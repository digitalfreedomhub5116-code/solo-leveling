
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Ruler, Fingerprint, Camera, Trash2, Search, Utensils, X, Terminal, Upload, ArrowRight, ArrowLeft, Zap, Dumbbell, Check, Cpu } from 'lucide-react';
import { HealthProfile, WorkoutDay, PlayerData, ProgressPhoto, MealLog } from '../types';
import ActiveWorkoutPlayer from './ActiveWorkoutPlayer';
import WorkoutMap from './WorkoutMap';
import WorkoutOverview from './WorkoutOverview';
import { generateSystemProtocol } from '../utils/workoutGenerator';
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
}

// --- ANIMATED RADAR COMPONENT ---
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

    // Background Grid
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
    
    return (
        <div className="relative flex flex-col items-center justify-center">
            <h3 className="text-sm font-mono font-bold mb-4 tracking-[0.3em] uppercase" style={{ color }}>{label}</h3>
            <svg width={size} height={size} className="overflow-visible">
                {/* Grid */}
                {gridLevels.map((level, idx) => {
                    const gridPoints = data.map((_, i) => {
                        const angle = (360 / data.length) * i;
                        return polarToCartesian(center, center, radius * level, angle);
                    });
                    const gridPath = gridPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';
                    return <path key={idx} d={gridPath} fill="none" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />;
                })}

                {/* The Data Shape */}
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

                {/* Vertices */}
                {points.map((p, i) => (
                    <g key={i}>
                        {/* Label */}
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
                        {/* Dot */}
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

// --- HELPER FUNCTIONS ---
const calculateNutritionPlan = (profile: Partial<HealthProfile>) => {
  const weight = profile.weight || 70;
  const height = profile.height || 175;
  const age = profile.age || 25;
  const gender = profile.gender || 'MALE';
  const activity = profile.activityLevel || 'MODERATE';
  const goal = profile.goal || 'BUILD_MUSCLE';

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
  
  const protein = Math.round(weight * 2.0);
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
  playerData
}) => {
  const [viewMode, setViewMode] = useState<'MAP' | 'OVERVIEW' | 'ACTIVE' | 'SETUP' | 'PROCESSING' | 'ANALYSIS' | 'FINALIZING'>('MAP');
  const [activeTab, setActiveTab] = useState<'WORKOUT' | 'NUTRITION' | 'BODY'>('WORKOUT');
  
  // Workout State
  const [, setSelectedDayIndex] = useState<number | null>(null);
  const [activePlan, setActivePlan] = useState<WorkoutDay | null>(null);

  // Setup Form State
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 7;
  const [formData, setFormData] = useState<Partial<HealthProfile>>({
      gender: 'MALE', 
      activityLevel: 'MODERATE', 
      goal: 'BUILD_MUSCLE', 
      equipment: 'GYM',
      intensity: 'MODERATE', 
      sessionDuration: 45, 
      age: 25, 
      height: 175, 
      weight: 70,
      targetWeight: 70
  });

  // Nutrition State
  const [foodSearch, setFoodSearch] = useState('');

  // Analysis Sequence State (1: Stats, 2: Current Radar, 3: Future Radar)
  const [analysisStage, setAnalysisStage] = useState(1);
  
  // Finalizing Logs
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
      if (index > (healthProfile?.workoutPlan?.length || 0)) return;
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
      // Simulate calculation time
      setTimeout(() => {
          setViewMode('ANALYSIS');
          setAnalysisStage(1);
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

      // Determine Identity based on goal
      let identity = "Shadow Recruit";
      if (fullProfile.goal === 'LOSE_WEIGHT') identity = "Iron Vessel";
      if (fullProfile.goal === 'BUILD_MUSCLE') identity = "Titan Vanguard";
      if (fullProfile.goal === 'ENDURANCE') identity = "Wind Walker";

      onSaveProfile(fullProfile, identity);
      setViewMode('MAP');
  };

  // --- RENDER: ACTIVE SESSION ---
  if (viewMode === 'ACTIVE' && activePlan) {
      return (
        <ActiveWorkoutPlayer 
            plan={activePlan} 
            onComplete={finishWorkout} 
            onFail={() => { onFailWorkout(); setViewMode('MAP'); }} 
            streak={playerData.streak} 
        />
      );
  }

  // --- RENDER: WORKOUT OVERVIEW ---
  if (viewMode === 'OVERVIEW' && activePlan) {
      return (
        <WorkoutOverview 
            plan={activePlan} 
            focusVideos={playerData.focusVideos} 
            onStart={startWorkout} 
            onCancel={() => setViewMode('MAP')} 
        />
      );
  }

  // --- RENDER: PROCESSING SCREEN ---
  if (viewMode === 'PROCESSING') {
      const logs = [
          "Compiling biometric data...",
          "Calculating Basal Metabolic Rate (BMR)...",
          "Projecting muscle synthesis timelines...",
          "Analyzing activity coefficients...",
          "Identifying physical limiters...",
          "SYNCING WITH SYSTEM DATABASE..."
      ];

      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-black">
              <div className="w-24 h-24 relative mb-8">
                  <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                  <div className="absolute inset-0 border-t-4 border-system-neon rounded-full animate-spin"></div>
                  <Terminal className="absolute inset-0 m-auto text-system-neon animate-pulse" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white font-mono mb-6 tracking-widest animate-pulse">CALIBRATING SYSTEM</h2>
              <div className="space-y-2 text-left font-mono text-xs max-w-sm w-full bg-gray-900/50 p-4 rounded border border-gray-800">
                  {logs.map((log, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.5 }}
                        className="text-system-neon/80"
                      >
                          {`> ${log}`}
                      </motion.div>
                  ))}
              </div>
          </div>
      );
  }

  // --- RENDER: FINALIZING SEQUENCE ---
  if (viewMode === 'FINALIZING') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-black">
              <div className="mb-8">
                  <Cpu className="w-16 h-16 text-system-accent animate-pulse mx-auto mb-4" />
                  <div className="h-1 w-64 bg-gray-900 rounded-full overflow-hidden mx-auto">
                      <motion.div 
                        className="h-full bg-system-accent"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 4, ease: "linear" }}
                      />
                  </div>
              </div>
              <h2 className="text-xl font-bold text-white font-mono mb-2 tracking-widest">SYSTEM INITIALIZATION</h2>
              <p className="text-sm text-gray-400 font-mono animate-pulse">{finalizingLog}</p>
          </div>
      );
  }

  // --- RENDER: ANALYSIS STAGES ---
  if (viewMode === 'ANALYSIS') {
      // Calculate estimated time
      const weightDiff = Math.abs((formData.weight || 0) - (formData.targetWeight || formData.weight || 0));
      const weeks = Math.ceil(weightDiff / 0.5) || 4; 
      
      const currentStats = [
          { subject: 'STRENGTH', value: 30, fullMark: 100 },
          { subject: 'ENDURANCE', value: 40, fullMark: 100 },
          { subject: 'AGILITY', value: 20, fullMark: 100 },
          { subject: 'VITALITY', value: 50, fullMark: 100 },
          { subject: 'INTELLIGENCE', value: 40, fullMark: 100 },
      ];

      // Organic/Realistic High Stats (Not just 100s)
      const potentialStats = [
          { subject: 'STRENGTH', value: 85, fullMark: 100 },
          { subject: 'ENDURANCE', value: 92, fullMark: 100 },
          { subject: 'AGILITY', value: 78, fullMark: 100 },
          { subject: 'VITALITY', value: 95, fullMark: 100 },
          { subject: 'INTELLIGENCE', value: 88, fullMark: 100 },
      ];

      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
              <div className="max-w-4xl w-full bg-black/90 border border-system-neon/30 rounded-2xl p-6 md:p-10 shadow-[0_0_100px_rgba(0,210,255,0.1)] relative overflow-hidden flex flex-col items-center">
                  
                  {/* Stage 1: Stats Grid */}
                  <AnimatePresence mode="wait">
                      {analysisStage === 1 && (
                          <motion.div 
                            key="stage1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full space-y-8"
                          >
                              <div>
                                  <h2 className="text-sm text-gray-500 font-mono tracking-[0.2em] mb-2">PHASE 1/3</h2>
                                  <h1 className="text-3xl md:text-4xl font-black text-white italic">BIOMETRIC ANALYSIS COMPLETE</h1>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-gray-900/50 p-6 rounded border border-gray-800 flex flex-col items-center">
                                      <div className="text-[10px] text-gray-500 font-mono mb-2">EST. TIMELINE</div>
                                      <div className="text-3xl text-white font-mono font-bold">{weeks} <span className="text-xs text-gray-500">WKS</span></div>
                                  </div>
                                  <div className="bg-gray-900/50 p-6 rounded border border-gray-800 flex flex-col items-center">
                                      <div className="text-[10px] text-gray-500 font-mono mb-2">DAILY RATION</div>
                                      <div className="text-3xl text-system-neon font-mono font-bold">{nutritionInfo.macros.calories} <span className="text-xs text-gray-500">KCAL</span></div>
                                  </div>
                                  <div className="bg-gray-900/50 p-6 rounded border border-gray-800 flex flex-col items-center">
                                      <div className="text-[10px] text-gray-500 font-mono mb-2">BASAL RATE</div>
                                      <div className="text-3xl text-white font-mono">{nutritionInfo.bmr}</div>
                                  </div>
                                  <div className="bg-gray-900/50 p-6 rounded border border-gray-800 flex flex-col items-center">
                                      <div className="text-[10px] text-gray-500 font-mono mb-2">BMI</div>
                                      <div className="text-3xl text-white font-mono">{((formData.weight || 0) / (((formData.height || 1)/100) ** 2)).toFixed(1)}</div>
                                  </div>
                              </div>

                              <button 
                                  onClick={() => setAnalysisStage(2)}
                                  className="px-8 py-3 bg-white text-black font-bold font-mono rounded-full hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                              >
                                  NEXT PHASE <ArrowRight size={16} />
                              </button>
                          </motion.div>
                      )}

                      {/* Stage 2: Current Radar */}
                      {analysisStage === 2 && (
                          <motion.div 
                            key="stage2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full space-y-8 flex flex-col items-center"
                          >
                              <div>
                                  <h2 className="text-sm text-red-500 font-mono tracking-[0.2em] mb-2">PHASE 2/3</h2>
                                  <h1 className="text-3xl md:text-4xl font-black text-white italic">CURRENT REALITY</h1>
                                  <p className="text-gray-500 font-mono text-xs mt-2">Physical capabilities are suppressed. Status: E-RANK.</p>
                              </div>

                              <AnimatedRadar data={currentStats} color="#ef4444" label="CURRENT STATUS" />

                              <button 
                                  onClick={() => setAnalysisStage(3)}
                                  className="px-8 py-3 border border-red-500 text-red-500 font-bold font-mono rounded-full hover:bg-red-500 hover:text-black transition-colors flex items-center gap-2 mx-auto"
                              >
                                  REVEAL POTENTIAL <ArrowRight size={16} />
                              </button>
                          </motion.div>
                      )}

                      {/* Stage 3: Future Radar */}
                      {analysisStage === 3 && (
                          <motion.div 
                            key="stage3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full space-y-8 flex flex-col items-center"
                          >
                              <div>
                                  <h2 className="text-sm text-system-neon font-mono tracking-[0.2em] mb-2">PHASE 3/3</h2>
                                  <h1 className="text-3xl md:text-4xl font-black text-white italic">SYSTEM PROJECTION</h1>
                                  <p className="text-gray-500 font-mono text-xs mt-2">With consistent adherence, S-RANK status is inevitable.</p>
                              </div>

                              <AnimatedRadar data={potentialStats} color="#00d2ff" label="POTENTIAL WITH US" />

                              <button 
                                  onClick={startJourneySequence}
                                  className="px-8 py-4 bg-system-neon text-black font-bold font-mono rounded-lg shadow-[0_0_20px_#00d2ff] hover:bg-white transition-all flex items-center gap-2 mx-auto animate-pulse"
                              >
                                  START MY JOURNEY <ArrowRight size={18} />
                              </button>
                          </motion.div>
                      )}
                  </AnimatePresence>

              </div>
          </div>
      );
  }

  // --- RENDER: SETUP WIZARD ---
  if (viewMode === 'SETUP') {
      const progress = (step / TOTAL_STEPS) * 100;

      const nextStep = () => setStep(prev => Math.min(TOTAL_STEPS, prev + 1));
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
                          PHASE {step} / {TOTAL_STEPS}
                      </p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        
                        {/* STEP 1: GENDER */}
                        {step === 1 && (
                            <motion.div 
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

                      {step < TOTAL_STEPS ? (
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

  // --- RENDER: DASHBOARD ---
  const currentDayIndex = playerData.logs.filter(l => l.type === 'WORKOUT').length;

  return (
    <div className="h-full flex flex-col gap-4">
        {/* TABS */}
        <div className="flex border-b border-gray-800">
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
                {activeTab === 'WORKOUT' && (
                    <motion.div key="workout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <WorkoutMap 
                            currentWeight={healthProfile?.weight || 0}
                            targetWeight={healthProfile?.targetWeight || 0}
                            workoutPlan={calculatedPlan}
                            completedDays={currentDayIndex}
                            onStartDay={handleDaySelect}
                        />
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
