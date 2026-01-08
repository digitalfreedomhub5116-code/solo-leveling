
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, Dumbbell, Zap, Activity, HeartPulse, ChevronRight, Fingerprint, ScanLine, Video, AlertTriangle } from 'lucide-react';
import { WorkoutDay, Exercise } from '../types';

interface WorkoutOverviewProps {
  plan: WorkoutDay;
  focusVideos: Record<string, string>;
  onStart: (modifiedPlan: WorkoutDay, isCardioActive: boolean) => void;
  onCancel: () => void;
}

// Check if string looks like a video embed URL or just a file path
const isEmbed = (url: string) => {
    if (!url) return false;
    const clean = url.toLowerCase();
    const hasDirectExtension = /\.(mp4|webm|ogg|mov)$/.test(clean);
    const isKnownEmbed = clean.includes('youtube') || clean.includes('youtu.be') || clean.includes('vimeo');
    return isKnownEmbed || !hasDirectExtension; // If it doesn't look like a file, assume it's a web page/embed
};

// --- VISUAL ANATOMY DISPLAY (VIDEO) ---
const HolographicBody: React.FC<{ focus: string; isCardio: boolean; videos: Record<string, string> }> = ({ focus, isCardio, videos }) => {
  const [hasError, setHasError] = useState(false);
  
  const videoKey = useMemo(() => {
      const f = focus.toUpperCase();
      if (f.includes('CHEST')) return 'CHEST';
      if (f.includes('BACK') || f.includes('PULL')) return 'BACK';
      if (f.includes('SHOULDER')) return 'SHOULDERS'; 
      if (f.includes('ARM') || f.includes('BICEP') || f.includes('TRICEP')) return 'ARMS';
      if (f.includes('LEG') || f.includes('SQUAT')) return 'LEGS';
      if (f.includes('CORE') || f.includes('ABS')) return 'CORE';
      if (isCardio || f.includes('CARDIO')) return 'CARDIO';
      return 'REST';
  }, [focus, isCardio]);

  const videoUrl = videos[videoKey];

  return (
    <div className="relative w-full h-[380px] flex items-center justify-center overflow-hidden bg-black/80 rounded-lg perspective-1000 group border border-gray-800">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none z-10" />
      
      {/* Scanning Line Animation Overlay */}
      <motion.div 
        initial={{ top: "-10%" }}
        animate={{ top: "120%" }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute w-full h-2 bg-gradient-to-b from-transparent via-system-neon/40 to-transparent z-20 pointer-events-none shadow-[0_0_15px_rgba(0,210,255,0.4)]"
      />

      {/* Main Video Player */}
      {videoUrl && !hasError ? (
          isEmbed(videoUrl) ? (
             <iframe 
                src={videoUrl}
                className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-auto"
                title="Hologram"
                allow="autoplay; encrypted-media"
                allowFullScreen
             />
          ) : (
             <video 
                key={videoUrl} // Critical: Forces React to re-mount video element when URL changes
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                autoPlay
                loop
                muted // Critical: Browsers block autoplay if not muted
                playsInline // Critical: Required for iOS
                onError={() => setHasError(true)}
             >
                 <source src={videoUrl} />
             </video>
          )
      ) : (
          <div className="flex flex-col items-center justify-center text-gray-700 p-4 text-center">
              {hasError ? (
                  <>
                    <AlertTriangle size={48} className="mb-2 text-red-900/50" />
                    <span className="text-xs font-mono text-red-900/70">SIGNAL LOST // CHECK LINK</span>
                  </>
              ) : (
                  <>
                    <Video size={48} className="mb-2 opacity-50" />
                    <span className="text-xs font-mono">NO VISUAL DATA // {videoKey}</span>
                  </>
              )}
          </div>
      )}

      {/* --- TARGET LABEL HUD --- */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-6 right-6 flex flex-col items-end z-20 pointer-events-none"
      >
          <div className="flex items-center gap-2 text-[10px] font-mono text-system-neon font-bold bg-black/80 px-3 py-1.5 rounded border border-system-neon/30 backdrop-blur-sm shadow-[0_0_15px_rgba(0,210,255,0.2)]">
              <ScanLine size={12} className="animate-pulse" />
              BIO-SCAN ACTIVE
          </div>
          <div className="mt-2 text-right bg-black/60 p-2 rounded backdrop-blur-sm">
              <div className="text-[8px] text-gray-400 font-mono tracking-widest uppercase">PRIMARY TARGET</div>
              <div className="text-sm font-bold text-white font-mono tracking-wider drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                  {focus}
              </div>
          </div>
      </motion.div>

      <div className="absolute bottom-4 left-4 text-[9px] text-gray-500 font-mono flex items-center gap-2 bg-black/60 px-2 py-1 rounded backdrop-blur-sm z-20 pointer-events-none">
          <Fingerprint size={12} />
          <span>SUB: HUMAN_MALE_01</span>
      </div>

    </div>
  );
};

// --- EXERCISE ROW ---
const ExerciseRow: React.FC<{ exercise: Exercise }> = ({ exercise }) => (
    <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center gap-4 p-3 bg-gray-900/50 border border-gray-800 rounded-lg group hover:border-system-neon/30 transition-colors"
    >
        <div className="w-12 h-12 bg-black border border-gray-700 rounded flex items-center justify-center relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,210,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />
            {exercise.type === 'CARDIO' ? <HeartPulse size={18} className="text-system-accent" /> : <Dumbbell size={18} className="text-system-neon" />}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white font-mono group-hover:text-system-neon transition-colors truncate pr-2">{exercise.name}</h4>
            <span className="text-[10px] text-gray-500 font-mono tracking-wider">{exercise.type} CLASS</span>
        </div>
        <div className="text-right font-mono shrink-0">
            <div className="text-xs font-bold text-white">{exercise.sets} SETS</div>
            <div className="text-[10px] text-system-neon">{exercise.reps}</div>
        </div>
    </motion.div>
);

const WorkoutOverview: React.FC<WorkoutOverviewProps> = ({ plan, focusVideos, onStart, onCancel }) => {
  const [isCardio, setIsCardio] = useState(false);

  const baseStats = useMemo(() => {
      const sets = plan.exercises.reduce((acc, curr) => acc + curr.sets, 0);
      const time = plan.totalDuration || 45;
      const cals = Math.floor(time * 6.5);
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
          modifiedPlan.exercises = [...modifiedPlan.exercises, {
              name: "Shadow Sprint (HIIT)",
              sets: 3,
              reps: "45s On / 15s Off",
              duration: 15,
              completed: false,
              type: "CARDIO",
              notes: "Added via Protocol"
          }];
      }
      onStart(modifiedPlan, isCardio);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-4xl bg-[#050505] border border-system-border rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]"
        >
            <div className="p-6 border-b border-gray-800 bg-gray-900/20 flex justify-between items-start">
                <div>
                    <div className="text-[10px] text-system-neon font-mono tracking-[0.3em] uppercase mb-1">Dungeon Gate</div>
                    <h2 className="text-2xl md:text-3xl font-black italic text-white tracking-tighter uppercase">{plan.focus} INSTANCE</h2>
                </div>
                <button onClick={onCancel} className="text-gray-500 hover:text-white font-mono text-xs">[ ESCAPE ]</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* LEFT: MAP & STATS */}
                    <div className="flex-1 space-y-6">
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

                        <div className="bg-black border border-gray-800 rounded-xl relative overflow-hidden flex flex-col items-center">
                            <HolographicBody focus={plan.focus} isCardio={isCardio} videos={focusVideos} />
                            
                            <div className="w-full bg-gray-900/80 backdrop-blur p-4 border-t border-gray-800 flex justify-between items-center">
                                <div>
                                    <div className={`text-xs font-bold font-mono ${isCardio ? 'text-system-accent' : 'text-gray-400'}`}>CARDIO PROTOCOL</div>
                                    <div className="text-[9px] text-gray-500">+30% BURN // +15 MIN</div>
                                </div>
                                <button 
                                    onClick={() => setIsCardio(!isCardio)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isCardio ? 'bg-system-accent shadow-[0_0_10px_#8b5cf6]' : 'bg-gray-700'}`}
                                >
                                    <motion.div animate={{ x: isCardio ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-md" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: ROSTER */}
                    <div className="flex-1 flex flex-col">
                        <h3 className="text-xs text-gray-500 font-mono mb-4 uppercase tracking-widest border-b border-gray-800 pb-2 flex items-center justify-between">
                            <span>Instance Enemies</span>
                            <span className="text-white font-bold">{plan.exercises.length} DETECTED</span>
                        </h3>
                        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[350px]">
                            {plan.exercises.map((ex, i) => <ExerciseRow key={i} exercise={ex} />)}
                            {isCardio && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <ExerciseRow exercise={{ name: "Shadow Sprint (HIIT)", sets: 3, reps: "45s Intervals", duration: 15, completed: false, type: "CARDIO" }} />
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
