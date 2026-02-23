
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Variants, animate, useAnimation } from 'framer-motion';
import { User, Activity, Ruler, Weight, Target, ChevronLeft, ChevronRight, Hexagon, Zap, Clock, TrendingUp, ShieldCheck, Dumbbell, Cpu, Database, Wifi, Lock, Hourglass, Sparkles, AlertTriangle, ArrowUp, AlertCircle, Eye, BookOpen, Moon } from 'lucide-react';
import { HealthProfile, CoreStats, BaselineStats } from '../types';
import SystemPersonalizationScreen from './SystemPersonalizationScreen';

interface CalibrationFlowProps {
  onComplete: (profile: HealthProfile, calculatedStats: CoreStats) => void;
}

const setupContainerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }, exit: { opacity: 0, x: -20, transition: { duration: 0.2 } } };
const setupItemVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

// --- HELPER: RADAR CHART ---
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// Helper for Color Interpolation
const interpolateColor = (color1: string, color2: string, factor: number) => {
    let result = color1.slice();
    let r1 = parseInt(color1.substring(1, 3), 16);
    let g1 = parseInt(color1.substring(3, 5), 16);
    let b1 = parseInt(color1.substring(5, 7), 16);
    let r2 = parseInt(color2.substring(1, 3), 16);
    let g2 = parseInt(color2.substring(3, 5), 16);
    let b2 = parseInt(color2.substring(5, 7), 16);
    let r = Math.round(r1 + factor * (r2 - r1));
    let g = Math.round(g1 + factor * (g2 - g1));
    let b = Math.round(b1 + factor * (b2 - b1));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const getPhaseColor = (progress: number) => {
    if (progress <= 0.33) {
        return interpolateColor("#ef4444", "#f97316", progress / 0.33);
    } else if (progress <= 0.66) {
        return interpolateColor("#f97316", "#84cc16", (progress - 0.33) / 0.33);
    } else {
        return interpolateColor("#84cc16", "#10b981", (progress - 0.66) / 0.34);
    }
};

const AwakeningRadar = ({ current, potential, progress, showGhost, color, isEntrance }: { current: number[]; potential: number[]; progress: number; showGhost: boolean; color: string; isEntrance?: boolean }) => {
    const size = 300;
    const center = size / 2;
    const radius = 100;
    const labels = ["STRENGTH", "SOCIAL", "INTELLIGENCE", "WILLPOWER", "FOCUS", "DISCIPLINE"]; 
    
    // Interpolate values
    const data = current.map((val, i) => val + (potential[i] - val) * progress);
    
    // Calculate Points
    const getPoints = (values: number[]) => {
        return values.map((val, i) => {
            const angle = (360 / values.length) * i;
            const r = (val / 100) * radius;
            return polarToCartesian(center, center, r, angle);
        });
    };

    const activePoints = getPoints(data);
    const activePath = activePoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';
    
    const ghostPoints = getPoints(current);
    const ghostPath = ghostPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';

    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];

    // Animation settings for entrance
    const DOT_STAGGER = 0.15;
    const LINE_DELAY = data.length * DOT_STAGGER;

    return (
        <div className="relative w-[300px] h-[300px] flex items-center justify-center">
            <svg width={size} height={size} className="overflow-visible">
                {/* Hexagonal Grid Background */}
                {gridLevels.map((level, i) => {
                    const points = labels.map((_, j) => {
                        const angle = (360 / labels.length) * j;
                        const pos = polarToCartesian(center, center, radius * level, angle);
                        return `${pos.x},${pos.y}`;
                    }).join(' ');
                    return <polygon key={i} points={points} fill="none" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />;
                })}

                {/* Axes Lines */}
                {labels.map((_, i) => {
                    const angle = (360 / labels.length) * i;
                    const pos = polarToCartesian(center, center, radius, angle);
                    return <line key={`axis-${i}`} x1={center} y1={center} x2={pos.x} y2={pos.y} stroke="#333" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />;
                })}
                
                {/* Labels */}
                {labels.map((label, i) => {
                    const angle = (360 / labels.length) * i;
                    const pos = polarToCartesian(center, center, radius + 30, angle);
                    return (
                        <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fill="#666" fontSize="8" fontWeight="bold" fontFamily="monospace" letterSpacing="1px">
                            {label}
                        </text>
                    );
                })}

                {/* Ghost Graph (The Past) */}
                {showGhost && (
                    <path d={ghostPath} fill="none" stroke="#444" strokeWidth="2" strokeDasharray="4 2" opacity="0.3" />
                )}

                {/* Active Graph */}
                <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.6"/>
                        <stop offset="100%" stopColor={color} stopOpacity="0.1"/>
                    </linearGradient>
                </defs>
                
                {/* 1. Line appears after dots if isEntrance */}
                <motion.path 
                    d={activePath} 
                    fill="url(#radarGradient)" 
                    stroke={color} 
                    strokeWidth="3"
                    initial={isEntrance ? { pathLength: 0, opacity: 0 } : false}
                    animate={isEntrance ? { pathLength: 1, opacity: 1, stroke: color, d: activePath } : { d: activePath, stroke: color }}
                    transition={isEntrance 
                        ? { delay: LINE_DELAY, duration: 1.5, ease: "easeOut" } 
                        : { type: "spring", stiffness: 100, damping: 20 }
                    }
                />
                
                {/* 2. Dots appear sequentially if isEntrance */}
                {activePoints.map((p, i) => (
                    <motion.circle 
                        key={i} 
                        cx={p.x} cy={p.y} r="3" 
                        fill="white"
                        initial={isEntrance ? { scale: 0, opacity: 0 } : false}
                        animate={{ cx: p.x, cy: p.y, scale: 1, opacity: 1 }}
                        transition={isEntrance 
                            ? { delay: i * DOT_STAGGER, duration: 0.4, type: "spring", stiffness: 200 }
                            : { type: "spring", stiffness: 100, damping: 20 }
                        }
                    />
                ))}
            </svg>
        </div>
    );
};

const BMIGauge = ({ value }: { value: number }) => {
    // Simple Linear Gauge
    const percent = Math.min(100, Math.max(0, ((value - 15) / (40 - 15)) * 100));

    return (
        <div className="w-24 mt-3 flex flex-col gap-1">
            <div className="h-1.5 w-full bg-gray-800 rounded-full relative overflow-visible">
                {/* Gradient Background */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500" />
                
                {/* Marker */}
                <motion.div 
                    initial={{ left: 0 }}
                    animate={{ left: `${percent}%` }}
                    transition={{ delay: 0.5, duration: 1, type: "spring" }}
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-black rounded-full shadow-[0_0_5px_white] z-10"
                    style={{ marginLeft: '-5px' }} 
                />
            </div>
            <div className="flex justify-between text-[8px] text-gray-600 font-mono">
                <span>15</span>
                <span>40</span>
            </div>
        </div>
    );
};

const TrendGraph = () => (
    <div className="flex items-end gap-1 h-12 w-full mt-2 justify-center opacity-80">
        {[0.3, 0.5, 0.4, 0.7, 0.5, 0.8, 0.6, 0.9].map((h, i) => (
            <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`w-2 rounded-t-sm ${i > 5 ? 'bg-system-neon shadow-[0_0_8px_#00d2ff]' : 'bg-gray-800'}`}
            />
        ))}
    </div>
);

const AnimatedClock = () => (
    <div className="relative w-14 h-14 border-2 border-gray-700 rounded-full flex items-center justify-center bg-gray-900/50 mx-auto mt-2 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute w-0.5 h-5 bg-yellow-500 origin-bottom bottom-1/2 left-[calc(50%-1px)] rounded-full"
        />
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute w-1 h-3 bg-white origin-bottom bottom-1/2 left-[calc(50%-2px)] rounded-full"
        />
        <div className="absolute w-1.5 h-1.5 bg-yellow-500 rounded-full z-10" />
    </div>
);

const GrowthSpinner = () => (
    <div className="relative w-16 h-16 flex items-center justify-center mt-2">
        <motion.div
            animate={{ rotate: 180 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            className="z-10"
        >
            <Hourglass className="text-purple-500" size={32} />
        </motion.div>
        <motion.div 
            className="absolute inset-0 border-2 border-purple-500/30 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
        />
    </div>
);

// --- ANIMATED COUNTER COMPONENT ---
const AnimatedCounter = ({ value, isEntrance }: { value: number, isEntrance: boolean }) => {
    const [display, setDisplay] = useState(0);
    
    useEffect(() => {
        if (!isEntrance) {
            setDisplay(value);
            return;
        }

        let start: number | null = null;
        const duration = 2000;
        
        const animate = (t: number) => {
            if (!start) start = t;
            const progress = Math.min((t - start) / duration, 1);
            
            // Quartic Ease Out for "slowing down at the end" (last digits slow roll)
            const ease = 1 - Math.pow(1 - progress, 4);
            
            const current = Math.floor(ease * value);
            setDisplay(current);
            
            if (progress < 1) requestAnimationFrame(animate);
            else setDisplay(value);
        };
        requestAnimationFrame(animate);
    }, [value, isEntrance]);

    return <>{display}</>;
};

// --- SYSTEM REPORT COMPONENT ---
const CalibrationReport: React.FC<{ profile: HealthProfile, onContinue: () => void }> = ({ profile, onContinue }) => {
    // 1. Calculate BMI
    const bmi = profile.weight / ((profile.height / 100) ** 2);
    
    // 2. Estimate Body Fat (Navy Method approx using BMI/Age/Gender as fallback)
    const bodyFat = (1.20 * bmi) + (0.23 * profile.age) - (profile.gender === 'MALE' ? 16.2 : 5.4);

    // 3. Calculate Timeline
    let weeks = 0;
    let message = "";
    const diff = Math.abs((profile.targetWeight || profile.weight) - profile.weight);
    
    if (profile.goal === 'LOSE_WEIGHT' || (profile.targetWeight || 0) < profile.weight) {
        weeks = Math.ceil(diff / 0.75);
        message = `To reach ${profile.targetWeight}kg`;
    } else if (profile.goal === 'BUILD_MUSCLE' || (profile.targetWeight || 0) > profile.weight) {
        weeks = Math.ceil(diff / 0.3);
        message = `To reach ${profile.targetWeight}kg`;
    } else {
        weeks = 8; // Standard Recomp Cycle
        message = "Body Recomposition Cycle";
    }

    // 4. Growth Potential (Gamified Sync Rate)
    const activityBonus = { 'SEDENTARY': 0, 'LIGHT': 10, 'MODERATE': 20, 'VERY_ACTIVE': 25 };
    const potential = 70 + (activityBonus[profile.activityLevel] || 10) + (profile.age < 30 ? 5 : 0);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[150] bg-black flex flex-col items-center justify-center p-6 font-mono overflow-y-auto"
        >
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center space-y-2">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-block px-3 py-1 border border-system-neon/30 rounded-full bg-system-neon/5 text-system-neon text-[10px] tracking-widest uppercase font-bold mb-2"
                    >
                        Analysis Complete
                    </motion.div>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">System Report</h2>
                    <p className="text-gray-500 text-xs">Based on your provided biometrics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* BMI Card */}
                    <motion.div 
                        whileHover={{ scale: 1.02, borderColor: '#10b981' }}
                        className="bg-[#0f0f0f] border border-gray-800 p-5 rounded-xl relative overflow-hidden group transition-colors flex flex-col justify-between"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-md bg-black border border-gray-700 group-hover:border-green-500/50 transition-colors">
                                        <Activity size={16} className="text-green-500" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">BMI Ratio</span>
                                </div>
                                <div className="text-2xl font-black text-white font-mono">{bmi.toFixed(1)}</div>
                                <div className="text-[10px] text-gray-400 mt-1 font-mono">
                                    {bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal Range" : "Overweight"}
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <BMIGauge value={bmi} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Body Fat Card */}
                    <motion.div 
                        whileHover={{ scale: 1.02, borderColor: '#3b82f6' }}
                        className="bg-[#0f0f0f] border border-gray-800 p-5 rounded-xl relative overflow-hidden group transition-colors flex flex-col justify-between"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-md bg-black border border-gray-700 group-hover:border-blue-500/50 transition-colors">
                                        <TrendingUp size={16} className="text-blue-500" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Est. Body Fat</span>
                                </div>
                                <div className="text-2xl font-black text-white font-mono">{bodyFat.toFixed(1)}%</div>
                                <div className="text-[10px] text-gray-400 mt-1 font-mono">Approximate Calculation</div>
                            </div>
                            <div className="w-24">
                                <TrendGraph />
                            </div>
                        </div>
                    </motion.div>

                    {/* Timeline Card */}
                    <motion.div 
                        whileHover={{ scale: 1.02, borderColor: '#eab308' }}
                        className="bg-[#0f0f0f] border border-gray-800 p-5 rounded-xl relative overflow-hidden group transition-colors flex flex-col justify-between"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-md bg-black border border-gray-700 group-hover:border-yellow-500/50 transition-colors">
                                        <Clock size={16} className="text-yellow-500" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Projected Timeline</span>
                                </div>
                                <div className="text-2xl font-black text-white font-mono">{weeks} WEEKS</div>
                                <div className="text-[10px] text-gray-400 mt-1 font-mono">{message}</div>
                            </div>
                            <div className="w-20 flex justify-center">
                                <AnimatedClock />
                            </div>
                        </div>
                    </motion.div>

                    {/* Growth Potential Card */}
                    <motion.div 
                        whileHover={{ scale: 1.02, borderColor: '#8b5cf6' }}
                        className="bg-[#0f0f0f] border border-gray-800 p-5 rounded-xl relative overflow-hidden group transition-colors flex flex-col justify-between"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-md bg-black border border-gray-700 group-hover:border-purple-500/50 transition-colors">
                                        <Zap size={16} className="text-purple-500" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Growth Potential</span>
                                </div>
                                <div className="text-2xl font-black text-white font-mono">{potential}%</div>
                                <div className="text-[10px] text-gray-400 mt-1 font-mono">Based on System Adherence</div>
                            </div>
                            <div className="w-20">
                                <GrowthSpinner />
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 text-center space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
                        The System has generated a personalized protocol based on this analysis. 
                        Compliance is mandatory for optimal results.
                    </p>
                    <button 
                        onClick={onContinue}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-lg hover:bg-system-neon hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        <ShieldCheck size={16} /> Accept Protocols
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const AwakeningOverlay: React.FC<{ profile: Partial<HealthProfile>; onComplete: (stats: CoreStats) => void }> = ({ profile, onComplete }) => {
    // Phase 0: Reality, 1: Phase 1, 2: Phase 2, 3: Vision (Max)
    const [phase, setPhase] = useState<number>(0);
    const progressRef = useRef(0);
    const [progress, setProgress] = useState(0); // 0 to 1 value for graph
    const [displayedWeeks, setDisplayedWeeks] = useState(0);
    const [currentColor, setCurrentColor] = useState("#ef4444");
    // New State for Personalization Screen
    const [isPersonalizing, setIsPersonalizing] = useState(false);
    
    // Animation controls
    const shakeControls = useAnimation();
    const glowControls = useAnimation();

    // Calculate Projected Weeks
    const totalWeeks = useMemo(() => {
        let weeks = 12; // Default fallback
        const diff = Math.abs((profile.targetWeight || profile.weight || 0) - (profile.weight || 0));
        if (diff > 0) {
            if (profile.goal === 'LOSE_WEIGHT' || (profile.targetWeight || 0) < (profile.weight || 0)) {
                weeks = Math.ceil(diff / 0.75);
            } else if (profile.goal === 'BUILD_MUSCLE' || (profile.targetWeight || 0) > (profile.weight || 0)) {
                weeks = Math.ceil(diff / 0.3);
            } else {
                weeks = 8; 
            }
        }
        return Math.max(weeks, 4); // Min 4 weeks
    }, [profile]);

    // Calculate Initial "Bad" Stats
    const currentStats = useMemo(() => {
        let str = 25, soc = 30, int = 40, wil = 25, foc = 30, dis = 20; 
        if (profile.activityLevel === 'SEDENTARY') { str = 15; dis = 15; wil = 20; }
        if (profile.activityLevel === 'LIGHT') { str = 30; dis = 25; wil = 30; }
        if (profile.activityLevel === 'MODERATE') { str = 45; dis = 40; wil = 45; }
        if (profile.activityLevel === 'VERY_ACTIVE') { str = 60; dis = 55; wil = 60; }
        return [str, soc, int, wil, foc, dis];
    }, [profile]);

    const potentialStats = [95, 85, 90, 92, 88, 99]; // Max stats
    const labels = ["STRENGTH", "SOCIAL", "INTELLIGENCE", "WILLPOWER", "FOCUS", "DISCIPLINE"];

    // Initial Set
    useEffect(() => {
        if (phase === 0) {
            setDisplayedWeeks(0);
            setCurrentColor(getPhaseColor(0));
        }
    }, []);

    // Shake & Glow Logic
    useEffect(() => {
        if (phase === 0) return;

        let shakeIntensity = 0;
        let glowColor = 'transparent';

        if (phase === 1) {
            // Prominent shake + Reddish border glow
            shakeIntensity = 12;
            glowColor = 'rgba(239, 68, 68, 0.5)';
        } else if (phase === 2) {
            // Less prominent shake + Orangish glow
            shakeIntensity = 6;
            glowColor = 'rgba(249, 115, 22, 0.5)';
        } else if (phase === 3) {
            // Minimal shake
            shakeIntensity = 2;
            glowColor = 'rgba(0, 210, 255, 0.2)'; // Subtle System Glow
        }

        if (shakeIntensity > 0) {
            // Generate jitter keyframes
            const count = 30; // Number of jitter points
            const x = Array.from({ length: count }, () => (Math.random() - 0.5) * shakeIntensity * 2);
            const y = Array.from({ length: count }, () => (Math.random() - 0.5) * shakeIntensity * 2);
            
            // Ensure end state is 0
            x.push(0);
            y.push(0);

            // Start Shake on Content
            shakeControls.start({
                x,
                y,
                transition: { duration: 1.5, ease: "linear" }
            });

            // Start Glow on Border
            glowControls.start({
                boxShadow: `inset 0 0 80px ${glowColor}`,
                transition: { duration: 0.5, ease: "easeOut" }
            }).then(() => {
                // Fade out glow after main animation part (1.5s total match)
                setTimeout(() => {
                    glowControls.start({
                        boxShadow: 'inset 0 0 0px transparent',
                        transition: { duration: 0.5 }
                    });
                }, 1000);
            });
        }

    }, [phase, shakeControls, glowControls]);

    // Phase Animation Logic
    useEffect(() => {
        // Target progress based on phase (0 -> 0.33 -> 0.66 -> 1)
        const targetProgress = phase / 3;
        
        // Target Weeks based on phase
        const targetWeeks = Math.floor(totalWeeks * targetProgress);

        // Animate both progress and weeks smoothly
        const controls = animate(progressRef.current, targetProgress, {
            duration: 1.5,
            ease: "easeInOut",
            onUpdate: (latest) => {
                progressRef.current = latest;
                setProgress(latest);
                setDisplayedWeeks(Math.floor(totalWeeks * (latest / 1))); // latest is 0-1 if target is 1? No, logic fix below.
                setCurrentColor(getPhaseColor(latest));
            }
        });
        
        const weekControls = animate(displayedWeeks, targetWeeks, {
            duration: 1.5,
            ease: "easeInOut",
            onUpdate: (latest) => setDisplayedWeeks(Math.floor(latest))
        });

        return () => {
            controls.stop();
            weekControls.stop();
        };
    }, [phase, totalWeeks]);

    const handleNextPhase = () => {
        if (phase < 3) {
            setPhase(prev => prev + 1);
        } else {
            // Trigger the loading screen instead of finishing immediately
            setIsPersonalizing(true);
        }
    };

    const handlePersonalizationComplete = () => {
        const statsObj: CoreStats = {
            strength: currentStats[0],
            social: currentStats[1],
            intelligence: currentStats[2],
            willpower: currentStats[3],
            focus: currentStats[4],
            discipline: currentStats[5]
        };
        onComplete(statsObj);
    };

    const getPhaseTitle = () => {
        switch(phase) {
            case 0: return "CURRENT REALITY";
            case 1: return "OPTIMIZATION PHASE I";
            case 2: return "OPTIMIZATION PHASE II";
            case 3: return "FULL POTENTIAL";
            default: return "SYSTEM";
        }
    };

    const getSubText = () => {
        switch(phase) {
            case 0: return "CURRENT STATUS";
            case 1: return `YOU AFTER ${Math.floor(totalWeeks / 3)} WEEKS`;
            case 2: return `YOU AFTER ${Math.floor(totalWeeks * 2 / 3)} WEEKS`;
            case 3: return "FINAL FORM";
            default: return "";
        }
    };

    const getButtonText = () => {
        switch(phase) {
            case 0: return "INITIATE AWAKENING";
            case 1: return "NEXT PHASE";
            case 2: return "FINAL PHASE";
            case 3: return "ENTER THE SYSTEM";
            default: return "CONTINUE";
        }
    };

    // --- INTERCEPT RENDER IF PERSONALIZING ---
    if (isPersonalizing) {
        return <SystemPersonalizationScreen onComplete={handlePersonalizationComplete} />;
    }

    return (
        <motion.div 
            className="fixed inset-0 z-[200] bg-black font-mono overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* GLOW LAYER - Fixed to viewport */}
            <motion.div 
                className="absolute inset-0 z-[220] pointer-events-none"
                animate={glowControls}
            />

            {/* SHAKE WRAPPER - Contains visual elements */}
            <motion.div 
                className="w-full h-full flex flex-col items-center justify-center p-6 relative"
                animate={shakeControls}
            >
                <div className={`absolute inset-0 transition-opacity duration-1000 ${phase === 0 ? 'opacity-20' : 'opacity-100'} bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.05)_0%,transparent_70%)] pointer-events-none`} />
                
                <div className="relative z-10 flex flex-col items-center w-full max-w-md">
                    
                    {/* HEADLINE */}
                    <motion.div layout className="mb-4 text-center space-y-2">
                        <motion.div 
                            className="text-xs font-bold tracking-[0.2em] uppercase"
                            style={{ color: currentColor }}
                        >
                            {getPhaseTitle()}
                        </motion.div>
                    </motion.div>

                    {/* WEEK COUNTER DISPLAY */}
                    <div className="flex flex-col items-center justify-center mb-6 w-full">
                        <div className="flex items-end gap-2 mb-1">
                            <div className="text-6xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                {displayedWeeks}
                            </div>
                            <div className="text-xl font-bold text-gray-500 mb-2">WEEKS</div>
                        </div>
                        
                        {/* Dynamic Subtext */}
                        <motion.div 
                            key={phase}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10px] uppercase tracking-[0.3em] font-bold mb-3"
                            style={{ color: currentColor }}
                        >
                            {getSubText()}
                        </motion.div>

                        {/* Progress Bar for Weeks */}
                        <div className="w-64 h-1 bg-gray-900 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full shadow-[0_0_10px_#00d2ff]"
                                style={{ backgroundColor: currentColor }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(displayedWeeks / totalWeeks) * 100}%` }}
                                transition={{ type: "spring", stiffness: 50 }}
                            />
                        </div>
                    </div>

                    {/* RADAR GRAPH */}
                    <div className="relative mb-8 transform scale-110">
                        <AwakeningRadar 
                            current={currentStats} 
                            potential={potentialStats} 
                            progress={progress} 
                            showGhost={phase > 0}
                            color={currentColor}
                            isEntrance={phase === 0}
                        />
                    </div>

                    {/* STATS POINTS TABLE - Shows Interpolated Values */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-3 gap-2 w-full mb-8 mt-4"
                    >
                        {labels.map((label, index) => {
                            const currentVal = currentStats[index];
                            const potentialVal = potentialStats[index];
                            // Animate value from current to potential during progress
                            const displayVal = Math.floor(currentVal + (potentialVal - currentVal) * progress);
                            const isMaxed = displayVal >= potentialVal && phase === 3;
                            const isImproving = phase > 0;

                            return (
                                <div 
                                    key={label} 
                                    className={`flex flex-col items-center p-2 rounded border transition-colors duration-500`}
                                    style={{ 
                                        borderColor: `${currentColor}30`, 
                                        backgroundColor: `${currentColor}10` 
                                    }}
                                >
                                    <span 
                                        className="text-[8px] font-bold uppercase tracking-widest mb-1 transition-colors duration-500"
                                        style={{ color: currentColor }}
                                    >
                                        {label}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className={`text-sm font-black font-mono tabular-nums ${phase === 0 ? 'text-gray-400' : isMaxed ? 'text-white' : 'text-gray-300'}`}>
                                            <AnimatedCounter value={displayVal} isEntrance={phase === 0} />
                                        </span>
                                        {isImproving && phase < 3 && (
                                            <ArrowUp size={10} style={{ color: currentColor }} className="animate-bounce" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>

                    {/* ACTIONS */}
                    <div className="w-full space-y-4">
                        <motion.div 
                            key={phase} // Re-animate on phase change
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <button 
                                onClick={handleNextPhase}
                                className={`w-full py-5 font-black rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2
                                    ${phase === 3 ? 'bg-system-neon text-black shadow-[0_0_40px_#00d2ff]' : 'bg-white text-black'}
                                `}
                            >
                                {phase === 0 && <Sparkles size={16} />}
                                {phase === 3 && <ShieldCheck size={16} />}
                                {getButtonText()}
                            </button>
                        </motion.div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
};

const AssessmentOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState("INITIALIZING UPLINK");

    const SYSTEM_MESSAGES = [
        "Establishing secure connection...",
        "Encrypting biometric data...",
        "Handshaking with Neural Interface...",
        "Allocating server resources...",
        "Parsing muscle fiber density...",
        "Calculating metabolic baseline...",
        "Syncing with Shadow Database...",
        "Optimizing workout algorithms...",
        "Generating growth projection...",
        "Finalizing user profile..."
    ];

    useEffect(() => {
        let currentProgress = 0;
        let messageIndex = 0;

        const interval = setInterval(() => {
            const increment = Math.random() * 3.5;
            currentProgress += increment;

            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                setStatus("COMPLETE");
                setTimeout(onComplete, 800);
            }

            setProgress(currentProgress);

            const targetLogIndex = Math.floor((currentProgress / 100) * SYSTEM_MESSAGES.length);
            if (targetLogIndex > messageIndex && messageIndex < SYSTEM_MESSAGES.length) {
                setLogs(prev => [...prev, SYSTEM_MESSAGES[messageIndex]]);
                messageIndex++;
            }

        }, 100); 

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center font-mono overflow-hidden"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.05)_0%,transparent_50%)]" />
            <div className="relative z-10 flex flex-col items-center gap-12">
                <div className="relative w-64 h-64 flex items-center justify-center">
                    <motion.div className="absolute inset-0 rounded-full border border-gray-800 border-t-system-neon/30 border-r-system-neon/30" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
                    <motion.div className="absolute inset-4 rounded-full border border-gray-800 border-b-system-neon/20 border-l-system-neon/20" animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
                    <svg className="absolute inset-0 w-full h-full -rotate-90 transform p-4">
                        <circle cx="50%" cy="50%" r="48%" className="stroke-gray-900/50" strokeWidth="2" fill="transparent" />
                        <motion.circle cx="50%" cy="50%" r="48%" className="stroke-system-neon drop-shadow-[0_0_15px_rgba(0,210,255,0.5)]" strokeWidth="4" fill="transparent" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: progress / 100 }} transition={{ duration: 0.1, ease: "linear" }} />
                    </svg>
                    <div className="flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-full w-32 h-32 border border-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10">
                        <span className="text-3xl font-black text-white tracking-tighter">
                            {Math.round(progress)}<span className="text-sm text-system-neon">%</span>
                        </span>
                    </div>
                </div>
                <div className="text-center space-y-4">
                    <h2 className="text-lg font-bold text-white tracking-[0.3em] uppercase animate-pulse">{status}</h2>
                    <div className="h-6 overflow-hidden relative flex justify-center w-full max-w-md">
                        <AnimatePresence mode="wait">
                            <motion.div key={logs[logs.length - 1]} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-xs text-gray-500 font-mono tracking-wider absolute w-full text-center">
                                {logs[logs.length - 1] ? `> ${logs[logs.length - 1]}` : "> Initializing System..."}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-neon/20 to-transparent" />
        </motion.div>
    );
};

const CalibrationFlow: React.FC<CalibrationFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [viewState, setViewState] = useState<'FORM' | 'ASSESSMENT' | 'REPORT' | 'AWAKENING'>('FORM');
  const TOTAL_STEPS = 14; 
  
  const [formData, setFormData] = useState<Partial<HealthProfile>>({
      gender: 'MALE', activityLevel: 'MODERATE', goal: 'RECOMP', equipment: 'GYM', workoutSplit: 'CLASSIC', age: 25, height: 175, weight: 70, targetWeight: 70
  });
  
  const [baselines, setBaselines] = useState<BaselineStats>({
      pushups: 10,
      focusDuration: 30,
      readingTime: 15,
      sleepAvg: 7
  });

  const [heightUnit, setHeightUnit] = useState<'CM' | 'FT'>('CM');
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LBS'>('KG');

  const toFtIn = (cm: number) => {
      const totalInches = Math.round(cm / 2.54);
      const ft = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return { ft, inches };
  };

  const toCm = (ft: number, inches: number) => Math.round((ft * 30.48) + (inches * 2.54));
  
  const toLbs = (kg: number) => Math.round(kg * 2.20462);
  const toKg = (lbs: number) => Math.round(lbs / 2.20462);

  const handleFinish = () => {
      setViewState('ASSESSMENT');
  };

  const handleAssessmentComplete = () => {
      setViewState('REPORT');
  };

  const handleReportAccept = () => {
      setViewState('AWAKENING');
  };

  const finalizeCalibration = (stats: CoreStats) => {
      const calculatedProfile = {
          ...formData,
          bmi: (formData.weight! / ((formData.height! / 100) ** 2)),
          bmr: 1600,
          macros: { protein: 150, carbs: 200, fats: 60, calories: 2000 },
          workoutPlan: [],
          injuries: [],
          category: 'Hunter',
          startingWeight: formData.weight,
          baselines: baselines // SAVE BASELINES
      } as HealthProfile;
      
      onComplete(calculatedProfile, stats);
  };

  const updateHeightFromFtIn = (ft: number | string, inch: number | string) => {
      const f = Number(ft) || 0;
      const i = Number(inch) || 0;
      const cm = toCm(f, i);
      setFormData({ ...formData, height: cm });
  };

  if (viewState === 'ASSESSMENT') return <AssessmentOverlay onComplete={handleAssessmentComplete} />;
  if (viewState === 'REPORT') return <CalibrationReport profile={formData as HealthProfile} onContinue={handleReportAccept} />;
  if (viewState === 'AWAKENING') return <AwakeningOverlay profile={formData} onComplete={finalizeCalibration} />;

  return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 font-mono">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-[#0a0a0a] border border-system-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
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
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-[10px] text-system-neon font-black bg-system-neon/10 px-2 py-0.5 rounded border border-system-neon/30">SYNCING...</motion.span>
              </div>

              <AnimatePresence mode="wait">
                  {/* Step 1: Honesty Warning */}
                  {step === 1 && (
                    <motion.div key="s1" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                        <motion.div variants={setupItemVariants} className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl text-center">
                            <AlertTriangle className="text-red-500 mx-auto mb-4" size={40} />
                            <h3 className="text-white font-black uppercase text-lg mb-2">System Warning</h3>
                            <p className="text-gray-400 text-xs leading-relaxed">
                                ForgeGuard is active. Falsifying biometric data or capability baselines will result in inaccurate difficulty scaling and potential System Lockout.
                            </p>
                            <p className="text-red-400 font-bold text-xs mt-4 uppercase tracking-widest">
                                HONESTY IS MANDATORY.
                            </p>
                        </motion.div>
                        <motion.button 
                            variants={setupItemVariants}
                            onClick={() => setStep(2)}
                            className="w-full bg-white text-black font-black py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                            I Understand <ShieldCheck size={14} />
                        </motion.button>
                    </motion.div>
                  )}

                  {/* Step 2: Gender */}
                  {step === 2 && (
                    <motion.div key="s2" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                        <motion.div variants={setupItemVariants} className="flex items-center gap-3 mb-4"><User className="text-system-neon" size={24} /><div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Vessel Identification</div></motion.div>
                        <div className="grid grid-cols-2 gap-4">{['MALE', 'FEMALE'].map(g => (<button key={g} onClick={() => { setFormData({...formData, gender: g as any}); setStep(3); }} className="py-6 border border-gray-800 rounded-2xl hover:bg-white hover:text-black hover:shadow-[0_0_20px_white] transition-all font-black text-sm tracking-widest text-gray-300">{g}</button>))}</div>
                    </motion.div>
                  )}

                  {/* Step 3: Age */}
                  {step === 3 && (
                    <motion.div key="s3" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                        <motion.div variants={setupItemVariants} className="flex items-center gap-3 mb-4"><Activity className="text-system-neon" size={24} /><div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Chronological Age</div></motion.div>
                        <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: Number(e.target.value)})} className="w-full bg-black border-b-2 border-gray-800 text-center text-6xl text-white outline-none focus:border-system-neon py-6 transition-colors"/>
                        <div className="flex justify-between mt-8"><button onClick={() => setStep(2)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button><button onClick={() => setStep(4)} className="bg-system-neon text-black px-10 py-3 rounded-full font-black text-xs shadow-[0_0_15px_#00d2ff] hover:bg-white transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button></div>
                    </motion.div>
                  )}

                  {/* Step 4: Height */}
                  {step === 4 && (
                    <motion.div key="s4" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                        <motion.div variants={setupItemVariants} className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <Ruler className="text-system-neon" size={24} />
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Height</div>
                            </div>
                            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                                <button onClick={() => setHeightUnit('CM')} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${heightUnit === 'CM' ? 'bg-system-neon text-black' : 'text-gray-500'}`}>CM</button>
                                <button onClick={() => setHeightUnit('FT')} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${heightUnit === 'FT' ? 'bg-system-neon text-black' : 'text-gray-500'}`}>FT</button>
                            </div>
                        </motion.div>
                        
                        {heightUnit === 'CM' ? (
                            <input 
                                type="number" 
                                value={formData.height} 
                                onChange={e => setFormData({...formData, height: Number(e.target.value)})} 
                                className="w-full bg-black border-b-2 border-gray-800 text-center text-6xl text-white outline-none focus:border-system-neon py-6 transition-colors"
                                placeholder="CM"
                            />
                        ) : (
                            <div className="flex gap-4 items-end">
                                <div className="relative flex-1">
                                    <input 
                                        type="number" 
                                        value={toFtIn(formData.height || 0).ft || ''} 
                                        onChange={e => updateHeightFromFtIn(e.target.value, toFtIn(formData.height || 0).inches)}
                                        className="w-full bg-black border-b-2 border-gray-800 text-center text-6xl text-white outline-none focus:border-system-neon py-6 transition-colors"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-0 bottom-8 text-gray-600 font-bold text-lg">FT</span>
                                </div>
                                <div className="relative flex-1">
                                    <input 
                                        type="number" 
                                        value={toFtIn(formData.height || 0).inches || ''} 
                                        onChange={e => updateHeightFromFtIn(toFtIn(formData.height || 0).ft, e.target.value)}
                                        className="w-full bg-black border-b-2 border-gray-800 text-center text-6xl text-white outline-none focus:border-system-neon py-6 transition-colors"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-0 bottom-8 text-gray-600 font-bold text-lg">IN</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-8"><button onClick={() => setStep(3)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button><button onClick={() => setStep(5)} className="bg-system-neon text-black px-10 py-3 rounded-full font-black text-xs shadow-[0_0_15px_#00d2ff] hover:bg-white transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button></div>
                    </motion.div>
                  )}

                  {/* Step 5: Current Weight */}
                  {step === 5 && (
                    <motion.div key="s5" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                        <motion.div variants={setupItemVariants} className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <Weight className="text-system-neon" size={24} />
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Current Mass</div>
                            </div>
                            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                                <button onClick={() => setWeightUnit('KG')} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${weightUnit === 'KG' ? 'bg-system-neon text-black' : 'text-gray-500'}`}>KG</button>
                                <button onClick={() => setWeightUnit('LBS')} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${weightUnit === 'LBS' ? 'bg-system-neon text-black' : 'text-gray-500'}`}>LBS</button>
                            </div>
                        </motion.div>

                        <div className="relative">
                            <input 
                                type="number" 
                                value={weightUnit === 'KG' ? formData.weight : (formData.weight ? toLbs(formData.weight) : '')} 
                                onChange={e => {
                                    const val = Number(e.target.value);
                                    setFormData({...formData, weight: weightUnit === 'KG' ? val : toKg(val)});
                                }}
                                className="w-full bg-black border-b-2 border-gray-800 text-center text-6xl text-white outline-none focus:border-system-neon py-6 transition-colors"
                                placeholder={weightUnit}
                            />
                            <span className="absolute right-12 bottom-8 text-gray-600 font-bold text-lg">{weightUnit}</span>
                        </div>

                        <div className="flex justify-between mt-8"><button onClick={() => setStep(4)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button><button onClick={() => setStep(6)} className="bg-system-neon text-black px-10 py-3 rounded-full font-black text-xs shadow-[0_0_15px_#00d2ff] hover:bg-white transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button></div>
                    </motion.div>
                  )}

                  {/* Step 6: Target Weight */}
                  {step === 6 && (
                    <motion.div key="s6" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                        <motion.div variants={setupItemVariants} className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <Target className="text-system-accent" size={24} />
                                <div className="text-xs text-system-accent uppercase tracking-widest font-black">Target Mass</div>
                            </div>
                            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                                <button onClick={() => setWeightUnit('KG')} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${weightUnit === 'KG' ? 'bg-system-accent text-white' : 'text-gray-500'}`}>KG</button>
                                <button onClick={() => setWeightUnit('LBS')} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${weightUnit === 'LBS' ? 'bg-system-accent text-white' : 'text-gray-500'}`}>LBS</button>
                            </div>
                        </motion.div>

                        <div className="relative">
                            <input 
                                type="number" 
                                value={weightUnit === 'KG' ? formData.targetWeight : (formData.targetWeight ? toLbs(formData.targetWeight) : '')} 
                                onChange={e => {
                                    const val = Number(e.target.value);
                                    setFormData({...formData, targetWeight: weightUnit === 'KG' ? val : toKg(val)});
                                }}
                                className="w-full bg-black border-b-2 border-system-accent text-center text-6xl text-white outline-none focus:shadow-[0_4px_15px_rgba(139,92,246,0.5)] py-6 transition-all font-black"
                                placeholder={weightUnit}
                            />
                            <span className="absolute right-12 bottom-8 text-gray-600 font-bold text-lg">{weightUnit}</span>
                        </div>

                        <div className="flex justify-between mt-8"><button onClick={() => setStep(5)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase"><ChevronLeft size={14}/> BACK</button><button onClick={() => setStep(7)} className="bg-system-accent text-white px-10 py-3 rounded-full font-black text-xs shadow-[0_0_20px_#8b5cf6] hover:bg-white hover:text-black transition-all uppercase flex items-center gap-2">NEXT <ChevronRight size={14}/></button></div>
                    </motion.div>
                  )}

                  {/* Step 7-13: Remaining Steps (Standard) */}
                  {step === 7 && (
                    <motion.div key="s7" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Energy Flux Levels</div>
                        <div className="grid gap-2">{['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE'].map(a => (<button key={a} onClick={() => { setFormData({...formData, activityLevel: a as any}); setStep(8); }} className="w-full py-4 border border-gray-800 rounded-xl font-black text-[10px] tracking-widest text-gray-300 hover:bg-white hover:text-black transition-all uppercase">{a}</button>))}</div>
                        <button onClick={() => setStep(6)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</button>
                    </motion.div>
                  )}
                  {step === 8 && (
                    <motion.div key="s8" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Primary Directive</div>
                        <div className="grid gap-2">{['LOSE_WEIGHT', 'BUILD_MUSCLE', 'RECOMP'].map(g => (<button key={g} onClick={() => { setFormData({...formData, goal: g as any}); setStep(9); }} className="w-full py-4 border border-gray-800 rounded-xl font-black text-[10px] tracking-widest text-gray-300 hover:bg-white hover:text-black transition-all uppercase">{g === 'RECOMP' ? 'LOSE WEIGHT + BUILD MUSCLE' : g.replace('_', ' ')}</button>))}</div>
                        <button onClick={() => setStep(7)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</button>
                    </motion.div>
                  )}
                  {step === 9 && (
                    <motion.div key="s9" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Resource Availability</div>
                        <div className="grid gap-2">{['GYM', 'HOME_DUMBBELLS', 'BODYWEIGHT'].map(eq => (<button key={eq} onClick={() => { setFormData({...formData, equipment: eq as any}); setStep(10); }} className="w-full py-4 border border-gray-800 rounded-xl font-black text-[10px] tracking-widest text-gray-300 hover:bg-white hover:text-black transition-all uppercase">{eq.replace('_', ' ')}</button>))}</div>
                        <button onClick={() => setStep(8)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</button>
                    </motion.div>
                  )}

                  {/* Step 10: Physical Baseline */}
                  {step === 10 && (
                    <motion.div key="s10" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                        <motion.div variants={setupItemVariants} className="flex items-center gap-3 mb-4">
                            <Dumbbell className="text-system-neon" size={24} />
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Physical Capacity</div>
                        </motion.div>
                        <p className="text-xs text-gray-400 mb-2">Max Push-ups in one uninterrupted set?</p>
                        <div className="grid gap-2">
                            {[
                                { label: "0 - 5 (Beginner)", val: 5 },
                                { label: "10 - 20 (Intermediate)", val: 15 },
                                { label: "30 - 50 (Advanced)", val: 40 },
                                { label: "50+ (Elite)", val: 60 }
                            ].map(opt => (
                                <button key={opt.val} onClick={() => { setBaselines({...baselines, pushups: opt.val}); setStep(11); }} className="w-full py-3 border border-gray-800 rounded-xl font-bold text-xs text-gray-300 hover:bg-system-neon hover:text-black transition-all uppercase">{opt.label}</button>
                            ))}
                        </div>
                        <button onClick={() => setStep(9)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</button>
                    </motion.div>
                  )}

                  {/* Step 11: Mental Focus Baseline */}
                  {step === 11 && (
                    <motion.div key="s11" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                        <motion.div variants={setupItemVariants} className="flex items-center gap-3 mb-4">
                            <Eye className="text-purple-500" size={24} />
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Focus Capacity</div>
                        </motion.div>
                        <p className="text-xs text-gray-400 mb-2">Avg. Deep Work duration before distraction?</p>
                        <div className="grid gap-2">
                            {[
                                { label: "< 15 Mins (Distracted)", val: 15 },
                                { label: "30 Mins (Average)", val: 30 },
                                { label: "60 Mins (Focused)", val: 60 },
                                { label: "2+ Hours (Deep State)", val: 120 }
                            ].map(opt => (
                                <button key={opt.val} onClick={() => { setBaselines({...baselines, focusDuration: opt.val}); setStep(12); }} className="w-full py-3 border border-gray-800 rounded-xl font-bold text-xs text-gray-300 hover:bg-purple-500 hover:text-white transition-all uppercase">{opt.label}</button>
                            ))}
                        </div>
                        <button onClick={() => setStep(10)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</button>
                    </motion.div>
                  )}

                  {/* Step 12: Knowledge/Reading Baseline */}
                  {step === 12 && (
                    <motion.div key="s12" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                        <motion.div variants={setupItemVariants} className="flex items-center gap-3 mb-4">
                            <BookOpen className="text-blue-500" size={24} />
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Intellect Baseline</div>
                        </motion.div>
                        <p className="text-xs text-gray-400 mb-2">Daily Reading/Learning Habit?</p>
                        <div className="grid gap-2">
                            {[
                                { label: "None / Rare", val: 0 },
                                { label: "15 Mins / Day", val: 15 },
                                { label: "30-60 Mins / Day", val: 45 },
                                { label: "Heavy Reader", val: 90 }
                            ].map(opt => (
                                <button key={opt.val} onClick={() => { setBaselines({...baselines, readingTime: opt.val}); setStep(13); }} className="w-full py-3 border border-gray-800 rounded-xl font-bold text-xs text-gray-300 hover:bg-blue-500 hover:text-white transition-all uppercase">{opt.label}</button>
                            ))}
                        </div>
                        <button onClick={() => setStep(11)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</button>
                    </motion.div>
                  )}

                  {/* Step 13: Sleep/Recovery */}
                  {step === 13 && (
                    <motion.div key="s13" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                        <motion.div variants={setupItemVariants} className="flex items-center gap-3 mb-4">
                            <Moon className="text-indigo-500" size={24} />
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Recovery Baseline</div>
                        </motion.div>
                        <p className="text-xs text-gray-400 mb-2">Average Sleep Duration?</p>
                        <div className="grid gap-2">
                            {[
                                { label: "< 5 Hours (Critical)", val: 4 },
                                { label: "5-6 Hours (Low)", val: 5.5 },
                                { label: "7-8 Hours (Optimal)", val: 7.5 },
                                { label: "9+ Hours (High)", val: 9 }
                            ].map(opt => (
                                <button key={opt.val} onClick={() => { setBaselines({...baselines, sleepAvg: opt.val}); setStep(14); }} className="w-full py-3 border border-gray-800 rounded-xl font-bold text-xs text-gray-300 hover:bg-indigo-500 hover:text-white transition-all uppercase">{opt.label}</button>
                            ))}
                        </div>
                        <button onClick={() => setStep(12)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-4"><ChevronLeft size={14}/> BACK</button>
                    </motion.div>
                  )}
                  
                  {/* Step 14: Confirmation */}
                  {step === 14 && (
                    <motion.div key="s14" variants={setupContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 text-center">
                        <motion.h3 variants={setupItemVariants} className="text-xl text-white font-black italic">CONFIRM CONFIGURATION</motion.h3>
                        <motion.div variants={setupItemVariants} className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 text-left space-y-3 font-mono text-xs">
                            <div className="flex justify-between"><span className="text-gray-500">PROFILE</span><span className="text-white">{formData.gender}, {formData.age}y</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">METRICS</span><span className="text-white">
                                {heightUnit === 'FT' ? `${toFtIn(formData.height || 0).ft}' ${toFtIn(formData.height || 0).inches}"` : `${formData.height}cm`} / {weightUnit === 'LBS' ? `${toLbs(formData.weight || 0)}lbs` : `${formData.weight}kg`}
                            </span></div>
                            <div className="flex justify-between"><span className="text-gray-500">BASELINE</span><span className="text-white">Pushups: {baselines.pushups}, Focus: {baselines.focusDuration}m</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">PROTOCOL</span><span className="text-white">{formData.equipment} / {formData.workoutSplit}</span></div>
                        </motion.div>
                        <motion.button 
                          variants={setupItemVariants}
                          onClick={handleFinish}
                          className="w-full bg-system-neon text-black font-black py-5 rounded-xl shadow-[0_0_30px_#00d2ff] hover:scale-105 transition-transform"
                        >
                            UPLOAD BIOMETRICS
                        </motion.button>
                        <motion.button variants={setupItemVariants} onClick={() => setStep(13)} className="text-gray-600 hover:text-white flex items-center gap-1 font-bold text-xs uppercase mt-6 mx-auto"><ChevronLeft size={14}/> BACK</motion.button>
                    </motion.div>
                  )}
              </AnimatePresence>
          </motion.div>
      </div>
  );
};

export default CalibrationFlow;
