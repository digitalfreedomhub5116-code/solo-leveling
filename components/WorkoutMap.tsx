
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Swords, Skull, Crown, Flag, Zap, X, Play, Activity, RotateCcw } from 'lucide-react';
import { WorkoutDay } from '../types';

interface WorkoutMapProps {
  currentWeight: number;
  targetWeight: number;
  workoutPlan: WorkoutDay[];
  completedDays: number;
  onStartDay: (dayIndex: number) => void;
}

const WorkoutMap: React.FC<WorkoutMapProps> = ({ 
  currentWeight, 
  targetWeight, 
  workoutPlan, 
  completedDays, 
  onStartDay 
}) => {
  const [selectedPreview, setSelectedPreview] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentDayRef = useRef<HTMLDivElement>(null);
  
  // Responsive Amplitude State
  const [amplitude, setAmplitude] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 80);

  useEffect(() => {
    const handleResize = () => {
        setAmplitude(window.innerWidth < 768 ? 40 : 80);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to current day
  useEffect(() => {
      if (currentDayRef.current && containerRef.current) {
          // Add a small timeout to ensure layout is ready
          setTimeout(() => {
              currentDayRef.current?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center' 
              });
          }, 300);
      }
  }, [completedDays]);

  // 1. Calculate Journey Length
  const weightDiff = Math.abs((currentWeight || 0) - (targetWeight || 0));
  // Ensure we are working with finite numbers
  const safeWeightDiff = Number.isFinite(weightDiff) ? weightDiff : 0;
  
  // Assumption: 0.5kg change per week roughly
  // CAP: Limit to 52 weeks (1 year) to prevent RangeError on huge numbers
  const estimatedWeeks = Math.min(52, Math.max(4, Math.ceil(safeWeightDiff / 0.5))); 
  const totalDays = Math.floor(estimatedWeeks * 7); // Ensure integer
  
  // 2. Generate Path Points
  const points = useMemo(() => {
    const pts = [];
    const verticalGap = 80; // Distance between nodes
    const frequency = 0.5;

    for (let i = 0; i <= totalDays; i++) {
      const y = i * verticalGap + 50; // Start with some padding
      // Sine wave pattern for x
      const xOffset = Math.sin(i * frequency) * amplitude;
      
      pts.push({ id: i, x: xOffset, y, isBoss: (i + 1) % 7 === 0, isFinal: i === totalDays });
    }
    return pts;
  }, [totalDays, amplitude]);

  // 3. Generate SVG Path String
  const svgPath = useMemo(() => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        
        // Bezier Control Points for smooth curves
        const cp1x = p1.x;
        const cp1y = p1.y + 50;
        const cp2x = p2.x;
        const cp2y = p2.y - 50;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  }, [points]);

  const mapHeight = points.length > 0 ? points[points.length - 1].y + 250 : 600;

  // Safe access for selected plan day
  const selectedDayData = selectedPreview !== null && workoutPlan ? workoutPlan[selectedPreview % workoutPlan.length] : null;

  return (
    <>
        <div className="relative w-full h-[500px] md:h-[600px] bg-black/40 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm group select-none shadow-inner transform-gpu">
            
            {/* Scrollable Container */}
            <div 
                ref={containerRef}
                className="absolute inset-0 overflow-y-auto scrollbar-hide flex justify-center overflow-x-hidden"
                style={{ scrollBehavior: 'smooth' }}
            >
                 {/* Map Content Wrapper centered horizontally */}
                 <div className="relative w-full max-w-md h-full" style={{ height: `${mapHeight}px` }}>
                    
                    {/* Background Grid - CRITICAL: pointer-events-none to prevent blocking clicks */}
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,210,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                    {/* SVG Path - CRITICAL: pointer-events-none */}
                    <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] md:w-[400px] h-full pointer-events-none z-0 overflow-visible">
                        <defs>
                            <linearGradient id="pathGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.8"/>
                                <stop offset={`${(completedDays / totalDays) * 100}%`} stopColor="#00d2ff" stopOpacity="0.8"/>
                                <stop offset={`${(completedDays / totalDays) * 100 + 5}%`} stopColor="#333" stopOpacity="0.3"/>
                                <stop offset="100%" stopColor="#333" stopOpacity="0.3"/>
                            </linearGradient>
                        </defs>
                        
                        <motion.path 
                            d={svgPath}
                            fill="none"
                            stroke="#00d2ff"
                            strokeWidth="12"
                            strokeOpacity="0.15"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            style={{ willChange: 'stroke-dashoffset' }}
                        />
                        
                        <motion.path 
                            d={svgPath}
                            fill="none"
                            stroke="url(#pathGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            style={{ willChange: 'stroke-dashoffset' }}
                        />
                    </svg>

                    {/* Nodes - CRITICAL: pointer-events-auto */}
                    {points.map((point, index) => {
                        const isCompleted = index < completedDays;
                        const isCurrent = index === completedDays;
                        const isLocked = index > completedDays;
                        const isSelected = selectedPreview === index;
                        const isDimmed = selectedPreview !== null && !isSelected;
                        
                        const zIndexClass = isSelected ? 'z-[60]' : isCurrent ? 'z-50' : point.isBoss ? 'z-40' : 'z-10';
                        
                        return (
                            <motion.div
                                key={point.id}
                                ref={isCurrent ? currentDayRef : null}
                                className={`absolute flex items-center justify-center cursor-pointer transition-all duration-300 ${zIndexClass} ${isDimmed ? 'opacity-30 blur-[1px]' : 'opacity-100'} pointer-events-auto`}
                                style={{ 
                                    left: `calc(50% + ${point.x}px)`, 
                                    top: point.y,
                                    x: '-50%',
                                    y: '-50%' 
                                }}
                                initial={false} 
                                animate={{ scale: isSelected ? 1.3 : 1 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPreview(index);
                                }}
                            >
                                <div className={`
                                    relative flex items-center justify-center rounded-full transition-all duration-300
                                    ${point.isBoss ? 'w-14 h-14 md:w-16 md:h-16' : 'w-10 h-10 md:w-12 md:h-12'}
                                    ${isCompleted ? 'bg-system-neon text-black shadow-[0_0_15px_rgba(0,210,255,0.5)]' : ''}
                                    ${isCurrent ? 'bg-black border-2 border-system-neon text-system-neon animate-pulse shadow-[0_0_20px_rgba(0,210,255,0.6)]' : ''}
                                    ${isLocked ? 'bg-gray-900 border border-gray-700 text-gray-600' : ''}
                                    ${isSelected ? 'ring-4 ring-white/50 shadow-[0_0_30px_white]' : ''}
                                `}>
                                    {point.isFinal ? (
                                        <Flag size={20} className="md:w-6 md:h-6" />
                                    ) : point.isBoss ? (
                                        isCompleted ? <Crown size={24} className="md:w-7 md:h-7" /> : <Skull size={24} className="md:w-7 md:h-7" />
                                    ) : (
                                        isCompleted ? <Check size={16} className="md:w-5 md:h-5" /> : 
                                        isCurrent ? <Swords size={16} className="md:w-5 md:h-5" /> :
                                        <Lock size={14} className="md:w-4 md:h-4" />
                                    )}

                                    {isCurrent && !selectedPreview && (
                                        <div className="absolute top-full mt-2 bg-system-neon text-black text-[9px] font-bold px-2 py-0.5 rounded pointer-events-none">
                                            CURRENT
                                        </div>
                                    )}
                                </div>

                                {isCurrent && !isSelected && (
                                    <div className="absolute inset-0 rounded-full border-2 border-system-neon opacity-50 animate-ping" />
                                )}
                            </motion.div>
                        );
                    })}

                 </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
            
            {completedDays >= totalDays && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full flex justify-center pointer-events-auto">
                     <button 
                        onClick={() => onStartDay(0)} 
                        className="bg-system-neon text-black font-bold px-6 py-3 rounded-full shadow-[0_0_20px_#00d2ff] hover:scale-105 transition-transform font-mono flex items-center gap-2"
                     >
                        <Zap size={18} /> NEW GAME+
                     </button>
                 </div>
            )}
        </div>

        {/* Preview Pop-up */}
        <AnimatePresence>
            {selectedPreview !== null && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 font-mono">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedPreview(null)} 
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative z-10 w-full max-w-[340px] bg-[#0a0a0a] border border-gray-700 rounded-xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]"
                    >
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-neon to-transparent opacity-50" />

                        <button 
                          onClick={() => setSelectedPreview(null)}
                          className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors p-1"
                        >
                          <X size={20} />
                        </button>

                        <h4 className="text-system-neon font-bold text-xs mb-4 border-b border-gray-800 pb-2 flex justify-between items-center tracking-widest shrink-0">
                            <span>{selectedDayData?.day || `DAY ${selectedPreview + 1}`} INTEL</span>
                            {selectedPreview > completedDays && <Lock size={14} className="text-gray-500" />}
                        </h4>
                        
                        <div className="overflow-y-auto scrollbar-hide flex-1">
                            <div className="text-white text-2xl font-black italic tracking-tighter mb-4 uppercase text-center drop-shadow-md">
                                {selectedDayData?.focus || "UNKNOWN"}
                            </div>
                            
                            <div className="space-y-4 mb-2 bg-gray-900/30 p-4 rounded-lg border border-gray-800/50">
                                <div className="flex justify-between text-xs font-mono text-gray-400">
                                    <span>REWARD</span>
                                    <span className="text-system-neon font-bold">{selectedPreview % 7 === 6 ? '0 XP' : '350 XP'}</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono text-gray-400">
                                    <span>STATUS</span>
                                    <span className={
                                        selectedPreview < completedDays ? "text-system-success font-bold" : 
                                        selectedPreview === completedDays ? "text-system-neon font-bold animate-pulse" :
                                        "text-gray-500"
                                    }>
                                        {selectedPreview < completedDays ? 'COMPLETED' : selectedPreview === completedDays ? 'READY' : 'LOCKED'}
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-gray-800/50">
                                     <div className="text-[10px] text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                                        <Activity size={12} className="text-system-neon" /> FULL PROTOCOL:
                                     </div>
                                     <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                                         {selectedDayData?.exercises.map((ex, i) => (
                                             <div key={i} className="text-xs text-gray-300 flex justify-between items-center p-2 rounded bg-black/40 border border-gray-800 hover:border-gray-700 transition-colors">
                                                 <div className="flex flex-col min-w-0 pr-2">
                                                    <span className="truncate font-bold text-white">{ex.name}</span>
                                                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">{ex.type}</span>
                                                 </div>
                                                 <span className="text-system-neon font-mono font-bold whitespace-nowrap bg-system-neon/10 px-1.5 py-0.5 rounded border border-system-neon/20 text-[10px] shrink-0">
                                                    {ex.sets} x {ex.reps}
                                                 </span>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer Action */}
                        <div className="shrink-0 mt-4">
                             {/* Logic: 
                                 - Current Day: "START MISSION"
                                 - Completed Day: "START NOW (REPLAY)"
                                 - Future Day: Locked
                             */}
                             {selectedPreview <= completedDays ? (
                                 <button 
                                    onClick={() => {
                                        onStartDay(selectedPreview);
                                        setSelectedPreview(null);
                                    }}
                                    className={`w-full font-bold py-3.5 rounded-lg shadow-[0_0_20px_rgba(0,210,255,0.2)] hover:bg-white transition-all flex items-center justify-center gap-2 group text-xs uppercase tracking-widest ${
                                        selectedPreview === completedDays 
                                        ? 'bg-system-neon text-black hover:shadow-[0_0_30px_rgba(0,210,255,0.6)]' 
                                        : 'bg-gray-800 text-white border border-gray-700 hover:text-black'
                                    }`}
                                 >
                                    {selectedPreview === completedDays ? (
                                        <>
                                            <Play size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" /> 
                                            START MISSION
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw size={16} className="group-hover:-rotate-180 transition-transform" />
                                            START NOW (REPLAY)
                                        </>
                                    )}
                                 </button>
                             ) : (
                                 <div className="text-[10px] text-gray-600 font-mono text-center border-t border-gray-800 pt-3 flex items-center justify-center gap-2 font-bold tracking-widest">
                                    <Lock size={14} /> LOCKED CONTENT
                                 </div>
                             )}
                        </div>

                    </motion.div>
                </div>,
                document.body
            )}
        </AnimatePresence>
    </>
  );
};

export default WorkoutMap;
