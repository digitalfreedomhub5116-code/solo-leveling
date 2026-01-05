import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Dumbbell, Brain, Target, Users, Shield, Repeat, RotateCcw, AlertOctagon } from 'lucide-react';
import { Quest, CoreStats, Rank } from '../types';

interface QuestCardProps {
  quest: Quest;
  onComplete: (id: string) => void;
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
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`relative border bg-system-card/80 backdrop-blur-sm p-4 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group overflow-hidden ${
        quest.isCompleted ? 'border-system-success/30 opacity-75' : 'border-system-border hover:border-system-neon/50 transition-colors'
      }`}
    >
       {/* Background Glow Effect */}
       <div className="absolute top-0 right-0 w-32 h-32 bg-system-accent/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

       <div className="flex items-center gap-4 z-10 w-full md:w-auto">
          {/* Rank Badge */}
          <div className={`flex items-center justify-center w-12 h-12 border-2 rounded-lg font-mono font-bold text-xl ${rankColors[quest.rank]}`}>
             {quest.rank}
          </div>
          
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded border border-gray-800 bg-gray-900 text-gray-400 flex items-center gap-1`}>
                    {statIcons[quest.category]}
                    {quest.category}
                </span>
                <span className="text-[10px] text-system-neon font-mono">+{quest.xpReward} XP</span>
                {quest.isDaily && (
                    <span className="text-[10px] text-system-accent font-mono flex items-center gap-1 bg-system-accent/10 px-2 py-0.5 rounded border border-system-accent/20">
                        <Repeat size={10} /> DAILY
                    </span>
                )}
             </div>
             <h3 className={`font-bold text-gray-200 ${quest.isCompleted ? 'line-through text-gray-600' : ''}`}>
               {quest.title}
             </h3>
             <p className="text-xs text-gray-500 max-w-md">{quest.description || "No detailed instructions provided."}</p>
          </div>
       </div>

       <div className="flex gap-2 w-full md:w-auto z-10">
          {!quest.isCompleted ? (
            <>
                <button 
                    onClick={() => onComplete(quest.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded bg-system-neon/10 text-system-neon border border-system-neon/20 hover:bg-system-neon hover:text-black transition-all font-mono text-xs font-bold active:scale-95"
                >
                    <CheckCircle size={14} /> COMPLETE
                </button>
                <button 
                    onClick={() => onFail(quest.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-system-danger/10 text-system-danger border border-system-danger/20 hover:bg-system-danger hover:text-black hover:animate-[shake_0.5s_ease-in-out] transition-all font-mono text-xs font-bold active:scale-95 group"
                    title="Admit Failure (Triggers Penalty)"
                >
                    <AlertOctagon size={14} className="group-hover:animate-pulse" /> I FAILED
                </button>
            </>
          ) : (
            <button 
                onClick={() => onReset(quest.id)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white transition-all font-mono text-xs font-bold active:scale-95"
                title="Reset Quest status to incomplete"
            >
                <RotateCcw size={14} /> RESET
            </button>
          )}
          
          <button 
             onClick={() => onDelete(quest.id)}
             className="px-3 py-2 rounded bg-system-bg border border-system-border text-gray-600 hover:text-system-danger hover:border-system-danger/50 transition-colors active:scale-95"
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