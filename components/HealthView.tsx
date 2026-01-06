
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Target, Dumbbell, Flame, CheckCircle, TrendingUp, ChevronLeft, ChevronRight, Ruler, Fingerprint, Crown, Lock, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HealthProfile, WorkoutDay, Exercise, PlayerData } from '../types';
import ActiveWorkoutPlayer from './ActiveWorkoutPlayer';
import WorkoutMap from './WorkoutMap';
import WorkoutOverview from './WorkoutOverview';
import { generateDailyWorkout } from '../utils/workoutGenerator';

interface HealthViewProps {
  healthProfile?: HealthProfile;
  onSaveProfile: (profile: HealthProfile, identity: string) => void;
  onCompleteWorkout: (exercisesCompleted: number, totalExercises: number, results: Record<string, number>, intensityModifier: boolean) => void;
  onFailWorkout: () => void;
  playerData: PlayerData;
}

// Interactive Slider Component
const NeonSlider: React.FC<{ 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  unit: string; 
  onChange: (val: number) => void 
}> = ({ label, value, min, max, unit, onChange }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="w-full mb-8 group">
      <div className="flex justify-between items-end mb-4">
        <span className="text-gray-500 font-mono text-xs tracking-widest uppercase group-hover:text-system-neon transition-colors">{label}</span>
        <div className="flex items-baseline gap-1">
           <span className="text-4xl font-black text-white font-mono">{value}</span>
           <span className="text-system-neon font-mono text-sm">{unit}</span>
        </div>
      </div>
      <div className="relative h-2 bg-gray-800 rounded-full cursor-pointer">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-system-neon rounded-full shadow-[0_0_15px_#00d2ff]" 
          style={{ width: `${percentage}%` }}
          layoutId={`slider-fill-${label}`}
        />
        <input 
          type="range" 
          min={min} 
          max={max} 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {/* Thumb Indicator (Visual only) */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-black border-2 border-system-neon rounded-full pointer-events-none shadow-[0_0_10px_rgba(0,210,255,0.5)] z-0 transition-transform group-hover:scale-125"
          style={{ left: `calc(${percentage}% - 12px)` }}
        />
      </div>
    </div>
  );
};

const HealthView: React.FC<HealthViewProps> = ({ healthProfile, onSaveProfile, onCompleteWorkout, onFailWorkout, playerData }) => {
  const [activeTab, setActiveTab] = useState<'WORKOUT' | 'STATS'>('WORKOUT');
  const [isOnboarding, setIsOnboarding] = useState(!healthProfile);
  const [scanStep, setScanStep] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [activeWorkoutData, setActiveWorkoutData] = useState<{plan: WorkoutDay, isCardio: boolean} | null>(null);
  
  // State for the selected day from the map
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  
  // Overview expansion state
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  
  // Identity Selection State
  const [selectedIdentity, setSelectedIdentity] = useState<string>('');

  // Determine "Completed Days" based on streak or logged data
  // For this version, we'll approximate using the streak if no explicit "days_completed" field exists
  const completedDays = Math.max(0, playerData.streak - 1); 

  // Form State
  const [formData, setFormData] = useState<Partial<HealthProfile>>({
    gender: 'MALE',
    age: 25,
    height: 175,
    weight: 70,
    targetWeight: 70,
    activityLevel: 'MODERATE',
    goal: 'BUILD_MUSCLE',
    equipment: 'GYM',
    sessionDuration: 60,
    intensity: 'MODERATE',
    injuries: [],
    ...healthProfile
  });

  const [realtimeBMI, setRealtimeBMI] = useState(0);

  // Real-time BMI Calc
  useEffect(() => {
    if (formData.height && formData.weight) {
      const h = formData.height / 100;
      const bmi = formData.weight / (h * h);
      setRealtimeBMI(parseFloat(bmi.toFixed(1)));
    }
  }, [formData.height, formData.weight]);

  const steps = [
    { id: 'INTRO', title: 'SYSTEM INITIALIZATION', icon: <Activity /> },
    { id: 'METRICS', title: 'BIOMETRIC CALIBRATION', icon: <Ruler /> },
    { id: 'TARGET', title: 'TARGET LOCK', icon: <Target /> },
    { id: 'INTENSITY', title: 'INTENSITY PROTOCOL', icon: <Flame /> },
    { id: 'LOGISTICS', title: 'LOGISTICS', icon: <Dumbbell /> },
    { id: 'IDENTITY', title: 'AFFIRM IDENTITY', icon: <Fingerprint /> },
  ];

  // --- 7-DAY SPLIT ARCHITECT (UPDATED) ---
  const generatePlan = (): WorkoutDay[] => {
      // Dynamic Day Generation: Day 1 is TODAY
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const todayIndex = new Date().getDay(); // 0 (Sun) - 6 (Sat)
      
      const plan: WorkoutDay[] = [];
      
      // Strict Schedule Map: Day Index -> Focus
      const scheduleMap: Record<number, string> = {
          1: 'CHEST',      // Monday
          2: 'BACK',       // Tuesday
          3: 'SHOULDERS',  // Wednesday
          4: 'ARMS',       // Thursday
          5: 'CORE',       // Friday
          6: 'LEGS',       // Saturday
          0: 'REST'        // Sunday
      };

      for (let i = 0; i < 7; i++) {
          // Calculate the specific day of week index for this slot
          const targetDayIndex = (todayIndex + i) % 7;
          const dayLabel = dayNames[targetDayIndex];
          const focus = scheduleMap[targetDayIndex];

          let exercises: Exercise[] = [];
          
          if (focus === 'REST') {
              exercises = [{name: 'Active Recovery', sets: 1, reps: '30 min', duration: 30, completed: false, type: 'STRETCH'}];
              plan.push({ day: dayLabel, focus, exercises, isRecovery: true, totalDuration: 30 });
          } else {
              // Use generator for specific body part logic
              exercises = generateDailyWorkout(
                  formData as HealthProfile, 
                  focus, 
                  playerData.exerciseDatabase
              );
              
              // Use the user's selected duration
              plan.push({ 
                  day: dayLabel, 
                  focus, 
                  exercises, 
                  isRecovery: false, 
                  totalDuration: formData.sessionDuration || 60 
              });
          }
      }
      return plan;
  };

  const handleFinishOnboarding = () => {
      const h = (formData.height || 175) / 100;
      const bmi = (formData.weight || 70) / (h * h);
      const plan = generatePlan();
      
      const profile: HealthProfile = {
          ...formData as HealthProfile,
          startingWeight: formData.weight,
          bmi,
          bmr: 2000,
          category: bmi < 25 ? 'OPTIMAL' : 'OVERWEIGHT',
          workoutPlan: plan,
          macros: { protein: 180, carbs: 200, fats: 60, calories: 2500 }
      };
      
      onSaveProfile(profile, selectedIdentity || "Shadow Hunter");
      setIsOnboarding(false);
  };

  // Get identities based on goal
  const getIdentityOptions = () => {
     switch (formData.goal) {
         case 'LOSE_WEIGHT':
             return [
                 { title: 'SHADOW DANCER', desc: 'Agility, Speed, Lethal Precision.' },
                 { title: 'WIND WALKER', desc: 'Untouchable, Enduring, Light.' },
                 { title: 'DISCIPLINED MONK', desc: 'Control over Body and Mind.' }
             ];
         case 'BUILD_MUSCLE':
             return [
                 { title: 'IRON MONARCH', desc: 'Unbreakable Defense, Massive Power.' },
                 { title: 'TITAN DESTROYER', desc: 'Force of Nature, Heavy Lifter.' },
                 { title: 'WARLORD', desc: 'Dominance through Strength.' }
             ];
         case 'ENDURANCE':
             return [
                 { title: 'RELENTLESS STRIKER', desc: 'Never Tires, Always Moving.' },
                 { title: 'STORM CHASER', desc: 'Energy that outlasts the storm.' },
                 { title: 'PATHFINDER', desc: 'The Journey is the Destination.' }
             ];
         default:
             return [
                 { title: 'SYSTEM RULER', desc: 'Master of all Stats.' },
                 { title: 'SOLO LEVELER', desc: 'Rising from the weakest to strongest.' },
                 { title: 'HUNTER', desc: 'Seeking growth in every challenge.' }
             ];
     }
  };

  // --- RECOVERY LOGIC ---
  const getMuscleStatus = () => {
      // Logic: Simulate fatigue based on the generated schedule relative to "Today".
      // Status = 100% (Recovered) -> Drops to 55% after training -> Recovers over 48h.
      
      const status = { UPPER: 100, LOWER: 100, CORE: 100, CARDIO: 100 };
      if (!healthProfile) return status;

      const todayIndex = new Date().getDay(); // 0-6 (Sun-Sat)
      
      // Look back 2 days
      const checkFatigue = (categoryKeywords: string[]) => {
          // Check Yesterday (1 day ago)
          const yesterdayIndex = (todayIndex + 6) % 7; // Wrap around
          // Find the workout plan entry that corresponds to yesterday's day name
          // NOTE: generatePlan creates a 7 day array starting from "Today". 
          // But healthProfile.workoutPlan is fixed when created.
          // We need to match current weekday to plan days.
          
          // Simplified approach: Iterate plan to find matching weekday
          const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          const yesterdayLabel = dayNames[yesterdayIndex];
          const twoDaysAgoLabel = dayNames[(todayIndex + 5) % 7];

          const yesterdayWorkout = healthProfile.workoutPlan.find(d => d.day === yesterdayLabel);
          const twoDaysAgoWorkout = healthProfile.workoutPlan.find(d => d.day === twoDaysAgoLabel);

          if (yesterdayWorkout && categoryKeywords.some(k => yesterdayWorkout.focus.includes(k))) {
              return 55; // High Fatigue
          }
          if (twoDaysAgoWorkout && categoryKeywords.some(k => twoDaysAgoWorkout.focus.includes(k))) {
              return 85; // Recovering
          }
          return 100; // Ready
      };

      status.UPPER = checkFatigue(['CHEST', 'BACK', 'ARMS', 'SHOULDERS', 'UPPER']);
      status.LOWER = checkFatigue(['LEGS', 'LOWER', 'SQUAT']);
      status.CORE = checkFatigue(['ABS', 'CORE']);
      status.CARDIO = checkFatigue(['CARDIO', 'HIIT', 'RUN']);

      return status;
  };

  const muscleStatus = getMuscleStatus();

  // --- ONBOARDING VIEW ---
  if (isOnboarding) {
      return (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
             {/* Dynamic Background */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-system-neon/10 via-black to-black pointer-events-none" />
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-neon to-transparent opacity-50" />

             <div className="relative z-10 w-full max-w-xl">
                 {/* Step Indicator */}
                 <div className="flex justify-between items-center mb-8">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${i <= scanStep ? 'bg-system-neon text-black border-system-neon' : 'bg-black text-gray-700 border-gray-800'}`}>
                                {i < scanStep ? <CheckCircle size={14} /> : i + 1}
                            </div>
                        </div>
                    ))}
                 </div>

                 <div className="bg-[#050505] border border-gray-800 rounded-2xl p-8 shadow-2xl min-h-[400px] flex flex-col relative overflow-hidden">
                    <AnimatePresence mode="wait">
                       <motion.div
                         key={scanStep}
                         initial={{ opacity: 0, x: 50 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: -50 }}
                         transition={{ duration: 0.4, ease: "easeOut" }}
                         className="flex-1 flex flex-col"
                       >
                          <div className="mb-8 flex items-center gap-3">
                              <div className="p-3 bg-gray-900 rounded-lg text-system-neon">
                                  {steps[scanStep].icon}
                              </div>
                              <div>
                                  <h2 className="text-xl font-bold text-white font-mono tracking-tight">{steps[scanStep].title}</h2>
                                  <p className="text-xs text-gray-500 font-mono">COMPLETE CALIBRATION</p>
                              </div>
                          </div>

                          {/* STEP 0: INTRO */}
                          {scanStep === 0 && (
                              <div className="text-center flex-1 flex flex-col justify-center">
                                  <Activity size={64} className="text-system-neon mx-auto mb-6 animate-pulse" />
                                  <p className="text-gray-400 mb-6 font-mono text-sm leading-relaxed">
                                      The System requires your biometric data to generate an optimized S-Rank growth protocol. 
                                      <br/><br/>
                                      Precision is key.
                                  </p>
                                  <div className="grid grid-cols-2 gap-4">
                                      {['MALE', 'FEMALE'].map(g => (
                                          <button 
                                            key={g} 
                                            onClick={() => setFormData({...formData, gender: g as any})}
                                            className={`py-4 border rounded-lg font-mono text-sm transition-all ${formData.gender === g ? 'bg-system-neon text-black border-system-neon font-bold' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                                          >
                                              {g}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {/* STEP 1: METRICS (SLIDERS) */}
                          {scanStep === 1 && (
                              <div className="flex-1 flex flex-col justify-center">
                                  <NeonSlider 
                                      label="HEIGHT" 
                                      value={formData.height || 175} 
                                      min={140} 
                                      max={220} 
                                      unit="CM"
                                      onChange={(v) => setFormData({...formData, height: v})}
                                  />
                                  <NeonSlider 
                                      label="CURRENT WEIGHT" 
                                      value={formData.weight || 70} 
                                      min={40} 
                                      max={150} 
                                      unit="KG"
                                      onChange={(v) => setFormData({...formData, weight: v})}
                                  />
                                  <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800 flex justify-between items-center">
                                      <span className="text-gray-500 font-mono text-xs">CALCULATED BMI</span>
                                      <span className={`font-mono text-xl font-bold ${realtimeBMI > 25 ? 'text-system-warning' : 'text-system-success'}`}>
                                          {realtimeBMI}
                                      </span>
                                  </div>
                              </div>
                          )}

                          {/* STEP 2: TARGET */}
                          {scanStep === 2 && (
                              <div className="flex-1 flex flex-col justify-center">
                                  <div className="text-center mb-6">
                                      <h3 className="text-system-neon font-mono text-4xl font-black">{formData.targetWeight} KG</h3>
                                      <p className="text-xs text-gray-500 font-mono mt-2">OBJECTIVE</p>
                                  </div>
                                  <NeonSlider 
                                      label="TARGET WEIGHT" 
                                      value={formData.targetWeight || 70} 
                                      min={40} 
                                      max={150} 
                                      unit="KG"
                                      onChange={(v) => setFormData({...formData, targetWeight: v})}
                                  />
                                  <div className="grid grid-cols-1 gap-3 mt-4">
                                      {['LOSE_WEIGHT', 'BUILD_MUSCLE', 'ENDURANCE'].map(g => (
                                          <button 
                                            key={g} 
                                            onClick={() => setFormData({...formData, goal: g as any})}
                                            className={`p-3 border rounded text-left font-mono text-xs transition-colors ${formData.goal === g ? 'bg-system-accent/20 border-system-accent text-white' : 'border-gray-800 text-gray-500'}`}
                                          >
                                              {g.replace('_', ' ')}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {/* STEP 3: INTENSITY */}
                          {scanStep === 3 && (
                              <div className="space-y-3">
                                  {[
                                      { id: 'LIGHT', label: 'E-RANK', desc: 'Maintenance' },
                                      { id: 'MODERATE', label: 'B-RANK', desc: 'Balanced Growth' },
                                      { id: 'HIGH', label: 'S-RANK', desc: 'Maximum Intensity' }
                                  ].map(i => (
                                      <button 
                                        key={i.id} 
                                        onClick={() => setFormData({...formData, intensity: i.id as any})}
                                        className={`w-full p-5 border rounded-lg flex items-center justify-between group transition-all ${formData.intensity === i.id ? 'bg-red-900/20 border-red-500' : 'border-gray-800 hover:border-gray-600'}`}
                                      >
                                          <div className="text-left">
                                              <div className={`font-bold font-mono text-lg ${formData.intensity === i.id ? 'text-red-500' : 'text-gray-400'}`}>{i.label}</div>
                                              <div className="text-xs text-gray-600 font-mono">{i.desc}</div>
                                          </div>
                                          {formData.intensity === i.id && <Flame className="text-red-500" />}
                                      </button>
                                  ))}
                              </div>
                          )}

                          {/* STEP 4: LOGISTICS (Duration) */}
                          {scanStep === 4 && (
                              <div className="flex-1 flex flex-col justify-center">
                                  <NeonSlider 
                                      label="SESSION DURATION" 
                                      value={formData.sessionDuration || 60} 
                                      min={30} 
                                      max={120} 
                                      unit="MIN"
                                      onChange={(v) => setFormData({...formData, sessionDuration: v})}
                                  />
                                  <div className="grid grid-cols-2 gap-4 mt-6">
                                      {['GYM', 'HOME_DUMBBELLS', 'BODYWEIGHT'].map(e => (
                                          <button 
                                            key={e}
                                            onClick={() => setFormData({...formData, equipment: e as any})}
                                            className={`py-4 border rounded font-mono text-xs ${formData.equipment === e ? 'bg-white text-black font-bold' : 'border-gray-800 text-gray-500'}`}
                                          >
                                              {e.replace('_', ' ')}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {/* STEP 5: IDENTITY PATH SELECTION */}
                          {scanStep === 5 && (
                              <div className="flex-1 flex flex-col justify-center space-y-4">
                                  <p className="text-gray-400 font-mono text-xs mb-2 text-center">SELECT YOUR PATH TO POWER</p>
                                  {getIdentityOptions().map((idOption) => (
                                      <button
                                        key={idOption.title}
                                        onClick={() => setSelectedIdentity(idOption.title)}
                                        className={`relative p-5 border rounded-lg text-left transition-all group overflow-hidden ${selectedIdentity === idOption.title ? 'bg-system-neon/10 border-system-neon ring-1 ring-system-neon' : 'border-gray-800 hover:border-gray-600'}`}
                                      >
                                          {selectedIdentity === idOption.title && (
                                              <div className="absolute top-0 right-0 p-2">
                                                  <Crown size={16} className="text-system-neon" />
                                              </div>
                                          )}
                                          <h3 className={`font-bold font-mono text-lg ${selectedIdentity === idOption.title ? 'text-white' : 'text-gray-400'}`}>
                                              {idOption.title}
                                          </h3>
                                          <p className="text-xs text-gray-600 font-mono mt-1">{idOption.desc}</p>
                                      </button>
                                  ))}
                                  {selectedIdentity && (
                                      <div className="mt-4 text-center">
                                          <div className="text-[10px] text-system-neon font-mono animate-pulse">
                                              IDENTITY AFFIRMED: {selectedIdentity}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )}

                       </motion.div>
                    </AnimatePresence>

                    <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-900">
                        <button 
                          onClick={() => setScanStep(prev => Math.max(0, prev - 1))}
                          className={`text-gray-500 hover:text-white transition-colors ${scanStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                        >
                            <ChevronLeft />
                        </button>
                        
                        <div className="flex gap-1">
                            {steps.map((_, i) => (
                                <div key={i} className={`w-1 h-1 rounded-full ${i === scanStep ? 'bg-system-neon' : 'bg-gray-800'}`} />
                            ))}
                        </div>

                        <button 
                          onClick={() => {
                              if (scanStep < steps.length - 1) setScanStep(prev => prev + 1);
                              else handleFinishOnboarding();
                          }}
                          disabled={scanStep === 5 && !selectedIdentity}
                          className="flex items-center gap-2 bg-system-neon text-black font-bold px-6 py-2 rounded-full hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {scanStep === steps.length - 1 ? 'AWAKEN' : 'NEXT'} <ChevronRight size={16} />
                        </button>
                    </div>
                 </div>
             </div>
          </div>
      );
  }

  // --- DASHBOARD VIEW ---
  
  if (!healthProfile) return null;
  
  const rawPlan = healthProfile.workoutPlan[activeDayIndex % 7];
  
  // Dynamic Override: Re-fetch exercises for the specific day focus from global DB
  const dynamicExercises = generateDailyWorkout(healthProfile, rawPlan.focus, playerData.exerciseDatabase);
  
  const todaysPlan: WorkoutDay = {
      ...rawPlan,
      exercises: dynamicExercises
  };

  // Graph Data
  const graphData = [
      { name: 'W1', weight: healthProfile.startingWeight || 75 },
      { name: 'W2', weight: (healthProfile.startingWeight || 75) - 0.5 },
      { name: 'W3', weight: (healthProfile.startingWeight || 75) - 1.2 },
      { name: 'W4', weight: (healthProfile.startingWeight || 75) - 1.8 },
      { name: 'NOW', weight: healthProfile.weight },
  ];

  if (isWorkoutActive && activeWorkoutData) {
      return (
          <ActiveWorkoutPlayer 
             plan={activeWorkoutData.plan}
             onComplete={(completed, total, results) => {
                 onCompleteWorkout(completed, total, results, activeWorkoutData.isCardio);
                 setIsWorkoutActive(false);
                 setActiveWorkoutData(null);
             }}
             onFail={() => {
                 onFailWorkout();
                 setIsWorkoutActive(false);
                 setActiveWorkoutData(null);
             }}
             streak={playerData.streak}
          />
      );
  }

  return (
    <div className="space-y-6 pb-24">
        {/* Dungeon Gate Overview */}
        <AnimatePresence>
            {showOverview && (
                <WorkoutOverview 
                    plan={todaysPlan}
                    onStart={(modifiedPlan, isCardio) => {
                        setActiveWorkoutData({ plan: modifiedPlan, isCardio });
                        setIsWorkoutActive(true);
                        setShowOverview(false);
                    }}
                    onCancel={() => setShowOverview(false)}
                />
            )}
        </AnimatePresence>

        {/* Heatmap & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Muscle Group Heatmap (Stylized Grid) */}
            <div className="bg-system-card border border-system-border rounded-xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-mono text-gray-400 tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-system-accent" /> MUSCLE STATUS
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {/* Status Bars for Body Parts - Now Dynamic */}
                    {[
                        { label: 'UPPER BODY', val: muscleStatus.UPPER, color: 'bg-system-neon' },
                        { label: 'CORE', val: muscleStatus.CORE, color: 'bg-system-warning' },
                        { label: 'LOWER BODY', val: muscleStatus.LOWER, color: 'bg-system-danger' },
                        { label: 'CARDIO', val: muscleStatus.CARDIO, color: 'bg-system-success' }
                    ].map((part) => (
                        <div key={part.label} className="bg-gray-900/50 p-3 rounded border border-gray-800">
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-gray-500 font-mono">{part.label}</span>
                                <span className="text-[10px] text-white font-mono">{part.val}%</span>
                            </div>
                            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${part.val}%` }}
                                    className={`h-full ${part.color} shadow-[0_0_8px_currentColor]`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Progression Graph */}
            <div className="bg-system-card border border-system-border rounded-xl p-6 lg:col-span-2 relative">
                <div className="absolute top-6 left-6 z-10">
                    <h3 className="text-sm font-mono text-gray-400 tracking-widest flex items-center gap-2">
                        <TrendingUp size={14} className="text-system-success" /> WEIGHT TRAJECTORY
                    </h3>
                    <p className="text-xs text-gray-600 font-mono">TARGET: {healthProfile.targetWeight} KG</p>
                </div>
                <div className="h-[180px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={graphData}>
                            <defs>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Action Tabs */}
        <div className="flex gap-4 border-b border-gray-800">
            <button 
                onClick={() => setActiveTab('WORKOUT')}
                className={`pb-2 text-sm font-mono transition-colors border-b-2 ${activeTab === 'WORKOUT' ? 'text-system-neon border-system-neon' : 'text-gray-600 border-transparent hover:text-gray-300'}`}
            >
                QUEST MAP
            </button>
            <button 
                onClick={() => setActiveTab('STATS')}
                className={`pb-2 text-sm font-mono transition-colors border-b-2 ${activeTab === 'STATS' ? 'text-system-accent border-system-accent' : 'text-gray-600 border-transparent hover:text-gray-300'}`}
            >
                PROTOCOL OVERVIEW
            </button>
        </div>

        <AnimatePresence mode="wait">
            {activeTab === 'WORKOUT' && (
                <motion.div 
                    key="workout"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                >
                    <WorkoutMap 
                        currentWeight={healthProfile.weight}
                        targetWeight={healthProfile.targetWeight || healthProfile.weight - 5}
                        workoutPlan={healthProfile.workoutPlan}
                        completedDays={completedDays}
                        onStartDay={(dayIndex) => {
                            setActiveDayIndex(dayIndex);
                            setShowOverview(true);
                        }}
                    />
                </motion.div>
            )}
            
            {activeTab === 'STATS' && (
                <motion.div 
                    key="overview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                >
                    {healthProfile.workoutPlan.map((dayPlan, index) => {
                        const isLocked = index > completedDays;
                        const isCompleted = index < completedDays;
                        const isToday = index === completedDays;
                        
                        return (
                            <div key={index} className={`bg-system-card border rounded-lg overflow-hidden transition-all ${isToday ? 'border-system-neon/50' : 'border-system-border'}`}>
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-sm ${isToday ? 'bg-system-neon text-black' : isLocked ? 'bg-gray-900 text-gray-600' : 'bg-system-success text-black'}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className={`font-mono text-sm font-bold uppercase tracking-wider ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                                                {dayPlan.focus}
                                            </h4>
                                            <span className="text-[10px] text-gray-600 font-mono uppercase">{dayPlan.day}</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setExpandedDay(expandedDay === index ? null : index)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-mono font-bold transition-colors ${
                                            isLocked 
                                                ? 'bg-gray-900 text-gray-500 hover:text-gray-300' 
                                                : 'bg-system-neon/10 text-system-neon hover:bg-system-neon hover:text-black'
                                        }`}
                                    >
                                        <Eye size={12} /> {expandedDay === index ? 'HIDE INTEL' : 'VIEW INTEL'}
                                        {expandedDay === index ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {expandedDay === index && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-black/50 border-t border-system-border p-4"
                                        >
                                            <div className="relative">
                                                {/* Locked Overlay */}
                                                {isLocked && (
                                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] rounded">
                                                        <Lock size={24} className="text-gray-500 mb-2" />
                                                        <span className="text-[10px] font-mono text-gray-400 tracking-widest uppercase">
                                                            ACCESS RESTRICTED UNTIL DAY {index + 1}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className={`space-y-3 ${isLocked ? 'opacity-30 blur-[1px]' : ''}`}>
                                                    {generateDailyWorkout(healthProfile, dayPlan.focus, playerData.exerciseDatabase).map((ex, i) => (
                                                        <div key={i} className="flex justify-between items-center border-b border-gray-800/50 pb-2 last:border-0 last:pb-0">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-gray-300">{ex.name}</span>
                                                                <span className="text-[10px] text-gray-600 font-mono uppercase">{ex.type}</span>
                                                            </div>
                                                            <div className="text-right font-mono text-xs">
                                                                <div className="text-system-neon">{ex.sets} SETS</div>
                                                                <div className="text-gray-500">{ex.reps}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    
                                                    {dayPlan.isRecovery && (
                                                        <div className="text-center py-2 text-xs font-mono text-system-success">
                                                            ACTIVE RECOVERY PROTOCOL
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default HealthView;
