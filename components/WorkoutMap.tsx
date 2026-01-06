
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Swords, Skull, Crown, Flag, Zap, X, Play } from 'lucide-react';
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
  
  // Responsive Amplitude State
  const [amplitude, setAmplitude] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 80);

  useEffect(() => {
    const handleResize = () => {
        setAmplitude(window.innerWidth < 768 ? 40 : 80);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Calculate Journey Length
  const weightDiff = Math.abs(currentWeight - targetWeight);
  // Assumption: 0.5kg change per week roughly
  const estimatedWeeks = Math.max(4, Math.ceil(weightDiff / 0.5)); 
  const totalDays = estimatedWeeks * 7;
  
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

  const mapHeight = points[points.length - 1].y + 250; // Increased padding at bottom for tooltip space

  return (
    <>
        <div className="relative w-full h-[500px] md:h-[600px] bg-black/40 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm group select-none">
            
            {/* Scrollable Container */}
            <div 
                ref={containerRef}
                className="absolute inset-0 overflow-y-auto scrollbar-hide flex justify-center overflow-x-hidden"
                style={{ scrollBehavior: 'smooth' }}
            >
                 {/* Map Content Wrapper centered horizontally */}
                 <div className="relative w-full max-w-md h-full" style={{ height: `${mapHeight}px` }}>
                    
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,210,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

                    {/* SVG Path */}
                    <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] md:w-[400px] h-full pointer-events-none z-0 overflow-visible">
                        <defs>
                            <linearGradient id="pathGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.8"/>
                                <stop offset={`${(completedDays / totalDays) * 100}%`} stopColor="#00d2ff" stopOpacity="0.8"/>
                                <stop offset={`${(completedDays / totalDays) * 100 + 5}%`} stopColor="#333" stopOpacity="0.3"/>
                                <stop offset="100%" stopColor="#333" stopOpacity="0.3"/>
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <motion.path 
                            d={svgPath}
                            fill="none"
                            stroke="url(#pathGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            filter="url(#glow)"
                        />
                    </svg>

                    {/* Nodes */}
                    {points.map((point, index) => {
                        const isCompleted = index < completedDays;
                        const isCurrent = index === completedDays;
                        const isLocked = index > completedDays;
                        
                        // Map generic day index to the 7-day workout plan cycle
                        const planDay = workoutPlan[index % 7] || { day: `DAY ${index}`, focus: 'UNKNOWN', exercises: [] };

                        // Critical Z-Index Fix: Ensure current day is always on top
                        const zIndexClass = isCurrent ? 'z-50' : point.isBoss ? 'z-40' : 'z-10';
                        
                        return (
                            <motion.div
                                key={point.id}
                                className={`absolute flex items-center justify-center cursor-pointer ${zIndexClass}`}
                                style={{ 
                                    left: `calc(50% + ${point.x}px)`, 
                                    top: point.y,
                                    x: '-50%',
                                    y: '-50%' 
                                }}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedPreview(index)}
                            >
                                {/* Visual Representation */}
                                <div className={`
                                    relative flex items-center justify-center rounded-full transition-all duration-300
                                    ${point.isBoss ? 'w-14 h-14 md:w-16 md:h-16' : 'w-10 h-10 md:w-12 md:h-12'}
                                    ${isCompleted ? 'bg-system-neon text-black shadow-[0_0_20px_#00d2ff]' : ''}
                                    ${isCurrent ? 'bg-black border-2 border-system-neon text-system-neon animate-pulse shadow-[0_0_30px_#00d2ff]' : ''}
                                    ${isLocked ? 'bg-gray-900 border border-gray-700 text-gray-600' : ''}
                                `}>
                                    {/* Icons */}
                                    {point.isFinal ? (
                                        <Flag size={20} className="md:w-6 md:h-6" />
                                    ) : point.isBoss ? (
                                        isCompleted ? <Crown size={24} className="md:w-7 md:h-7" /> : <Skull size={24} className="md:w-7 md:h-7" />
                                    ) : (
                                        isCompleted ? <Check size={16} className="md:w-5 md:h-5" /> : 
                                        isCurrent ? <Swords size={16} className="md:w-5 md:h-5" /> :
                                        <Lock size={14} className="md:w-4 md:h-4" />
                                    )}

                                    {/* Label for Current/Boss */}
                                    {(isCurrent || point.isBoss) && (
                                        <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-[180px] pointer-events-none flex justify-center">
                                            {/* Enhanced Tooltip - pointer-events-auto enabled for button interaction */}
                                            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-[0_0_30px_rgba(0,0,0,0.9)] flex flex-col items-center gap-1.5 relative pointer-events-auto z-50 w-full">
                                                 <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0a0a0a] border-t border-l border-gray-800 rotate-45" />
                                                 
                                                 {point.isFinal ? (
                                                     <span className="text-system-neon font-bold text-[10px] tracking-widest text-center">TARGET REACHED</span>
                                                 ) : (
                                                     <>
                                                        <div className="flex items-center gap-2 border-b border-gray-800 pb-1 w-full justify-center">
                                                            <span className={`text-[9px] font-bold tracking-widest ${point.isBoss ? 'text-red-500' : 'text-gray-400'}`}>
                                                                {point.isBoss ? 'BOSS BATTLE' : `DAY ${index + 1}`}
                                                            </span>
                                                            {isCurrent && <span className="w-1.5 h-1.5 bg-system-neon rounded-full animate-pulse shadow-[0_0_5px_#00d2ff]" />}
                                                        </div>
                                                        
                                                        <div className="text-sm font-black text-white italic tracking-tighter uppercase text-center px-1 leading-tight">
                                                            {planDay.focus}
                                                        </div>
                                                        
                                                        <div className="text-[9px] text-system-neon font-mono font-bold bg-system-neon/10 px-2 py-0.5 rounded border border-system-neon/20 uppercase tracking-wider">
                                                            {planDay.day}
                                                        </div>

                                                        {isCurrent && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onStartDay(index);
                                                                }}
                                                                className="mt-2 w-full bg-system-neon text-black text-[10px] font-bold py-2 px-4 rounded flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:bg-white transition-colors"
                                                            >
                                                                <Play size={10} fill="black" /> 
                                                                <span className="tracking-wider">START</span>
                                                            </motion.button>
                                                        )}
                                                     </>
                                                 )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Connecting Pulse for Current */}
                                {isCurrent && (
                                    <div className="absolute inset-0 rounded-full border-2 border-system-neon opacity-50 animate-ping" />
                                )}
                            </motion.div>
                        );
                    })}

                 </div>
            </div>

            {/* Scroll Indicator Overlay (Fade at bottom) */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
            
            {/* Restart Journey Button (Only visible at end) */}
            {completedDays >= totalDays && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full flex justify-center">
                     <button 
                        onClick={() => onStartDay(0)} 
                        className="bg-system-neon text-black font-bold px-6 py-3 rounded-full shadow-[0_0_20px_#00d2ff] hover:scale-105 transition-transform font-mono flex items-center gap-2"
                     >
                        <Zap size={18} /> NEW GAME+
                     </button>
                 </div>
            )}
        </div>

        {/* Preview Pop-up (Responsive Modal via Portal) */}
        <AnimatePresence>
            {selectedPreview !== null && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 font-mono">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedPreview(null)} 
                    />
                    
                    {/* Centered Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative z-10 w-full max-w-[320px] bg-[#0a0a0a] border border-gray-700 rounded-xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[80vh]"
                    >
                         {/* Decorative Header Line */}
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-neon to-transparent opacity-50" />

                        <button 
                          onClick={() => setSelectedPreview(null)}
                          className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
                        >
                          <X size={20} />
                        </button>

                        <h4 className="text-system-neon font-bold text-xs mb-4 border-b border-gray-800 pb-2 flex justify-between items-center tracking-widest shrink-0">
                            <span>DAY {selectedPreview + 1} INTEL</span>
                            {selectedPreview > completedDays && <Lock size={14} className="text-gray-500" />}
                        </h4>
                        
                        <div className="overflow-y-auto scrollbar-hide">
                            <div className="text-white text-2xl font-black italic tracking-tighter mb-4 uppercase text-center">
                                {workoutPlan[selectedPreview % 7]?.focus || "UNKNOWN"}
                            </div>
                            
                            <div className="space-y-3 mb-6 bg-gray-900/30 p-4 rounded-lg border border-gray-800/50">
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

                                {/* Exercise List Preview */}
                                <div className="mt-4 pt-3 border-t border-gray-800/50">
                                     <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">PROTOCOL:</div>
                                     <div className="space-y-1">
                                         {workoutPlan[selectedPreview % 7]?.exercises.slice(0, 3).map((ex, i) => (
                                             <div key={i} className="text-xs text-gray-300 flex justify-between">
                                                 <span className="truncate pr-2">{ex.name}</span>
                                                 <span className="text-gray-600 whitespace-nowrap">{ex.sets}x{ex.reps}</span>
                                             </div>
                                         ))}
                                         {(workoutPlan[selectedPreview % 7]?.exercises.length || 0) > 3 && (
                                             <div className="text-[10px] text-gray-600 italic mt-1 text-center">
                                                 + {(workoutPlan[selectedPreview % 7]?.exercises.length || 0) - 3} MORE
                                             </div>
                                         )}
                                     </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer Action */}
                        <div className="shrink-0 mt-2">
                             {selectedPreview === completedDays ? (
                                 <button 
                                    onClick={() => {
                                        onStartDay(selectedPreview);
                                        setSelectedPreview(null);
                                    }}
                                    className="w-full bg-system-neon text-black font-bold py-3 rounded shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:bg-white transition-all flex items-center justify-center gap-2 group"
                                 >
                                    <Play size={18} fill="black" className="group-hover:scale-110 transition-transform" /> 
                                    START MISSION
                                 </button>
                             ) : selectedPreview < completedDays ? (
                                 <div className="text-[10px] text-system-success font-mono text-center border-t border-gray-800 pt-3 flex items-center justify-center gap-2">
                                    <Check size={12} /> MISSION ACCOMPLISHED
                                 </div>
                             ) : (
                                 <div className="text-[10px] text-gray-600 font-mono text-center border-t border-gray-800 pt-3 flex items-center justify-center gap-2">
                                    <Lock size={12} /> LOCKED
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
