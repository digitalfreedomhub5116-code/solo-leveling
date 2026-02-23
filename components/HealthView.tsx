
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Utensils, Dumbbell, Camera, Search, Trash2, 
  X, ScanLine, Target, Scale,
  Crosshair, BarChart3, AlertTriangle, Check, Flame, Droplets, User, Edit2, Plus, ChevronDown, Settings, List, Play, Lock
} from 'lucide-react';
import { 
  HealthProfile, MealLog, FoodItem, PlayerData, WorkoutDay, AdminExercise
} from '../types';
import { generateSystemProtocol, calculateTimeEstimate } from '../utils/workoutGenerator';
import { INDIAN_FOOD_DB } from '../utils/indianFoodDb';
import WorkoutOverview from './WorkoutOverview';
import ActiveWorkoutPlayer from './ActiveWorkoutPlayer';
import WorkoutMap from './WorkoutMap';
import { PlanCreator } from './PlanCreator';
import { GoogleGenAI, Type } from "@google/genai";

interface HealthViewProps {
  healthProfile?: HealthProfile;
  onSaveProfile: (profile: HealthProfile, identity: string) => void;
  onCompleteWorkout: (exercisesCompleted: number, totalExercises: number, results: Record<string, number>, intensityModifier: boolean) => void;
  onFailWorkout: () => void;
  onLogMeal: (meal: MealLog) => void;
  onDeleteMeal: (id: string) => void;
  playerData: PlayerData;
  onTutorialAction?: (step: number) => void;
  tutorialStep?: number;
  onToggleNav: (visible: boolean) => void;
  onConsumeKey: (amount?: number) => Promise<boolean>;
  onUpdateCustomPlans?: (protocols: Record<string, WorkoutDay[]>) => void;
}

type Tab = 'PROTOCOL' | 'INTAKE';
type ScanState = 'IDLE' | 'SCANNING' | 'RESULT';

// --- HELPER COMPONENT: CIRCULAR METRIC ---
const CircularMetric = ({ value, max, label, color, suffix = '', size = 80 }: { value: number, max: number, label: string, color: string, suffix?: string, size?: number }) => {
    const radius = size / 2 - 4; // 4px stroke width
    const circumference = 2 * Math.PI * radius;
    // Ensure progress is valid number
    const safeValue = isNaN(value) ? 0 : value;
    const progress = Math.min(100, Math.max(0, (safeValue / max) * 100));
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                {/* Background Circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                        cx="50%" cy="50%" r={radius}
                        stroke="rgba(255,255,255,0.1)" 
                        strokeWidth="4"
                        fill="transparent"
                    />
                    {/* Foreground Circle */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="50%" cy="50%" r={radius}
                        stroke={color}
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{ filter: `drop-shadow(0 0 2px ${color})` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-white font-mono leading-none">{safeValue}{suffix}</span>
                </div>
            </div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-2">{label}</span>
        </div>
    );
};

// --- HELPER: BIOMETRIC CALCULATIONS ---
const calculateStats = (profile: Partial<HealthProfile>) => {
    if (!profile.weight || !profile.height || !profile.age) return null;

    let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
    bmr += profile.gender === 'MALE' ? 5 : -161;

    const activityMultipliers: Record<string, number> = {
        'SEDENTARY': 1.2,
        'LIGHT': 1.375,
        'MODERATE': 1.55,
        'VERY_ACTIVE': 1.725
    };
    
    let tdee = bmr * (activityMultipliers[profile.activityLevel || 'MODERATE'] || 1.2);

    if (profile.goal === 'LOSE_WEIGHT') tdee *= 0.85;
    else if (profile.goal === 'BUILD_MUSCLE') tdee *= 1.10;
    
    const protein = profile.weight * 2.0; 
    const fats = profile.weight * 0.9;
    const proteinCal = protein * 4;
    const fatsCal = fats * 9;
    const remainingCal = Math.max(0, tdee - proteinCal - fatsCal);
    const carbs = remainingCal / 4;

    const heightM = profile.height / 100;
    const bmi = profile.weight / (heightM * heightM);
    const bodyFat = (1.20 * bmi) + (0.23 * profile.age) - (profile.gender === 'MALE' ? 16.2 : 5.4);

    return {
        bmi: parseFloat(bmi.toFixed(1)),
        bmr: Math.round(bmr),
        bodyFat: Math.max(5, parseFloat(bodyFat.toFixed(1))),
        tdee: Math.round(tdee),
        macros: {
            protein: Math.round(protein),
            fats: Math.round(fats),
            carbs: Math.round(carbs),
            calories: Math.round(tdee)
        }
    };
};

export const HealthView: React.FC<HealthViewProps> = ({ 
    healthProfile, 
    onSaveProfile, 
    onCompleteWorkout, 
    onFailWorkout,
    onLogMeal,
    onDeleteMeal,
    playerData,
    onTutorialAction,
    tutorialStep,
    onToggleNav,
    onConsumeKey,
    onUpdateCustomPlans
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('PROTOCOL');
  
  // Auto-switch to INTAKE tab for tutorial step 9 (which is the Nutrition step)
  useEffect(() => {
      if (tutorialStep === 9) {
          setActiveTab('INTAKE');
      }
  }, [tutorialStep]);

  // --- WORKOUT STATE ---
  const [activeWorkoutDay, setActiveWorkoutDay] = useState<WorkoutDay | null>(null);
  const [showWorkoutOverview, setShowWorkoutOverview] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  
  // Plan Management
  const [showPlanCreator, setShowPlanCreator] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('SYSTEM'); // 'SYSTEM' or custom ID
  const [editingPlan, setEditingPlan] = useState<{name: string, plan: WorkoutDay[]} | undefined>(undefined);

  // --- NUTRITION STATE ---
  const [scanState, setScanState] = useState<ScanState>('IDLE');
  const [scanResult, setScanResult] = useState<FoodItem | null>(null);
  const [scanItems, setScanItems] = useState<{name: string; quantity: string; calories: number}[]>([]);
  const [scanDescription, setScanDescription] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [foodSearch, setFoodSearch] = useState('');
  
  // --- PROFILE STATE ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState<Partial<HealthProfile>>(healthProfile || {
      gender: 'MALE', 
      age: 0, 
      height: 0, 
      weight: 0, 
      targetWeight: 0,
      activityLevel: 'MODERATE', 
      goal: 'RECOMP', 
      equipment: 'GYM'
  });

  // Check if profile is valid (Calibrated)
  const isCalibrated = healthProfile && healthProfile.height > 0 && healthProfile.weight > 0 && healthProfile.age > 0;

  // Resolve Current Plan
  const customPlans = playerData.customProtocols || {};
  
  const systemPlan = useMemo(() => {
      // If we are in SYSTEM mode, use the one from profile or generate it
      return healthProfile?.workoutPlan && healthProfile.workoutPlan.length > 0 
          ? healthProfile.workoutPlan 
          : generateSystemProtocol((healthProfile || {}) as HealthProfile, customPlans);
  }, [healthProfile, customPlans]);

  const currentPlan = useMemo(() => {
      if (selectedPlanId === 'SYSTEM') return systemPlan;
      return customPlans[selectedPlanId] || systemPlan;
  }, [selectedPlanId, systemPlan, customPlans]);

  // Completion calculation logic
  const startWeight = healthProfile?.startingWeight || healthProfile?.weight || 0;
  const targetWeight = healthProfile?.targetWeight || healthProfile?.weight || 0;
  const currentWeight = healthProfile?.weight || 0;
  
  const totalLossNeeded = Math.abs(startWeight - targetWeight);
  const currentLoss = Math.abs(startWeight - currentWeight);
  
  let completionPercent = 0;
  if (totalLossNeeded > 0) {
      completionPercent = Math.min(100, (currentLoss / totalLossNeeded) * 100);
  } else {
      completionPercent = 100;
  }

  // Consumed Stats
  const consumedCalories = playerData.nutritionLogs.reduce((sum, log) => sum + log.totalCalories, 0);
  const consumedProtein = playerData.nutritionLogs.reduce((sum, log) => sum + log.totalProtein, 0);
  const consumedCarbs = playerData.nutritionLogs.reduce((sum, log) => sum + log.totalCarbs, 0);
  const consumedFats = playerData.nutritionLogs.reduce((sum, log) => sum + log.totalFats, 0);

  // Targets
  const targetCalories = healthProfile?.macros?.calories || 2000;
  const targetProtein = healthProfile?.macros?.protein || 150;
  const targetCarbs = healthProfile?.macros?.carbs || 200;
  const targetFats = healthProfile?.macros?.fats || 60;

  // --- CALIBRATION HANDLER ---
  const handleCalibrate = () => {
      if (!tempProfile.height || !tempProfile.weight || !tempProfile.age) {
          alert("Please fill in all biometric fields.");
          return;
      }

      // Perform calculations
      const stats = calculateStats(tempProfile);
      
      if (stats) {
          const fullProfile: HealthProfile = {
              ...(tempProfile as HealthProfile),
              bmi: stats.bmi,
              bmr: stats.bmr,
              bodyFat: stats.bodyFat,
              macros: stats.macros,
              category: 'Hunter', // Default class
              workoutPlan: [], // Will be generated if empty
              startingWeight: healthProfile?.startingWeight || tempProfile.weight,
              injuries: healthProfile?.injuries || []
          };
          
          onSaveProfile(fullProfile, playerData.identity || "Hunter");
          setIsEditingProfile(false);
      }
  };

  // --- AI SCANNING LOGIC ---
  const resetScanner = () => {
      setScanState('IDLE');
      setScanResult(null);
      setScanItems([]);
      setScanDescription('');
      setLoadingMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const hasKey = await onConsumeKey(1);
      if (!hasKey) {
          alert("Insufficient Keys for AI Scan (Requires 1 Key)");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }

      setLoadingMessage("ANALYZING BIOMATTER...");
      setScanState('SCANNING');

      try {
          // Convert file to base64
          const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                  const result = reader.result as string;
                  // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
                  const base64 = result.split(',')[1];
                  resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
          });

          // Instantiate AI locally to avoid import issues
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: {
                  parts: [
                      {
                          inlineData: {
                              mimeType: file.type,
                              data: base64Data
                          }
                      },
                      {
                          text: "Analyze this meal. Identify the food items and estimate total calories, protein, carbs, and fats. Return JSON with 'output' containing 'total' (calories, protein, carbs, fat), 'food' (array of name, quantity, calories), and 'status' string."
                      }
                  ]
              },
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          output: {
                              type: Type.OBJECT,
                              properties: {
                                  total: {
                                      type: Type.OBJECT,
                                      properties: {
                                          calories: { type: Type.NUMBER },
                                          protein: { type: Type.NUMBER },
                                          carbs: { type: Type.NUMBER },
                                          fat: { type: Type.NUMBER },
                                      },
                                      required: ["calories", "protein", "carbs", "fat"],
                                  },
                                  food: {
                                      type: Type.ARRAY,
                                      items: {
                                          type: Type.OBJECT,
                                          properties: {
                                              name: { type: Type.STRING },
                                              quantity: { type: Type.STRING },
                                              calories: { type: Type.NUMBER },
                                          },
                                          required: ["name", "quantity", "calories"],
                                      },
                                  },
                                  status: { type: Type.STRING },
                              },
                              required: ["total", "food", "status"],
                          },
                      },
                      required: ["output"],
                  },
              }
          });

          const responseText = response.text;
          if (!responseText) throw new Error("No data received from System AI.");

          const data = JSON.parse(responseText);
          const responseData = Array.isArray(data) ? data[0] : data;
          
          if (responseData?.output && responseData.output.total) {
              const { total, food, status } = responseData.output;
              
              const summary: FoodItem = {
                  id: `scan_${Date.now()}`,
                  name: (food && food.length > 0) ? food[0].name : "AI Analyzed Meal",
                  calories: Math.round(total.calories),
                  protein: Math.round(total.protein),
                  carbs: Math.round(total.carbs),
                  fats: Math.round(total.fat || 0), 
                  servingSize: "1 meal",
                  region: "Detected"
              };

              const detailedItems = Array.isArray(food) ? food.map((f: any) => ({
                  name: f.name,
                  quantity: f.quantity,
                  calories: Math.round(f.calories)
              })) : [];

              setScanResult(summary);
              setScanItems(detailedItems);
              setScanDescription(typeof status === 'string' ? status : "Analysis Complete.");
              setScanState('RESULT');
          } else {
              throw new Error("AI analysis failed or returned invalid format");
          }

      } catch (err: any) {
          console.error("Scanning Error:", err);
          setLoadingMessage(`SYSTEM ERROR: ${err.message || "Unknown"}`);
          setTimeout(() => resetScanner(), 3000);
      }
  };

  const handleLogScan = () => {
      if (scanResult) {
          const mealLog: MealLog = {
              id: `log_${Date.now()}`,
              label: scanResult.name,
              items: [{ ...scanResult, quantity: 1 }],
              totalCalories: scanResult.calories,
              totalProtein: scanResult.protein,
              totalCarbs: scanResult.carbs,
              totalFats: scanResult.fats,
              timestamp: Date.now()
          };
          onLogMeal(mealLog);
          resetScanner();
      }
  };

  // --- WORKOUT HANDLERS ---
  const handleDaySelect = (dayIndex: number) => {
      if (!isCalibrated) return;
      setActiveWorkoutDay(currentPlan[dayIndex]);
      setShowWorkoutOverview(true);
      onToggleNav(false);
  };

  const handleStartWorkout = (modifiedPlan: WorkoutDay, isCardioActive: boolean) => {
      setActiveWorkoutDay(modifiedPlan); 
      setShowWorkoutOverview(false);
      setIsWorkoutActive(true);
  };

  const handleWorkoutComplete = (exercisesCompleted: number, totalExercises: number, results: Record<string, number>) => {
      setIsWorkoutActive(false);
      setActiveWorkoutDay(null);
      onToggleNav(true);
      onCompleteWorkout(exercisesCompleted, totalExercises, results, false);
  };

  const handleWorkoutFail = () => {
      setIsWorkoutActive(false);
      setActiveWorkoutDay(null);
      onToggleNav(true);
      onFailWorkout();
  };

  // --- RENDERERS ---

  const renderCalibrationForm = () => (
      <div className="p-4 space-y-6">
          <div className="bg-system-neon/10 border border-system-neon/30 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-system-neon shrink-0 mt-1" size={20} />
              <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">System Calibration Required</h3>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                      Biometric data missing. To synchronize with the System, you must provide your physical specifications.
                  </p>
              </div>
          </div>

          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Gender</label>
                      <div className="flex bg-black border border-gray-800 rounded-lg p-1">
                          {['MALE', 'FEMALE'].map((g) => (
                              <button
                                  key={g}
                                  onClick={() => setTempProfile({...tempProfile, gender: g as any})}
                                  className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-colors ${tempProfile.gender === g ? 'bg-gray-800 text-white' : 'text-gray-600'}`}
                              >
                                  {g}
                              </button>
                          ))}
                      </div>
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Age</label>
                      <input 
                          type="number" 
                          value={tempProfile.age || ''}
                          onChange={e => setTempProfile({...tempProfile, age: Number(e.target.value)})}
                          className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:border-system-neon outline-none font-mono"
                          placeholder="Years"
                      />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Height (CM)</label>
                      <input 
                          type="number" 
                          value={tempProfile.height || ''}
                          onChange={e => setTempProfile({...tempProfile, height: Number(e.target.value)})}
                          className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:border-system-neon outline-none font-mono"
                          placeholder="cm"
                      />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Weight (KG)</label>
                      <input 
                          type="number" 
                          value={tempProfile.weight || ''}
                          onChange={e => setTempProfile({...tempProfile, weight: Number(e.target.value)})}
                          className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:border-system-neon outline-none font-mono"
                          placeholder="kg"
                      />
                  </div>
              </div>

              <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Target Weight (KG)</label>
                  <input 
                      type="number" 
                      value={tempProfile.targetWeight || ''}
                      onChange={e => setTempProfile({...tempProfile, targetWeight: Number(e.target.value)})}
                      className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:border-system-neon outline-none font-mono"
                      placeholder="Goal kg"
                  />
              </div>

              <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Activity Level</label>
                  <select 
                      value={tempProfile.activityLevel}
                      onChange={e => setTempProfile({...tempProfile, activityLevel: e.target.value as any})}
                      className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white text-xs focus:border-system-neon outline-none font-mono uppercase"
                  >
                      <option value="SEDENTARY">Sedentary (Desk Job)</option>
                      <option value="LIGHT">Light Active (1-3 days)</option>
                      <option value="MODERATE">Moderate (3-5 days)</option>
                      <option value="VERY_ACTIVE">Very Active (6-7 days)</option>
                  </select>
              </div>

              <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Primary Goal</label>
                  <select 
                      value={tempProfile.goal}
                      onChange={e => setTempProfile({...tempProfile, goal: e.target.value as any})}
                      className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white text-xs focus:border-system-neon outline-none font-mono uppercase"
                  >
                      <option value="LOSE_WEIGHT">Lose Weight</option>
                      <option value="BUILD_MUSCLE">Build Muscle</option>
                      <option value="RECOMP">Recomposition</option>
                  </select>
              </div>
          </div>

          <button 
              onClick={handleCalibrate}
              className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-system-neon transition-all flex items-center justify-center gap-2 shadow-lg"
          >
              <Check size={18} /> CALIBRATE SYSTEM
          </button>
      </div>
  );

  const renderProtocol = () => {
      // Consolidate plans into a single array
      const plans = [
          {
              id: 'SYSTEM',
              name: 'DUSK PROTOCOL',
              subtext: 'SYSTEM DEFAULT',
              image: 'https://images.unsplash.com/photo-1517963879466-e925ac69aa18?q=80&w=2070&auto=format&fit=crop', // Dark Gym
              isCustom: false
          },
          ...Object.keys(customPlans).map((key, idx) => ({
              id: key,
              name: key.toUpperCase(),
              subtext: 'CUSTOM ROUTINE',
              image: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop`, // Weights
              isCustom: true
          }))
      ];

      return (
          <div className="space-y-6 pb-20 relative min-h-screen">
              
              {/* PLAN CAROUSEL (Replacements for Dropdown) */}
              <div className="relative">
                  <div data-no-swipe="true" className="flex overflow-x-auto gap-4 p-4 scrollbar-hide snap-x">
                      {plans.map((plan) => (
                          <motion.div
                              key={plan.id}
                              onClick={() => setSelectedPlanId(plan.id)}
                              className={`
                                  relative w-48 h-28 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer snap-center group glass-card
                                  ${selectedPlanId === plan.id ? 'border-system-neon shadow-[0_0_15px_rgba(0,210,255,0.4)] scale-105' : 'border-white/5 opacity-60 hover:opacity-100'}
                              `}
                              whileTap={{ scale: 0.95 }}
                          >
                              {/* Background Image */}
                              <img src={plan.image} alt={plan.name} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                              
                              {/* Selection Ring */}
                              {selectedPlanId === plan.id && (
                                  <div className="absolute inset-0 border-2 border-system-neon rounded-xl animate-pulse" />
                              )}

                              {/* Text Content */}
                              <div className="absolute bottom-2 left-2 right-2">
                                  <div className={`text-[10px] font-black uppercase tracking-widest truncate ${selectedPlanId === plan.id ? 'text-white' : 'text-gray-300'}`}>
                                      {plan.name}
                                  </div>
                                  <div className="text-[8px] text-system-neon font-mono uppercase">
                                      {plan.subtext}
                                  </div>
                              </div>

                              {/* Edit Button for Custom Plans */}
                              {plan.isCustom && selectedPlanId === plan.id && (
                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingPlan({ name: plan.id, plan: customPlans[plan.id] });
                                          setShowPlanCreator(true);
                                      }}
                                      className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur rounded-full text-white hover:bg-system-neon hover:text-black transition-colors"
                                  >
                                      <Settings size={12} />
                                  </button>
                              )}
                          </motion.div>
                      ))}

                      {/* Add New Plan Card */}
                      <motion.button
                          onClick={() => {
                              setEditingPlan(undefined);
                              setShowPlanCreator(true);
                          }}
                          className="relative w-28 h-28 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center shrink-0 hover:border-system-neon hover:bg-system-neon/10 transition-colors group snap-center bg-black/20 backdrop-blur-sm"
                          whileTap={{ scale: 0.95 }}
                      >
                          <Plus size={24} className="text-gray-500 group-hover:text-system-neon mb-1" />
                          <span className="text-[9px] font-bold text-gray-500 group-hover:text-white uppercase tracking-widest">
                              New Plan
                          </span>
                      </motion.button>
                  </div>
                  
                  {/* Fade Indicators */}
                  <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-0 h-full w-4 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
              </div>

              {/* Biometric Analysis & Physical Evolution Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                  
                  {/* Biometric Analysis */}
                  <div id="tut-biometric-analysis" className="glass-card rounded-2xl p-5">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <BarChart3 size={14} className="text-system-accent" /> Biometric Analysis
                          </h3>
                          <button 
                              onClick={() => {
                                  setTempProfile(healthProfile || {});
                                  setIsEditingProfile(true);
                              }} 
                              className="text-[10px] text-gray-600 hover:text-white flex items-center gap-1 border border-white/10 px-2 py-1 rounded hover:border-white/30 transition-colors"
                          >
                              <Edit2 size={10} /> RE-CALIBRATE
                          </button>
                      </div>
                      <div className="flex justify-around items-start">
                          <CircularMetric 
                              value={parseFloat((healthProfile?.bmi || 0).toFixed(1))} 
                              max={40} 
                              label="BMI RATIO" 
                              color={(healthProfile?.bmi || 0) > 25 ? "#f59e0b" : "#00d2ff"} 
                          />
                          <CircularMetric 
                              value={Math.round(healthProfile?.bodyFat || 0)} 
                              max={50} 
                              label="BODY FAT %" 
                              color="#ef4444" 
                              suffix="%"
                          />
                      </div>
                  </div>

                  {/* Physical Evolution (Completion) */}
                  <div className="glass-card rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-black/40 to-transparent">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                      <div className="relative z-10 flex items-center gap-6">
                          <CircularMetric 
                              value={Math.round(completionPercent)} 
                              max={100} 
                              label="GOAL SYNC" 
                              color="#eab308" 
                              suffix="%" 
                              size={70}
                          />
                          <div className="flex-1">
                              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">Physical Evolution</h3>
                              <p className="text-[10px] text-gray-500 font-mono leading-relaxed mb-3">
                                  Current transformation progress based on initial calibration data.
                              </p>
                              {completionPercent >= 100 && (
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-yellow-500 bg-yellow-900/10 px-2 py-1 rounded border border-yellow-500/20 w-fit">
                                      <Check size={12} /> TARGET ACHIEVED
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>

              <WorkoutMap 
                  currentWeight={healthProfile?.weight || 70}
                  targetWeight={healthProfile?.targetWeight || 70}
                  workoutPlan={currentPlan.length > 0 ? currentPlan : generateSystemProtocol(healthProfile!, playerData.customProtocols)}
                  startDate={playerData.startDate || Date.now()}
                  logs={playerData.logs}
                  onStartDay={handleDaySelect}
              />
          </div>
      );
  };

  const renderNutrition = () => (
      <div id="tut-nutrition-dashboard" className="space-y-6">
          {/* ENERGY & FUEL DASHBOARD */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs text-white font-bold uppercase tracking-widest flex items-center gap-2">
                        <Utensils size={14} className="text-system-neon" /> Energy & Fuel
                    </h3>
                    <div className="text-[10px] text-gray-500 font-mono">
                        DAILY TARGETS
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Calories Circle (Radial Gauge) */}
                    <div className="flex flex-col items-center justify-center p-4 bg-black/20 rounded-xl border border-white/5 relative backdrop-blur-sm">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            {/* Background Track */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="50%" cy="50%" r="46%" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                                <motion.circle 
                                    initial={{ strokeDashoffset: 289 }} // 2*PI*r approx
                                    animate={{ strokeDashoffset: 289 - (Math.min(1, consumedCalories / targetCalories) * 289) }}
                                    cx="50%" cy="50%" r="46%" 
                                    stroke={consumedCalories > targetCalories ? "#ef4444" : "#00d2ff"} 
                                    strokeWidth="8" 
                                    strokeDasharray="289" 
                                    strokeLinecap="round" 
                                    fill="transparent" 
                                    className="drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]"
                                />
                            </svg>
                            <div className="text-center">
                                <div className="text-2xl font-black text-white leading-none">{consumedCalories}</div>
                                <div className="text-[10px] text-gray-500 font-mono mt-1">/ {targetCalories}</div>
                                <div className="text-[9px] text-system-neon font-bold uppercase tracking-wider mt-1">KCAL</div>
                            </div>
                        </div>
                    </div>

                    {/* Macros Grid (Horizontal Bars) */}
                    <div className="space-y-3 flex flex-col justify-center">
                        {/* Protein */}
                        <div className="bg-black/20 border border-white/5 rounded-lg p-3 backdrop-blur-sm">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-blue-400">PROTEIN</span>
                                <span className="font-mono text-white">{consumedProtein} / {targetProtein}g</span>
                            </div>
                            <div className="h-1.5 bg-gray-900/80 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (consumedProtein / targetProtein) * 100)}%` }}
                                    className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                                />
                            </div>
                        </div>

                        {/* Carbs */}
                        <div className="bg-black/20 border border-white/5 rounded-lg p-3 backdrop-blur-sm">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-yellow-400">CARBS</span>
                                <span className="font-mono text-white">{consumedCarbs} / {targetCarbs}g</span>
                            </div>
                            <div className="h-1.5 bg-gray-900/80 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (consumedCarbs / targetCarbs) * 100)}%` }}
                                    className="h-full bg-yellow-500 shadow-[0_0_10px_#eab308]"
                                />
                            </div>
                        </div>

                        {/* Fats */}
                        <div className="bg-black/20 border border-white/5 rounded-lg p-3 backdrop-blur-sm">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-red-400">FATS</span>
                                <span className="font-mono text-white">{consumedFats} / {targetFats}g</span>
                            </div>
                            <div className="h-1.5 bg-gray-900/80 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (consumedFats / targetFats) * 100)}%` }}
                                    className="h-full bg-red-500 shadow-[0_0_10px_#ef4444]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
          </div>

          {/* Scanner Button */}
          <div className="relative">
              <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
              />
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 glass-card rounded-xl flex flex-col items-center justify-center gap-2 hover:border-system-neon hover:bg-system-neon/5 transition-all group"
              >
                  <div className="w-12 h-12 rounded-full bg-black/50 border border-gray-600 flex items-center justify-center group-hover:border-system-neon group-hover:text-system-neon transition-colors">
                      <Camera size={24} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-white uppercase tracking-widest">
                      AI Food Analysis (1 Key)
                  </span>
              </button>
          </div>

          {/* Scanner Result Overlay */}
          <AnimatePresence>
              {scanState !== 'IDLE' && (
                  <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="glass-panel rounded-xl p-4 relative overflow-hidden"
                  >
                      {scanState === 'SCANNING' ? (
                          <div className="flex flex-col items-center py-8">
                              <ScanLine size={40} className="text-system-neon animate-pulse mb-4" />
                              <div className="text-xs font-mono text-system-neon font-bold tracking-widest">{loadingMessage}</div>
                          </div>
                      ) : scanResult ? (
                          <div>
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <h3 className="text-lg font-black text-white uppercase italic leading-none">{scanResult.name}</h3>
                                      {scanDescription && (
                                          <p className="text-[10px] text-gray-400 font-mono mt-2 mb-2 leading-relaxed border-l-2 border-gray-700 pl-2">
                                              {scanDescription}
                                          </p>
                                      )}
                                      <div className="flex gap-2 mt-2">
                                          <span className="text-[10px] bg-system-neon/10 text-system-neon px-2 py-0.5 rounded border border-system-neon/20 font-bold">
                                              {scanResult.calories} KCAL
                                          </span>
                                          <span className="text-[10px] bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded border border-blue-900/30 font-bold">
                                              {scanResult.protein}G PROTEIN
                                          </span>
                                      </div>
                                  </div>
                                  <button onClick={resetScanner} className="text-gray-500 hover:text-white"><X size={16}/></button>
                              </div>
                              
                              {scanItems.length > 0 && (
                                  <div className="bg-black/40 rounded p-2 mb-4 space-y-1">
                                      {scanItems.map((item, idx) => (
                                          <div key={idx} className="flex justify-between text-[10px] text-gray-400 font-mono border-b border-gray-800 last:border-0 pb-1 last:pb-0">
                                              <span>{item.name} ({item.quantity})</span>
                                              <span>{item.calories} kcal</span>
                                          </div>
                                      ))}
                                  </div>
                              )}

                              <button 
                                  onClick={handleLogScan}
                                  className="w-full py-3 bg-system-neon text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-white transition-colors"
                              >
                                  LOG CONSUMPTION
                              </button>
                          </div>
                      ) : null}
                  </motion.div>
              )}
          </AnimatePresence>

          {/* Manual Search */}
          <div className="glass-card rounded-xl p-4">
              <div className="relative mb-4">
                  <Search size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input 
                      value={foodSearch}
                      onChange={e => setFoodSearch(e.target.value)}
                      placeholder="Search Database..."
                      className="w-full bg-black/50 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-system-neon transition-colors"
                  />
              </div>

              <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                  {INDIAN_FOOD_DB.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase())).map(food => (
                      <button 
                          key={food.id}
                          onClick={() => {
                              const log: MealLog = {
                                  id: `manual_${Date.now()}`,
                                  label: food.name,
                                  items: [{...food, quantity: 1}],
                                  totalCalories: food.calories,
                                  totalProtein: food.protein,
                                  totalCarbs: food.carbs,
                                  totalFats: food.fats,
                                  timestamp: Date.now()
                              };
                              onLogMeal(log);
                              setFoodSearch('');
                          }}
                          className="w-full text-left p-2 hover:bg-white/5 rounded flex justify-between items-center group"
                      >
                          <span className="text-xs text-gray-300 font-mono group-hover:text-white">{food.name}</span>
                          <span className="text-[10px] text-gray-600 font-mono group-hover:text-system-neon">{food.calories} kcal</span>
                      </button>
                  ))}
              </div>
          </div>

          {/* Today's Logs */}
          <div className="space-y-2">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Today's Intake</div>
              {playerData.nutritionLogs.map(log => (
                  <div key={log.id} className="flex justify-between items-center bg-black/20 border border-white/5 p-3 rounded-lg group backdrop-blur-sm">
                      <div>
                          <div className="text-xs font-bold text-white">{log.label}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">{log.totalCalories} kcal • {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                      <button onClick={() => onDeleteMeal(log.id)} className="text-gray-700 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                      </button>
                  </div>
              ))}
              {playerData.nutritionLogs.length === 0 && (
                  <div className="text-center py-4 text-xs text-gray-700 font-mono">NO DATA LOGGED</div>
              )}
          </div>
      </div>
  );

  // --- RENDER MAIN ---
  
  // Force Calibration View if needed
  if (!isCalibrated && !isEditingProfile) {
      return renderCalibrationForm();
  }

  // Edit Overlay
  if (isEditingProfile) {
      return (
          <div className="relative">
              <button 
                  onClick={() => setIsEditingProfile(false)} 
                  className="absolute top-2 right-2 text-gray-500 hover:text-white z-10"
              >
                  <X size={20} />
              </button>
              {renderCalibrationForm()}
          </div>
      );
  }

  // Plan Creator Overlay
  if (showPlanCreator) {
      return (
          <PlanCreator 
              exerciseDatabase={playerData.exerciseDatabase}
              initialPlan={editingPlan?.plan}
              initialName={editingPlan?.name}
              onCancel={() => setShowPlanCreator(false)}
              onSave={(name, plan) => {
                  const newCustomPlans = { ...customPlans, [name]: plan };
                  if (onUpdateCustomPlans) {
                      onUpdateCustomPlans(newCustomPlans);
                  }
                  setShowPlanCreator(false);
                  setSelectedPlanId(name);
              }}
          />
      );
  }

  return (
    <div className="flex flex-col h-full relative">
        
        {/* TAB HEADER */}
        <div className="flex border-b border-gray-800 mb-6">
            <button 
                onClick={() => setActiveTab('PROTOCOL')}
                className={`flex-1 pb-4 text-xs font-bold tracking-widest transition-colors flex justify-center gap-2 ${activeTab === 'PROTOCOL' ? 'text-system-neon border-b-2 border-system-neon' : 'text-gray-600 hover:text-gray-300'}`}
            >
                <Dumbbell size={14} /> PROTOCOL
            </button>
            <button 
                id="tut-nutrition-tab-btn"
                onClick={() => setActiveTab('INTAKE')}
                className={`flex-1 pb-4 text-xs font-bold tracking-widest transition-colors flex justify-center gap-2 ${activeTab === 'INTAKE' ? 'text-system-neon border-b-2 border-system-neon' : 'text-gray-600 hover:text-gray-300'}`}
            >
                <Utensils size={14} /> INTAKE
            </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
            <AnimatePresence mode="wait">
                {activeTab === 'PROTOCOL' && (
                    <motion.div key="protocol" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        {renderProtocol()}
                    </motion.div>
                )}
                {activeTab === 'INTAKE' && (
                    <motion.div key="intake" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        {renderNutrition()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* FLOATING ACTION BUTTON - Backup, still useful for quick adds */}
        <AnimatePresence>
            {activeTab === 'PROTOCOL' && (
                <motion.div
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-40"
                >
                    <button 
                        onClick={() => {
                            setEditingPlan(undefined); // Clear edit state for new plan
                            setShowPlanCreator(true);
                        }}
                        className="w-14 h-14 bg-system-neon rounded-full flex items-center justify-center shadow-[0_0_20px_#00d2ff] hover:scale-110 transition-transform active:scale-95 group"
                        title="Create New Protocol"
                    >
                        <Plus size={24} className="text-black group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* WORKOUT OVERVIEW MODAL */}
        <AnimatePresence>
            {showWorkoutOverview && activeWorkoutDay && (
                <WorkoutOverview 
                    plan={activeWorkoutDay} 
                    focusVideos={playerData.focusVideos || {}}
                    onStart={handleStartWorkout}
                    onCancel={() => { setShowWorkoutOverview(false); onToggleNav(true); }}
                    userWeight={healthProfile?.weight}
                />
            )}
        </AnimatePresence>

        {/* ACTIVE WORKOUT PLAYER */}
        <AnimatePresence>
            {isWorkoutActive && activeWorkoutDay && (
                <ActiveWorkoutPlayer 
                    plan={activeWorkoutDay}
                    onComplete={handleWorkoutComplete}
                    onFail={handleWorkoutFail}
                    streak={playerData.streak}
                />
            )}
        </AnimatePresence>

    </div>
  );
};
