
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, AlertOctagon, Check, Activity, Film, ChevronRight, Timer as TimerIcon } from 'lucide-react';
import { WorkoutDay } from '../types';
import { SpeechService } from '../utils/speechService';
import { playSystemSoundEffect } from '../utils/soundEngine';
import { useSystem } from '../hooks/useSystem';

interface ActiveWorkoutPlayerProps {
  plan: WorkoutDay;
  onComplete: (exercisesCompleted: number, totalExercises: number, results: Record<string, number>) => void;
  onFail: () => void;
  streak: number;
}

const SET_DURATION = 45; 
const REST_DURATION = 30;

const isEmbed = (url: string) => {
    if (!url) return false;
    const clean = url.toLowerCase();
    // If it ends in a video extension, it's a direct file. Otherwise, assume embed.
    const hasDirectExtension = /\.(mp4|webm|ogg|mov)($|\?)/.test(clean);
    const isKnownEmbed = clean.includes('youtube') || clean.includes('youtu.be') || clean.includes('vimeo');
    return isKnownEmbed || !hasDirectExtension;
};

const ActiveWorkoutPlayer: React.FC<ActiveWorkoutPlayerProps> = ({ plan, onComplete, onFail }) => {
  const { player } = useSystem();
  
  // --- STATE ---
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timeLeft, setTimeLeft] = useState(SET_DURATION);
  const [phase, setPhase] = useState<'WORK' | 'REST'>('WORK');
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [results, setResults] = useState<Record<string, number>>({});

  // Derived Data
  const exercise = plan.exercises[currentIdx];
  const totalExercises = plan.exercises.length;
  
  // Resolve Video Source (DB priority -> Local fallback)
  const liveExerciseData = player.exerciseDatabase.find(e => e.name === exercise.name);
  const videoSource = liveExerciseData?.videoUrl || exercise.videoUrl;

  // --- LOGIC ---

  useEffect(() => {
    SpeechService.announceStart(exercise.name, exercise.sets, exercise.reps);
  }, []); // Run once on mount

  useEffect(() => {
    let interval: any;
    if (!isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (phase === 'WORK' && next === Math.floor(SET_DURATION / 2)) SpeechService.announceHalfway();
          if (next <= 3 && next > 0) playSystemSoundEffect('TICK');
          return next;
        });
      }, 1000);
    } else if (timeLeft === 0 && !isPaused) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [timeLeft, isPaused, phase]);

  const handleTimerComplete = () => {
    if (phase === 'WORK') {
      // Work Timer Finished -> Auto-complete set? 
      // Usually better to let user click "Complete", but if timer runs out, we can notify.
      // For this system, let's treat timer as "Guideline". 
      // We don't auto-transition from work to rest without user input in most gym apps, 
      // but if this is a "Follow Along" style, we auto-transition.
      // Let's Auto-transition for flow.
      completeSet();
    } else {
      // Rest Timer Finished -> Back to Work
      startNextSet();
    }
  };

  const completeSet = () => {
      playSystemSoundEffect('SUCCESS');
      setResults(prev => ({...prev, [`${exercise.name}_set${currentSet}`]: 1 }));
      
      if (currentSet < exercise.sets) {
        setPhase('REST');
        setTimeLeft(REST_DURATION);
        SpeechService.announceRest(REST_DURATION);
      } else {
        handleExerciseComplete();
      }
  };

  const startNextSet = () => {
      playSystemSoundEffect('SYSTEM');
      SpeechService.announceSetStart(currentSet + 1);
      setPhase('WORK');
      setCurrentSet(prev => prev + 1);
      setTimeLeft(SET_DURATION);
  };

  const handleExerciseComplete = () => {
    if (currentIdx < totalExercises - 1) {
      const nextEx = plan.exercises[currentIdx + 1];
      SpeechService.announceNextExercise(nextEx.name);
      
      // Transition to next exercise (start with Rest/Prep)
      setPhase('REST');
      setTimeLeft(REST_DURATION);
      setCurrentIdx(prev => prev + 1);
      setCurrentSet(1);
    } else {
      SpeechService.announceVictory();
      playSystemSoundEffect('LEVEL_UP');
      onComplete(totalExercises, totalExercises, results);
    }
  };

  const confirmQuit = () => { SpeechService.announceFailure(); onFail(); };

  // --- UI CONSTANTS ---
  const progressPercent = (currentIdx / totalExercises) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white font-sans h-[100dvh] flex flex-col overflow-hidden">
        
        {/* --- HEADER (Fixed) --- */}
        <div className="h-16 px-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-30 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3">
                <div className="bg-black/50 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-xs font-mono font-bold text-gray-300">
                    <span className="text-system-neon">{currentIdx + 1}</span> / {totalExercises}
                </div>
            </div>
            
            <button 
                onClick={() => setShowQuitConfirm(true)} 
                className="pointer-events-auto w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-gray-400 hover:text-red-500 hover:border-red-500/50 transition-colors backdrop-blur"
            >
                <X size={16} />
            </button>
        </div>

        {/* --- MEDIA AREA (Flexible Top Half) --- */}
        <div className="relative flex-1 bg-gray-900 overflow-hidden">
            {/* Phase Overlay/Tint */}
            <AnimatePresence>
                {phase === 'REST' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center"
                    >
                        <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="bg-black/80 border border-system-success/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                        >
                            <h3 className="text-system-success font-mono font-bold tracking-widest text-lg mb-2 flex items-center justify-center gap-2">
                                <Activity size={20} className="animate-pulse" /> RECOVERY
                            </h3>
                            <div className="text-6xl font-black font-mono text-white mb-2 tabular-nums">
                                {timeLeft}<span className="text-xl text-gray-500">s</span>
                            </div>
                            <p className="text-xs text-gray-400 font-mono uppercase">
                                NEXT: SET {currentSet}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Player */}
            <div className="w-full h-full flex items-center justify-center bg-black">
                {videoSource ? (
                    isEmbed(videoSource) ? (
                        <iframe 
                            src={videoSource}
                            className="w-full h-full pointer-events-none"
                            title={exercise.name}
                            allow="autoplay; encrypted-media"
                        />
                    ) : (
                        <video 
                            key={videoSource} // Force reload on change
                            src={videoSource} 
                            className="w-full h-full object-cover opacity-80" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                        />
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <Film size={48} className="mb-4" />
                        <span className="font-mono text-xs tracking-widest">NO VISUAL FEED</span>
                    </div>
                )}
            </div>
            
            {/* Bottom Gradient for smooth transition to controls */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#050505] to-transparent z-10" />
        </div>

        {/* --- COMMAND DECK (Bottom Half) --- */}
        <div className="bg-[#050505] relative z-30 flex flex-col border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pb-safe-area">
            
            {/* Progress Bar Line */}
            <div className="w-full h-1 bg-gray-900">
                <motion.div 
                    className="h-full bg-system-neon shadow-[0_0_10px_#00d2ff]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="p-6 md:p-8 space-y-6">
                
                {/* Exercise Info */}
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-4">
                        <motion.h2 
                            key={exercise.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl md:text-3xl font-black italic text-white leading-tight uppercase tracking-tight truncate"
                        >
                            {exercise.name}
                        </motion.h2>
                        <div className="flex items-center gap-3 mt-2 text-xs font-mono text-gray-400">
                            <span className="bg-gray-900 px-2 py-1 rounded border border-gray-800 text-gray-300">
                                {exercise.sets} SETS
                            </span>
                            <span className="bg-gray-900 px-2 py-1 rounded border border-gray-800 text-system-neon font-bold">
                                {exercise.reps} REPS
                            </span>
                        </div>
                    </div>
                    
                    {/* Mini Timer (Visible during work) */}
                    {phase === 'WORK' && (
                        <div className="flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 rounded-lg p-2 min-w-[70px]">
                            <TimerIcon size={14} className="text-system-neon mb-1" />
                            <span className="text-xl font-bold font-mono text-white leading-none">{timeLeft}s</span>
                        </div>
                    )}
                </div>

                {/* Set Indicators */}
                <div className="flex gap-1.5 h-1.5 w-full">
                    {Array.from({ length: exercise.sets }).map((_, i) => {
                        let statusColor = 'bg-gray-800';
                        if (i < currentSet - 1) statusColor = 'bg-system-neon'; // Completed
                        if (i === currentSet - 1) statusColor = phase === 'WORK' ? 'bg-white animate-pulse' : 'bg-system-success'; // Current
                        
                        return (
                            <motion.div 
                                key={i} 
                                className={`flex-1 rounded-full ${statusColor}`}
                                layoutId={`set-dot-${i}`}
                            />
                        );
                    })}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-4 gap-3">
                    <button 
                        onClick={() => setIsPaused(!isPaused)}
                        className={`col-span-1 h-16 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${
                            isPaused 
                            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                            : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                        }`}
                    >
                        {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                    </button>

                    {phase === 'WORK' ? (
                        <button 
                            onClick={completeSet}
                            className="col-span-3 h-16 bg-system-neon text-black font-black text-lg rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:bg-white transition-all active:scale-95 group"
                        >
                            <Check size={24} strokeWidth={3} />
                            <span>COMPLETE SET</span>
                        </button>
                    ) : (
                        <button 
                            onClick={() => setTimeLeft(0)}
                            className="col-span-3 h-16 bg-system-success text-black font-black text-lg rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-white transition-all active:scale-95 group"
                        >
                            <span>START NEXT</span>
                            <ChevronRight size={24} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>

            </div>
        </div>

        {/* --- QUIT MODAL --- */}
        <AnimatePresence>
           {showQuitConfirm && (
              <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
                 <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.9, opacity: 0 }} 
                    className="bg-[#0a0a0a] border border-red-900/50 w-full max-w-sm rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]"
                 >
                    <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-900/50">
                        <AlertOctagon size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 font-mono">ABORT MISSION?</h2>
                    <p className="text-xs text-red-400 font-mono mb-8 leading-relaxed">
                        WARNING: Leaving the instance early will result in a penalty. XP will be deducted and your streak may be broken.
                    </p>
                    <div className="flex flex-col gap-3">
                       <button 
                           onClick={() => setShowQuitConfirm(false)} 
                           className="w-full py-4 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-700 transition-colors"
                       >
                           RESUME PROTOCOL
                       </button>
                       <button 
                           onClick={confirmQuit} 
                           className="w-full py-4 rounded-xl bg-transparent border border-red-900/50 text-red-500 font-bold text-sm hover:bg-red-900/10 transition-colors"
                       >
                           ACCEPT PENALTY & QUIT
                       </button>
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>
    </div>
  );
};

export default ActiveWorkoutPlayer;
