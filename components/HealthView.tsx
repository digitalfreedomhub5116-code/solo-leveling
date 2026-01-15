
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Ruler, Fingerprint, Camera, Trash2, Search, Utensils, X, Terminal, Upload, ArrowRight, ArrowLeft, Zap, Dumbbell, Check, Cpu, Flame, Target, Map, Calendar, List, Swords, Layers, Grid, TrendingUp, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { HealthProfile, WorkoutDay, PlayerData, ProgressPhoto, MealLog } from '../types';
import ActiveWorkoutPlayer from './ActiveWorkoutPlayer';
import WorkoutMap from './WorkoutMap';
import WorkoutOverview from './WorkoutOverview';
import { generateSystemProtocol, calculateTimeEstimate } from '../utils/workoutGenerator';
import { INDIAN_FOOD_DB } from '../utils/indianFoodDb';

interface HealthViewProps {
  healthProfile?: HealthProfile;
  onSaveProfile: (profile: HealthProfile, identity: string) => void;
  onCompleteWorkout: (exercisesCompleted: number, totalExercises: number, results: Record<string, number>, intensityModifier: boolean) => void;
  onFailWorkout: () => void;
  onAddPhoto?: (photo: ProgressPhoto) => void;
  onDeletePhoto?: (id: string) => void;
  onLogMeal?: (meal: MealLog) => void;
  onDeleteMeal?: (id: string) => void;
  playerData: PlayerData;
  onTutorialAction?: (step: number) => void;
  tutorialStep?: number;
}

// --- TECH RADAR CHART UTILS ---
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const TechRadar = ({ data, color, label }: { data: { value: number; fullMark: number; subject: string }[], color: string, label: string }) => {
    const size = 300;
    const center = size / 2;
    const radius = 100;
    
    // Grid Generation
    const gridLevels = 4;
    const gridPaths = [];
    for (let level = 1; level <= gridLevels; level++) {
        const levelRadius = (radius / gridLevels) * level;
        const pts = data.map((_, i) => {
            const angle = (360 / data.length) * i;
            const { x, y } = polarToCartesian(center, center, levelRadius, angle);
            return `${x},${y}`;
        });
        gridPaths.push(pts.join(' '));
    }

    // Axes Generation
    const axesLines = data.map((_, i) => {
        const angle = (360 / data.length) * i;
        const { x, y } = polarToCartesian(center, center, radius, angle);
        return { x1: center, y1: center, x2: x, y2: y };
    });

    // Data Points Calculation
    const points = data.map((d, i) => {
        const angle = (360 / data.length) * i;
        const valRadius = (d.value / d.fullMark) * radius;
        return polarToCartesian(center, center, valRadius, angle);
    });

    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';

    // Animation Timings: Dots first, then lines
    const dotDelay = 0.15;
    const totalDotTime = data.length * dotDelay;

    return (
        <div id="tut-health-radar" className="relative flex flex-col items-center justify-center w-full h-full">
            <h3 className="text-sm font-mono font-bold mb-4 tracking-[0.3em] uppercase transition-colors duration-500" style={{ color }}>{label}</h3>
            
            <svg width={size} height={size} className="overflow-visible">
                <defs>
                    <linearGradient id={`radarFill-${label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0.05}/>
                    </linearGradient>
                </defs>

                {/* Grid Polygons */}
                {gridPaths.map((pts, i) => (
                    <polygon key={`grid-${i}`} points={pts} fill="none" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />
                ))}
                
                {/* Axis Lines */}
                {axesLines.map((line, i) => (
                    <line key={`axis-${i}`} {...line} stroke="#333" strokeWidth="1" strokeDasharray="4 4" />
                ))}

                {/* Animated Data Area (Appears last) */}
                <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: totalDotTime + 0.5, duration: 0.5 }}
                    d={pathD}
                    fill={`url(#radarFill-${label})`}
                    stroke="none"
                />
                
                {/* Animated Data Stroke (Draws after dots) */}
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: totalDotTime, duration: 1.5, ease: "easeInOut" }}
                />

                {/* Data Points (Dots) & Labels */}
                {data.map((d, i) => {
                     const angle = (360 / data.length) * i;
                     const labelPos = polarToCartesian(center, center, radius + 35, angle);
                     const point = points[i];
                     
                     return (
                        <g key={i}>
                             {/* Label */}
                             <text 
                                x={labelPos.x} y={labelPos.y} 
                                textAnchor="middle" dominantBaseline="middle" 
                                fill="#666" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1px"
                             >
                                 {d.subject}
                             </text>
                             
                             {/* Animated Dot */}
                             <motion.circle
                                cx={point.x} cy={point.y} 
                                r={4}
                                fill="#000" stroke={color} strokeWidth={2}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * dotDelay, type: "spring", stiffness: 300, damping: 20 }}
                            />
                        </g>
                     );
                })}
            </svg>
        </div>
    );
};

const calculateNutritionPlan = (profile: Partial<HealthProfile>) => {
  const weight = profile.weight || 70;
  const height = profile.height || 175;
  const age = profile.age || 25;
  const gender = profile.gender || 'MALE';
  const activity = profile.activityLevel || 'MODERATE';
  const goal = profile.goal || 'RECOMP';

  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'MALE') bmr += 5;
  else if (gender === 'FEMALE') bmr -= 161;
  else bmr += 5;

  const activityMultipliers: Record<string, number> = {
      'SEDENTARY': 1.2,
      'LIGHT': 1.375,
      'MODERATE': 1.55,
      'VERY_ACTIVE': 1.725
  };
  
  const tdee = bmr * (activityMultipliers[activity] || 1.55);
  
  let targetCalories = tdee;
  if (goal === 'LOSE_WEIGHT') targetCalories -= 500;
  else if (goal === 'BUILD_MUSCLE') targetCalories += 300;
  else if (goal === 'RECOMP') targetCalories -= 200; // Slight deficit for body recomposition
  
  const protein = Math.round(weight * 2.2); // Higher protein for recomp
  const fats = Math.round((targetCalories * 0.25) / 9);
  const carbs = Math.round((targetCalories - (protein * 4) - (fats * 9)) / 4);

  return {
      bmr: Math.round(bmr),
      macros: {
          protein: Math.round(protein),
          fats: Math.round(fats),
          carbs: Math.round(carbs),
          calories: Math.round(targetCalories)
      },
      tdee: Math.round(tdee)
  };
};

const HealthView: React.FC<HealthViewProps> = ({ 
  healthProfile, 
  onSaveProfile, 
  onCompleteWorkout, 
  onFailWorkout, 
  onAddPhoto, 
  onDeletePhoto, 
  onLogMeal, 
  onDeleteMeal,
  playerData,
  onTutorialAction,
  tutorialStep
}) => {
  // New States: DIAGNOSIS (Current State) -> PROJECTION (Graph)
  const [viewMode, setViewMode] = useState<'MAP' | 'OVERVIEW' | 'ACTIVE' | 'SETUP' | 'PROCESSING' | 'DIAGNOSIS' | 'PROJECTION' | 'FINALIZING'>('MAP');
  const [activeTab, setActiveTab] = useState<'WORKOUT' | 'NUTRITION' | 'BODY'>('WORKOUT');
  
  // Projection Animation State
  const [isTransformed, setIsTransformed] = useState(false);

  // Workout State
  const [, setSelectedDayIndex] = useState<number | null>(null);
  const [activePlan, setActivePlan] = useState<WorkoutDay | null>(null);

  // Setup Form State
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 8;
  const [formData, setFormData] = useState<Partial<HealthProfile>>({
      gender: 'MALE', 
      activityLevel: 'MODERATE', 
      goal: 'RECOMP', 
      equipment: 'GYM',
      workoutSplit: 'CLASSIC', 
      intensity: 'MODERATE', 
      sessionDuration: 45, 
      age: 25, 
      height: 175, 
      weight: 70,
      targetWeight: 70
  });

  const [foodSearch, setFoodSearch] = useState('');
  const [finalizingLog, setFinalizingLog] = useState("Initializing...");

  // Initial Logic
  useEffect(() => {
      if (!healthProfile) setViewMode('SETUP');
  }, [healthProfile]);

  // Derived Values
  const calculatedPlan = useMemo(() => {
     if (healthProfile?.workoutPlan) return healthProfile.workoutPlan;
     if (formData.weight && formData.height) return generateSystemProtocol(formData as HealthProfile);
     return [];
  }, [healthProfile, formData]);

  const nutritionInfo = useMemo(() => calculateNutritionPlan(healthProfile || formData), [healthProfile, formData]);
  
  // BMI calc for Diagnosis
  const currentBMI = useMemo(() => {
      if(formData.weight && formData.height) {
          return (formData.weight / ((formData.height/100) ** 2)).toFixed(1);
      }
      return "0.0";
  }, [formData.weight, formData.height]);

  // Handlers
  const handleDaySelect = (index: number) => {
      if (index > calculatedPlan.length) return;
      const dayPlan = calculatedPlan[index % calculatedPlan.length];
      setActivePlan(dayPlan);
      setSelectedDayIndex(index);
      setViewMode('OVERVIEW');
  };

  const startWorkout = (modifiedPlan: WorkoutDay, _isCardio: boolean) => {
      setActivePlan(modifiedPlan);
      setViewMode('ACTIVE');
  };

  const finishWorkout = (completed: number, total: number, results: Record<string, number>) => {
      onCompleteWorkout(completed, total, results, false);
      setViewMode('MAP');
      setActivePlan(null);
      setSelectedDayIndex(null);
  };

  const startProcessing = () => {
      setViewMode('PROCESSING');
      setTimeout(() => {
          // Jump to Diagnosis (Current Situation) instead of Analysis
          setViewMode('DIAGNOSIS');
          if (tutorialStep === 12 && onTutorialAction) {
              onTutorialAction(13);
          }
      }, 4500); // Extended time to enjoy the animation
  };

  const startJourneySequence = () => {
      setViewMode('FINALIZING');
      const sequence = [
          "REWRITING BIOLOGICAL LIMITS...",
          "UNLOCKING HIDDEN POTENTIAL...",
          "YOUR OLD SELF IS BEING ARCHIVED...",
          "CONSTRUCTING A NEW REALITY...",
          "SYSTEM ONLINE. ASCENSION BEGINS."
      ];
      
      let i = 0;
      const interval = setInterval(() => {
          setFinalizingLog(sequence[i]);
          i++;
          if (i >= sequence.length) {
              clearInterval(interval);
              setTimeout(() => finalizeSetup(), 2500);
          }
      }, 2000); 
  };

  const finalizeSetup = () => {
      const fullProfile = {
          ...formData,
          bmi: parseFloat(currentBMI),
          bmr: nutritionInfo.bmr,
          workoutPlan: calculatedPlan,
          macros: nutritionInfo.macros,
          injuries: [],
          category: 'Hunter',
          startingWeight: formData.weight,
          targetWeight: formData.targetWeight || formData.weight
      } as HealthProfile;

      let identity = "Shadow Recruit";
      if (fullProfile.goal === 'LOSE_WEIGHT') identity = "Iron Vessel";
      else if (fullProfile.goal === 'BUILD_MUSCLE') identity = "Titan Vanguard";
      else if (fullProfile.goal === 'ENDURANCE') identity = "Wind Walker";
      else if (fullProfile.goal === 'RECOMP') identity = "Shadow Sovereign";

      onSaveProfile(fullProfile, identity);
      setViewMode('MAP');
      
      if (tutorialStep === 13 && onTutorialAction) {
          onTutorialAction(14);
      }
  };

  // --- RENDER: SETUP WIZARD & PROCESSING ---
  
  if (viewMode === 'PROCESSING') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 bg-black/95 absolute inset-0 z-50">
              <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                  {/* Outer Rings */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border border-system-neon/20 rounded-full border-dashed"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border border-system-accent/20 rounded-full border-dotted"
                  />
                  
                  {/* Scanning Bar */}
                  <motion.div 
                    animate={{ height: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-full bg-gradient-to-b from-transparent via-system-neon/30 to-transparent"
                    style={{ height: '50%', top: '0%' }}
                  />

                  {/* Center Icon */}
                  <Cpu className="text-system-neon animate-pulse" size={40} />
              </div>

              <h2 className="text-2xl font-black text-white font-mono tracking-tighter mb-2">CALIBRATING SYSTEM</h2>
              
              <div className="h-6 overflow-hidden relative w-full max-w-xs">
                  <motion.div 
                    animate={{ y: -120 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute top-full left-0 w-full text-center space-y-2"
                  >
                      <p className="text-[10px] text-gray-500 font-mono">ANALYZING BIOMETRICS...</p>
                      <p className="text-[10px] text-system-neon font-mono">CALCULATING POTENTIAL...</p>
                      <p className="text-[10px] text-system-accent font-mono">OPTIMIZING PATHWAYS...</p>
                      <p className="text-[10px] text-green-500 font-mono">SUCCESS PROBABILITY: 100%</p>
                      <p className="text-[10px] text-gray-500 font-mono">GENERATING GRAPH...</p>
                  </motion.div>
              </div>
          </div>
      );
  }

  // --- STEP 1: CURRENT DIAGNOSIS ---
  if (viewMode === 'DIAGNOSIS') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] bg-black/95 absolute inset-0 z-50 p-6">
              <div className="w-full max-w-md relative">
                  {/* Decorative corner lines */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-500" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-500" />
                  
                  {/* Updated Header */}
                  <div className="mb-8 border-b border-gray-800 pb-4">
                      <h2 className="text-2xl font-black text-white font-mono tracking-tighter flex items-center gap-2">
                          <Terminal size={24} className="text-system-neon" /> SYSTEM ANALYSIS
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                          <ShieldCheck size={12} className="text-system-success" />
                          <span className="text-[10px] text-system-success font-mono tracking-wider">SYSTEM GUARANTEE: GOAL ACHIEVEMENT INEVITABLE</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-gray-900/30 border border-gray-800 p-4 rounded-lg">
                          <div className="text-[10px] text-gray-500 font-mono">CURRENT BMI</div>
                          <div className="text-2xl text-white font-mono font-bold">{currentBMI}</div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-gray-900/30 border border-gray-800 p-4 rounded-lg">
                          <div className="text-[10px] text-gray-500 font-mono">EST. TIME TO GOAL</div>
                          <div className="text-xl text-yellow-500 font-mono font-bold">{calculateTimeEstimate(formData)}</div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-gray-900/30 border border-gray-800 p-4 rounded-lg">
                          <div className="text-[10px] text-gray-500 font-mono">DAILY CALORIES</div>
                          <div className="text-xl text-blue-400 font-mono font-bold">{nutritionInfo.macros.calories}</div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-gray-900/30 border border-gray-800 p-4 rounded-lg">
                          <div className="text-[10px] text-gray-500 font-mono">SYSTEM RANK</div>
                          <div className="text-2xl text-white font-mono font-bold">C-RANK</div>
                      </motion.div>
                  </div>

                  <button 
                    onClick={() => setViewMode('PROJECTION')}
                    className="w-full py-4 bg-white text-black font-black font-mono text-sm rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                      VIEW POTENTIAL <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>
          </div>
      );
  }

  // --- STEP 2: PROJECTION & TRANSFORMATION ---
  if (viewMode === 'PROJECTION') {
      const lowStats = [
          { subject: 'STRENGTH', value: 40, fullMark: 100 },
          { subject: 'VITALITY', value: 45, fullMark: 100 },
          { subject: 'AGILITY', value: 35, fullMark: 100 },
          { subject: 'INTELLIGENCE', value: 50, fullMark: 100 },
          { subject: 'PERCEPTION', value: 40, fullMark: 100 }
      ];

      const highStats = [
          { subject: 'STRENGTH', value: 85, fullMark: 100 },
          { subject: 'VITALITY', value: 90, fullMark: 100 },
          { subject: 'AGILITY', value: 80, fullMark: 100 },
          { subject: 'INTELLIGENCE', value: 75, fullMark: 100 },
          { subject: 'PERCEPTION', value: 95, fullMark: 100 }
      ];

      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] bg-black/95 absolute inset-0 z-50 p-6">
              <div className="w-full max-w-sm flex flex-col items-center">
                  <h2 className="text-xl font-bold text-white font-mono mb-1 tracking-[0.2em] flex items-center gap-2">
                      <TrendingUp size={20} className={isTransformed ? "text-system-neon" : "text-red-500"} /> 
                      {isTransformed ? "SYSTEM POTENTIAL" : "CURRENT LIMITS"}
                  </h2>
                  <div className="text-[10px] font-mono text-gray-500 mb-4 tracking-widest uppercase">
                      RANK: {isTransformed ? "S-CLASS" : "C-CLASS"}
                  </div>
                  
                  <div className="relative mb-8 w-full max-w-[320px] aspect-square">
                      {/* Using TechRadar with specified colors */}
                      <TechRadar 
                          label={isTransformed ? "POTENTIAL" : "CURRENT"}
                          color={isTransformed ? "#00d2ff" : "#ef4444"}
                          data={isTransformed ? highStats : lowStats}
                      />
                      
                      {/* Transformation Particle Effects */}
                      {isTransformed && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 1, 0], scale: 1.5 }}
                            transition={{ duration: 0.8 }}
                            className="absolute inset-0 bg-system-neon/20 rounded-full blur-xl pointer-events-none"
                          />
                      )}
                  </div>

                  <div className="w-full space-y-4">
                      {/* Assurance Banner */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="bg-gray-900/50 border border-gray-800 p-3 rounded flex items-start gap-3"
                      >
                          <Lock size={16} className="text-system-neon mt-0.5 shrink-0" />
                          <div>
                              <div className="text-[10px] text-system-neon font-bold font-mono uppercase mb-1">SYSTEM ASSURANCE</div>
                              <p className="text-[10px] text-gray-400 leading-relaxed font-mono">
                                  {isTransformed 
                                    ? "By following the daily quests, reaching this potential is mathematically guaranteed."
                                    : "Current stats are temporary. System integration will initiate rapid growth."}
                              </p>
                          </div>
                      </motion.div>

                      {!isTransformed ? (
                          <button 
                            onClick={() => setIsTransformed(true)}
                            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-900 text-white font-black font-mono text-sm rounded shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)] hover:scale-105 transition-all flex items-center justify-center gap-2"
                          >
                              INITIATE TRANSFORMATION <Zap size={16} fill="currentColor" />
                          </button>
                      ) : (
                          <motion.button 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={startJourneySequence}
                            className="w-full py-4 bg-system-neon text-black font-black font-mono text-sm rounded shadow-[0_0_20px_#00d2ff] hover:bg-white transition-all flex items-center justify-center gap-2"
                          >
                              ACCEPT PROTOCOL <Check size={16} />
                          </motion.button>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- STEP 3: FINALIZING (High Fidelity) ---
  if (viewMode === 'FINALIZING') {
      return (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono overflow-hidden">
              
              {/* Background Ambience */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000000_100%)] z-0" />
              <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 z-0 pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none opacity-20 z-0" />

              {/* Central Core Animation */}
              <div className="relative z-10 mb-16 scale-150">
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 10, ease: "linear", repeat: Infinity }} 
                    className="absolute inset-[-40px] border border-dashed border-system-neon/20 rounded-full"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }} 
                    transition={{ duration: 15, ease: "linear", repeat: Infinity }} 
                    className="absolute inset-[-20px] border border-dotted border-system-accent/30 rounded-full"
                  />
                  {/* Glowing Core */}
                  <div className="w-12 h-12 bg-system-neon rounded-full blur-[20px] absolute inset-0 m-auto animate-pulse" />
                  <div className="w-12 h-12 flex items-center justify-center relative bg-black rounded-full border border-system-neon/50 shadow-[0_0_30px_#00d2ff]">
                      <Sparkles className="text-white" size={24} />
                  </div>
              </div>

              {/* Cinematic Text */}
              <div className="h-20 relative z-10 flex items-center justify-center w-full max-w-2xl px-4 text-center">
                  <AnimatePresence mode="wait">
                      <motion.div
                          key={finalizingLog}
                          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                          transition={{ duration: 0.5 }}
                          className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-[0.1em] uppercase leading-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                      >
                          {finalizingLog}
                      </motion.div>
                  </AnimatePresence>
              </div>

              {/* Progress Line */}
              <div className="w-64 h-1 bg-gray-900 mt-12 rounded-full overflow-hidden relative z-10 border border-gray-800">
                  <motion.div
                      className="h-full bg-gradient-to-r from-system-neon to-white shadow-[0_0_15px_#00d2ff]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 12, ease: "easeInOut" }} // Matches approx sequence length
                  />
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-4 text-[9px] text-gray-500 font-mono tracking-widest uppercase z-10"
              >
                  Integration in progress...
              </motion.div>
          </div>
      );
  }

  if (viewMode === 'SETUP') {
      const progress = (step / TOTAL_STEPS) * 100;

      const nextStep = () => {
          if (step === 7 && formData.equipment === 'BODYWEIGHT') {
              startProcessing();
              return;
          }
          setStep(prev => Math.min(TOTAL_STEPS, prev + 1));
      };
      
      const prevStep = () => setStep(prev => Math.max(1, prev - 1));

      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
              <div className="max-w-md w-full bg-black/80 backdrop-blur-md border border-system-border rounded-2xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.7)] relative overflow-hidden flex flex-col min-h-[500px]">
                  
                  {/* Neon Progress Bar */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-900">
                      <motion.div 
                        className="h-full bg-system-neon shadow-[0_0_15px_#00d2ff]" 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "easeInOut", duration: 0.5 }}
                      />
                  </div>

                  {/* Header */}
                  <div className="mb-6 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-system-neon/10 border border-system-neon/30 mb-4 text-system-neon">
                          <Terminal size={20} />
                      </div>
                      <h2 className="text-xl font-bold text-white font-mono tracking-[0.2em] mb-1">CALIBRATION</h2>
                      <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                          PHASE {step} / {formData.equipment === 'BODYWEIGHT' ? 7 : 8}
                      </p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        
                        {/* STEP 1: GENDER */}
                        {step === 1 && (
                            <motion.div 
                                id="tut-health-start"
                                key="step1"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-sm text-gray-400 font-mono mb-2 uppercase tracking-widest">Biological Profile</div>
                                <div className="grid grid-cols-1 gap-3">
                                    {['MALE', 'FEMALE', 'RATHER NOT SAY'].map(g => (
                                        <button 
                                            key={g} 
                                            onClick={() => setFormData({...formData, gender: g as any})} 
                                            className={`py-4 rounded-xl border font-mono font-bold text-sm transition-all hover:scale-105 ${formData.gender === g ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-black border-gray-800 text-gray-500 hover:border-gray-500 hover:text-white'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: AGE */}
                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-sm text-gray-400 font-mono uppercase tracking-widest">Chronological Age</div>
                                <div className="relative max-w-[200px] mx-auto group">
                                    <input 
                                        type="number" 
                                        value={formData.age} 
                                        onChange={e => setFormData({...formData, age: Number(e.target.value)})} 
                                        className="w-full bg-transparent border-b-2 border-gray-700 text-center text-5xl font-black text-white font-mono py-2 focus:border-system-neon focus:outline-none transition-colors"
                                        autoFocus
                                    />
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono">YRS</div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: HEIGHT */}
                        {step === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-sm text-gray-400 font-mono uppercase tracking-widest">Vertical Height</div>
                                <div className="relative max-w-[200px] mx-auto group">
                                    <input 
                                        type="number" 
                                        value={formData.height} 
                                        onChange={e => setFormData({...formData, height: Number(e.target.value)})} 
                                        className="w-full bg-transparent border-b-2 border-gray-700 text-center text-5xl font-black text-white font-mono py-2 focus:border-system-neon focus:outline-none transition-colors"
                                        autoFocus
                                    />
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono">CM</div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: WEIGHT */}
                        {step === 4 && (
                            <motion.div 
                                key="step4"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm text-gray-400 font-mono uppercase tracking-widest mb-2">Current Mass</div>
                                        <div className="relative max-w-[200px] mx-auto group">
                                            <input 
                                                type="number" 
                                                value={formData.weight} 
                                                onChange={e => setFormData({...formData, weight: Number(e.target.value)})} 
                                                className="w-full bg-transparent border-b-2 border-gray-700 text-center text-4xl font-black text-white font-mono py-2 focus:border-system-neon focus:outline-none transition-colors"
                                            />
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono">KG</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 font-mono uppercase tracking-widest mb-2">Target Mass</div>
                                        <div className="relative max-w-[200px] mx-auto group">
                                            <input 
                                                type="number" 
                                                value={formData.targetWeight} 
                                                onChange={e => setFormData({...formData, targetWeight: Number(e.target.value)})} 
                                                className="w-full bg-transparent border-b-2 border-gray-700 text-center text-4xl font-black text-system-accent font-mono py-2 focus:border-system-accent focus:outline-none transition-colors"
                                            />
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono">KG</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 5: ACTIVITY */}
                        {step === 5 && (
                            <motion.div 
                                key="step5"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-3"
                            >
                                <div className="text-sm text-gray-400 font-mono uppercase tracking-widest mb-2">Activity Level</div>
                                <div className="flex flex-col gap-2">
                                    {[
                                        { id: 'SEDENTARY', label: 'SEDENTARY', sub: 'Little to no exercise' },
                                        { id: 'LIGHT', label: 'LIGHT', sub: '1-3 days/week' },
                                        { id: 'MODERATE', label: 'MODERATE', sub: '3-5 days/week' },
                                        { id: 'VERY_ACTIVE', label: 'ATHLETE', sub: '6-7 days/week' }
                                    ].map(act => (
                                        <button 
                                            key={act.id} 
                                            onClick={() => setFormData({...formData, activityLevel: act.id as any})}
                                            className={`w-full py-3 px-4 rounded-lg border flex justify-between items-center transition-all ${formData.activityLevel === act.id ? 'bg-system-accent border-system-accent text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-black border-gray-800 text-gray-400 hover:border-gray-600'}`}
                                        >
                                            <span className="font-mono font-bold text-sm">{act.label}</span>
                                            <span className="text-[10px] opacity-70 font-mono">{act.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 6: GOAL */}
                        {step === 6 && (
                            <motion.div 
                                key="step6"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="text-sm text-gray-400 font-mono uppercase tracking-widest mb-2">Prime Directive</div>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'RECOMP', label: 'LOSE FAT + BUILD MUSCLE', icon: <Swords size={18} />, color: 'text-system-accent', borderColor: 'border-system-accent' },
                                        { id: 'LOSE_WEIGHT', label: 'WEIGHT LOSS', icon: <Zap size={18} />, color: 'text-yellow-500', borderColor: 'border-yellow-500' },
                                        { id: 'BUILD_MUSCLE', label: 'MUSCLE GAIN', icon: <Dumbbell size={18} />, color: 'text-system-neon', borderColor: 'border-system-neon' },
                                        { id: 'ENDURANCE', label: 'ENDURANCE', icon: <Activity size={18} />, color: 'text-system-success', borderColor: 'border-system-success' }
                                    ].map(g => (
                                        <button 
                                            key={g.id} 
                                            onClick={() => setFormData({...formData, goal: g.id as any})}
                                            className={`w-full py-4 rounded-xl border flex items-center justify-center gap-3 transition-all font-mono font-bold ${formData.goal === g.id ? `bg-white/10 ${g.borderColor} ${g.color} shadow-[0_0_15px_currentColor]` : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}
                                        >
                                            {g.icon} {g.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 7: EQUIPMENT */}
                        {step === 7 && (
                            <motion.div 
                                key="step7"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-sm text-gray-400 font-mono uppercase tracking-widest mb-2">Resource Access</div>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'GYM', label: 'FULL GYM ACCESS' },
                                        { id: 'HOME_DUMBBELLS', label: 'HOME (DUMBBELLS)' },
                                        { id: 'BODYWEIGHT', label: 'BODYWEIGHT ONLY' }
                                    ].map(eq => (
                                        <button 
                                            key={eq.id} 
                                            onClick={() => setFormData({...formData, equipment: eq.id as any})}
                                            className={`w-full py-3 rounded-lg border font-mono text-xs font-bold transition-all ${formData.equipment === eq.id ? 'bg-white text-black border-white shadow-[0_0_15px_white]' : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white'}`}
                                        >
                                            {eq.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 8: WORKOUT SPLIT (ONLY FOR GYM/DUMBBELLS) */}
                        {step === 8 && (
                            <motion.div 
                                key="step8"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-sm text-gray-400 font-mono uppercase tracking-widest mb-2">PROTOCOL ARCHITECTURE</div>
                                <div className="grid grid-cols-1 gap-4">
                                    <button 
                                        onClick={() => setFormData({...formData, workoutSplit: 'PPL'})}
                                        className={`w-full py-4 px-4 rounded-xl border flex flex-col gap-1 transition-all ${formData.workoutSplit === 'PPL' ? 'bg-system-neon/10 border-system-neon text-white shadow-[0_0_15px_rgba(0,210,255,0.2)]' : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600'}`}
                                    >
                                        <div className="flex items-center justify-center gap-2 font-mono font-bold text-sm">
                                            <Layers size={16} /> PUSH / PULL / LEGS
                                        </div>
                                        <span className="text-[10px] opacity-60 font-mono">High Frequency (6 Days/Week)</span>
                                    </button>

                                    <button 
                                        onClick={() => setFormData({...formData, workoutSplit: 'CLASSIC'})}
                                        className={`w-full py-4 px-4 rounded-xl border flex flex-col gap-1 transition-all ${formData.workoutSplit === 'CLASSIC' ? 'bg-system-accent/10 border-system-accent text-white shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600'}`}
                                    >
                                        <div className="flex items-center justify-center gap-2 font-mono font-bold text-sm">
                                            <Grid size={16} /> CLASSIC SPLIT
                                        </div>
                                        <span className="text-[10px] opacity-60 font-mono">Isolated Focus (Chest, Back, Legs...)</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                  </div>

                  {/* Navigation Footer */}
                  <div className="mt-8 pt-4 border-t border-gray-800 flex items-center justify-between w-full">
                      {step > 1 ? (
                          <button 
                            onClick={prevStep}
                            className="text-gray-500 hover:text-white transition-colors"
                          >
                              <ArrowLeft size={24} />
                          </button>
                      ) : (
                          <div /> // Spacer
                      )}

                      {/* Logic: If Step 7 and Bodyweight, show Finish. Else show Next */}
                      {(step < TOTAL_STEPS && formData.equipment !== 'BODYWEIGHT') || (step < 7) ? (
                          <button 
                            onClick={nextStep}
                            className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold font-mono hover:bg-system-neon transition-colors"
                          >
                              NEXT <ArrowRight size={16} />
                          </button>
                      ) : (
                          <button 
                            onClick={startProcessing}
                            className="flex items-center gap-2 bg-system-neon text-black px-6 py-2 rounded-full font-bold font-mono hover:bg-white shadow-[0_0_15px_#00d2ff] transition-colors"
                          >
                              INITIALIZE SYSTEM <Check size={16} />
                          </button>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: OVERVIEW & ACTIVE WORKOUT ---
  
  if (viewMode === 'OVERVIEW' && activePlan) {
      return (
          <WorkoutOverview 
              plan={activePlan} 
              focusVideos={playerData.focusVideos}
              onStart={startWorkout}
              onCancel={() => {
                  setActivePlan(null);
                  setSelectedDayIndex(null);
                  setViewMode('MAP');
              }}
          />
      );
  }

  if (viewMode === 'ACTIVE' && activePlan) {
      return (
          <ActiveWorkoutPlayer 
              plan={activePlan} 
              onComplete={finishWorkout}
              onFail={() => {
                  onFailWorkout();
                  setViewMode('MAP');
                  setActivePlan(null);
              }}
              streak={playerData.streak}
          />
      );
  }

  // --- RENDER: DASHBOARD ---
  const currentDayIndex = playerData.logs.filter(l => l.type === 'WORKOUT').length;

  return (
    <div className="h-full flex flex-col gap-4">
        {/* TABS */}
        <div className="flex border-b border-gray-800 sticky top-0 bg-system-bg z-30 pt-2">
            {[
                { id: 'WORKOUT', icon: <Activity size={14} />, label: 'OPERATIONS' },
                { id: 'NUTRITION', icon: <Utensils size={14} />, label: 'RATIONS' },
                { id: 'BODY', icon: <Fingerprint size={14} />, label: 'BIOMETRICS' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 pb-3 text-xs font-mono font-bold tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === tab.id ? 'text-system-neon border-b-2 border-system-neon' : 'text-gray-600 hover:text-white'}`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-h-[500px]">
            <AnimatePresence mode="wait">
                
                {/* --- OPERATIONS TAB --- */}
                {activeTab === 'WORKOUT' && (
                    <motion.div key="workout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12 pb-10">
                        
                        {/* 1. STREAK SECTION */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
                                <Flame className="text-orange-500 mb-2 animate-pulse" size={24} />
                                <div className="text-2xl font-black text-white font-mono">{playerData.streak}</div>
                                <div className="text-[9px] text-orange-400 font-mono tracking-widest uppercase">DAY STREAK</div>
                            </div>
                            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-system-neon/5 group-hover:bg-system-neon/10 transition-colors" />
                                <Target className="text-system-neon mb-2" size={24} />
                                <div className="text-xl font-bold text-white font-mono">{calculateTimeEstimate(healthProfile || formData)}</div>
                                <div className="text-[9px] text-system-neon font-mono tracking-widest uppercase">EST. COMPLETION</div>
                            </div>
                        </div>

                        {/* 2. MAP SECTION */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                                <Map size={16} className="text-system-accent" />
                                <h3 className="text-xs text-white font-mono font-bold tracking-[0.2em]">OPERATIONAL MAP</h3>
                            </div>
                            <WorkoutMap 
                                currentWeight={healthProfile?.weight || 0}
                                targetWeight={healthProfile?.targetWeight || 0}
                                workoutPlan={calculatedPlan}
                                completedDays={currentDayIndex}
                                onStartDay={handleDaySelect}
                            />
                        </div>

                        {/* 3. PROTOCOL OVERVIEW SECTION */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                                <List size={16} className="text-gray-400" />
                                <h3 className="text-xs text-white font-mono font-bold tracking-[0.2em]">PROTOCOL MANIFEST</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6">
                                {/* Chunk days into weeks */}
                                {Array.from({ length: 4 }).map((_, weekIdx) => {
                                    const weekDays = calculatedPlan.slice(weekIdx * 7, (weekIdx + 1) * 7);
                                    
                                    return (
                                        <div key={weekIdx} className="bg-black border border-gray-800 rounded-xl overflow-hidden">
                                            <div className="bg-gray-900/50 p-3 border-b border-gray-800 flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-system-neon" />
                                                    <span className="text-xs font-bold text-white font-mono">WEEK {weekIdx + 1}</span>
                                                </div>
                                                <span className="text-[9px] text-gray-500 font-mono">PHASE {weekIdx + 1}/4</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-7 divide-x divide-gray-800">
                                                {weekDays.map((day, dIdx) => {
                                                    const globalIdx = (weekIdx * 7) + dIdx;
                                                    const isComplete = globalIdx < currentDayIndex;
                                                    const isCurrent = globalIdx === currentDayIndex;
                                                    
                                                    return (
                                                        <div key={dIdx} className={`p-2 flex flex-col items-center justify-center min-h-[60px] relative group hover:bg-white/5 transition-colors ${isCurrent ? 'bg-system-neon/10' : ''}`}>
                                                            <div className="text-[8px] text-gray-600 font-mono mb-1">DAY {dIdx + 1}</div>
                                                            <div className={`text-[9px] font-bold text-center leading-tight ${isComplete ? 'text-system-success line-through opacity-50' : isCurrent ? 'text-white' : 'text-gray-400'}`}>
                                                                {day.focus}
                                                            </div>
                                                            
                                                            {/* Status Dot */}
                                                            <div className={`mt-1 w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-system-success' : isCurrent ? 'bg-system-neon animate-pulse' : 'bg-gray-800'}`} />
                                                            
                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 border border-gray-700 p-2 rounded w-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center shadow-xl">
                                                                <div className="text-[9px] text-white font-bold mb-1">{day.day}</div>
                                                                <div className="text-[8px] text-gray-400">{day.exercises.length} EXERCISES</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </motion.div>
                )}

                {activeTab === 'NUTRITION' && (
                    <motion.div key="nutrition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        {/* SUMMARY CARD */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
                                <div className="text-[10px] text-gray-500 font-mono">CALORIES</div>
                                <div className="text-xl text-white font-mono font-bold">{nutritionInfo.macros.calories}</div>
                            </div>
                            <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
                                <div className="text-[10px] text-gray-500 font-mono">PROTEIN</div>
                                <div className="text-xl text-system-accent font-mono font-bold">{nutritionInfo.macros.protein}g</div>
                            </div>
                            <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
                                <div className="text-[10px] text-gray-500 font-mono">CARBS</div>
                                <div className="text-xl text-blue-400 font-mono font-bold">{nutritionInfo.macros.carbs}g</div>
                            </div>
                            <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
                                <div className="text-[10px] text-gray-500 font-mono">FATS</div>
                                <div className="text-xl text-yellow-500 font-mono font-bold">{nutritionInfo.macros.fats}g</div>
                            </div>
                        </div>

                        {/* FOOD LOGGING */}
                        <div className="bg-black border border-gray-800 rounded-xl p-4">
                            <h3 className="text-xs text-white font-mono font-bold mb-4 flex items-center gap-2">
                                <Search size={14} /> FOOD DATABASE
                            </h3>
                            <input 
                                value={foodSearch}
                                onChange={e => setFoodSearch(e.target.value)}
                                placeholder="Search Indian Foods..."
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-system-neon mb-4"
                            />
                            <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                                {INDIAN_FOOD_DB.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase())).map(food => (
                                    <div key={food.id} className="flex justify-between items-center p-2 hover:bg-gray-900 rounded cursor-pointer group">
                                        <div>
                                            <div className="text-xs text-gray-300 font-bold">{food.name}</div>
                                            <div className="text-[10px] text-gray-500">{food.calories} kcal | P:{food.protein} C:{food.carbs} F:{food.fats}</div>
                                        </div>
                                        <button 
                                            onClick={() => onLogMeal?.({ 
                                                id: Math.random().toString(36).substr(2, 9),
                                                label: 'Quick Add',
                                                items: [{ ...food, quantity: 1 }],
                                                totalCalories: food.calories,
                                                totalProtein: food.protein,
                                                totalCarbs: food.carbs,
                                                totalFats: food.fats,
                                                timestamp: Date.now()
                                            })}
                                            className="opacity-0 group-hover:opacity-100 bg-system-neon text-black text-[10px] font-bold px-2 py-1 rounded"
                                        >
                                            ADD
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* LOGS */}
                        <div className="space-y-2">
                            {playerData.nutritionLogs.map(log => (
                                <div key={log.id} className="flex justify-between items-center bg-gray-900/30 p-3 rounded border border-gray-800">
                                    <div>
                                        <div className="text-xs text-white font-bold">{log.items[0].name} {log.items.length > 1 && `+ ${log.items.length - 1} more`}</div>
                                        <div className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-xs text-system-neon font-mono font-bold">{log.totalCalories} kcal</div>
                                        <button onClick={() => onDeleteMeal?.(log.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'BODY' && (
                    <motion.div key="body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-900/30 border border-gray-800 p-4 rounded-xl">
                            <h3 className="text-xs text-white font-mono font-bold mb-4 flex items-center gap-2"><Ruler size={14} /> STATS</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-xs text-gray-500">BMI</span>
                                    <span className="text-xs text-white font-mono">{healthProfile?.bmi}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-xs text-gray-500">BMR</span>
                                    <span className="text-xs text-white font-mono">{healthProfile?.bmr} kcal</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-xs text-gray-500">BODY TYPE</span>
                                    <span className="text-xs text-white font-mono">{healthProfile?.category}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900/30 border border-gray-800 p-4 rounded-xl">
                             <h3 className="text-xs text-white font-mono font-bold mb-4 flex items-center gap-2"><Camera size={14} /> PROGRESS SCANS</h3>
                             <div className="grid grid-cols-3 gap-2">
                                 {/* Upload Placeholder */}
                                 <div 
                                    onClick={() => onAddPhoto?.({
                                        id: Date.now().toString(),
                                        date: Date.now(),
                                        imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
                                    })}
                                    className="aspect-square bg-black border border-dashed border-gray-700 rounded flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-system-neon hover:text-system-neon transition-colors"
                                 >
                                     <Upload size={20} />
                                     <span className="text-[8px] mt-1 font-mono">UPLOAD</span>
                                 </div>
                                 {/* Display Photos */}
                                 {healthProfile?.progressPhotos?.map(photo => (
                                     <div key={photo.id} className="aspect-square bg-gray-800 rounded relative overflow-hidden group">
                                         <img src={photo.imageUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="Progress" />
                                         <div className="absolute bottom-0 left-0 w-full bg-black/50 text-[8px] text-white p-1 text-center font-mono">
                                             {new Date(photo.date).toLocaleDateString()}
                                         </div>
                                         <button onClick={() => onDeletePhoto?.(photo.id)} className="absolute top-1 right-1 bg-black/50 p-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                                             <X size={10} />
                                         </button>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};

export default HealthView;
