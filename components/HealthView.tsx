
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Ruler, Fingerprint, Camera, Trash2, Search, Utensils, X, Terminal, Upload, ArrowRight, ArrowLeft, Zap, Dumbbell, Check, Cpu, Flame, Target, Map, Calendar, List, Swords, Layers, Grid } from 'lucide-react';
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

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const AnimatedRadar = ({ data, color, label }: { data: { value: number; fullMark: number; subject: string }[], color: string, label: string }) => {
    const size = 300;
    const center = size / 2;
    const radius = 100;
    
    const points = data.map((d, i) => {
        const angle = (360 / data.length) * i;
        const valRadius = (d.value / d.fullMark) * radius;
        return polarToCartesian(center, center, valRadius, angle);
    });

    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';

    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
    
    return (
        <div id="tut-health-radar" className="relative flex flex-col items-center justify-center">
            <h3 className="text-sm font-mono font-bold mb-4 tracking-[0.3em] uppercase" style={{ color }}>{label}</h3>
            <svg width={size} height={size} className="overflow-visible">
                {gridLevels.map((level, idx) => {
                    const gridPoints = data.map((_, i) => {
                        const angle = (360 / data.length) * i;
                        return polarToCartesian(center, center, radius * level, angle);
                    });
                    const gridPath = gridPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';
                    return <path key={idx} d={gridPath} fill="none" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />;
                })}

                <motion.path
                    d={pathD}
                    fill={color}
                    fillOpacity={0.2}
                    stroke="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                />
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
                />

                {points.map((p, i) => (
                    <g key={i}>
                        {(() => {
                             const angle = (360 / data.length) * i;
                             const labelPos = polarToCartesian(center, center, radius + 25, angle);
                             return (
                                 <text 
                                    x={labelPos.x} y={labelPos.y} 
                                    textAnchor="middle" dominantBaseline="middle" 
                                    fill="#666" fontSize="9" fontFamily="monospace" fontWeight="bold"
                                 >
                                     {data[i].subject}
                                 </text>
                             );
                        })()}
                        <motion.circle
                            cx={p.x} cy={p.y} r={4}
                            fill="#000" stroke={color} strokeWidth={2}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1, type: "spring" }}
                        />
                    </g>
                ))}
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
  const [viewMode, setViewMode] = useState<'MAP' | 'OVERVIEW' | 'ACTIVE' | 'SETUP' | 'PROCESSING' | 'ANALYSIS' | 'FINALIZING'>('MAP');
  const [activeTab, setActiveTab] = useState<'WORKOUT' | 'NUTRITION' | 'BODY'>('WORKOUT');
  
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
  const [analysisStage, setAnalysisStage] = useState(1);
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
          setViewMode('ANALYSIS');
          setAnalysisStage(1);
          if (tutorialStep === 12 && onTutorialAction) {
              onTutorialAction(13);
          }
      }, 3500);
  };

  const startJourneySequence = () => {
      setViewMode('FINALIZING');
      const sequence = [
          "Building personalized plan...",
          "Calculating metabolic thresholds...",
          "Adding nutritional ingredients...",
          "Syncing workout protocols...",
          "Finalizing System..."
      ];
      
      let i = 0;
      const interval = setInterval(() => {
          setFinalizingLog(sequence[i]);
          i++;
          if (i >= sequence.length) {
              clearInterval(interval);
              setTimeout(() => finalizeSetup(), 1000);
          }
      }, 800);
  };

  const finalizeSetup = () => {
      const fullProfile = {
          ...formData,
          bmi: parseFloat((formData.weight! / ((formData.height!/100) ** 2)).toFixed(1)),
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
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="mb-8 relative"
              >
                  <div className="w-24 h-24 rounded-full border-t-2 border-l-2 border-system-neon opacity-80" />
                  <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-system-neon animate-pulse" size={40} />
              </motion.div>
              <h2 className="text-2xl font-black text-white font-mono tracking-tighter mb-2">CALIBRATING SYSTEM</h2>
              <p className="text-xs text-gray-500 font-mono">Analyzing biometrics...</p>
          </div>
      );
  }

  if (viewMode === 'ANALYSIS') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] bg-black/95 absolute inset-0 z-50 p-6">
              <h2 className="text-xl font-bold text-white font-mono mb-8 tracking-[0.2em] flex items-center gap-2">
                  <Terminal size={20} className="text-system-accent" /> SYSTEM ANALYSIS
              </h2>
              
              <AnimatedRadar 
                  label="PROJECTION"
                  color="#8b5cf6"
                  data={[
                      { subject: 'STR', value: analysisStage > 0 ? 80 : 20, fullMark: 100 },
                      { subject: 'VIT', value: analysisStage > 0 ? 75 : 30, fullMark: 100 },
                      { subject: 'AGI', value: analysisStage > 0 ? 90 : 40, fullMark: 100 },
                      { subject: 'INT', value: analysisStage > 0 ? 85 : 50, fullMark: 100 },
                      { subject: 'PER', value: analysisStage > 0 ? 70 : 25, fullMark: 100 }
                  ]}
              />

              <div className="mt-12 w-full max-w-xs">
                  <button 
                    onClick={startJourneySequence}
                    className="w-full py-4 bg-white text-black font-black font-mono text-sm rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                      ACCEPT PROTOCOL <Check size={16} />
                  </button>
              </div>
          </div>
      );
  }

  if (viewMode === 'FINALIZING') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] bg-black text-green-500 font-mono text-xs absolute inset-0 z-50">
              <div className="w-full max-w-md space-y-1">
                  {finalizingLog}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="inline-block w-2 h-4 bg-green-500 ml-1"
                  />
              </div>
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
