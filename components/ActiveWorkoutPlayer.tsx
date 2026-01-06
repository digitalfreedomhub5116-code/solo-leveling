
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, AlertOctagon, RefreshCw, Activity, Film } from 'lucide-react';
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
    const hasExtension = /\.(mp4|webm|ogg|mov)$/.test(clean);
    return !hasExtension;
};

const CircularTimer: React.FC<{ 
  progress: number; 
  total: number; 
  isRest: boolean; 
  onToggle: () => void; 
  isPaused: boolean; 
}> = ({ progress, total, isRest, onToggle, isPaused }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / total) * circumference;
  const color = isRest ? '#10b981' : '#00d2ff'; 

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-64 h-64 -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <circle cx="128" cy="128" r={radius} stroke="#1f2937" strokeWidth="8" fill="none" />
        <motion.circle
          cx="128"
          cy="128"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "linear" }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggle}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${isPaused ? 'bg-yellow-500/20 text-yellow-500 animate-pulse' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
        >
          {isPaused ? <Play size={40} fill="currentColor" /> : <Pause size={40} fill="currentColor" />}
        </motion.button>
        <div className="mt-4 text-4xl font-black font-mono tracking-tighter text-white">
          {Math.ceil(progress)}<span className="text-sm text-gray-500">s</span>
        </div>
        <div className={`text-[10px] font-mono tracking-[0.3em] uppercase mt-1 ${isRest ? 'text-system-success' : 'text-system-neon'}`}>
          {isRest ? 'RECOVER' : 'ENGAGE'}
        </div>
      </div>
    </div>
  );
};

const ActiveWorkoutPlayer: React.FC<ActiveWorkoutPlayerProps> = ({ plan, onComplete, onFail }) => {
  const { player } = useSystem();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timeLeft, setTimeLeft] = useState(SET_DURATION);
  const [phase, setPhase] = useState<'WORK' | 'REST'>('WORK');
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [results, setResults] = useState<Record<string, number>>({});

  const exercise = plan.exercises[currentIdx];
  const totalExercises = plan.exercises.length;

  const liveExerciseData = player.exerciseDatabase.find(e => e.name === exercise.name);
  const videoSource = liveExerciseData?.videoUrl || exercise.videoUrl;
  const imageSource = liveExerciseData?.imageUrl || exercise.imageUrl;
  
  useEffect(() => {
    SpeechService.announceStart(exercise.name, exercise.sets, exercise.reps);
  }, []); 

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
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [timeLeft, isPaused, phase]);

  const handleTimerComplete = () => {
    if (phase === 'WORK') {
      playSystemSoundEffect('SUCCESS');
      SpeechService.announceRest(REST_DURATION);
      setResults(prev => ({...prev, [`${exercise.name}_set${currentSet}`]: 1 }));
      if (currentSet < exercise.sets) {
        setPhase('REST');
        setTimeLeft(REST_DURATION);
      } else {
        handleExerciseComplete();
      }
    } else {
      playSystemSoundEffect('SYSTEM');
      SpeechService.announceSetStart(currentSet + 1);
      setPhase('WORK');
      setCurrentSet(prev => prev + 1);
      setTimeLeft(SET_DURATION);
    }
  };

  const handleExerciseComplete = () => {
    if (currentIdx < totalExercises - 1) {
      const nextEx = plan.exercises[currentIdx + 1];
      SpeechService.announceNextExercise(nextEx.name);
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

  const skipTimer = () => setTimeLeft(0);
  const confirmQuit = () => { SpeechService.announceFailure(); onFail(); };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col font-sans text-white">
        <div className="flex justify-between items-center p-6 bg-black border-b border-gray-900 z-20">
            <div className="flex items-center gap-3">
               <div className="text-2xl font-black italic text-system-neon tracking-tighter">
                  {currentIdx + 1} <span className="text-gray-600 text-lg not-italic">/ {totalExercises}</span>
               </div>
               <div className="h-8 w-[1px] bg-gray-800" />
               <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-mono tracking-widest">TARGET</span>
                  <span className="text-xs font-bold">{exercise.name}</span>
               </div>
            </div>
            <button onClick={() => setShowQuitConfirm(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 text-gray-500 hover:bg-red-900/20 hover:text-red-500 transition-colors">
               <X size={20} />
            </button>
        </div>

        <div className="flex-1 relative flex flex-col">
            <div className="flex-1 flex flex-col justify-center relative bg-black/50 border-y border-system-border overflow-hidden group">
               <div className={`w-full h-full relative flex items-center justify-center transition-opacity duration-500 ${phase === 'WORK' ? 'opacity-100' : 'opacity-50 blur-sm'}`}>
                   {videoSource ? (
                      isEmbed(videoSource) ? (
                          <iframe 
                             src={videoSource}
                             className="w-full h-full"
                             allow="autoplay; encrypted-media"
                             title={exercise.name}
                          />
                      ) : (
                          <video 
                            key={videoSource}
                            src={videoSource} 
                            className="w-full h-full object-cover" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                          />
                      )
                   ) : imageSource ? (
                      <img src={imageSource} alt={exercise.name} className="w-full h-full object-cover" />
                   ) : (
                      <div className="flex flex-col items-center justify-center text-system-neon/30">
                          <Activity size={80} className="animate-pulse mb-6 opacity-50" />
                          <div className="flex items-center gap-2 text-xs font-mono tracking-widest border border-system-neon/20 px-4 py-2 rounded bg-system-neon/5">
                             <Film size={14} /> NO VISUAL FEED DETECTED
                          </div>
                      </div>
                   )}
                   <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10 opacity-30" />
                   <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-system-neon/50 pointer-events-none" />
                   <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-system-neon/50 pointer-events-none" />
               </div>
               
               {phase === 'REST' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-0 flex flex-col items-center justify-center pb-8 z-30 pointer-events-none">
                     <div className="bg-black/90 backdrop-blur-md border border-system-success/50 px-10 py-8 rounded-xl text-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                        <RefreshCw size={32} className="text-system-success mx-auto mb-4 animate-spin-slow" />
                        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">RECOVERY MODE</h2>
                        <p className="text-xs text-gray-400 font-mono">UP NEXT: <span className="text-system-neon font-bold">{plan.exercises[currentIdx]?.name || 'FINISH'}</span></p>
                     </div>
                  </motion.div>
               )}
            </div>

            <div className="bg-[#050505] border-t border-gray-900 p-8 pb-12 flex flex-col items-center relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
               <div className="mb-6 flex gap-1">
                  {Array.from({ length: exercise.sets }).map((_, i) => (
                     <div key={i} className={`w-8 h-1 rounded-full transition-colors ${i < currentSet - (phase === 'REST' && currentSet > 1 ? 0 : 1) ? 'bg-system-neon' : i === currentSet - 1 ? 'bg-white animate-pulse' : 'bg-gray-800'}`} />
                  ))}
               </div>
               <div className="flex items-center gap-8 w-full max-w-md justify-between">
                  <button onClick={skipTimer} className="flex-1 py-4 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 font-bold font-mono text-xs hover:bg-gray-800 hover:text-white transition-all active:scale-95">{phase === 'WORK' ? 'COMPLETE EARLY' : 'SKIP REST'}</button>
                  <div className="-mt-16 bg-black rounded-full p-2 border-4 border-[#050505]">
                     <CircularTimer progress={timeLeft} total={phase === 'WORK' ? SET_DURATION : REST_DURATION} isRest={phase === 'REST'} isPaused={isPaused} onToggle={() => setIsPaused(!isPaused)} />
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center opacity-60">
                     <div className="text-2xl font-black text-white">{exercise.reps}</div>
                     <div className="text-[8px] font-mono tracking-widest text-gray-500 uppercase">REPS</div>
                  </div>
               </div>
            </div>
        </div>

        <AnimatePresence>
           {showQuitConfirm && (
              <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
                 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0a0a0a] border border-red-900/50 w-full max-w-sm rounded-xl p-6 text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                    <AlertOctagon size={48} className="mx-auto text-red-600 mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold text-white mb-2">ABANDON DUNGEON?</h2>
                    <p className="text-xs text-red-400 font-mono mb-6 leading-relaxed">WARNING: Leaving the instance early will result in a penalty. XP will be deducted and your streak may be broken.</p>
                    <div className="flex gap-3">
                       <button onClick={() => setShowQuitConfirm(false)} className="flex-1 py-3 rounded bg-gray-800 text-white font-bold text-xs hover:bg-gray-700">RESUME</button>
                       <button onClick={confirmQuit} className="flex-1 py-3 rounded bg-red-900/20 border border-red-900 text-red-500 font-bold text-xs hover:bg-red-900 hover:text-white transition-colors">ACCEPT PENALTY</button>
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>
    </div>
  );
};

export default ActiveWorkoutPlayer;
