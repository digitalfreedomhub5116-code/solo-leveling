
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Dumbbell, Brain, Target, Users, Shield, Repeat, RotateCcw, AlertOctagon, Link, Zap, ZapOff, BatteryLow } from 'lucide-react';
import { Quest, CoreStats, Rank } from '../types';

interface QuestCardProps {
  quest: Quest;
  onComplete: (id: string, asMini?: boolean) => void;
  onFail: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
}

const rankColors: Record<Rank, string> = {
  'S': 'text-yellow-400 border-yellow-400 bg-yellow-400/10',
  'A': 'text-red-500 border-red-500 bg-red-500/10',
  'B': 'text-purple-500 border-purple-500 bg-purple-500/10',
  'C': 'text-blue-500 border-blue-500 bg-blue-500/10',
  'D': 'text-green-500 border-green-500 bg-green-500/10',
  'E': 'text-gray-400 border-gray-400 bg-gray-400/10',
};

const statIcons: Record<keyof CoreStats, React.ReactNode> = {
  strength: <Dumbbell size={14} />,
  intelligence: <Brain size={14} />,
  focus: <Target size={14} />,
  social: <Users size={14} />,
  willpower: <Shield size={14} />,
};

const QuestCard: React.FC<QuestCardProps> = ({ quest, onComplete, onFail, onReset, onDelete }) => {
  const [isMiniView, setIsMiniView] = useState(false);

  // If quest doesn't have a mini version but user toggles, we use a fallback
  const miniTitle = quest.miniQuest || "Minimum Activation: Just Start.";
  const miniXp = Math.floor(quest.xpReward * 0.1);

  // Determine active visual state
  const isMiniActive = isMiniView && !quest.isCompleted;
  const borderColor = isMiniActive ? 'border-amber-700' : 'border-system-border hover:border-system-neon/50';
  const glowColor = isMiniActive ? 'bg-amber-900/10' : 'bg-system-card/80';
  const textColor = isMiniActive ? 'text-amber-500' : 'text-gray-200';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`relative border backdrop-blur-sm p-4 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group overflow-hidden transition-colors duration-300 ${glowColor} ${borderColor} ${
        quest.isCompleted ? 'border-system-success/30 opacity-75' : ''
      }`}
    >
       {/* Background Glow Effect */}
       <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-colors duration-500 ${isMiniActive ? 'bg-amber-500/5' : 'bg-system-accent/5'}`} />

       {/* Mini Mode Status Strip */}
       {isMiniActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-600 animate-pulse" />
       )}

       <div className="flex items-center gap-4 z-10 w-full md:w-auto">
          {/* Rank Badge */}
          <div className={`flex items-center justify-center w-12 h-12 border-2 rounded-lg font-mono font-bold text-xl ${isMiniActive ? 'border-amber-800 text-amber-700 bg-amber-950' : rankColors[quest.rank]} shrink-0 transition-all`}>
             {isMiniActive ? 'M' : quest.rank}
          </div>
          
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded border border-gray-800 bg-gray-900 text-gray-400 flex items-center gap-1`}>
                    {statIcons[quest.category]}
                    {quest.category}
                </span>
                
                {/* XP Display */}
                <span className={`text-[10px] font-mono transition-colors ${isMiniActive ? 'text-amber-500 line-through decoration-amber-500/50' : 'text-system-neon'}`}>
                    {isMiniActive ? `+${quest.xpReward} XP` : `+${quest.xpReward} XP`}
                </span>
                {isMiniActive && <span className="text-[10px] font-mono text-amber-500 font-bold">+{miniXp} XP (SAFE MODE)</span>}

                {quest.isDaily && (
                    <span className="text-[10px] text-system-accent font-mono flex items-center gap-1 bg-system-accent/10 px-2 py-0.5 rounded border border-system-accent/20">
                        <Repeat size={10} /> DAILY
                    </span>
                )}
             </div>
             
             {/* Title */}
             <h3 className={`font-bold truncate pr-4 transition-colors ${textColor} ${quest.isCompleted ? 'line-through text-gray-600' : ''}`}>
               {isMiniActive ? miniTitle : quest.title}
             </h3>
             
             {/* Description */}
             {!isMiniActive && quest.description && (
                 <p className="text-xs text-gray-500 max-w-md line-clamp-2">{quest.description}</p>
             )}

             {/* TRIGGER SUB-TEXT */}
             {!isMiniActive && quest.trigger && (
                <div className="mt-1.5 flex items-start gap-1.5 text-[10px] font-mono opacity-80">
                   <Link size={12} className="text-system-accent mt-0.5 shrink-0" />
                   <span className="text-system-accent uppercase tracking-wider">TRIGGER:</span>
                   <span className="text-gray-400 italic">"{quest.trigger}"</span>
                </div>
             )}

             {/* Completion Status Tag */}
             {quest.completedAsMini && quest.isCompleted && (
                 <div className="mt-1 text-[9px] text-amber-600 font-mono flex items-center gap-1">
                     <BatteryLow size={10} /> COMPLETED IN SAFE MODE (MINIMIZED)
                 </div>
             )}
          </div>
       </div>

       <div className="flex gap-2 w-full md:w-auto z-10 shrink-0">
          {!quest.isCompleted ? (
            <>
                {/* MINIMIZE TOGGLE */}
                <button 
                    onClick={() => setIsMiniView(!isMiniView)}
                    className={`flex items-center justify-center p-2 rounded border transition-all active:scale-95 ${isMiniActive ? 'bg-amber-900/30 border-amber-600 text-amber-500' : 'bg-system-bg border-gray-800 text-gray-600 hover:text-white'}`}
                    title={isMiniActive ? "Restore Full Quest" : "Switch to Mini-Quest (Activation Energy)"}
                >
                    {isMiniActive ? <Zap size={16} fill="currentColor" /> : <ZapOff size={16} />}
                </button>

                <button 
                    onClick={() => onComplete(quest.id, isMiniActive)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded border transition-all font-mono text-xs font-bold active:scale-95 whitespace-nowrap 
                        ${isMiniActive 
                            ? 'bg-amber-900/20 text-amber-500 border-amber-800 hover:bg-amber-800 hover:text-white' 
                            : 'bg-system-neon/10 text-system-neon border-system-neon/20 hover:bg-system-neon hover:text-black'
                        }`}
                >
                    <CheckCircle size={14} /> {isMiniActive ? 'MINI COMPLETE' : 'COMPLETE'}
                </button>
                
                {!isMiniActive && (
                    <button 
                        onClick={() => onFail(quest.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-system-danger/10 text-system-danger border border-system-danger/20 hover:bg-system-danger hover:text-black hover:animate-[shake_0.5s_ease-in-out] transition-all font-mono text-xs font-bold active:scale-95 group whitespace-nowrap"
                        title="Admit Failure (Triggers Penalty)"
                    >
                        <AlertOctagon size={14} className="group-hover:animate-pulse" /> FAIL
                    </button>
                )}
            </>
          ) : (
            <button 
                onClick={() => onReset(quest.id)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white transition-all font-mono text-xs font-bold active:scale-95 whitespace-nowrap"
                title="Reset Quest status to incomplete"
            >
                <RotateCcw size={14} /> RESET
            </button>
          )}
          
          <button 
             onClick={() => onDelete(quest.id)}
             className="px-3 py-2 rounded bg-system-bg border border-system-border text-gray-600 hover:text-system-danger hover:border-system-danger/50 transition-all active:scale-95 shrink-0"
             title="Abandon Quest"
          >
             <XCircle size={16} />
          </button>
       </div>
       <style>{`
         @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
         }
       `}</style>
    </motion.div>
  );
};

export default QuestCard;
