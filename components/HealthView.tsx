import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Heart, Zap, Scale, Ruler, Utensils, AlertTriangle, CheckCircle, Brain, Target, Shield, Dumbbell, Clock, Timer } from 'lucide-react';
import { HealthProfile, WorkoutDay, Exercise } from '../types';

interface HealthViewProps {
  healthProfile?: HealthProfile;
  onSaveProfile: (profile: HealthProfile) => void;
  onCompleteWorkout: (exercisesCompleted: number, totalExercises: number, isRecovery: boolean) => void;
}

const steps = [
  { id: 'PHYSICAL', title: 'PHYSICAL SCAN', icon: <Scale /> },
  { id: 'GOALS', title: 'OBJECTIVES', icon: <Target /> },
  { id: 'TIME', title: 'TIME COMMITMENT', icon: <Clock /> },
  { id: 'FITNESS', title: 'FITNESS LEVEL', icon: <Activity /> },
  { id: 'LOGISTICS', title: 'LOGISTICS', icon: <Dumbbell /> },
  { id: 'SAFETY', title: 'SAFETY CHECK', icon: <Shield /> },
  { id: 'LIFESTYLE', title: 'LIFESTYLE', icon: <Brain /> },
];

const HealthView: React.FC<HealthViewProps> = ({ healthProfile, onSaveProfile, onCompleteWorkout }) => {
  const [activeTab, setActiveTab] = useState<'WORKOUT' | 'NUTRITION'>('WORKOUT');
  const [isOnboarding, setIsOnboarding] = useState(!healthProfile);
  const [scanStep, setScanStep] = useState(0);

  // Form State
  const [formData, setFormData] = useState<Partial<HealthProfile>>({
    gender: 'MALE',
    age: 25,
    height: 175,
    weight: 70,
    activityLevel: 'MODERATE',
    goal: 'BUILD_MUSCLE',
    equipment: 'GYM',
    sessionDuration: 60,
    injuries: [],
    ...healthProfile
  });
  
  const [neck, setNeck] = useState(35);
  const [waist, setWaist] = useState(80);
  const [hip, setHip] = useState(90);

  // --- BIOMETRIC ENGINE ---
  const calculateBiometrics = () => {
     // BMI
     const heightM = (formData.height || 175) / 100;
     const bmi = (formData.weight || 70) / (heightM * heightM);

     // BMR (Mifflin-St Jeor)
     let bmr = (10 * (formData.weight || 70)) + (6.25 * (formData.height || 175)) - (5 * (formData.age || 25));
     bmr += formData.gender === 'MALE' ? 5 : -161;

     // TDEE
     const multipliers = { SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, VERY_ACTIVE: 1.725 };
     const tdee = bmr * (multipliers[formData.activityLevel || 'MODERATE'] || 1.2);

     // Body Fat (Navy Seal - Approx)
     let bodyFat = 15; 
     try {
       if (formData.gender === 'MALE') {
         bodyFat = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(formData.height || 175) + 36.76;
       } else {
         bodyFat = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(formData.height || 175) - 78.387;
       }
     } catch (e) {
        bodyFat = 0; 
     }

     let category = 'NORMAL';
     if (bmi < 18.5) category = 'UNDERWEIGHT';
     else if (bmi >= 25 && bmi < 30) category = 'OVERWEIGHT';
     else if (bmi >= 30) category = 'OBESE';
     else category = 'OPTIMAL';

     return { bmi, bmr: tdee, bodyFat, category };
  };

  // --- WORKOUT GENERATOR (Gap-Filling Logic) ---
  const generatePlan = (): WorkoutDay[] => {
      const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const plan: WorkoutDay[] = [];
      const goal = formData.goal;
      const equip = formData.equipment;
      const duration = formData.sessionDuration || 60;
      
      // Scaling Logic: Increase volume if duration is long
      const isHighVolume = duration >= 90;
      const compoundSets = isHighVolume ? 5 : 4;
      const accessorySets = isHighVolume ? 4 : 3;

      // Time Estimates (mins)
      const TIME_COMPOUND = 12; // Including rest
      const TIME_ACCESSORY = 7;
      const TIME_WARMUP = 5;

      // Exercise Pools
      const accessories = {
          PUSH: ['Lateral Raises', 'Tricep Extensions', 'Chest Flys', 'Front Raises', 'Dips'],
          PULL: ['Bicep Curls', 'Face Pulls', 'Shrugs', 'Hammer Curls', 'Rear Delt Flys'],
          LEGS: ['Calf Raises', 'Leg Extensions', 'Leg Curls', 'Lunges', 'Glute Bridges'],
          CORE: ['Plank', 'Leg Raises', 'Russian Twists', 'Crunches', 'Mountain Climbers']
      };

      days.forEach((day, index) => {
          let focus = 'REST';
          let exercises: Exercise[] = [];
          
          // --- SPLIT LOGIC ---
          if (goal === 'BUILD_MUSCLE') {
              // PPL Split
              if (index === 0) focus = 'PUSH';
              else if (index === 1) focus = 'PULL';
              else if (index === 2) focus = 'LEGS';
              else if (index === 3) focus = 'REST';
              else if (index === 4) focus = 'UPPER';
              else if (index === 5) focus = 'LOWER';
              else focus = 'REST';
          } else if (goal === 'LOSE_WEIGHT') {
              if (index % 2 === 0) focus = 'FULL_BODY_CIRCUIT';
              else focus = 'CARDIO';
              if (index === 6) focus = 'REST';
          } else {
             if (index % 2 === 0) focus = 'ENDURANCE_RUN';
             else focus = 'CORE_STABILITY';
             if (index === 6) focus = 'REST';
          }

          if (focus === 'REST') {
              plan.push({ 
                  day, focus, 
                  exercises: [{name: 'Active Recovery Walk', sets: 1, reps: '30 min', duration: 30, completed: false, type: 'STRETCH'}], 
                  isRecovery: true,
                  totalDuration: 30
              });
              return;
          }

          // --- GAP FILLING ALGORITHM ---
          let currentDuration = TIME_WARMUP;
          
          // 1. Add S-Rank Compounds (Primary)
          if (focus === 'PUSH' || focus === 'UPPER' || focus === 'FULL_BODY_CIRCUIT') {
              const name = equip === 'GYM' ? 'Bench Press' : 'Pushups';
              const reps = equip === 'GYM' ? '8-10' : 'Failure';
              exercises.push({name, sets: compoundSets, reps, duration: TIME_COMPOUND, completed: false, type: 'COMPOUND'});
              currentDuration += TIME_COMPOUND;
          }
          if (focus === 'PUSH' || focus === 'UPPER') {
               const name = equip === 'GYM' ? 'Overhead Press' : 'Pike Pushups';
               exercises.push({name, sets: compoundSets, reps: '8-12', duration: TIME_COMPOUND, completed: false, type: 'COMPOUND'});
               currentDuration += TIME_COMPOUND;
          }

          if (focus === 'PULL' || focus === 'UPPER' || focus === 'FULL_BODY_CIRCUIT') {
              const name = equip === 'GYM' ? 'Deadlift / Rack Pull' : 'Pullups / Door Rows';
              exercises.push({name, sets: compoundSets, reps: '6-8', duration: TIME_COMPOUND, completed: false, type: 'COMPOUND'});
              currentDuration += TIME_COMPOUND;
          }
           if (focus === 'PULL' || focus === 'UPPER') {
               const name = equip === 'GYM' ? 'Barbell Row' : 'Inverted Row';
               exercises.push({name, sets: compoundSets, reps: '10-12', duration: TIME_COMPOUND, completed: false, type: 'COMPOUND'});
               currentDuration += TIME_COMPOUND;
          }

          if (focus === 'LEGS' || focus === 'LOWER' || focus === 'FULL_BODY_CIRCUIT') {
              const name = equip === 'GYM' ? 'Squat' : 'Bulgarian Split Squat';
              exercises.push({name, sets: compoundSets, reps: '8-10', duration: TIME_COMPOUND, completed: false, type: 'COMPOUND'});
              currentDuration += TIME_COMPOUND;
          }

          // 2. Cardio Specific
          if (focus === 'CARDIO' || focus === 'ENDURANCE_RUN') {
              exercises.push({name: 'Zone 2 Run', sets: 1, reps: `${duration - 10} min`, duration: duration - 10, completed: false, type: 'CARDIO'});
              currentDuration += (duration - 10);
          }

          // 3. Fill the Gap with Accessories
          let accessoryPool: string[] = [];
          if (focus.includes('PUSH')) accessoryPool = [...accessories.PUSH];
          if (focus.includes('PULL')) accessoryPool = [...accessories.PULL];
          if (focus.includes('LEGS')) accessoryPool = [...accessories.LEGS];
          if (focus.includes('UPPER')) accessoryPool = [...accessories.PUSH, ...accessories.PULL];
          if (focus.includes('LOWER')) accessoryPool = [...accessories.LEGS, ...accessories.CORE];
          if (focus.includes('FULL') || focus.includes('CORE')) accessoryPool = [...accessories.CORE, ...accessories.PUSH];

          let poolIndex = 0;
          // While we have time and exercises left in pool
          while (currentDuration + TIME_ACCESSORY <= duration && poolIndex < accessoryPool.length) {
               const accName = accessoryPool[poolIndex];
               exercises.push({
                   name: accName, 
                   sets: accessorySets, 
                   reps: '12-15', 
                   duration: TIME_ACCESSORY, 
                   completed: false, 
                   type: 'ACCESSORY'
               });
               currentDuration += TIME_ACCESSORY;
               poolIndex++;
          }

          plan.push({ day, focus, exercises, isRecovery: false, totalDuration: currentDuration });
      });
      return plan;
  };

  const handleFinishOnboarding = () => {
      const bio = calculateBiometrics();
      const plan = generatePlan();
      
      const macros = {
          calories: Math.round(bio.bmr),
          protein: Math.round(formData.weight! * 2.2),
          carbs: Math.round((bio.bmr * 0.4) / 4),
          fats: Math.round((bio.bmr * 0.25) / 9)
      };

      const profile: HealthProfile = {
          ...formData as HealthProfile,
          ...bio,
          workoutPlan: plan,
          macros
      };
      
      onSaveProfile(profile);
      setIsOnboarding(false);
  };

  const getProgressionSpeed = (mins: number) => {
     if (mins >= 120) return { label: 'GOD TIER', color: 'text-system-neon', multiplier: '2.5x' };
     if (mins >= 90) return { label: 'ACCELERATED', color: 'text-system-accent', multiplier: '2.0x' };
     if (mins >= 60) return { label: 'OPTIMAL', color: 'text-system-success', multiplier: '1.5x' };
     if (mins >= 45) return { label: 'STANDARD', color: 'text-white', multiplier: '1.0x' };
     return { label: 'MAINTENANCE', color: 'text-gray-400', multiplier: '0.8x' };
  };

  // --- RENDERERS ---

  if (isOnboarding) {
      return (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
             {/* Holographic BG */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
             <div className="absolute inset-0 bg-system-neon/5 animate-pulse" />
             
             {/* Scanning Line */}
             <motion.div 
               animate={{ top: ['0%', '100%', '0%'] }}
               transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
               className="absolute left-0 w-full h-[2px] bg-system-neon shadow-[0_0_20px_#00d2ff] z-0 opacity-50"
             />

             <div className="relative z-10 w-full max-w-2xl bg-black/90 border border-system-neon/30 p-8 rounded-xl backdrop-blur-xl">
                 <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
                           <Activity className="text-system-neon" /> AWAKENING ASSESSMENT
                        </h2>
                        <p className="text-xs text-system-neon/70 font-mono tracking-widest">
                           STEP {scanStep + 1} / {steps.length}: {steps[scanStep].title}
                        </p>
                    </div>
                    <div className="text-system-accent">{steps[scanStep].icon}</div>
                 </div>

                 <div className="min-h-[300px]">
                    <AnimatePresence mode="wait">
                       <motion.div
                         key={scanStep}
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: -20 }}
                         className="space-y-6"
                       >
                          {scanStep === 0 && (
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                     <label className="block text-xs text-gray-500 mb-1 font-mono">GENDER</label>
                                     <div className="flex gap-2">
                                        {['MALE', 'FEMALE'].map(g => (
                                            <button key={g} onClick={() => setFormData({...formData, gender: g as any})} className={`flex-1 py-3 border rounded ${formData.gender === g ? 'bg-system-neon text-black border-system-neon' : 'border-gray-800 text-gray-500'}`}>{g}</button>
                                        ))}
                                     </div>
                                  </div>
                                  <div>
                                     <label className="block text-xs text-gray-500 mb-1 font-mono">AGE</label>
                                     <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: Number(e.target.value)})} className="w-full bg-black border border-gray-800 rounded p-3 text-white font-mono" />
                                  </div>
                                  <div>
                                     <label className="block text-xs text-gray-500 mb-1 font-mono">HEIGHT (CM)</label>
                                     <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: Number(e.target.value)})} className="w-full bg-black border border-gray-800 rounded p-3 text-white font-mono" />
                                  </div>
                                  <div>
                                     <label className="block text-xs text-gray-500 mb-1 font-mono">WEIGHT (KG)</label>
                                     <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} className="w-full bg-black border border-gray-800 rounded p-3 text-white font-mono" />
                                  </div>
                              </div>
                          )}

                          {scanStep === 1 && (
                              <div className="space-y-4">
                                  <label className="block text-xs text-gray-500 mb-1 font-mono">PRIMARY OBJECTIVE</label>
                                  {['LOSE_WEIGHT', 'BUILD_MUSCLE', 'ENDURANCE'].map(g => (
                                      <button 
                                        key={g} 
                                        onClick={() => setFormData({...formData, goal: g as any})}
                                        className={`w-full text-left p-4 border rounded flex items-center justify-between group ${formData.goal === g ? 'bg-system-accent/20 border-system-accent text-white' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                                      >
                                          <span>{g.replace('_', ' ')}</span>
                                          {formData.goal === g && <CheckCircle size={16} className="text-system-accent" />}
                                      </button>
                                  ))}
                              </div>
                          )}

                          {scanStep === 2 && (
                               <div className="space-y-6">
                                   <div className="text-center">
                                       <Clock size={48} className="mx-auto text-system-neon mb-4 animate-pulse" />
                                       <h3 className="text-xl text-white font-mono mb-2">TIME COMMITMENT</h3>
                                       <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                           How much time can you dedicate per session? The System will mathematically generate a protocol to fill this window.
                                       </p>
                                   </div>
                                   
                                   <div className="grid grid-cols-1 gap-3">
                                       {[30, 45, 60, 90, 120].map(mins => {
                                           const speed = getProgressionSpeed(mins);
                                           return (
                                               <button 
                                                    key={mins}
                                                    onClick={() => setFormData({...formData, sessionDuration: mins})}
                                                    className={`p-4 border rounded flex items-center justify-between group transition-all ${formData.sessionDuration === mins ? 'bg-system-neon/10 border-system-neon' : 'border-gray-800 hover:border-gray-600'}`}
                                               >
                                                   <div className="flex flex-col text-left">
                                                       <span className={`text-lg font-bold font-mono ${formData.sessionDuration === mins ? 'text-system-neon' : 'text-white'}`}>{mins} MINUTES</span>
                                                       <span className={`text-[10px] tracking-widest ${speed.color}`}>PROJECTED SPEED: {speed.label}</span>
                                                   </div>
                                                   {formData.sessionDuration === mins && <CheckCircle size={20} className="text-system-neon" />}
                                               </button>
                                           );
                                       })}
                                   </div>
                               </div>
                          )}
                          
                          {scanStep === 3 && (
                              <div className="space-y-4">
                                  <label className="block text-xs text-gray-500 mb-1 font-mono">ACTIVITY LEVEL</label>
                                  {['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE'].map(a => (
                                      <button 
                                        key={a} 
                                        onClick={() => setFormData({...formData, activityLevel: a as any})}
                                        className={`w-full text-left p-4 border rounded flex items-center justify-between group ${formData.activityLevel === a ? 'bg-system-warning/20 border-system-warning text-white' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                                      >
                                          <span>{a}</span>
                                          {formData.activityLevel === a && <CheckCircle size={16} className="text-system-warning" />}
                                      </button>
                                  ))}
                              </div>
                          )}

                          {scanStep === 4 && (
                              <div className="space-y-4">
                                  <label className="block text-xs text-gray-500 mb-1 font-mono">AVAILABLE EQUIPMENT</label>
                                  {['GYM', 'HOME_DUMBBELLS', 'BODYWEIGHT'].map(e => (
                                      <button 
                                        key={e} 
                                        onClick={() => setFormData({...formData, equipment: e as any})}
                                        className={`w-full text-left p-4 border rounded flex items-center justify-between group ${formData.equipment === e ? 'bg-system-success/20 border-system-success text-white' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                                      >
                                          <span>{e.replace('_', ' ')}</span>
                                          {formData.equipment === e && <CheckCircle size={16} className="text-system-success" />}
                                      </button>
                                  ))}
                              </div>
                          )}

                          {scanStep === 5 && (
                              <div className="space-y-4">
                                  <div className="p-4 border border-system-danger/50 bg-system-danger/10 rounded text-system-danger text-sm font-mono flex items-start gap-2">
                                     <AlertTriangle size={20} className="shrink-0" />
                                     <span>INJURY REPORT: Do you have existing conditions that limit movement?</span>
                                  </div>
                                  <textarea 
                                    className="w-full bg-black border border-gray-800 rounded p-4 text-white font-mono h-32 focus:border-system-danger focus:outline-none" 
                                    placeholder="List injuries here (e.g. Lower back pain, bad knees)..."
                                    onChange={(e) => setFormData({...formData, injuries: e.target.value ? [e.target.value] : []})}
                                  />
                              </div>
                          )}

                          {scanStep === 6 && (
                             <div className="space-y-6">
                                <p className="text-sm text-gray-400 font-mono">
                                   To calculate precise body fat percentage (Navy Seal Formula), please provide the following (optional, defaults used if skipped):
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                   <div>
                                     <label className="block text-xs text-gray-500 mb-1 font-mono">NECK (CM)</label>
                                     <input type="number" value={neck} onChange={e => setNeck(Number(e.target.value))} className="w-full bg-black border border-gray-800 rounded p-3 text-white font-mono" />
                                   </div>
                                   <div>
                                     <label className="block text-xs text-gray-500 mb-1 font-mono">WAIST (CM)</label>
                                     <input type="number" value={waist} onChange={e => setWaist(Number(e.target.value))} className="w-full bg-black border border-gray-800 rounded p-3 text-white font-mono" />
                                   </div>
                                   <div>
                                     <label className="block text-xs text-gray-500 mb-1 font-mono">HIP (CM)</label>
                                     <input type="number" value={hip} onChange={e => setHip(Number(e.target.value))} className="w-full bg-black border border-gray-800 rounded p-3 text-white font-mono" disabled={formData.gender === 'MALE'} />
                                   </div>
                                </div>
                             </div>
                          )}
                       </motion.div>
                    </AnimatePresence>
                 </div>

                 <div className="flex justify-between mt-8 pt-4 border-t border-gray-800">
                    <button 
                      onClick={() => setScanStep(Math.max(0, scanStep - 1))}
                      disabled={scanStep === 0}
                      className="px-6 py-2 text-gray-500 font-mono hover:text-white disabled:opacity-30"
                    >
                       BACK
                    </button>
                    <button 
                      onClick={() => {
                          if (scanStep < steps.length - 1) setScanStep(scanStep + 1);
                          else handleFinishOnboarding();
                      }}
                      className="px-8 py-2 bg-system-neon text-black font-bold font-mono rounded hover:bg-white transition-colors"
                    >
                       {scanStep === steps.length - 1 ? 'GENERATE PROTOCOL' : 'NEXT STEP'}
                    </button>
                 </div>
             </div>
          </div>
      );
  }

  // --- MAIN DASHBOARD ---
  
  if (!healthProfile) return null; // Should not happen due to isOnboarding logic

  const todaysPlan = healthProfile.workoutPlan[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; // Shift Mon=0 to Sun=6
  const progressionSpeed = getProgressionSpeed(healthProfile.sessionDuration || 60);

  // Calculate Time Remaining for UI
  const completedDuration = todaysPlan.exercises.reduce((acc, ex) => ex.completed ? acc + ex.duration : acc, 0);
  const totalDuration = todaysPlan.totalDuration;
  const progressPercent = Math.min(100, (completedDuration / totalDuration) * 100);

  return (
    <div className="space-y-6 pb-20">
       {/* Biometric Header */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-system-card border border-system-border rounded-lg p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500 font-mono">BIOMETRICS</span>
                  <Activity size={16} className="text-system-neon" />
              </div>
              <div className="mt-2">
                  <div className="text-2xl font-bold text-white font-mono">{healthProfile.weight} KG</div>
                  <div className={`text-xs font-mono mt-1 px-2 py-0.5 inline-block rounded ${healthProfile.category === 'OPTIMAL' ? 'bg-system-success/20 text-system-success' : 'bg-system-warning/20 text-system-warning'}`}>
                     {healthProfile.category} (BMI: {healthProfile.bmi.toFixed(1)})
                  </div>
              </div>
           </div>

           <div className="bg-system-card border border-system-border rounded-lg p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500 font-mono">METABOLIC RATE</span>
                  <Zap size={16} className="text-system-warning" />
              </div>
              <div className="mt-2">
                  <div className="text-2xl font-bold text-white font-mono">{Math.round(healthProfile.bmr)} KCAL</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">Daily Maintenance</div>
              </div>
           </div>

           <div className="bg-system-card border border-system-border rounded-lg p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500 font-mono">BODY COMPOSITION</span>
                  <Scale size={16} className="text-system-accent" />
              </div>
              <div className="mt-2">
                  <div className="text-2xl font-bold text-white font-mono">{healthProfile.bodyFat ? healthProfile.bodyFat.toFixed(1) : '--'}%</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">Est. Body Fat</div>
              </div>
           </div>

           <div className="bg-system-card border border-system-border rounded-lg p-4 flex flex-col justify-between relative overflow-hidden">
              <div className={`absolute right-0 top-0 p-12 bg-gradient-to-br from-transparent to-${progressionSpeed.color.replace('text-', '')}/10 rounded-full blur-xl pointer-events-none`}></div>
              <div className="flex justify-between items-start relative z-10">
                  <span className="text-xs text-gray-500 font-mono">PROJECTED PHYSIQUE</span>
                  <Clock size={16} className={progressionSpeed.color} />
              </div>
              <div className="mt-2 relative z-10">
                  <div className={`text-xl font-bold font-mono ${progressionSpeed.color}`}>{progressionSpeed.label}</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">Speed: {progressionSpeed.multiplier}</div>
              </div>
           </div>
       </div>

       {/* Tabs */}
       <div className="flex gap-2 border-b border-system-border">
          <button 
             onClick={() => setActiveTab('WORKOUT')}
             className={`px-4 py-2 text-sm font-mono border-b-2 transition-colors ${activeTab === 'WORKOUT' ? 'border-system-neon text-system-neon' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
             DAILY WORKOUT
          </button>
          <button 
             onClick={() => setActiveTab('NUTRITION')}
             className={`px-4 py-2 text-sm font-mono border-b-2 transition-colors ${activeTab === 'NUTRITION' ? 'border-system-accent text-system-accent' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
             NUTRITION
          </button>
       </div>

       {/* Content Area */}
       <AnimatePresence mode="wait">
          {activeTab === 'WORKOUT' && (
             <motion.div 
               key="workout"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="bg-system-card/50 border border-system-border rounded-lg p-6 relative overflow-hidden"
             >
                 {todaysPlan.isRecovery && (
                    <div className="absolute top-0 right-0 p-2 bg-system-success/10 text-system-success text-xs font-mono flex items-center gap-2 rounded-bl-lg border-b border-l border-system-success/20">
                       <Heart size={14} /> RECOVERY DAY
                    </div>
                 )}

                 <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                            <Dumbbell className="text-system-neon" /> {todaysPlan.focus} PROTOCOL
                        </h2>
                        <p className="text-xs text-gray-500 font-mono mt-1">DAY: {todaysPlan.day} • {todaysPlan.totalDuration} MIN SESSION</p>
                    </div>

                    {/* Time Progress Bar */}
                    <div className="w-full md:w-64">
                         <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-1">
                             <span>SESSION PROGRESS</span>
                             <span>{completedDuration}/{totalDuration} MIN</span>
                         </div>
                         <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${progressPercent}%` }}
                               className="h-full bg-system-neon shadow-[0_0_10px_#00d2ff]"
                             />
                         </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    {todaysPlan.exercises.map((ex, idx) => (
                       <div key={idx} className="flex items-center justify-between p-4 bg-black/40 border border-system-border rounded-lg group hover:border-system-neon/30 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-colors ${ex.completed ? 'bg-system-neon border-system-neon' : 'border-gray-600'}`}>
                                {ex.completed && <CheckCircle size={14} className="text-black" />}
                             </div>
                             <div>
                                <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                                    {ex.name}
                                    {ex.type === 'COMPOUND' && <span className="text-[9px] bg-system-accent/20 text-system-accent px-1.5 py-0.5 rounded border border-system-accent/30">S-RANK</span>}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">
                                    {ex.sets} SETS x {ex.reps} • {ex.duration} MIN
                                </div>
                             </div>
                          </div>
                          
                          <div className="text-xs font-mono text-gray-600 hidden sm:block">
                              {ex.type}
                          </div>
                       </div>
                    ))}
                 </div>

                 <button 
                    onClick={() => onCompleteWorkout(todaysPlan.exercises.length, todaysPlan.exercises.length, !!todaysPlan.isRecovery)}
                    className="w-full mt-6 py-4 bg-system-neon/10 border border-system-neon text-system-neon font-bold font-mono rounded-lg hover:bg-system-neon hover:text-black transition-all shadow-[0_0_20px_rgba(0,210,255,0.1)]"
                 >
                    COMPLETE SESSION
                 </button>
             </motion.div>
          )}

          {activeTab === 'NUTRITION' && (
             <motion.div 
               key="nutrition"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="grid grid-cols-1 md:grid-cols-2 gap-6"
             >
                 <div className="bg-system-card/50 border border-system-border rounded-lg p-6">
                     <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2 mb-6">
                        <Utensils size={18} className="text-system-accent" /> MACRO TARGETS
                     </h3>
                     
                     <div className="space-y-6">
                        <div>
                           <div className="flex justify-between text-xs text-gray-500 font-mono mb-2">
                              <span>PROTEIN</span>
                              <span>{healthProfile.macros.protein}g</span>
                           </div>
                           <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 w-3/4 shadow-[0_0_10px_#ef4444]" />
                           </div>
                        </div>
                        <div>
                           <div className="flex justify-between text-xs text-gray-500 font-mono mb-2">
                              <span>CARBOHYDRATES</span>
                              <span>{healthProfile.macros.carbs}g</span>
                           </div>
                           <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 w-1/2 shadow-[0_0_10px_#3b82f6]" />
                           </div>
                        </div>
                        <div>
                           <div className="flex justify-between text-xs text-gray-500 font-mono mb-2">
                              <span>FATS</span>
                              <span>{healthProfile.macros.fats}g</span>
                           </div>
                           <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-500 w-1/4 shadow-[0_0_10px_#eab308]" />
                           </div>
                        </div>
                     </div>
                 </div>

                 <div className="bg-system-card/50 border border-system-border rounded-lg p-6 flex flex-col justify-center items-center text-center">
                     <div className="w-32 h-32 rounded-full border-4 border-gray-800 flex items-center justify-center relative mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-t-system-accent border-r-system-accent border-b-transparent border-l-transparent rotate-45" />
                        <div>
                           <div className="text-2xl font-bold text-white font-mono">{healthProfile.macros.calories}</div>
                           <div className="text-[10px] text-gray-500 font-mono">KCAL</div>
                        </div>
                     </div>
                     <p className="text-xs text-gray-400 font-mono max-w-xs">
                        Adhere to these caloric limits to achieve your goal of {healthProfile.goal.replace('_', ' ')}.
                     </p>
                 </div>
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default HealthView;