
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, Dumbbell, Zap, Activity, HeartPulse, ChevronRight } from 'lucide-react';
import { WorkoutDay, Exercise } from '../types';

interface WorkoutOverviewProps {
  plan: WorkoutDay;
  onStart: (modifiedPlan: WorkoutDay, isCardioActive: boolean) => void;
  onCancel: () => void;
}

// --- HOLOGRAPHIC ANATOMY MAP ---
const HolographicBody: React.FC<{ focus: string; isCardio: boolean }> = ({ focus, isCardio }) => {
  // Simple SVG paths for body parts
  const paths = {
    head: "M100 30 C100 30 115 30 115 45 C115 60 100 65 100 65 C100 65 85 60 85 45 C85 30 100 30 100 30",
    torso: "M85 70 L115 70 L125 140 L75 140 Z",
    arms: "M75 75 L50 110 M125 75 L150 110",
    legs: "M75 140 L65 220 M125 140 L135 220",
  };

  const isUpper = ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'UPPER'].some(k => focus.includes(k));
  const isLower = ['LEGS', 'LOWER', 'SQUAT'].some(k => focus.includes(k));
  const isCore = ['ABS', 'CORE'].some(k => focus.includes(k));

  const getColor = (isActive: boolean) => isActive ? "#00d2ff" : "#1f2937";
  const getOpacity = (isActive: boolean) => isActive ? 0.8 : 0.3;

  return (
    <div className="relative w-48 h-64 flex items-center justify-center">
      {/* Scanner Effect */}
      <motion.div 
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute w-full h-[2px] bg-system-neon/50 shadow-[0_0_15px_#00d2ff] z-10"
      />
      
      <svg viewBox="0 0 200 250" className="w-full h-full drop-shadow-[0_0_10px_rgba(0,210,255,0.3)]">
        {/* Skeleton/Body Base */}
        <g strokeWidth="2" stroke="currentColor" fill="none" className="text-gray-800">
           <path d={paths.head} />
           <path d={paths.torso} />
           <path d={paths.arms} />
           <path d={paths.legs} />
        </g>

        {/* Muscle Fills */}
        <motion.path 
            d={paths.torso} 
            fill={getColor(isUpper || isCore)} 
            initial={{ opacity: 0 }} animate={{ opacity: getOpacity(isUpper || isCore) }}
        />
        <motion.path 
            d={paths.arms} 
            stroke={getColor(isUpper)} 
            strokeWidth="6"
            initial={{ opacity: 0 }} animate={{ opacity: getOpacity(isUpper) }}
        />
        <motion.path 
            d={paths.legs} 
            stroke={isCardio ? "#a855f7" : getColor(isLower)} 
            strokeWidth="6"
            initial={{ opacity: 0 }} animate={{ opacity: getOpacity(isLower || isCardio) }}
        />

        {/* Cardio Heart Overlay */}
        {isCardio && (
            <motion.g 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="text-system-accent"
            >
                <path d="M100 85 l-10 -10 a5 5 0 0 1 7 -7 l3 3 l3 -3 a5 5 0 0 1 7 7 z" fill="#a855f7" className="animate-pulse" />
                <circle cx="100" cy="85" r="15" fill="none" stroke="#a855f7" strokeWidth="1" className="animate-ping" />
            </motion.g>
        )}
      </svg>
    </div>
  );
};

// --- ANIMATED EXERCISE ROW ---
const ExerciseRow: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
    return (
        <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4 p-3 bg-gray-900/50 border border-gray-800 rounded-lg group hover:border-system-neon/30 transition-colors"
        >
            {/* Lottie Placeholder (Holographic Box) */}
            <div className="w-12 h-12 bg-black border border-gray-700 rounded flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,210,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />
                {exercise.type === 'CARDIO' ? <HeartPulse size={18} className="text-system-accent" /> : <Dumbbell size={18} className="text-system-neon" />}
            </div>

            <div className="flex-1">
                <h4 className="text-sm font-bold text-white font-mono group-hover:text-system-neon transition-colors">{exercise.name}</h4>
                <span className="text-[10px] text-gray-500 font-mono tracking-wider">{exercise.type} CLASS</span>
            </div>

            <div className="text-right font-mono">
                <div className="text-xs font-bold text-white">{exercise.sets} SETS</div>
                <div className="text-[10px] text-system-neon">{exercise.reps}</div>
            </div>
        </motion.div>
    );
};

const WorkoutOverview: React.FC<WorkoutOverviewProps> = ({ plan, onStart, onCancel }) => {
  const [isCardio, setIsCardio] = useState(false);

  // Stats Logic
  const baseStats = useMemo(() => {
      const sets = plan.exercises.reduce((acc, curr) => acc + curr.sets, 0);
      const time = plan.totalDuration || 45;
      const cals = Math.floor(time * 6.5); // Approx burn rate
      return { sets, time, cals };
  }, [plan]);

  const activeStats = {
      time: isCardio ? baseStats.time + 15 : baseStats.time,
      cals: isCardio ? Math.floor(baseStats.cals * 1.3) : baseStats.cals,
      sets: isCardio ? baseStats.sets + 3 : baseStats.sets
  };

  const handleStart = () => {
      let modifiedPlan = { ...plan };
      if (isCardio) {
          const cardioQuest: Exercise = {
              name: "Shadow Sprint (HIIT)",
              sets: 3,
              reps: "45s On / 15s Off",
              duration: 15,
              completed: false,
              type: "CARDIO",
              notes: "Added via Protocol"
          };
          modifiedPlan.exercises = [...modifiedPlan.exercises, cardioQuest];
      }
      onStart(modifiedPlan, isCardio);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-[#050505] border border-system-border rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]"
        >
            {/* Header */}
            <div className="p-6 border-b border-gray-800 bg-gray-900/20 flex justify-between items-start">
                <div>
                    <div className="text-[10px] text-system-neon font-mono tracking-[0.3em] uppercase mb-1">Dungeon Gate</div>
                    <h2 className="text-2xl md:text-3xl font-black italic text-white tracking-tighter uppercase">{plan.focus} INSTANCE</h2>
                </div>
                <button onClick={onCancel} className="text-gray-500 hover:text-white font-mono text-xs">[ ESCAPE ]</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* LEFT: MAP & STATS */}
                    <div className="flex-1 space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-900/50 border border-gray-800 p-3 rounded text-center">
                                <Flame className={`w-5 h-5 mx-auto mb-1 ${isCardio ? 'text-system-accent animate-pulse' : 'text-gray-400'}`} />
                                <div className="text-lg font-bold text-white">{activeStats.cals}</div>
                                <div className="text-[8px] text-gray-500 font-mono uppercase">KCAL EST.</div>
                            </div>
                            <div className="bg-gray-900/50 border border-gray-800 p-3 rounded text-center">
                                <Clock className={`w-5 h-5 mx-auto mb-1 ${isCardio ? 'text-system-accent' : 'text-gray-400'}`} />
                                <div className="text-lg font-bold text-white">{activeStats.time}</div>
                                <div className="text-[8px] text-gray-500 font-mono uppercase">MINUTES</div>
                            </div>
                            <div className="bg-gray-900/50 border border-gray-800 p-3 rounded text-center">
                                <Activity className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                                <div className="text-lg font-bold text-white">{activeStats.sets}</div>
                                <div className="text-[8px] text-gray-500 font-mono uppercase">SETS</div>
                            </div>
                        </div>

                        {/* Visual Map */}
                        <div className="bg-black border border-gray-800 rounded-xl relative overflow-hidden flex flex-col items-center py-4">
                            <div className="absolute top-2 left-3 text-[10px] text-gray-600 font-mono">TARGET SCAN</div>
                            <HolographicBody focus={plan.focus} isCardio={isCardio} />
                            
                            {/* Cardio Toggle */}
                            <div className="absolute bottom-4 w-[90%] bg-gray-900/80 backdrop-blur rounded-lg p-3 border border-gray-700 flex justify-between items-center">
                                <div>
                                    <div className={`text-xs font-bold font-mono ${isCardio ? 'text-system-accent' : 'text-gray-400'}`}>CARDIO PROTOCOL</div>
                                    <div className="text-[9px] text-gray-500">+30% BURN // +15 MIN</div>
                                </div>
                                <button 
                                    onClick={() => setIsCardio(!isCardio)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isCardio ? 'bg-system-accent' : 'bg-gray-700'}`}
                                >
                                    <motion.div 
                                        animate={{ x: isCardio ? 24 : 0 }}
                                        className="w-4 h-4 bg-white rounded-full shadow-md"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: ROSTER */}
                    <div className="flex-1">
                        <h3 className="text-xs text-gray-500 font-mono mb-4 uppercase tracking-widest border-b border-gray-800 pb-2">Instance Enemies (Exercises)</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {plan.exercises.map((ex, i) => (
                                <ExerciseRow key={i} exercise={ex} />
                            ))}
                            {isCardio && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <ExerciseRow exercise={{
                                        name: "Shadow Sprint (HIIT)",
                                        sets: 3,
                                        reps: "45s Intervals",
                                        duration: 15,
                                        completed: false,
                                        type: "CARDIO"
                                    }} />
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-6 bg-gray-900/50 border-t border-gray-800">
                <button 
                    onClick={handleStart}
                    className="w-full h-14 bg-system-neon text-black text-lg font-black italic tracking-tighter rounded clip-path-slant hover:bg-white transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,210,255,0.4)] group"
                >
                    <Zap size={24} className="group-hover:rotate-12 transition-transform" />
                    ENTER DUNGEON
                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    </div>
  );
};

export default WorkoutOverview;
