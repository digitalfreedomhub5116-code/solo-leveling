
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Swords, Skull, Crown, Flag, Zap, X, Play, Activity, XCircle } from 'lucide-react';
import { WorkoutDay, ActivityLog } from '../types';

interface WorkoutMapProps {
  currentWeight: number;
  targetWeight: number;
  workoutPlan: WorkoutDay[];
  startDate: number;
  logs: ActivityLog[];
  onStartDay: (dayIndex: number) => void;
}

const WorkoutMap: React.FC<WorkoutMapProps> = ({ 
  currentWeight, 
  targetWeight, 
  workoutPlan, 
  startDate,
  logs,
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

  // Calculate current progress in DAYS based on Time
  const currentDayIndex = useMemo(() => {
      const now = Date.now();
      const diffTime = Math.max(0, now - startDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays;
  }, [startDate]);

  // Check completions map
  // Map Key: day index (0, 1, 2...) -> Value: boolean
  const completionMap = useMemo(() => {
      const map: Record<number, boolean> = {};
      const workoutLogs = logs.filter(l => l.type === 'WORKOUT');
      
      workoutLogs.forEach(log => {
          // Calculate which relative day this log belongs to
          const logDiff = log.timestamp - startDate;
          const dayIndex = Math.floor(logDiff / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0) {
              map[dayIndex] = true;
          }
      });
      return map;
  }, [logs, startDate]);

  // Auto-scroll to current day
  useEffect(() => {
      if (currentDayRef.current && containerRef.current) {
          setTimeout(() => {
              currentDayRef.current?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center' 
              });
          }, 500);
      }
  }, [currentDayIndex]);

  // 1. Calculate Journey Length
  const weightDiff = Math.abs((currentWeight || 0) - (targetWeight || 0));
  const safeWeightDiff = Number.isFinite(weightDiff) ? weightDiff : 0;
  
  // Cap weeks to prevent massive lists
  const estimatedWeeks = Math.min(52, Math.max(4, Math.ceil(safeWeightDiff / 0.5))); 
  const totalDays = Math.floor(estimatedWeeks * 7); 
  
  // 2. Generate Path Points
  const points = useMemo(() => {
    const pts = [];
    const verticalGap = 160; 
    const frequency = 0.5;

    for (let i = 0; i <= totalDays; i++) {
      const y = i * verticalGap + 100; 
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
        
        const cp1x = p1.x;
        const cp1y = p1.y + 80;
        const cp2x = p2.x;
        const cp2y = p2.y - 80;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  }, [points]);

  const mapHeight = points.length > 0 ? points[points.length - 1].y + 300 : 600;

  // Safe access for selected plan day (Preview Modal)
  const selectedDayData = selectedPreview !== null && workoutPlan ? workoutPlan[selectedPreview % workoutPlan.length] : null;

  return (
    <>
        <div className="relative w-full h-[600px] bg-black/40 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm group select-none shadow-inner transform-gpu">
            
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 w-full p-4 z-20 pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
                <h3 className="text-white font-mono font-bold tracking-widest flex items-center gap-2">
                    <Activity size={16} className="text-system-neon" /> MISSION MAP
                </h3>
            </div>

            {/* Scrollable Container */}
            <div 
                ref={containerRef}
                className="absolute inset-0 overflow-y-auto scrollbar-hide flex justify-center overflow-x-hidden"
                style={{ scrollBehavior: 'smooth' }}
            >
                 {/* Map Content Wrapper centered horizontally */}
                 <div className="relative w-full max-w-md h-full" style={{ height: `${mapHeight}px` }}>
                    
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,210,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                    {/* SVG Path */}
                    <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] md:w-[400px] h-full pointer-events-none z-0 overflow-visible">
                        <defs>
                            <linearGradient id="pathGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.8"/>
                                {/* Fill based on Current Day Index relative to Total Days */}
                                <stop offset={`${(currentDayIndex / totalDays) * 100}%`} stopColor="#00d2ff" stopOpacity="0.8"/>
                                <stop offset={`${(currentDayIndex / totalDays) * 100 + 5}%`} stopColor="#333" stopOpacity="0.3"/>
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
                        />
                    </svg>

                    {/* Nodes */}
                    {points.map((point, index) => {
                        const isPast = index < currentDayIndex;
                        const isCurrent = index === currentDayIndex;
                        const isFuture = index > currentDayIndex;
                        
                        // Status Logic
                        const isCompleted = completionMap[index];
                        const isSkipped = isPast && !isCompleted;
                        
                        const isSelected = selectedPreview === index;
                        
                        // Get data for this node
                        const nodeData = workoutPlan[index % workoutPlan.length];
                        
                        return (
                            <motion.div
                                key={point.id}
                                ref={isCurrent ? currentDayRef : null}
                                className={`absolute flex flex-col items-center justify-center transition-all duration-300 pointer-events-auto ${isCurrent ? 'z-50' : 'z-10'}`}
                                style={{ 
                                    left: `calc(50% + ${point.x}px)`, 
                                    top: point.y,
                                    x: '-50%',
                                    y: '-50%' 
                                }}
                                initial={false} 
                                animate={{ scale: isSelected ? 1.1 : 1 }}
                            >
                                {/* Node Icon */}
                                <div 
                                    className={`
                                        relative flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer border-4
                                        ${point.isBoss ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12 md:w-14 md:h-14'}
                                        ${isCompleted ? 'bg-system-neon border-system-neon text-black shadow-[0_0_20px_rgba(0,210,255,0.6)]' : ''}
                                        ${isSkipped ? 'bg-black border-red-600 text-red-600' : ''}
                                        ${isCurrent ? 'bg-black border-system-neon text-system-neon shadow-[0_0_40px_rgba(0,210,255,0.5)] animate-pulse' : ''}
                                        ${isFuture ? 'bg-gray-900 border-gray-800 text-gray-600' : ''}
                                        ${isSelected ? 'ring-4 ring-white/50' : ''}
                                        hover:scale-110 active:scale-95
                                    `}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Active node has its own card, only show preview modal for others
                                        if (!isCurrent) setSelectedPreview(index);
                                    }}
                                >
                                    {point.isFinal ? (
                                        <Flag size={24} className="md:w-8 md:h-8" />
                                    ) : point.isBoss ? (
                                        isCompleted ? <Crown size={32} className="md:w-10 md:h-10" /> : <Skull size={32} className="md:w-10 md:h-10" />
                                    ) : (
                                        isCompleted ? <Check size={20} className="md:w-6 md:h-6" /> : 
                                        isSkipped ? <XCircle size={20} className="md:w-6 md:h-6" /> :
                                        isCurrent ? <Swords size={24} className="md:w-8 md:h-8" /> :
                                        <Lock size={16} className="md:w-5 md:h-5" />
                                    )}
                                </div>

                                {/* Active Node Glow Ring */}
                                {isCurrent && (
                                    <div className="absolute top-0 left-0 w-full h-full -z-10 rounded-full border-2 border-system-neon opacity-50 animate-ping" />
                                )}

                                {/* --- ACTIVE DAY CARD (Mission Start) --- */}
                                {isCurrent && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="absolute top-full mt-6 bg-[#0a0a0a]/90 backdrop-blur-md border border-system-neon/50 p-4 rounded-xl shadow-[0_0_30px_rgba(0,210,255,0.2)] w-48 flex flex-col items-center text-center z-50 group-hover:border-system-neon transition-colors"
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-system-neon/50" />
                                        
                                        <div className="text-[10px] font-mono text-gray-400 tracking-widest uppercase mb-1">
                                            TODAY: DAY {index + 1}
                                        </div>
                                        <div className="text-xl font-black text-white italic tracking-tighter uppercase mb-4 leading-none">
                                            {nodeData?.focus || "TRAINING"}
                                        </div>
                                        
                                        <div className="w-full text-left mb-4 bg-black/40 p-2 rounded border border-white/10 max-h-[100px] overflow-y-auto custom-scrollbar">
                                            {nodeData?.exercises.map((ex, i) => (
                                                <div key={i} className="text-[9px] text-gray-400 truncate border-b border-gray-800 last:border-0 pb-1 mb-1">
                                                    • {ex.name}
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStartDay(index);
                                            }}
                                            className="w-full bg-system-neon text-black font-bold text-xs py-3 rounded uppercase tracking-wider hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,210,255,0.4)] flex items-center justify-center gap-2"
                                        >
                                            <Play size={12} fill="currentColor" /> START MISSION
                                        </button>
                                    </motion.div>
                                )}

                                {/* Completed/Skipped Labels */}
                                {!isCurrent && !selectedPreview && (
                                    <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        {isSkipped && <div className="text-[9px] text-red-500 font-mono bg-black/80 px-2 py-1 rounded border border-red-900">SKIPPED</div>}
                                        {isCompleted && <div className="text-[9px] text-system-neon font-mono bg-black/80 px-2 py-1 rounded border border-system-neon/30">COMPLETE</div>}
                                        {isFuture && <div className="text-[9px] text-gray-500 font-mono bg-black/80 px-2 py-1 rounded border border-gray-800">LOCKED</div>}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}

                 </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
            
            {/* New Game+ if finished (Current day > total days) */}
            {currentDayIndex > totalDays && (
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full flex justify-center pointer-events-auto">
                     <button 
                        onClick={() => onStartDay(0)} 
                        className="bg-system-neon text-black font-bold px-8 py-4 rounded-full shadow-[0_0_30px_#00d2ff] hover:scale-105 transition-transform font-mono flex items-center gap-2 text-sm"
                     >
                        <Zap size={20} /> NEW GAME+
                     </button>
                 </div>
            )}
        </div>

        {/* Universal Preview Modal (Works for Locked, Completed, Skipped) */}
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
                        className="relative z-10 w-full max-w-[320px] bg-[#0a0a0a] border border-gray-700 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center"
                    >
                        <button 
                          onClick={() => setSelectedPreview(null)}
                          className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors"
                        >
                          <X size={20} />
                        </button>

                        <div className="mb-6 relative">
                            {/* Icon Based on State */}
                            <div className={`w-16 h-16 rounded-full border-2 bg-black flex items-center justify-center relative z-10 
                                ${selectedPreview < currentDayIndex 
                                    ? (completionMap[selectedPreview] ? 'border-system-success' : 'border-red-600') 
                                    : 'border-gray-800'}`
                            }>
                                {selectedPreview < currentDayIndex ? (
                                    completionMap[selectedPreview] 
                                    ? <Check size={28} className="text-system-success" /> 
                                    : <XCircle size={28} className="text-red-600" />
                                ) : (
                                    <Lock size={28} className="text-gray-500" />
                                )}
                            </div>
                        </div>

                        <div className="w-full border-t border-gray-800 pt-6 relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0a0a0a] px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                DAY {selectedPreview + 1}
                            </div>

                            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-6 mt-2">
                                {selectedDayData?.focus || "REST"}
                            </h2>

                            {/* Full Intel Display: Always show exercise names */}
                            <div className="w-full bg-gray-900/30 rounded-lg border border-gray-800 p-3 mb-6 text-left max-h-[150px] overflow-y-auto custom-scrollbar">
                                <div className="text-[9px] text-gray-500 uppercase font-bold mb-2 tracking-wider sticky top-0 bg-[#0d0d0d]/90 backdrop-blur-sm pb-1 border-b border-gray-800">Protocol Intel</div>
                                <div className="space-y-1.5">
                                    {selectedDayData?.exercises.map((ex, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] text-gray-300 border-b border-gray-800/30 pb-1 last:border-0">
                                            <span className="truncate pr-2 font-medium">{ex.name}</span>
                                            <span className="text-gray-500 whitespace-nowrap bg-gray-800 px-1.5 rounded">{ex.sets}x{ex.reps}</span>
                                        </div>
                                    )) || <div className="text-gray-600 text-xs italic">No intel available.</div>}
                                </div>
                            </div>

                            {completionMap[selectedPreview] ? (
                                <button 
                                    onClick={() => {
                                        onStartDay(selectedPreview);
                                        setSelectedPreview(null);
                                    }}
                                    className="w-full py-4 bg-white text-black font-black text-sm uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Play size={16} fill="currentColor" />
                                    REPLAY MISSION
                                </button>
                            ) : (
                                <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">
                                    {selectedPreview < currentDayIndex ? "MISSED OPPORTUNITY" : "FUTURE PROTOCOL"}
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
