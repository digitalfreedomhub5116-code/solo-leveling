import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Ruler, Fingerprint, Search, Cpu, Flame, Target, Check, Sparkles, User, Weight, ChevronRight, ChevronLeft, ShieldCheck, ArrowRight, Clock, TrendingUp } from 'lucide-react';
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
  onToggleNav?: (visible: boolean) => void;
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const TechRadar = React.memo(({ data, color, label, isAnimating, showEntrance = false }: { data: { value: number; fullMark: number; subject: string }[], color: string, label: string, isAnimating?: boolean, showEntrance?: boolean }) => {
    const size = 320;
    const center = size / 2;
    const radius = 100;
    const gridLevels = 4;
    
    // Animation constants
    const DOT_DELAY = 0.15;
    const PATH_DELAY = data.length * DOT_DELAY;
    const FILL_DELAY = PATH_DELAY + 0.6;

    const gridPaths = useMemo(() => {
        const paths = [];
        for (let level = 1; level <= gridLevels; level++) {
            const levelRadius = (radius / gridLevels) * level;
            const pts = data.map((_, i) => {
                const angle = (360 / data.length) * i;
                const { x, y } = polarToCartesian(center, center, levelRadius, angle);
                return `${x},${y}`;
            });
            paths.push(pts.join(' '));
        }
        return paths;
    }, [data.length, radius, center]);

    const axesLines = useMemo(() => {
        return data.map((_, i) => {
            const angle = (360 / data.length) * i;
            const { x, y } = polarToCartesian(center, center, radius, angle);
            return { x1: center, y1: center, x2: x, y2: y };
        });
    }, [data.length, radius, center]);

    const points = data.map((d, i) => {
        const angle = (360 / data.length) * i;
        const valRadius = (d.value / d.fullMark) * radius;
        return polarToCartesian(center, center, valRadius, angle);
    });

    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-full font-mono">
            <h3 className="text-sm font-bold mb-6 tracking-[0.4em] uppercase transition-colors duration-300" style={{ color }}>{label}</h3>
            <svg width={size} height={size} className="overflow-visible">
                <defs>
                    <linearGradient id={`radarFill-${label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.7}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0.2}/>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                </defs>
                {gridPaths.map((pts, i) => (
                    <polygon key={`grid-${i}`} points={pts} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                ))}
                {axesLines.map((line, i) => (
                    <line key={`axis-${i}`} {...line} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                ))}
                
                {/* Connecting Line */}
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    filter="url(#glow)"
                    initial={showEntrance ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ 
                        pathLength: { delay: showEntrance ? PATH_DELAY : 0, duration: 1.5, ease: "easeInOut" },
                        opacity: { delay: showEntrance ? PATH_DELAY : 0, duration: 0.2 }
                    }}
                />

                {/* Fill Area */}
                <motion.path
                    d={pathD}
                    fill={`url(#radarFill-${label})`}
                    stroke="none"
                    initial={showEntrance ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: showEntrance ? FILL_DELAY : 0, duration: 0.8 }}
                />

                {/* Data Points (Dots) */}
                {data.map((d, i) => {
                     const angle = (360 / data.length) * i;
                     // Push labels out a bit more
                     const labelPos = polarToCartesian(center, center, radius + 30, angle);
                     const point = points[i];
                     return (
                        <g key={i}>
                             <motion.text 
                                initial={showEntrance ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: showEntrance ? i * DOT_DELAY : 0 }}
                                x={labelPos.x} y={labelPos.y} 
                                textAnchor="middle" dominantBaseline="middle" 
                                fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="bold" letterSpacing="1px"
                                className="uppercase font-mono"
                             >
                                 {d.subject}
                             </motion.text>
                             <motion.circle
                                initial={showEntrance ? { r: 0, opacity: 0 } : { r: 4, opacity: 1 }}
                                animate={{ r: 4, opacity: 1, cx: point.x, cy: point.y }}
                                transition={{ 
                                    r: { delay: showEntrance ? i * DOT_DELAY : 0, type: "spring" },
                                    opacity: { delay: showEntrance ? i * DOT_DELAY : 0, duration: 0.2 },
                                    cx: { duration: isAnimating ? 0 : 0.5 },
                                    cy: { duration: isAnimating ? 0 : 0.5 }
                                }}
                                cx={point.x} cy={point.y} 
                                fill={color}
                                stroke="#000" strokeWidth={1.5}
                            />
                        </g>
                     );
                })}
            </svg>
        </div>
    );
});

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
  const multipliers: Record<string, number> = { 'SEDENTARY': 1.2, 'LIGHT': 1.375, 'MODERATE': 1.55, 'VERY_ACTIVE': 1.725 };
  const tdee = bmr * (multipliers[activity] || 1.55);
  let targetCalories = tdee;
  if (goal === 'LOSE_WEIGHT') targetCalories -= 500;
  else if (goal === 'BUILD_MUSCLE') targetCalories += 300;
  const protein = Math.round(weight * 2.2);
  const fats = Math.round((targetCalories * 0.25) / 9);
  const carbs = Math.round((targetCalories - (protein * 4) - (fats * 9)) / 4);
  return { bmr: Math.round(bmr), macros: { protein, fats, carbs, calories: Math.round(targetCalories) }, tdee: Math.round(tdee) };
};

const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-yellow-500' };
    if (bmi < 25) return { label: 'Healthy Weight', color: 'text-system-success' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-orange-500' };
    if (bmi < 40) return { label: 'Obesity', color: 'text-red-500' };
    return { label: 'Severe Obesity', color: 'text-red-700' };
};

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;
const lerpColor = (a: string, b: string, amount: number) => { 
    const ah = parseInt(a.replace(/#/g, ''), 16),
          ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
          bh = parseInt(b.replace(/#/g, ''), 16),
          br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
          rr = ar + amount * (br - ar),
          rg = ag + amount * (bg - ag),
          rb = ab + amount * (bb - ab);
    return '#' + ((1 << 24) + (Math.round(rr) << 16) + (Math.round(rg) << 8) + Math.round(rb)).toString(16).slice(1);
}

const HealthView: React.FC<HealthViewProps> = ({ 
  healthProfile, onSaveProfile, onCompleteWorkout, onFailWorkout, onLogMeal, playerData, onToggleNav
}) => {
  const [viewMode, setViewMode] = useState<'MAP' | 'OVERVIEW' | 'ACTIVE' | 'SETUP' | 'PROCESSING' | 'DIAGNOSIS' | 'PROJECTION' | 'FINALIZING'>('MAP');
  const [activeTab, setActiveTab] = useState<'WORKOUT' | 'NUTRITION' | 'BODY'>('WORKOUT');
  
  // Projection Animation States
  const [transformProgress, setTransformProgress] = useState(0);
  const [isTransformed, setIsTransformed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);

  const [activePlan, setActivePlan] = useState<WorkoutDay | null>(null);
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 9;
  const [formData, setFormData] = useState<Partial<HealthProfile>>({
      gender: 'MALE', activityLevel: 'MODERATE', goal: 'RECOMP', equipment: 'GYM', workoutSplit: 'CLASSIC', age: 25, height: 175, weight: 70, targetWeight: 70
  });
  const [foodSearch, setFoodSearch] = useState('');
  const [finalizingLog, setFinalizingLog] = useState("Initializing...");

  useEffect(() => {
      if (onToggleNav) {
          const hideNavModes = ['SETUP', 'PROCESSING', 'DIAGNOSIS', 'PROJECTION', 'FINALIZING'];
          onToggleNav(!hideNavModes.includes(viewMode));
      }
  }, [viewMode, onToggleNav]);

  useEffect(() => { if (!healthProfile) setViewMode('SETUP'); }, [healthProfile]);

  const calculatedPlan = useMemo(() => healthProfile?.workoutPlan || generateSystemProtocol(formData as HealthProfile), [healthProfile, formData]);
  const nutritionInfo = useMemo(() => calculateNutritionPlan(healthProfile || formData), [healthProfile, formData]);
  
  const rawBMI = useMemo(() => (formData.weight && formData.height) ? (formData.weight / ((formData.height/100) ** 2)) : 0, [formData.weight, formData.height]);
  const currentBMI = rawBMI.toFixed(1);
  const bmiCategory = useMemo(() => getBMICategory(rawBMI), [rawBMI]);

  const startProcessing = () => {
      setViewMode('PROCESSING');
      setTimeout(() => setViewMode('DIAGNOSIS'), 5000);
  };

  const startJourneySequence = () => {
      setViewMode('FINALIZING');
      const sequence = ["BIOLOGICAL RESTRUCTURING...", "NEURAL SYNCING...", "CONSTRUCTING PROTOCOLS...", "SYSTEM ONLINE. ASCEND."];
      let i = 0;
      const interval = setInterval(() => {
          if (i < sequence.length) {
              setFinalizingLog(sequence[i]);
              i++;
          } else {
              clearInterval(interval);
              setTimeout(() => {
                const fullProfile = { ...formData, bmi: parseFloat(currentBMI), bmr: nutritionInfo.bmr, workoutPlan: calculatedPlan, macros: nutritionInfo.macros, injuries: [], category: 'Hunter', startingWeight: formData.weight } as HealthProfile;
                onSaveProfile(fullProfile, "Shadow Vessel");
                setViewMode('MAP');
              }, 2000);
          }
      }, 1500); 
  };

  // --- ANIMATION LOOP FOR SMOOTH CHART TRANSITION ---
  const handleAscensionClick = () => {
      setIsAnimating(true);
      let startTime: number | null = null;
      const duration = 2000; // 2 seconds for full transformation

      const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          setTransformProgress(progress);

          if (progress < 1) {
              animationRef.current = requestAnimationFrame(animate);
          } else {
              setIsTransformed(true);
              setIsAnimating(false);
          }
      };

      animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
      return () => {
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
  }, []);

  if (viewMode === 'PROCESSING') {
      return (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono p-6 overflow-hidden">
              {/* Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
              
              <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                  {/* Outer Hexagon Ring */}
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }} 
                    className="absolute inset-0 border border-system-neon/20 clip-hex flex items-center justify-center rounded-full"
                  >
                      <div className="w-full h-full border-t-2 border-b-2 border-system-neon/50 rounded-full" />
                  </motion.div>

                  {/* Middle Dashed Ring */}
                  <motion.div 
                    animate={{ rotate: -360 }} 
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }} 
                    className="absolute inset-8 border-2 border-dashed border-gray-700 rounded-full" 
                  />

                  {/* Inner Rotating Tech Circle */}
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }} 
                    className="absolute inset-16 border-t-4 border-r-4 border-system-neon rounded-full shadow-[0_0_20px_#00d2ff]" 
                  />
                  
                  {/* Counter-Rotating Core */}
                  <motion.div 
                    animate={{ rotate: -360 }} 
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }} 
                    className="absolute inset-20 border-b-4 border-l-4 border-system-accent rounded-full" 
                  />

                  {/* Central Core Pulse */}
                  <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute w-12 h-12 bg-system-neon rounded-full blur-md"
                  />
                  
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                      <Cpu className="text-white" size={32} />
                  </div>

                  {/* Scanning Radar Effect */}
                  <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-tr from-transparent via-system-neon/10 to-transparent pointer-events-none"
                      style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 50% 50%)' }} // Approx wedge
                  />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center z-10"
              >
                <h2 className="text-3xl font-black text-white tracking-tighter mb-2 glitch-text" data-text="CALIBRATING">
                    CALIBRATING...
                </h2>
                <div className="text-[10px] text-system-neon font-mono tracking-[0.3em] uppercase mb-8">
                    Syncing Biological Data to Core
                </div>

                {/* Segmented Progress Bar */}
                <div className="w-64 h-2 bg-gray-900 rounded-full overflow-hidden mx-auto flex gap-0.5">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0.1 }}
                            animate={{ opacity: [0.1, 1, 0.1] }}
                            transition={{ 
                                duration: 1.5, 
                                repeat: Infinity, 
                                delay: i * 0.05,
                                repeatDelay: 0.5
                            }}
                            className="flex-1 bg-system-neon shadow-[0_0_5px_#00d2ff]"
                        />
                    ))}
                </div>
                
                {/* Random Data Stream */}
                <div className="mt-4 text-[9px] text-gray-600 font-mono h-6 overflow-hidden">
                    <motion.div
                        animate={{ y: -100 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "steps(10)" }}
                    >
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i}>{Math.random().toString(16).substring(2, 14).toUpperCase()}</div>
                        ))}
                    </motion.div>
                </div>
              </motion.div>
          </div>
      );
  }

  if (viewMode === 'DIAGNOSIS') {
      return (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 font-mono">
              <div className="w-full max-w-md border border-gray-800 p-8 rounded-3xl bg-system-card relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-system-neon opacity-50" />
                  <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-2"><Fingerprint className="text-system-neon" /> INITIAL ANALYSIS</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-black/50 p-6 rounded-2xl border border-gray-800 hover:border-system-neon transition-colors group">
                        <div className="text-[10px] text-gray-500 mb-2 uppercase font-bold">BMI Index</div>
                        <div className="text-3xl text-white font-black">{currentBMI}</div>
                        <div className={`text-[9px] font-bold mt-2 uppercase tracking-widest ${bmiCategory.color}`}>{bmiCategory.label}</div>
                      </div>
                      <div className="bg-black/50 p-6 rounded-2xl border border-gray-800 hover:border-system-neon transition-colors group">
                        <div className="text-[10px] text-gray-500 mb-2 uppercase font-bold">BMR Status</div>
                        <div className="text-3xl text-white font-black">{nutritionInfo.bmr}</div>
                        <div className="text-[9px] text-gray-600 font-bold mt-2 uppercase tracking-widest">KCAL / DAY</div>
                      </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold"><Check size={14} className="text-system-success" /> METABOLIC SYNC STABLE</div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold"><Check size={14} className="text-system-success" /> NEURAL INTERFACE ONLINE</div>
                  </div>

                  <button 
                    onClick={() => setViewMode('PROJECTION')} 
                    className="w-full py-5 bg-white text-black font-black rounded-2xl shadow-[0_0_30px_white] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    VIEW ASCENSION PROJECTION <ArrowRight size={20} />
                  </button>
              </div>
          </div>
      );
  }

  if (viewMode === 'PROJECTION') {
      // 5-Point Stats: Strength, Intelligence, Focus, Social, Willpower
      const lowStats = [ 
          { subject: 'STRENGTH', value: 40, fullMark: 100 }, 
          { subject: 'INTELLIGENCE', value: 50, fullMark: 100 }, 
          { subject: 'FOCUS', value: 30, fullMark: 100 }, 
          { subject: 'SOCIAL', value: 20, fullMark: 100 }, 
          { subject: 'WILLPOWER', value: 60, fullMark: 100 } 
      ];
      const highStats = [ 
          { subject: 'STRENGTH', value: 85, fullMark: 100 }, 
          { subject: 'INTELLIGENCE', value: 75, fullMark: 100 }, 
          { subject: 'FOCUS', value: 80, fullMark: 100 }, 
          { subject: 'SOCIAL', value: 65, fullMark: 100 }, 
          { subject: 'WILLPOWER', value: 95, fullMark: 100 } 
      ];
      
      const currentStats = lowStats.map((stat, i) => ({ 
          subject: stat.subject, 
          value: lerp(stat.value, highStats[i].value, transformProgress), 
          fullMark: 100 
      }));
      
      // Transition from Red (#ef4444) to Green (#10b981)
      const currentColor = lerpColor("#ef4444", "#10b981", transformProgress);
      
      const estimatedTime = calculateTimeEstimate(healthProfile || formData);
      // Rough calculation of average stat increase (avg high / avg low)
      const avgLow = lowStats.reduce((a, b) => a + b.value, 0) / lowStats.length;
      const avgHigh = highStats.reduce((a, b) => a + b.value, 0) / highStats.length;
      const percentIncrease = Math.round(((avgHigh - avgLow) / avgLow) * 100);

      return (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 font-mono overflow-hidden h-[100dvh]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
              
              <div className="flex-1 w-full flex flex-col items-center justify-center min-h-0 relative z-10">
                  {/* Floating Context Labels */}
                  <div className="absolute top-4 left-4 opacity-30 text-[10px] space-y-4 hidden lg:block">
                      <div className="p-2 border border-gray-800 rounded">TARGET_GOAL: {formData.goal}</div>
                      <div className="p-2 border border-gray-800 rounded">EQUIPMENT: {formData.equipment}</div>
                  </div>

                  <div className="w-full max-w-md aspect-square flex items-center justify-center">
                    <TechRadar 
                      label={isTransformed ? "PEAK EVOLUTION REALISED" : isAnimating ? "REWRITING BIOLOGY..." : "CURRENT BIO-SCAN"} 
                      color={currentColor} 
                      data={currentStats} 
                      isAnimating={isAnimating}
                      showEntrance={!isTransformed && !isAnimating}
                    />
                  </div>
              </div>
              
              <div className="w-full max-w-md shrink-0 space-y-6 pb-4 relative z-10">
                  {/* Additional Metrics for Peak Evolution */}
                  <AnimatePresence>
                      {isTransformed && (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4 w-full"
                          >
                              <div className="flex-1 bg-system-success/10 border border-system-success/30 p-3 rounded-xl text-center">
                                  <div className="text-[10px] text-system-success/70 font-bold uppercase mb-1 flex items-center justify-center gap-1"><TrendingUp size={12}/> STAT INCREASE</div>
                                  <div className="text-2xl font-black text-system-success">+{percentIncrease}%</div>
                              </div>
                              <div className="flex-1 bg-system-success/10 border border-system-success/30 p-3 rounded-xl text-center">
                                  <div className="text-[10px] text-system-success/70 font-bold uppercase mb-1 flex items-center justify-center gap-1"><Clock size={12}/> EST. TIME</div>
                                  <div className="text-2xl font-black text-system-success">{estimatedTime}</div>
                              </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
                  
                  <div className="w-full text-center"> 
                    <AnimatePresence mode="wait">
                        {!isTransformed && !isAnimating ? (
                            <motion.div 
                                key="init"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                                    The System has analyzed your current vessel. You are capable of reaching peak human potential within this cycle.
                                </p>
                                <button onClick={handleAscensionClick} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl animate-pulse shadow-[0_0_30px_#ef4444] tracking-widest text-xs sm:text-sm uppercase">INITIATE ASCENSION SEQUENCE</button>
                            </motion.div>
                        ) : isAnimating ? (
                            <motion.div
                                key="animating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-4"
                            >
                                <div className="text-system-success font-black text-xl tracking-[0.2em] animate-pulse">OPTIMIZING...</div>
                                <div className="w-64 h-1 bg-gray-900 rounded-full mt-4 overflow-hidden">
                                    <motion.div 
                                        style={{ width: `${transformProgress * 100}%` }}
                                        className="h-full bg-system-success shadow-[0_0_10px_#10b981]"
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="accept"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="p-3 bg-system-success/5 border border-system-success/30 rounded-2xl">
                                    <div className="text-system-success font-black text-xs mb-1 flex items-center justify-center gap-2">
                                        <ShieldCheck size={14} /> SYSTEM GUARANTEE
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs mx-auto">
                                        Adherence to established protocols ensures peak biological evolution.
                                    </p>
                                </div>
                                <button onClick={startJourneySequence} className="w-full py-4 bg-system-success text-black font-black rounded-2xl shadow-[0_0_40px_#10b981] hover:bg-white transition-all uppercase tracking-widest text-xs sm:text-sm">ACCEPT SYSTEM PROTOCOLS</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
              </div>

              {/* Decorative HUD Elements */}
              <div className="absolute top-6 right-6 flex items-center gap-3 text-gray-800 opacity-50 pointer-events-none">
                  <Activity size={24} />
                  <div className="text-[10px] font-bold">BIO_SYNC_V2 // STABLE</div>
              </div>
          </div>
      );
  }

  if (viewMode === 'FINALIZING') {
      return (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono">
              <Sparkles className="text-system-neon mb-8 animate-pulse" size={48} />
              <div className="text-2xl text-white font-black uppercase text-center tracking-[0.3em]">{finalizingLog}</div>
              <div className="mt-8 w-64 h-1 bg-gray-900 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 6 }} className="h-full bg-system-neon shadow-[0_0_15px_#00d2ff]" />
              </div>
          </div>
      );
  }

  if (viewMode === 'SETUP') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 font-mono">
              <div className="max-w-md w-full bg-system-card border border-system-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(step/TOTAL_STEPS)*100}%` }} 
                        className="h-full bg-system-neon shadow-[0_0_15px_#00d2ff]" 
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase">Calibration Phase {step}/{TOTAL_STEPS}</h2>
                    <span className="text-[10px] text-system-neon font-black bg-system-neon/10 px-2 py-0.5 rounded border border-system-neon/30">SYNCING...</span>
                  </div>

                  <AnimatePresence mode="wait">
                      {step === 1 && (
                        <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <User className="text-system-neon" size={24} />
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Vessel Identification</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {['MALE', 'FEMALE'].map(g => (
                                    <button 
                                        key={g} 
                                        onClick={() => { setFormData({...formData, gender: g as any}); setStep(2); }} 
                                        className="py-6 border border-gray-800 rounded-2xl hover:bg-white hover:text-black hover:shadow-[0_0_20px_white] transition-all font-black text-sm tracking-widest"
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                      )}

                      {step === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Activity className="text-system-neon" size={24} />
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Chronological Age</div>
                            </div>
                            <input 
                                type="number" 
                                value={formData.age} 
                                onChange={e => setFormData({...formData, age: Number(e.target.value)})} 
                                className="w-full bg-black border-b-2 border-gray-800 text-center text-6xl text-white outline-none focus:border-system-neon py-6 transition-colors"
                            />
                            <div className="flex justify-between items-center mt-8">
                                <button onClick={() => setStep(1)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button>
                                <button onClick={() => setStep(3)} className="bg-system-neon text-black px-10 py-3 rounded-full font-black text-xs shadow-[0_0_15px_#00d2ff] hover:bg-white transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button>
                            </div>
                        </motion.div>
                      )}

                      {step === 3 && (
                        <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Ruler className="text-system-neon" size={24} />
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Verticality Mapping (CM)</div>
                            </div>
                            <input 
                                type="number" 
                                value={formData.height} 
                                onChange={e => setFormData({...formData, height: Number(e.target.value)})} 
                                className="w-full bg-black border-b-2 border-gray-800 text-center text-6xl text-white outline-none focus:border-system-neon py-6 transition-colors"
                            />
                            <div className="flex justify-between items-center mt-8">
                                <button onClick={() => setStep(2)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button>
                                <button onClick={() => setStep(4)} className="bg-system-neon text-black px-10 py-3 rounded-full font-black text-xs shadow-[0_0_15px_#00d2ff] hover:bg-white transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button>
                            </div>
                        </motion.div>
                      )}

                      {step === 4 && (
                        <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Weight className="text-system-neon" size={24} />
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Current Mass (KG)</div>
                            </div>
                            <input 
                                type="number" 
                                value={formData.weight} 
                                onChange={e => setFormData({...formData, weight: Number(e.target.value)})} 
                                className="w-full bg-black border-b-2 border-gray-800 text-center text-6xl text-white outline-none focus:border-system-neon py-6 transition-colors"
                            />
                            <div className="flex justify-between items-center mt-8">
                                <button onClick={() => setStep(3)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button>
                                <button onClick={() => setStep(5)} className="bg-system-neon text-black px-10 py-3 rounded-full font-black text-xs shadow-[0_0_15px_#00d2ff] hover:bg-white transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button>
                            </div>
                        </motion.div>
                      )}

                      {step === 5 && (
                        <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Target className="text-system-accent" size={24} />
                                <div className="text-xs text-system-accent uppercase tracking-widest font-black">Target Mass (KG)</div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-system-accent/10 blur-xl -z-10 rounded-full" />
                                <input 
                                    type="number" 
                                    value={formData.targetWeight} 
                                    onChange={e => setFormData({...formData, targetWeight: Number(e.target.value)})} 
                                    className="w-full bg-black border-b-2 border-system-accent text-center text-6xl text-white outline-none focus:shadow-[0_4px_15px_rgba(139,92,246,0.5)] py-6 transition-all font-black"
                                />
                            </div>
                            <div className="flex justify-between items-center mt-8">
                                <button onClick={() => setStep(4)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button>
                                <button onClick={() => setStep(6)} className="bg-system-accent text-white px-10 py-3 rounded-full font-black text-xs shadow-[0_0_20px_#8b5cf6] hover:bg-white hover:text-black transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button>
                            </div>
                        </motion.div>
                      )}

                      {step === 6 && (
                        <motion.div key="s6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Energy Flux Levels</div>
                            <div className="grid gap-2">
                                {['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE'].map(a => (
                                    <button 
                                        key={a} 
                                        onClick={() => { setFormData({...formData, activityLevel: a as any}); setStep(7); }} 
                                        className="w-full py-4 border border-gray-800 rounded-xl font-black text-[10px] tracking-widest hover:bg-white hover:text-black transition-all uppercase"
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setStep(5)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</button>
                        </motion.div>
                      )}

                      {step === 7 && (
                        <motion.div key="s7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Primary Directive</div>
                            <div className="grid gap-2">
                                {['LOSE_WEIGHT', 'BUILD_MUSCLE', 'RECOMP'].map(g => (
                                    <button 
                                        key={g} 
                                        onClick={() => { setFormData({...formData, goal: g as any}); setStep(8); }} 
                                        className="w-full py-4 border border-gray-800 rounded-xl font-black text-[10px] tracking-widest hover:bg-white hover:text-black transition-all uppercase"
                                    >
                                        {g.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setStep(6)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</button>
                        </motion.div>
                      )}

                      {step === 8 && (
                        <motion.div key="s8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Resource Availability</div>
                            <div className="grid gap-2">
                                {['GYM', 'HOME_DUMBBELLS', 'BODYWEIGHT'].map(eq => (
                                    <button 
                                        key={eq} 
                                        onClick={() => { 
                                            setFormData({...formData, equipment: eq as any}); 
                                            if (eq === 'BODYWEIGHT') startProcessing(); 
                                            else setStep(9); 
                                        }} 
                                        className="w-full py-4 border border-gray-800 rounded-xl font-black text-[10px] tracking-widest hover:bg-white hover:text-black transition-all uppercase"
                                    >
                                        {eq.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setStep(7)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</button>
                        </motion.div>
                      )}

                      {step === 9 && (
                        <motion.div key="s9" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Training Architecture</div>
                            <div className="grid gap-4">
                                {['PPL', 'CLASSIC'].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => { setFormData({...formData, workoutSplit: s as any}); startProcessing(); }} 
                                        className="w-full py-6 border border-gray-800 rounded-2xl font-black text-sm tracking-widest hover:bg-white hover:text-black transition-all uppercase shadow-lg group"
                                    >
                                        {s} SPLIT
                                        <div className="text-[8px] text-gray-500 mt-1 font-normal group-hover:text-black/50">
                                            {s === 'PPL' ? 'PUSH-PULL-LEGS REVOLUTION' : 'TRADITIONAL SYNC PATTERN'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setStep(8)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-6"><ChevronLeft size={14}/> BACK</button>
                        </motion.div>
                      )}
                  </AnimatePresence>
              </div>
          </div>
      );
  }

  if (viewMode === 'OVERVIEW' && activePlan) return <WorkoutOverview plan={activePlan} focusVideos={playerData.focusVideos} onStart={(p) => { setActivePlan(p); setViewMode('ACTIVE'); }} onCancel={() => setViewMode('MAP')} />;
  if (viewMode === 'ACTIVE' && activePlan) return <ActiveWorkoutPlayer plan={activePlan} onComplete={(c, t, r) => { onCompleteWorkout(c, t, r, false); setViewMode('MAP'); }} onFail={() => { onFailWorkout(); setViewMode('MAP'); }} streak={playerData.streak} />;

  return (
    <div className="h-full flex flex-col gap-6 font-mono">
        <div className="flex border-b border-gray-800 bg-black/50 backdrop-blur sticky top-0 z-30">
            {['WORKOUT', 'NUTRITION', 'BODY'].map(t => <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-4 text-xs font-bold tracking-widest ${activeTab === t ? 'text-system-neon border-b-2 border-system-neon' : 'text-gray-600'}`}>{t}</button>)}
        </div>
        <div className="flex-1 pb-20">
            <AnimatePresence mode="wait">
                {activeTab === 'WORKOUT' && (
                    <motion.div key="wo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center"><Flame className="text-orange-500 mx-auto mb-2 animate-pulse" size={24} /><div className="text-2xl font-black text-white">{playerData.streak}</div><div className="text-[10px] text-gray-500 uppercase">STREAK</div></div>
                            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center"><Target className="text-system-neon mx-auto mb-2" size={24} /><div className="text-xl font-bold text-white uppercase">{calculateTimeEstimate(healthProfile || formData)}</div><div className="text-[10px] text-gray-500 uppercase">TARGET</div></div>
                        </div>
                        <WorkoutMap currentWeight={healthProfile?.weight || 0} targetWeight={healthProfile?.targetWeight || 0} workoutPlan={calculatedPlan} completedDays={playerData.logs.filter(l => l.type === 'WORKOUT').length} onStartDay={(idx) => { setActivePlan(calculatedPlan[idx % calculatedPlan.length]); setViewMode('OVERVIEW'); }} />
                    </motion.div>
                )}
                {activeTab === 'NUTRITION' && (
                    <motion.div key="nut" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="grid grid-cols-4 gap-2">
                            {Object.entries(nutritionInfo.macros).map(([k, v]) => <div key={k} className="bg-gray-900/50 p-3 rounded-xl border border-gray-800 text-center"><div className="text-[10px] text-gray-500 uppercase">{k}</div><div className="text-sm font-bold text-white">{v}{k === 'calories' ? '' : 'g'}</div></div>)}
                        </div>
                        <div className="bg-black border border-gray-800 p-6 rounded-2xl">
                            <h3 className="text-xs text-white font-black mb-4 flex items-center gap-2"><Search size={14} /> FOOD SCANNER</h3>
                            <input value={foodSearch} onChange={e => setFoodSearch(e.target.value)} placeholder="SEARCH FOODS..." className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-sm mb-4 outline-none focus:border-system-neon" />
                            <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                                {INDIAN_FOOD_DB.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase())).map(food => (
                                    <div key={food.id} onClick={() => onLogMeal?.({ id: Math.random().toString(36).substr(2,9), label: food.name, items: [{...food, quantity: 1}], totalCalories: food.calories, totalProtein: food.protein, totalCarbs: food.carbs, totalFats: food.fats, timestamp: Date.now() })} className="p-3 bg-gray-900/30 hover:bg-gray-900 transition-colors cursor-pointer rounded-xl flex justify-between items-center group">
                                        <div><div className="text-xs font-bold text-gray-300">{food.name}</div><div className="text-[9px] text-gray-600">{food.calories} KCAL</div></div>
                                        <div className="bg-system-neon text-black px-2 py-0.5 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">ADD</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
                {activeTab === 'BODY' && (
                    <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800">
                            <h3 className="text-sm text-white font-black mb-6 flex items-center gap-2"><Fingerprint size={16} /> BIOMETRIC_REPORT</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-gray-800 pb-4"><span className="text-gray-500 uppercase">Body Mass Index</span><span className="text-white font-bold">{healthProfile?.bmi}</span></div>
                                <div className="flex justify-between border-b border-gray-800 pb-4"><span className="text-gray-500 uppercase">Basal Metabolic Rate</span><span className="text-white font-bold">{healthProfile?.bmr} kcal</span></div>
                                <div className="flex justify-between border-b border-gray-800 pb-4"><span className="text-gray-500 uppercase">Status</span><span className="text-system-neon font-black">STABLE</span></div>
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