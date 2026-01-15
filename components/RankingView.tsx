
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, Lock, AlertTriangle, ArrowUp, ArrowDown, Minus, Zap, Clock, TrendingUp } from 'lucide-react';
import { PlayerData } from '../types';

interface RankingViewProps {
  currentPlayer: PlayerData;
}

type Trend = 'UP' | 'DOWN' | 'SAME';

interface LeaderboardEntry {
  id: string;
  name: string;
  isPlayer: boolean;
  xp: number;
  avatarColor: string;
  grindRate: number; // XP per hour capability
  lastRank: number; // Previous rank for tracking
  trend: Trend; // Visual indicator state
}

// --- CONFIGURATION ---
const ROSTER_SIZE = 15; 
const TIMER_KEY = 'shadow_ranking_next_update';

const INDIAN_NAMES = [
    "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Muhammad", "Rohan", "Krishna", "Ishaan", "Shaurya",
    "Aarav", "Kabir", "Riyan", "Vivaan", "Dhruv", "Anaya", "Myra", "Saanvi", "Aadya", "Kiara",
    "Diya", "Pari", "Anaisha", "Fatima", "Zoya", "Riya", "Prisha", "Ahana", "Sarthak", "Neel",
    "Karan", "Vikram", "Rahul", "Priya", "Amit", "Sneha", "Rohit", "Pooja", "Ajay", "Nisha"
];

const RankingView: React.FC<RankingViewProps> = ({ currentPlayer }) => {
  const STORAGE_KEY = `shadow_ranking_v3_${currentPlayer.username}`;

  // --- LAZY INIT STATE ---
  const [roster, setRoster] = useState<LeaderboardEntry[]>(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const playerEntry: LeaderboardEntry = {
          id: 'player_me',
          name: currentPlayer.username || 'You',
          isPlayer: true,
          xp: currentPlayer.dailyXp || 0,
          avatarColor: '#00d2ff',
          grindRate: 0,
          lastRank: 0,
          trend: 'SAME'
      };

      if (stored) {
          try {
              const parsed = JSON.parse(stored);
              return parsed.data; // Return saved state as-is (unsorted relative to new XP potentially)
          } catch (e) {
              console.error("Leaderboard Corrupt", e);
          }
      }
      
      // Fallback: Generate new if empty
      const bots = [];
      const names = [...INDIAN_NAMES].sort(() => 0.5 - Math.random());
      for (let i = 0; i < ROSTER_SIZE - 1; i++) {
          const grindRate = Math.floor(Math.random() * 60) + 15; 
          bots.push({
              id: `bot_${i}`,
              name: names[i],
              isPlayer: false,
              xp: Math.floor(Math.random() * 500), // Random start XP
              avatarColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)],
              grindRate: grindRate,
              lastRank: i + 1,
              trend: 'SAME' as Trend
          });
      }
      bots.push(playerEntry);
      return bots; // Return unsorted mixed list
  });

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [status, setStatus] = useState<'LOCKED' | 'ACTIVE'>('ACTIVE');

  // --- HELPER: SAVE ---
  const saveRoster = (data: LeaderboardEntry[]) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: data
      }));
  };

  // --- HELPER: SORT & RANK ---
  const processRankings = (data: LeaderboardEntry[]) => {
      // 1. Sort by XP Descending
      const sorted = [...data].sort((a, b) => b.xp - a.xp);

      // 2. Assign Ranks & Trends
      const ranked = sorted.map((entry, index) => {
          const newRank = index + 1;
          const oldRank = entry.lastRank || 999; // Default to low rank if new

          let trend: Trend = 'SAME';
          if (newRank < oldRank) trend = 'UP';
          else if (newRank > oldRank) trend = 'DOWN';
          else trend = 'SAME';

          // Persist trend if it was already UP and rank hasn't changed this specific tick?
          // No, recalc every time is safer for "instant" feel.

          return {
              ...entry,
              lastRank: newRank,
              trend: trend
          };
      });

      return ranked;
  };

  // --- EFFECT: MOUNT LOGIC (ANIMATION TRIGGER) ---
  useEffect(() => {
      // 1. Check Lock
      if (currentPlayer.quests.length < 7) {
          setStatus('LOCKED');
          return;
      }

      // 2. Sync Data & Trigger Animation
      // We purposefully wait a tick so the initial render happens (showing old order/stats)
      // Then we update states which triggers the layout animation.
      const mountTimer = setTimeout(() => {
          setIsAnimating(true);

          setRoster(prevRoster => {
              // A. Update Player XP Live
              let updated = prevRoster.map(entry => {
                  if (entry.isPlayer) {
                      return { ...entry, xp: currentPlayer.dailyXp || 0 };
                  }
                  return entry;
              });

              // B. Check Background Timer for Bot Updates
              const now = Date.now();
              const nextUpdateStr = localStorage.getItem(TIMER_KEY);
              let nextUpdate = nextUpdateStr ? parseInt(nextUpdateStr, 10) : 0;

              if (!nextUpdate || now >= nextUpdate) {
                  // Time passed! Give bots some XP
                  updated = updated.map(bot => {
                      if (bot.isPlayer) return bot;
                      // Chance to gain XP
                      if (Math.random() > 0.4) {
                          const gain = Math.floor(Math.random() * 40) + 10;
                          return { ...bot, xp: bot.xp + gain };
                      }
                      return bot;
                  });
                  
                  // Reset Timer (15-60s)
                  const delay = (Math.floor(Math.random() * 45) + 15) * 1000;
                  localStorage.setItem(TIMER_KEY, (now + delay).toString());
              }

              // C. Process Ranks
              const finalRoster = processRankings(updated);
              saveRoster(finalRoster);
              return finalRoster;
          });

          // End animation state after transition
          setTimeout(() => setIsAnimating(false), 800);
      }, 150); // 150ms delay for DOM paint

      return () => clearTimeout(mountTimer);
  }, []); // Run once on mount

  // --- EFFECT: BACKGROUND TIMER (UI UPDATE ONLY) ---
  useEffect(() => {
      if (status === 'LOCKED') return;

      const interval = setInterval(() => {
          const now = Date.now();
          const nextUpdateStr = localStorage.getItem(TIMER_KEY);
          let nextUpdate = nextUpdateStr ? parseInt(nextUpdateStr, 10) : 0;

          if (!nextUpdate) {
              // Initialize if missing
              nextUpdate = now + 30000;
              localStorage.setItem(TIMER_KEY, nextUpdate.toString());
          }

          const diff = Math.ceil((nextUpdate - now) / 1000);
          
          if (diff <= 0) {
              // Timer hit zero.
              // We could trigger a re-sort here, but to avoid jarring shifts while viewing,
              // we usually let the next mount handle heavy updates, or update silently.
              // For "Bio-Sync", let's trigger a live update for immersion.
              
              // Set new time immediately to prevent loop
              localStorage.setItem(TIMER_KEY, (now + 30000).toString());
              
              // Trigger Update
              setIsAnimating(true);
              setRoster(prev => {
                  const updated = prev.map(bot => {
                      if (bot.isPlayer) return { ...bot, xp: currentPlayer.dailyXp || 0 };
                      if (Math.random() > 0.6) {
                          return { ...bot, xp: bot.xp + Math.floor(Math.random() * 25) };
                      }
                      return bot;
                  });
                  const ranked = processRankings(updated);
                  saveRoster(ranked);
                  return ranked;
              });
              setTimeout(() => setIsAnimating(false), 800);
          } else {
              setTimeLeft(diff);
          }
      }, 1000);

      return () => clearInterval(interval);
  }, [status, currentPlayer.dailyXp]);

  // --- RENDER HELPERS ---
  const getRankIcon = (rank: number) => {
      if (rank === 1) return <Crown size={20} className="text-yellow-500 fill-yellow-500/20 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
      if (rank === 2) return <Medal size={20} className="text-gray-300 fill-gray-300/20" />;
      if (rank === 3) return <Medal size={20} className="text-orange-600 fill-orange-600/20" />;
      return <span className="font-mono font-bold text-gray-500 w-6 text-center">{rank}</span>;
  };

  // --- VIEW: LOCKED ---
  if (status === 'LOCKED') {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
              <div className="w-24 h-24 rounded-full bg-gray-900 border-2 border-dashed border-gray-700 flex items-center justify-center">
                  <Lock size={32} className="text-gray-500" />
              </div>
              <div>
                  <h2 className="text-2xl font-black text-white font-mono mb-2">LEAGUE LOCKED</h2>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto font-mono">
                      Minimum Qualification Not Met.
                  </p>
              </div>
              <div className="bg-red-900/10 border border-red-900/50 p-4 rounded-xl max-w-sm">
                  <div className="flex items-center gap-3 mb-2 text-red-400 font-bold font-mono text-xs">
                      <AlertTriangle size={14} /> ENTRY REQUIREMENT
                  </div>
                  <p className="text-xs text-gray-400 text-left">
                      You must have at least <span className="text-white font-bold">7 Active Quests</span> in your log to participate in the Daily Tournament.
                  </p>
                  <div className="mt-3 text-right text-xs font-mono text-red-500">
                      CURRENT: {currentPlayer.quests.length} / 7
                  </div>
              </div>
          </div>
      );
  }

  // --- VIEW: ACTIVE ---
  const playerRank = roster.findIndex(u => u.isPlayer) + 1;
  const isQualified = (currentPlayer.dailyXp || 0) > 0;

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full px-2 relative">
       
       {/* HEADER */}
       <div className="flex justify-between items-end mb-6 border-b border-system-border pb-4 sticky top-0 bg-system-bg z-20 pt-2">
          <div>
             <div className="flex items-center gap-2 mb-1">
                 <Trophy className="text-yellow-500" size={20} />
                 <span className="text-[10px] text-yellow-500 font-mono tracking-widest uppercase font-bold">DAILY TOURNAMENT</span>
             </div>
             <h1 className="text-2xl font-black text-white font-mono tracking-tighter">
                LEADERBOARD
             </h1>
             <div className="flex items-center gap-2 mt-1">
                 <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                    TOP 3 EARN GOLD. RESET: MIDNIGHT
                 </p>
                 <div className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded border border-gray-800 text-[8px] text-gray-400 font-mono">
                    <Clock size={10} /> NEXT UPDATE: {timeLeft}s
                 </div>
             </div>
          </div>
          <div className="text-right">
              <div className="text-[10px] text-gray-500 font-mono mb-1">YOUR RANK</div>
              <div className={`text-2xl font-black font-mono leading-none ${playerRank <= 3 ? 'text-system-neon' : 'text-white'}`}>
                  #{isQualified ? playerRank : '-'}
              </div>
          </div>
       </div>

       {/* LIST */}
       <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 relative min-h-[400px]">
          <div className="space-y-2 relative">
             <AnimatePresence>
             {roster.map((user) => {
                const index = roster.findIndex(u => u.id === user.id);
                const rank = index + 1;
                const isMe = user.isPlayer;
                const isAscending = user.trend === 'UP';

                let bgStyle = isMe ? "bg-system-neon/10 border-system-neon/50" : "bg-gray-900/30 border-gray-800";
                if (rank === 1 && !isMe) bgStyle = "bg-yellow-900/10 border-yellow-500/30";
                
                // Highlight styles for Ascension
                let animationProps = { scale: 1, backgroundColor: isMe ? 'rgba(0, 210, 255, 0.1)' : 'rgba(17, 24, 39, 0.3)' };
                if (isAscending && isAnimating) {
                    animationProps = {
                        scale: 1.02,
                        backgroundColor: isMe ? 'rgba(0, 210, 255, 0.25)' : 'rgba(16, 185, 129, 0.15)'
                    };
                }

                return (
                   <motion.div 
                      layout
                      key={user.id} 
                      // Optimized spring physics for smoother shuffling
                      transition={{ 
                          type: "spring", 
                          stiffness: 60, 
                          damping: 15,
                          mass: 1
                      }}
                      animate={animationProps}
                      className={`flex items-center justify-between p-3 md:p-4 rounded-xl border relative overflow-hidden ${bgStyle} ${isAscending ? 'border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : ''}`}
                   >
                      {/* Left: Rank & Info */}
                      <div className="flex items-center gap-4 z-10">
                         <div className="flex flex-col items-center justify-center w-8 relative gap-1">
                            {/* Rank Icon */}
                            <div>{getRankIcon(rank)}</div>
                            
                            {/* Trend Icon */}
                            <div className="h-3 flex items-center justify-center">
                                {user.trend === 'UP' && <ArrowUp size={12} className="text-green-400" />}
                                {user.trend === 'DOWN' && <ArrowDown size={12} className="text-red-800 opacity-50" />}
                                {user.trend === 'SAME' && <Minus size={12} className="text-gray-800" />}
                            </div>
                         </div>
                         
                         {/* Avatar & Name */}
                         <div className="flex items-center gap-3">
                            <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-white/20"
                                style={{ backgroundColor: user.avatarColor }}
                            >
                                {user.name.substring(0, 1)}
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <span className={`font-bold font-mono text-sm ${isMe ? 'text-system-neon' : 'text-gray-200'}`}>
                                     {user.name}
                                  </span>
                                  {isMe && <span className="text-[8px] bg-system-neon text-black px-1.5 rounded font-bold tracking-wider">YOU</span>}
                                </div>
                               
                               {/* Ascended Mark */}
                               {isAscending && (
                                   <motion.div 
                                     initial={{ opacity: 0, x: -5 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     className="text-[9px] text-green-400 font-mono flex items-center gap-1 mt-0.5 font-bold"
                                   >
                                       <TrendingUp size={10} /> ASCENDED
                                   </motion.div>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Right: XP */}
                      <div className="text-right z-10">
                         <div className="text-sm font-black text-white font-mono flex items-center justify-end gap-1">
                            {user.xp} <span className="text-[10px] text-gray-500">XP</span>
                         </div>
                         {/* Activity Text */}
                         {!isMe && isAscending && (
                             <div className="text-[8px] text-gray-500 font-mono flex items-center justify-end gap-1 mt-1 opacity-70">
                                 <Zap size={8} className="text-yellow-500" fill="currentColor" /> Activity
                             </div>
                         )}
                      </div>
                      
                      {/* Ascension Glow Overlay */}
                      {isAscending && (
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-transparent pointer-events-none" />
                      )}
                   </motion.div>
                );
             })}
             </AnimatePresence>
          </div>
       </div>

       {/* MY RANK STICKY FOOTER (If active and scrolled away) */}
       {isQualified && playerRank > 6 && (
           <motion.div 
             initial={{ y: 100 }}
             animate={{ y: 0 }}
             className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-30"
           >
               <div className="bg-system-neon text-black p-4 rounded-xl shadow-[0_0_30px_#00d2ff] flex justify-between items-center font-mono border-2 border-white relative overflow-hidden">
                   <div className="absolute inset-0 bg-white/20 animate-pulse" />
                   <div className="flex items-center gap-3 relative z-10">
                       <span className="font-black text-xl">#{playerRank}</span>
                       <div className="flex flex-col">
                           <span className="font-bold text-xs">YOUR POSITION</span>
                           <span className="text-[9px] opacity-80">{playerRank <= 5 ? "THE PODIUM IS CLOSE" : "PUSH HARDER"}</span>
                       </div>
                   </div>
                   <div className="font-black text-lg relative z-10">
                       {currentPlayer.dailyXp || 0} XP
                   </div>
               </div>
           </motion.div>
       )}

    </div>
  );
};

export default RankingView;
