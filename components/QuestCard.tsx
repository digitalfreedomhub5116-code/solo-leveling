
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, Repeat, MoreVertical, Trash2, RotateCcw, Zap, Calendar } from 'lucide-react';
import { Quest, Rank, CoreStats } from '../types';

interface QuestCardProps {
  quest: Quest;
  onComplete: (id: string, asMini: boolean, rect: DOMRect) => void;
  onFail: (id: string) => void;
  onReset: (id: string) => void; // Deprecated but kept for interface compatibility if needed upstream
  onDelete: (id: string) => void;
  onToggleDaily?: (id: string) => void; 
}

const rankColorMap: Record<Rank, string> = {
  'S': '#fbbf24', // Amber
  'A': '#ef4444', // Red
  'B': '#a855f7', // Purple
  'C': '#3b82f6', // Blue
  'D': '#10b981', // Green
  'E': '#9ca3af', // Gray
};

export const STAT_COLORS: Record<string, string> = {
  strength: '#707EC2',
  focus: '#E06A8F',
  willpower: '#C9D61B',
  intelligence: '#B19976',
  social: '#7a8c7a',
  discipline: '#AAB6BC'
};

const QuestCard: React.FC<QuestCardProps> = ({ quest, onComplete, onFail, onReset, onDelete, onToggleDaily }) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Mini Quest Logic (Deprecated but kept for compat if data exists)
  const [isMiniView, setIsMiniView] = useState(false);
  const displayTitle = isMiniView && quest.miniQuest ? quest.miniQuest : quest.title;

  // --- TIMER LOGIC ---
  useEffect(() => {
      if (quest.isCompleted || quest.failed || !quest.expiresAt) return;

      const updateTimer = () => {
          const now = Date.now();
          const diff = (quest.expiresAt || 0) - now;

          if (diff <= 0) {
              setTimeLeft("Expired");
          } else {
              const hours = Math.floor(diff / (1000 * 60 * 60));
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
              else setTimeLeft(`${minutes}m`);
          }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
  }, [quest.expiresAt, quest.isCompleted, quest.failed]);

  const handleComplete = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      // Coin reward is now triggered by parent after validation checks
      const rect = e.currentTarget.getBoundingClientRect();
      onComplete(quest.id, isMiniView, rect);
  };

  const handleFail = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      onFail(quest.id);
  };

  // Styles based on state
  const isCompleted = quest.isCompleted;
  const isFailed = quest.failed;
  
  // Resolve Stat Color
  const statKey = quest.category ? quest.category.toLowerCase() : 'discipline';
  const baseColor = STAT_COLORS[statKey] || '#374151';
  const successColor = '#10b981'; // Tailwind system-success green
  
  let borderBackground = baseColor;
  // Use lower opacity for glass feel
  let cardBackground = `linear-gradient(135deg, ${baseColor}10, ${baseColor}30)`;

  if (isFailed) {
      borderBackground = '#7f1d1d';
      cardBackground = 'rgba(127, 29, 29, 0.1)';
  } else if (isCompleted) {
      // 70% Stat Color -> 30% Success Green (Visual split)
      // We start transitioning at 70% to ensure the dominant color is the stat color
      borderBackground = `linear-gradient(135deg, ${baseColor} 0%, ${baseColor} 70%, ${successColor} 100%)`;
      cardBackground = `linear-gradient(135deg, ${baseColor}20 0%, ${baseColor}20 70%, ${successColor}20 100%)`;
  }

  // Format last completed date
  const lastCompletedStr = quest.lastCompletedAt 
    ? new Date(quest.lastCompletedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative rounded-2xl mb-3 group transition-all duration-300 backdrop-blur-md shadow-lg ${isCompleted || isFailed ? 'opacity-75' : 'opacity-100 hover:brightness-110'}`}
    >
        {/* --- GRADIENT BORDER LAYER --- */}
        <div 
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ 
                padding: '1px', 
                background: borderBackground,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
            }} 
        />

        {/* --- MAIN CONTENT LAYER --- */}
        <div 
            className="relative rounded-2xl p-5 h-full w-full bg-black/20"
            style={{ background: cardBackground }}
        >
            {/* Stat Label Badge */}
            <div className="absolute top-0 right-0 px-3 py-1 bg-black/40 rounded-bl-xl border-l border-b border-inherit backdrop-blur-sm" style={{ borderColor: isCompleted ? successColor : isFailed ? '#7f1d1d' : `${baseColor}40` }}>
                <span className="text-[9px] font-black font-mono tracking-widest uppercase" style={{ color: isCompleted ? successColor : isFailed ? '#ef4444' : baseColor }}>
                    {quest.category || 'GENERAL'}
                </span>
            </div>

            <div className="flex justify-between items-center gap-4">
                
                {/* Left Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] font-bold font-mono tracking-wide px-1.5 py-0.5 rounded bg-black/40 border border-white/10 ${isCompleted ? 'text-gray-400' : 'text-white'}`}>
                            {quest.rank}-RANK
                        </span>
                        {quest.isDaily && (
                            <div className="flex items-center gap-1 text-[9px] font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/10" style={{ color: isCompleted ? successColor : baseColor }}>
                                <Repeat size={10} /> Daily
                            </div>
                        )}
                        {quest.scheduledTime && (
                            <div className="flex items-center gap-1 text-[9px] font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/10 text-system-neon">
                                <Clock size={10} /> {quest.scheduledTime}
                            </div>
                        )}
                    </div>

                    <h3 className={`text-base font-bold font-mono tracking-tight mb-2 truncate ${isCompleted ? 'text-gray-400 line-through decoration-system-success/50' : 'text-white'}`}>
                        {displayTitle}
                    </h3>
                    
                    {/* Meta Info Row */}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-mono">
                        {/* Last Completed Date for Dailies */}
                        {quest.isDaily && lastCompletedStr && (
                            <div className="flex items-center gap-1 opacity-70">
                                <Calendar size={10} /> Last: {lastCompletedStr}
                            </div>
                        )}

                        {quest.estimatedDuration && (
                            <div className="flex items-center gap-1 opacity-70">
                                ~{quest.estimatedDuration}m
                            </div>
                        )}

                        {isFailed && <span className="text-red-500 font-bold bg-red-950/50 px-2 py-0.5 rounded border border-red-900">FAILED</span>}
                        {isCompleted && <span className="text-system-success font-bold bg-green-950/50 px-2 py-0.5 rounded border border-green-900">COMPLETED</span>}
                    </div>
                </div>

                {/* Right Interactive Area */}
                <div className="flex flex-col items-end gap-2 shrink-0 pt-4">
                    
                    {/* Actions Row */}
                    <div className="flex items-center gap-2">
                        {/* ACTIVE STATE ACTIONS */}
                        {!isCompleted && !isFailed && (
                            <div className="flex items-center gap-2">
                                {/* Fail Button */}
                                <button
                                    onClick={handleFail}
                                    className="w-8 h-8 rounded-full border border-red-900/50 bg-black/20 flex items-center justify-center text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                                    title="I Failed"
                                >
                                    <X size={14} />
                                </button>

                                {/* Complete Button */}
                                <button
                                    onClick={handleComplete}
                                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-lg bg-black/20 hover:bg-white/10 group/check relative overflow-hidden`}
                                    style={{ borderColor: baseColor }}
                                >   
                                    <div className="absolute inset-0 opacity-0 group-hover/check:opacity-20 transition-opacity" style={{ backgroundColor: baseColor }} />
                                    <Check size={24} className="text-white group-hover/check:scale-110 transition-transform relative z-10" strokeWidth={3} />
                                </button>
                            </div>
                        )}

                        {/* COMPLETED / FAILED STATE ACTIONS */}
                        {(isCompleted || isFailed) && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => onDelete(quest.id)}
                                    className="p-2 rounded-lg bg-black/40 border border-white/10 text-gray-500 hover:text-red-500 hover:border-red-500/50 transition-colors"
                                    title="Delete Quest"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bottom Row Controls */}
                    <div className="flex gap-2">
                        {onToggleDaily && (
                            <button 
                                onClick={() => onToggleDaily(quest.id)}
                                className={`p-1.5 rounded border transition-colors ${quest.isDaily ? 'bg-blue-900/20 border-blue-700 text-blue-400' : 'bg-transparent border-white/10 text-gray-600 hover:text-gray-400'}`}
                                title={quest.isDaily ? "Disable Daily Repeat" : "Enable Daily Repeat"}
                            >
                                <Repeat size={12} />
                            </button>
                        )}
                        
                        {!isCompleted && !isFailed && quest.miniQuest && (
                            <button 
                                onClick={() => setIsMiniView(!isMiniView)}
                                className={`p-1.5 rounded border transition-colors ${isMiniView ? 'bg-white/20 text-white' : 'bg-transparent border-white/10 text-gray-600 hover:text-white'}`}
                                title="Toggle Mini Mode"
                            >
                                <Zap size={12} />
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    </motion.div>
  );
};

export default QuestCard;
