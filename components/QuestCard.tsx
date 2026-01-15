
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Dumbbell, Brain, Target, Users, Shield, AlertOctagon, Zap, ZapOff } from 'lucide-react';
import { Quest, CoreStats, Rank } from '../types';

interface QuestCardProps {
  quest: Quest;
  onComplete: (id: string, asMini?: boolean) => void;
  onFail: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
}

const rankColors: Record<Rank, string> = {
  'S': 'text-yellow-400 border-yellow-400/50 bg-yellow-400/5',
  'A': 'text-red-500 border-red-500/50 bg-red-500/5',
  'B': 'text-purple-500 border-purple-500/50 bg-purple-500/5',
  'C': 'text-blue-500 border-blue-500/50 bg-blue-500/5',
  'D': 'text-green-500 border-green-500/50 bg-green-500/5',
  'E': 'text-gray-400 border-gray-400/50 bg-gray-400/5',
};

const statIcons: Record<keyof CoreStats, React.ReactNode> = {
  strength: <Dumbbell size={12} />,
  intelligence: <Brain size={12} />,
  focus: <Target size={12} />,
  social: <Users size={12} />,
  willpower: <Shield size={12} />,
};

const QuestCard: React.FC<QuestCardProps> = ({ quest, onComplete, onFail, onReset, onDelete }) => {
  const [isMiniView, setIsMiniView] = useState(false);
  const [isFailing, setIsFailing] = useState(false);

  const miniTitle = quest.miniQuest || "Activation: Just Start.";
  const miniXp = Math.floor(quest.xpReward * 0.1);

  const isMiniActive = isMiniView && !quest.isCompleted;
  
  // Handle Fail Animation Sequence
  const handleFailClick = () => {
      setIsFailing(true);
      // Wait for animation to play before triggering actual fail logic
      setTimeout(() => {
          onFail(quest.id);
      }, 500);
  };

  const handleDeleteClick = () => {
      const confirmDelete = window.confirm("WARNING: This will permanently delete the quest and all associated data. This action cannot be undone. Are you sure?");
      if (confirmDelete) {
          onDelete(quest.id);
      }
  };
  
  // Dynamic styles based on state
  let borderColor = 'border-gray-800';
  let bgClass = 'bg-system-card/40';
  let titleColor = 'text-gray-200';

  if (isFailing) {
      borderColor = 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]';
      bgClass = 'bg-red-950/30';
      titleColor = 'text-red-500';
  } else if (quest.failed) {
      borderColor = 'border-red-900/30 border-dashed';
      bgClass = 'bg-red-950/10 grayscale';
      titleColor = 'text-red-800 line-through decoration-red-900 decoration-2';
  } else if (quest.isCompleted) {
      borderColor = 'border-system-success/30';
      bgClass = 'bg-black/40';
      titleColor = 'text-gray-500 line-through decoration-system-success/50';
  } else if (isMiniActive) {
      borderColor = 'border-amber-700/50';
      titleColor = 'text-amber-500';
  }

  // Animation variants
  const variants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95 },
      failing: { 
          x: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.4 }
      }
  };

  return (
    <motion.div 
      variants={variants}
      initial="hidden"
      animate={isFailing ? "failing" : "visible"}
      exit="exit"
      // Added scroll-mt-32 to account for sticky header when autoscrolling
      className={`relative border backdrop-blur-sm p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group overflow-hidden transition-all duration-300 scroll-mt-32 ${bgClass} ${borderColor}`}
    >
       {/* Active Glow/Background */}
       {!quest.isCompleted && !quest.failed && !isFailing && (
           <div className={`absolute inset-0 bg-gradient-to-r ${isMiniActive ? 'from-amber-900/10' : 'from-gray-900/50'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
       )}

       {/* FAILED VISUAL SLASH (Red Line) */}
       {(isFailing || quest.failed) && (
           <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
               <motion.line 
                   x1="-10%" y1="10%" x2="110%" y2="90%"
                   stroke="#ef4444"
                   strokeWidth="4"
                   initial={{ pathLength: 0, opacity: 0 }}
                   animate={{ pathLength: 1, opacity: 0.6 }}
                   transition={{ duration: 0.3, ease: "circIn" }}
               />
           </svg>
       )}

       {/* Completion Overlay Flash */}
       {quest.isCompleted && (
           <>
             <motion.div 
               initial={{ opacity: 0.6 }} 
               animate={{ opacity: 0 }} 
               transition={{ duration: 1.5, ease: "easeOut" }}
               className="absolute inset-0 bg-system-success/10 pointer-events-none" 
             />
             <div className="absolute inset-0 shadow-[0_0_30px_rgba(16,185,129,0.05)_inset] pointer-events-none rounded-xl" />
           </>
       )}

       <div className="flex items-center gap-4 z-10 w-full md:w-auto">
          {/* Rank Badge */}
          <div className={`flex items-center justify-center w-10 h-10 border rounded-lg font-mono font-bold text-sm ${isMiniActive ? 'border-amber-800/50 text-amber-600 bg-amber-950/20' : rankColors[quest.rank]} shrink-0`}>
             {isMiniActive ? 'M' : quest.rank}
          </div>
          
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase text-gray-500 tracking-wider flex items-center gap-1 font-mono">
                    {statIcons[quest.category]} {quest.category}
                </span>
                
                {/* Rewards */}
                <motion.span 
                    key={quest.isCompleted ? 'completed' : 'active'}
                    initial={quest.isCompleted ? { scale: 1.5, color: '#4ade80' } : {}}
                    animate={quest.isCompleted ? { scale: 1, color: '#4ade80' } : {}}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    className={`text-[10px] font-mono font-bold ${isMiniActive ? 'text-amber-500' : quest.isCompleted ? 'text-system-success' : quest.failed ? 'text-red-900' : 'text-system-neon'}`}
                >
                    +{isMiniActive ? miniXp : quest.xpReward} XP
                </motion.span>

                {quest.isDaily && (
                    <span className="text-[9px] text-system-accent border border-system-accent/20 px-1.5 rounded bg-system-accent/5 font-mono">
                        DAILY
                    </span>
                )}
             </div>
             
             <h3 className={`font-bold text-sm md:text-base transition-colors ${titleColor} ${!quest.failed && !quest.isCompleted ? 'group-hover:text-white' : ''}`}>
               {isMiniActive ? miniTitle : quest.title}
             </h3>
             
             {!isMiniActive && quest.description && (
                 <p className="text-xs text-gray-500 max-w-md line-clamp-1 mt-0.5">{quest.description}</p>
             )}

             {quest.isCompleted && (
                 <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-1 text-[10px] font-mono text-system-success flex items-center gap-1"
                 >
                     <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                     >
                        <CheckCircle size={12} />
                     </motion.div>
                     <span className="font-bold">COMPLETED</span>
                     {quest.completedAsMini && <span className="text-amber-600 ml-2">(SAFE MODE)</span>}
                 </motion.div>
             )}

             {quest.failed && (
                 <div className="mt-1 text-[10px] font-mono text-red-700 flex items-center gap-1 font-bold">
                     <AlertOctagon size={12} />
                     <span>SYSTEM REJECTION: FAILED</span>
                 </div>
             )}
          </div>
       </div>

       <div className="flex gap-2 w-full md:w-auto z-10 shrink-0">
          {!quest.isCompleted && !quest.failed ? (
            <>
                {/* Safe Mode Toggle */}
                <button 
                    onClick={() => setIsMiniView(!isMiniView)}
                    disabled={isFailing}
                    className={`p-2 rounded-lg border transition-all ${isMiniActive ? 'bg-amber-900/20 border-amber-800 text-amber-500' : 'bg-transparent border-transparent text-gray-600 hover:text-gray-400 hover:bg-white/5'}`}
                    title="Toggle Safe Mode"
                >
                    {isMiniActive ? <Zap size={16} fill="currentColor" /> : <ZapOff size={16} />}
                </button>

                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onComplete(quest.id, isMiniActive)}
                    disabled={isFailing}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-mono text-xs font-bold transition-all shadow-lg
                        ${isMiniActive 
                            ? 'bg-amber-600 text-black hover:bg-amber-500' 
                            : 'bg-white text-black hover:bg-system-neon hover:text-black'
                        } disabled:opacity-50 disabled:grayscale`}
                >
                    {isMiniActive ? 'ACTIVATE' : 'COMPLETE'}
                </motion.button>
                
                {!isMiniActive && (
                    <button 
                        onClick={handleFailClick}
                        disabled={isFailing}
                        className={`p-2.5 rounded-lg transition-colors ${isFailing ? 'text-red-500 bg-red-500/20' : 'text-gray-600 hover:text-red-500 hover:bg-red-500/10'}`}
                        title="Fail Quest (Apply Penalty)"
                    >
                        <AlertOctagon size={18} className={isFailing ? "animate-pulse" : ""} />
                    </button>
                )}
            </>
          ) : (
            // Completed -> Reset Option. FAILED -> NO OPTION (Hidden)
            !quest.failed && (
                <button 
                    onClick={() => onReset(quest.id)}
                    className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-xs font-mono font-bold"
                >
                    RESET
                </button>
            )
          )}
          
          {/* Permanent Delete */}
          <button 
             onClick={handleDeleteClick}
             disabled={isFailing}
             className="p-2.5 rounded-lg text-gray-700 hover:text-red-500 hover:bg-red-500/10 transition-colors"
             title="Permanently Delete"
          >
             <XCircle size={18} />
          </button>
       </div>
    </motion.div>
  );
};

export default QuestCard;
