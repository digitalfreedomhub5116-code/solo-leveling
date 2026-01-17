import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Ruler, Fingerprint, Search, Flame, Target, Check, Sparkles, User, Weight, ChevronRight, ChevronLeft, ShieldCheck, ArrowRight, Clock, TrendingUp } from 'lucide-react';
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

// --- MICRO VISUALIZATIONS ---

const BMIGauge = ({ value }: { value: number }) => {
    const clamped = Math.min(40, Math.max(15, value));
    const percentage = (clamped - 15) / (40 - 15);
    const rotation = -90 + (percentage * 180);

    return (
        <div className="relative w-24 h-12 overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-[6px] border-gray-800 border-t-system-neon border-r-gray-800 border-b-gray-800 border-l-system-neon transform rotate-[-45deg]" />
            <motion.div 
                initial={{ rotate: -90 }}
                animate={{ rotate: rotation }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                className="absolute bottom-0 left-1/2 w-1 h-12 bg-white origin-bottom rounded-full z-10"
                style={{ marginLeft: '-2px' }}
            >
                <div className="w-2 h-2 bg-white rounded-full absolute bottom-0 left-1/2 -translate-x-1/2 shadow-[0_0_10px_white]" />
            </motion.div>
            <div className="absolute bottom-0 w-full text-center">
                <span className="text-[9px] text-gray-500 font-mono">15</span>
                <span className="absolute right-0 text-[9px] text-gray-500 font-mono">40</span>
            </div>
        </div>
    );
};

const BMRWave = () => (
    <div className="relative w-24 h-12 flex items-center justify-center overflow-hidden bg-gray-900/30 rounded-lg border border-gray-800">
        <Activity className="text-system-accent animate-pulse" />
    </div>
);

const DurationGraph = () => (
    <div className="flex items-end gap-1 h-12 w-24">
        {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => (
            <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`flex-1 rounded-t-sm ${i % 2 === 0 ? 'bg-system-accent' : 'bg-gray-700'}`}
            />
        ))}
    </div>
);

const CircularCalibration = ({ percent }: { percent: number }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="relative w-64 h-64 flex items-center justify-center p-4">
            {/* Outer Decorative Ring */}
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-gray-800"
            />
            
            {/* Inner Decorative Ring - Spaced Inwards */}
            <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-8 rounded-full border border-gray-800/50"
            />

            {/* Progress SVG - Centered with Padding */}
            <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-48 h-48 -rotate-90 drop-shadow-[0_0_15px_rgba(0,210,255,0.2)]" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={radius} stroke="#1f2937" strokeWidth="6" fill="none" strokeOpacity={0.5} />
                    <motion.circle 
                        cx="60" cy="60" r={radius} 
                        stroke="#00d2ff" 
                        strokeWidth="6" 
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ ease: "linear" }}
                    />
                </svg>
            </div>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
                    {percent}%
                </div>
                <div className="text-[10px] text-system-neon font-bold tracking-[0.3em] uppercase mt-2 animate-pulse">
                    Analyzing
                </div>
            </div>
        </div>
    );
};

// --- END MICRO VISUALIZATIONS ---

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
    const DOT_STAGGER = 0.2;
    // Line starts after all dots (5 * 0.2 = 1.0s)
    const LINE_DELAY = data.length * DOT_STAGGER; 
    // Fill starts after line finishes drawing (1.0s + 0.8s = 1.8s)
    const FILL_DELAY = LINE_DELAY + 0.8;

    // Sanitize label for ID (remove spaces/special chars)
    const gradientId = useMemo(() => `radarFill-${label.replace(/[^a-z0-9]/gi, '')}`, [label]);

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
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0.3}/>
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
                
                {/* Fill Area (Last in sequence) */}
                <motion.path
                    d={pathD}
                    fill={`url(#${gradientId})`}
                    stroke="none"
                    initial={showEntrance ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: showEntrance ? FILL_DELAY : 0, duration: 0.8 }}
                />

                {/* Connecting Line (Stroke) - Draws after dots */}
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    filter="url(#glow)"
                    initial={showEntrance ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ 
                        pathLength: { delay: showEntrance ? LINE_DELAY : 0, duration: 1.0, ease: "easeInOut" },
                        opacity: { delay: showEntrance ? LINE_DELAY : 0, duration: 0.2 }
                    }}
                />

                {/* Data Points (Dots) - Appear First */}
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
                                transition={{ delay: showEntrance ? i * DOT_STAGGER : 0 }}
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
                                    r: { delay: showEntrance ? i * DOT_STAGGER : 0, type: "spring" },
                                    opacity: { delay: showEntrance ? i * DOT_STAGGER : 0, duration: 0.2 },
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

// Animation Variants
const setupContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

const setupItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const HealthView: React.FC<HealthViewProps> = ({ 
  healthProfile, onSaveProfile, onCompleteWorkout, onFailWorkout, onLogMeal, playerData, onToggleNav
}) => {
  const [viewMode, setViewMode] = useState<'MAP' | 'OVERVIEW' | 'ACTIVE' | 'SETUP' | 'PROCESSING' | 'DIAGNOSIS' | 'PROJECTION' | 'FINALIZING'>('MAP');
  const [activeTab, setActiveTab] = useState<'WORKOUT' | 'NUTRITION' | 'BODY'>('WORKOUT');
  
  // Projection Animation States
  const [transformProgress, setTransformProgress] = useState(0);
  const [processingPercent, setProcessingPercent] = useState(0);
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

  // Calculate stable projected increase based on username to persist across re-renders/visits
  const projectedIncrease = useMemo(() => {
      if (playerData.username) {
          let hash = 0;
          for (let i = 0; i < playerData.username.length; i++) {
              hash = playerData.username.charCodeAt(i) + ((hash << 5) - hash);
          }
          const normalized = Math.abs(hash) % 11; // 0 to 10
          return 60 + normalized;
      }
      return Math.floor(Math.random() * 11) + 60;
  }, [playerData.username]);

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
  const estimatedTimeStr = useMemo(() => calculateTimeEstimate(healthProfile || formData), [healthProfile, formData]);

  const startProcessing = () => {
      setViewMode('PROCESSING');
      setProcessingPercent(0);
      
      let p = 0;
      const interval = setInterval(() => {
          p += 1;
          setProcessingPercent(p);
          if (p >= 100) {
              clearInterval(interval);
              setTimeout(() => setViewMode('DIAGNOSIS'), 500);
          }
      }, 40); // Total approx 4 seconds
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono p-6 overflow-hidden"
          >
              <div className="relative mb-12">
                  <CircularCalibration percent={processingPercent} />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-4 flex gap-4 justify-center">
                    <span>Load_Buffer_0x692</span>
                    <span>Async_Success</span>
                </div>
                
                <div className="mt-8 h-6 overflow-hidden w-64 mx-auto border-t border-gray-900/50 pt-2 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none opacity-50" />
                    <motion.div
                        animate={{ y: -80 }}
                        transition={{ duration: 4, ease: "linear" }}
                        className="text-[9px] text-system-neon/70 space-y-1 text-center"
                    >
                        <div>MAPPING EXERCISE REGISTRY</div>
                        <div>OPTIMIZING NEURAL SYNC LEVEL</div>
                        <div>INITIALIZING SHADOW PROTOCOLS</div>
                        <div>CALIBRATION COMPLETE</div>
                    </motion.div>
                </div>
              </motion.div>
          </motion.div>
      );
  }

  if (viewMode === 'DIAGNOSIS') {
      return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/95 overflow-y-auto font-mono"
          >
              <div className="flex min-h-full items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-2xl border border-gray-800 p-6 md:p-8 rounded-3xl bg-system-card relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)] my-8"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-neon to-transparent opacity-50" />
                    
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-between items-start mb-8"
                    >
                        <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter italic">
                            <Fingerprint className="text-system-neon animate-pulse" size={28} /> INITIAL ANALYSIS
                        </h2>
                        <div className="text-[10px] text-gray-500 font-bold border border-gray-800 px-3 py-1 rounded">OS_v1.0.42</div>
                    </motion.div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* BMI CARD */}
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-black/50 p-6 rounded-2xl border border-gray-800 hover:border-system-neon/50 transition-all group/card shadow-lg flex flex-col justify-between"
                        >
                            <div>
                                <div className="text-[10px] text-gray-500 mb-2 uppercase font-bold tracking-widest">BMI Index</div>
                                <div className="text-3xl text-white font-black drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{currentBMI}</div>
                                <div className={`text-[9px] font-bold mt-2 uppercase tracking-widest ${bmiCategory.color}`}>{bmiCategory.label}</div>
                            </div>
                            <div className="mt-4 self-end">
                                <BMIGauge value={parseFloat(currentBMI)} />
                            </div>
                        </motion.div>

                        {/* BMR CARD */}
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-black/50 p-6 rounded-2xl border border-gray-800 hover:border-system-neon/50 transition-all group/card shadow-lg flex flex-col justify-between"
                        >
                            <div>
                                <div className="text-[10px] text-gray-500 mb-2 uppercase font-bold tracking-widest">BMR Status</div>
                                <div className="text-3xl text-white font-black drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{nutritionInfo.bmr}</div>
                                <div className="text-[9px] text-gray-600 font-bold mt-2 uppercase tracking-widest">KCAL / DAY</div>
                            </div>
                            <div className="mt-4 self-end">
                                <BMRWave />
                            </div>
                        </motion.div>

                        {/* DURATION CARD */}
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-black/50 p-6 rounded-2xl border border-gray-800 hover:border-system-accent/50 transition-all group/card shadow-lg flex flex-col justify-between"
                        >
                            <div>
                                <div className="text-[10px] text-system-accent mb-2 uppercase font-bold tracking-widest">Est. Duration</div>
                                <div className="text-3xl text-white font-black drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]">{estimatedTimeStr.split(' ')[0]}</div>
                                <div className="text-[9px] text-system-accent/70 font-bold mt-2 uppercase tracking-widest">WEEKS TO GOAL</div>
                            </div>
                            <div className="mt-4 self-end">
                                <DurationGraph />
                            </div>
                        </motion.div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-2 gap-4 mb-8"
                    >
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold"><Check size={14} className="text-system-success" /> METABOLIC SYNC STABLE</div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold"><Check size={14} className="text-system-success" /> NEURAL INTERFACE ONLINE</div>
                    </motion.div>

                    <motion.button 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        onClick={() => setViewMode('PROJECTION')} 
                        className="w-full py-5 bg-white text-black font-black rounded-2xl shadow-[0_0_30px_white] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                    >
                        VIEW ASCENSION PROJECTION <ArrowRight size={20} />
                    </motion.button>
                </motion.div>
              </div>
          </motion.div>
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
      
      const highStatsData = [ 
          { subject: 'STRENGTH', value: 85, fullMark: 100 }, 
          { subject: 'INTELLIGENCE', value: 75, fullMark: 100 }, 
          { subject: 'FOCUS', value: 80, fullMark: 100 }, 
          { subject: 'SOCIAL', value: 65, fullMark: 100 }, 
          { subject: 'WILLPOWER', value: 95, fullMark: 100 } 
      ];
      
      const currentStats = lowStats.map((stat, i) => ({ 
          subject: stat.subject, 
          value: lerp(stat.value, highStatsData[i].value, transformProgress), 
          fullMark: 100 
      }));
      
      // Transition from Red (#ef4444) to Green (#10b981)
      const currentColor = lerpColor("#ef4444", "#10b981", transformProgress);
      
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
                              <div className="flex-1 bg-system-success/10 border border-system-success/30 p-3 rounded-xl text-center shadow-lg">
                                  <div className="text-[10px] text-system-success/70 font-bold uppercase mb-1 flex items-center justify-center gap-1"><TrendingUp size={12}/> PROJECTED STAT INCREASE</div>
                                  <div className="text-2xl font-black text-system-success">+{projectedIncrease}%</div>
                              </div>
                              <div className="flex-1 bg-system-success/10 border border-system-success/30 p-3 rounded-xl text-center shadow-lg">
                                  <div className="text-[10px] text-system-success/70 font-bold uppercase mb-1 flex items-center justify-center gap-1"><Clock size={12}/> EST. TIME</div>
                                  <div className="text-2xl font-black text-system-success">{estimatedTimeStr}</div>
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
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-system-card border border-system-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
              >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(step/TOTAL_STEPS)*100}%` }} 
                        className="h-full bg-system-neon shadow-[0_0_15px_#00d2ff]" 
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase">Calibration Phase {step}/{TOTAL_STEPS}</h2>
                    <motion.span 
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-[10px] text-system-neon font-black bg-system-neon/10 px-2 py-0.5 rounded border border-system-neon/30"
                    >
                        SYNCING...
                    </motion.span>
                  </div>

                  <AnimatePresence mode="wait">
                      {step === 1 && (
                        <motion.div key="s1" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                            <motion.div variants={setupItemVariants} className="flex items-center gap-3 mb-4">
                                <User className="text-system-neon" size={24} />
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Vessel Identification</div>
                            </motion.div>
                            <motion.div variants={setupItemVariants} className="grid grid-cols-2 gap-4">
                                {['MALE', 'FEMALE'].map(g => (
                                    <button 
                                        key={g} 
                                        onClick={() => { setFormData({...formData, gender: g as any}); setStep(2); }} 
                                        className="py-6 border border-gray-800 rounded-2xl hover:bg-white hover:text-black hover:shadow-[0_0_20px_white] transition-all font-black text-sm tracking-widest"
                                    >
                                        {g}
                                    </button>
                                ))}
                            </motion.div>
                        </motion.div>
                      )}

                      {step === 2 && (
                        <motion.div key="s2" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                            <motion.div variants={setupItemVariants} className="flex items-center gap-3 mb-4">
                                <Activity className="text-system-neon" size={24} />
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Chronological Age</div>
                            </motion.div>
                            <motion.input 
                                variants={setupItemVariants}
                                type="number" 
                                value={formData.age} 
                                onChange={e => setFormData({...formData, age: Number(e.target.value)})} 
                                className="w-full bg-black border-b-2 border-gray-800 text-center text-6xl text-white outline-none focus:border-system-neon py-6 transition-colors"
                            />
                            <motion.div variants={setupItemVariants} className="flex justify-between items-center mt-8">
                                <button onClick={() => setStep(1)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button>
                                <button onClick={() => setStep(3)} className="bg-system-neon text-black px-10 py-3 rounded-full font-black text-xs shadow-[0_0_15px_#00d2ff] hover:bg-white transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button>
                            </motion.div>
                        </motion.div>
                      )}

                      {step === 3 && (
                        <motion.div key="s3" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                            <motion.div variants={setupItemVariants} className="flex items-center gap-3 mb-4">
                                <Ruler className="text-system-neon" size={24} />
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Verticality Mapping (CM)</div>
                            </motion.div>
                            <motion.input 
                                variants={setupItemVariants}
                                type="number" 
                                value={formData.height} 
                                onChange={e => setFormData({...formData, height: Number(e.target.value)})} 
                                className="w-full bg-black border-b-2 border-gray-800 text-center text-6xl text-white outline-none focus:border-system-neon py-6 transition-colors"
                            />
                            <motion.div variants={setupItemVariants} className="flex justify-between items-center mt-8">
                                <button onClick={() => setStep(2)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button>
                                <button onClick={() => setStep(4)} className="bg-system-neon text-black px-10 py-3 rounded-full font-black text-xs shadow-[0_0_15px_#00d2ff] hover:bg-white transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button>
                            </motion.div>
                        </motion.div>
                      )}

                      {step === 4 && (
                        <motion.div key="s4" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                            <motion.div variants={setupItemVariants} className="flex items-center gap-3 mb-4">
                                <Weight className="text-system-neon" size={24} />
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Current Mass (KG)</div>
                            </motion.div>
                            <motion.input 
                                variants={setupItemVariants}
                                type="number" 
                                value={formData.weight} 
                                onChange={e => setFormData({...formData, weight: Number(e.target.value)})} 
                                className="w-full bg-black border-b-2 border-gray-800 text-center text-6xl text-white outline-none focus:border-system-neon py-6 transition-colors"
                            />
                            <motion.div variants={setupItemVariants} className="flex justify-between items-center mt-8">
                                <button onClick={() => setStep(3)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button>
                                <button onClick={() => setStep(5)} className="bg-system-neon text-black px-10 py-3 rounded-full font-black text-xs shadow-[0_0_15px_#00d2ff] hover:bg-white transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button>
                            </motion.div>
                        </motion.div>
                      )}

                      {step === 5 && (
                        <motion.div key="s5" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                            <motion.div variants={setupItemVariants} className="flex items-center gap-3 mb-4">
                                <Target className="text-system-accent" size={24} />
                                <div className="text-xs text-system-accent uppercase tracking-widest font-black">Target Mass (KG)</div>
                            </motion.div>
                            <motion.div variants={setupItemVariants} className="relative">
                                <div className="absolute inset-0 bg-system-accent/10 blur-xl -z-10 rounded-full" />
                                <input 
                                    type="number" 
                                    value={formData.targetWeight} 
                                    onChange={e => setFormData({...formData, targetWeight: Number(e.target.value)})} 
                                    className="w-full bg-black border-b-2 border-system-accent text-center text-6xl text-white outline-none focus:shadow-[0_4px_15px_rgba(139,92,246,0.5)] py-6 transition-all font-black"
                                />
                            </motion.div>
                            <motion.div variants={setupItemVariants} className="flex justify-between items-center mt-8">
                                <button onClick={() => setStep(4)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button>
                                <button onClick={() => setStep(6)} className="bg-system-accent text-white px-10 py-3 rounded-full font-black text-xs shadow-[0_0_20px_#8b5cf6] hover:bg-white hover:text-black transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button>
                            </motion.div>
                        </motion.div>
                      )}

                      {step === 6 && (
                        <motion.div key="s6" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                            <motion.div variants={setupItemVariants} className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Energy Flux Levels</motion.div>
                            <motion.div variants={setupItemVariants} className="grid gap-2">
                                {['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE'].map(a => (
                                    <button 
                                        key={a} 
                                        onClick={() => { setFormData({...formData, activityLevel: a as any}); setStep(7); }} 
                                        className="w-full py-4 border border-gray-800 rounded-xl font-black text-[10px] tracking-widest hover:bg-white hover:text-black transition-all uppercase"
                                    >
                                        {a}
                                    </button>
                                ))}
                            </motion.div>
                            <motion.button variants={setupItemVariants} onClick={() => setStep(5)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</motion.button>
                        </motion.div>
                      )}

                      {step === 7 && (
                        <motion.div key="s7" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                            <motion.div variants={setupItemVariants} className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Primary Directive</motion.div>
                            <motion.div variants={setupItemVariants} className="grid gap-2">
                                {['LOSE_WEIGHT', 'BUILD_MUSCLE', 'RECOMP'].map(g => (
                                    <button 
                                        key={g} 
                                        onClick={() => { setFormData({...formData, goal: g as any}); setStep(8); }} 
                                        className="w-full py-4 border border-gray-800 rounded-xl font-black text-[10px] tracking-widest hover:bg-white hover:text-black transition-all uppercase"
                                    >
                                        {g === 'RECOMP' ? 'LOSE WEIGHT + BUILD MUSCLE' : g.replace('_', ' ')}
                                    </button>
                                ))}
                            </motion.div>
                            <motion.button variants={setupItemVariants} onClick={() => setStep(6)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</motion.button>
                        </motion.div>
                      )}

                      {step === 8 && (
                        <motion.div key="s8" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                            <motion.div variants={setupItemVariants} className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Resource Availability</motion.div>
                            <motion.div variants={setupItemVariants} className="grid gap-2">
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
                            </motion.div>
                            <motion.button variants={setupItemVariants} onClick={() => setStep(7)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</motion.button>
                        </motion.div>
                      )}

                      {step === 9 && (
                        <motion.div key="s9" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 text-center">
                            <motion.h3 variants={setupItemVariants} className="text-xl text-white font-black italic">CONFIRM CONFIGURATION</motion.h3>
                            <motion.div variants={setupItemVariants} className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 text-left space-y-3 font-mono text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">PROFILE</span>
                                    <span className="text-white">{formData.gender}, {formData.age}y</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">METRICS</span>
                                    <span className="text-white">{formData.height}cm / {formData.weight}kg</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">GOAL</span>
                                    <span className="text-system-neon">
                                        {formData.goal === 'RECOMP' ? 'LOSE WEIGHT + BUILD MUSCLE' : formData.goal?.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">PROTOCOL</span>
                                    <span className="text-white">{formData.equipment} / {formData.workoutSplit}</span>
                                </div>
                            </motion.div>
                            <motion.button 
                              variants={setupItemVariants}
                              onClick={startProcessing}
                              className="w-full bg-system-neon text-black font-black py-5 rounded-xl shadow-[0_0_30px_#00d2ff] hover:scale-105 transition-transform"
                            >
                                INITIALIZE SYSTEM
                            </motion.button>
                            <motion.button variants={setupItemVariants} onClick={() => setStep(8)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-6 mx-auto"><ChevronLeft size={14}/> BACK</motion.button>
                        </motion.div>
                      )}
                  </AnimatePresence>
              </motion.div>
          </div>
      );
  }

  if (viewMode === 'OVERVIEW' && activePlan) return <WorkoutOverview plan={activePlan} focusVideos={playerData.focusVideos} onStart={(p) => { setActivePlan(p); setViewMode('ACTIVE'); }} onCancel={() => setViewMode('MAP')} userWeight={healthProfile?.weight} />;
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
                            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center shadow-lg"><Flame className="text-orange-500 mx-auto mb-2 animate-pulse" size={24} /><div className="text-2xl font-black text-white">{playerData.streak}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest">STREAK</div></div>
                            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center shadow-lg"><Target className="text-system-neon mx-auto mb-2" size={24} /><div className="text-xl font-bold text-white uppercase tracking-tight">{calculateTimeEstimate(healthProfile || formData)}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest">TARGET</div></div>
                        </div>
                        <WorkoutMap currentWeight={healthProfile?.weight || 0} targetWeight={healthProfile?.targetWeight || 0} workoutPlan={calculatedPlan} completedDays={playerData.logs.filter(l => l.type === 'WORKOUT').length} onStartDay={(idx) => { setActivePlan(calculatedPlan[idx % calculatedPlan.length]); setViewMode('OVERVIEW'); }} />
                    </motion.div>
                )}
                {activeTab === 'NUTRITION' && (
                    <motion.div key="nut" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="grid grid-cols-4 gap-2">
                            {Object.entries(nutritionInfo.macros).map(([k, v]) => <div key={k} className="bg-gray-900/50 p-3 rounded-xl border border-gray-800 text-center"><div className="text-[10px] text-gray-500 uppercase">{k}</div><div className="text-sm font-bold text-white">{v}{k === 'calories' ? '' : 'g'}</div></div>)}
                        </div>
                        <div className="bg-black border border-gray-800 p-6 rounded-2xl shadow-xl">
                            <h3 className="text-xs text-white font-black mb-4 flex items-center gap-2 tracking-widest"><Search size={14} /> FOOD SCANNER</h3>
                            <input value={foodSearch} onChange={e => setFoodSearch(e.target.value)} placeholder="SEARCH FOODS..." className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-sm mb-4 outline-none focus:border-system-neon transition-all" />
                            <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                                {INDIAN_FOOD_DB.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase())).map(food => (
                                    <div key={food.id} onClick={() => onLogMeal?.({ id: Math.random().toString(36).substr(2,9), label: food.name, items: [{...food, quantity: 1}], totalCalories: food.calories, totalProtein: food.protein, totalCarbs: food.carbs, totalFats: food.fats, timestamp: Date.now() })} className="p-3 bg-gray-900/30 hover:bg-gray-900 transition-all cursor-pointer rounded-xl flex justify-between items-center group">
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
                        <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 shadow-xl">
                            <h3 className="text-sm text-white font-black mb-6 flex items-center gap-2 tracking-widest"><Fingerprint size={16} /> BIOMETRIC_REPORT</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-gray-800 pb-4"><span className="text-gray-500 uppercase text-xs">Body Mass Index</span><span className="text-white font-bold">{healthProfile?.bmi}</span></div>
                                <div className="flex justify-between border-b border-gray-800 pb-4"><span className="text-gray-500 uppercase text-xs">Basal Metabolic Rate</span><span className="text-white font-bold">{healthProfile?.bmr} kcal</span></div>
                                <div className="flex justify-between border-b border-gray-800 pb-4"><span className="text-gray-500 uppercase text-xs">Status</span><span className="text-system-neon font-black tracking-widest">STABLE</span></div>
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