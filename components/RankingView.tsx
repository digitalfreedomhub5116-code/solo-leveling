
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, Lock, AlertTriangle, ArrowUp, ArrowDown, Minus, Zap, Clock } from 'lucide-react';
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

const INDIAN_NAMES = [
    "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Muhammad", "Rohan", "Krishna", "Ishaan", "Shaurya",
    "Aarav", "Kabir", "Riyan", "Vivaan", "Dhruv", "Anaya", "Myra", "Saanvi", "Aadya", "Kiara",
    "Diya", "Pari", "Anaisha", "Fatima", "Zoya", "Riya", "Prisha", "Ahana", "Sarthak", "Neel",
    "Karan", "Vikram", "Rahul", "Priya", "Amit", "Sneha", "Rohit", "Pooja", "Ajay", "Nisha"
];

const RankingView: React.FC<RankingViewProps> = ({ currentPlayer }) => {
  const [status, setStatus] = useState<'LOCKED' | 'ACTIVE'>('ACTIVE');
  const [roster, setRoster] = useState<LeaderboardEntry[]>([]);
  const [timeToNextUpdate, setTimeToNextUpdate] = useState<number>(15);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const hasInitialized = useRef(false);

  // --- 1. INITIALIZATION & LOGIC ---
  useEffect(() => {
      if (hasInitialized.current) return;
      hasInitialized.current = true;

      // Rule: Player needs 7 quests to enter
      if (currentPlayer.quests.length < 7) {
          setStatus('LOCKED');
          return;
      }

      initializeSystem();
  }, [currentPlayer.quests.length]);

  // --- 2. INTELLIGENT SIMULATION LOOP ---
  useEffect(() => {
      if (status === 'LOCKED') return;

      let timer: ReturnType<typeof setTimeout>;
      let countdownInterval: ReturnType<typeof setInterval>;

      const scheduleNextUpdate = () => {
          // Intelligent random interval
          const options = [15, 30, 45, 60];
          const nextSeconds = options[Math.floor(Math.random() * options.length)];
          
          setTimeToNextUpdate(nextSeconds);

          // Countdown ticker
          countdownInterval = setInterval(() => {
              setTimeToNextUpdate(prev => {
                  if (prev <= 1) return 0;
                  return prev - 1;
              });
          }, 1000);

          // Trigger update after delay
          timer = setTimeout(() => {
              clearInterval(countdownInterval);
              triggerBotActivity();
              scheduleNextUpdate(); 
          }, nextSeconds * 1000);
      };

      scheduleNextUpdate();

      return () => {
          clearTimeout(timer);
          clearInterval(countdownInterval);
      };
  }, [status]);

  // --- 3. CORE FUNCTIONS ---

  const initializeSystem = () => {
      const storageKey = `shadow_ranking_v3_${currentPlayer.username}`; // v3 for trend logic
      const stored = localStorage.getItem(storageKey);
      const now = Date.now();
      
      let loadedRoster: LeaderboardEntry[] = [];
      let isFirstRun = false;

      // Sync Player Object
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
          const parsed = JSON.parse(stored);
          const lastSaveTime = parsed.timestamp;
          
          // CHECK RESET: New day (Midnight)
          const lastDate = new Date(lastSaveTime).getDate();
          const currDate = new Date(now).getDate();

          if (lastDate !== currDate) {
              // RESET DAY: Everything to 0, keep identities
              loadedRoster = parsed.data.map((b: LeaderboardEntry) => ({ 
                  ...b, xp: 0, lastRank: 0, trend: 'SAME' 
              }));
              // Re-insert player
              loadedRoster = loadedRoster.filter(u => !u.isPlayer);
              loadedRoster.push(playerEntry);
          } else {
              // SAME DAY: CALCULATE CATCH-UP
              const hoursElapsed = (now - lastSaveTime) / (1000 * 60 * 60);
              
              // Map over stored data to apply passive growth
              loadedRoster = parsed.data.map((entry: LeaderboardEntry) => {
                  if (entry.isPlayer) return { ...playerEntry, lastRank: entry.lastRank, trend: entry.trend }; // Update player current stats but keep old rank/trend for a moment
                  
                  // Bot Growth
                  const growth = Math.floor(entry.grindRate * hoursElapsed);
                  return {
                      ...entry,
                      xp: entry.xp + growth
                  };
              });
          }
      } else {
          // FIRST LOAD EVER
          loadedRoster = generateNewRoster();
          loadedRoster.push(playerEntry);
          isFirstRun = true;
      }

      // RENDER INITIAL STATE
      // Crucial: We set the roster strictly in the saved order first.
      // This ensures the DOM renders them in their "old" positions.
      setRoster([...loadedRoster]);

      if (!isFirstRun) {
          // VISUAL CATCH-UP SEQUENCE
          // Wait 1s for user to register the "Before" state, then animate to "After"
          setTimeout(() => {
              setIsAnimating(true);
              sortAndRank(loadedRoster);
              setTimeout(() => setIsAnimating(false), 1000);
          }, 1000);
      } else {
          // Instant sort for fresh account
          sortAndRank(loadedRoster);
      }
  };

  const generateNewRoster = (): LeaderboardEntry[] => {
      const bots: LeaderboardEntry[] = [];
      const names = [...INDIAN_NAMES].sort(() => 0.5 - Math.random());
      
      const now = new Date();
      const startOfDay = new Date(now).setHours(0,0,0,0);
      const hoursSinceMidnight = Math.max(0, (now.getTime() - startOfDay) / (1000 * 60 * 60) - 6); 

      for (let i = 0; i < ROSTER_SIZE - 1; i++) {
          const grindRate = Math.floor(Math.random() * 60) + 15; 
          const startXp = Math.floor(grindRate * hoursSinceMidnight);

          bots.push({
              id: `bot_${i}`,
              name: names[i],
              isPlayer: false,
              xp: startXp,
              avatarColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)],
              grindRate: grindRate,
              lastRank: i + 1, // Placeholder
              trend: 'SAME'
          });
      }
      return bots;
  };

  const triggerBotActivity = () => {
      setIsAnimating(true);
      setRoster(currentRoster => {
          // 1. Give XP to random bots
          const updated = currentRoster.map(bot => {
              if (bot.isPlayer) return { ...bot, xp: currentPlayer.dailyXp || 0 };
              
              const chance = bot.grindRate / 100; 
              if (Math.random() < chance) {
                  const gain = Math.floor(Math.random() * 35) + 15; 
                  return { ...bot, xp: bot.xp + gain };
              }
              return bot;
          });

          // 2. Pass to sorter which handles Rank & Trend logic
          return calculateRankings(updated);
      });
      setTimeout(() => setIsAnimating(false), 800);
  };

  // Wrapper for external calls
  const sortAndRank = (list: LeaderboardEntry[]) => {
      setRoster(calculateRankings(list));
  };

  const calculateRankings = (list: LeaderboardEntry[]): LeaderboardEntry[] => {
      // 1. Sort by XP (Desc)
      const sorted = [...list].sort((a, b) => b.xp - a.xp);

      // 2. Assign Ranks & Determine Trends
      const ranked = sorted.map((entry, index) => {
          const newRank = index + 1;
          const oldRank = entry.lastRank || newRank; // Fallback for first run

          let trend: Trend = 'SAME';
          if (newRank < oldRank) trend = 'UP';
          if (newRank > oldRank) trend = 'DOWN';

          return {
              ...entry,
              lastRank: newRank, // This becomes the "old" rank for the next cycle
              trend: trend
          };
      });

      saveRoster(ranked);
      return ranked;
  };

  const saveRoster = (fullRoster: LeaderboardEntry[]) => {
      const storageKey = `shadow_ranking_v3_${currentPlayer.username}`;
      localStorage.setItem(storageKey, JSON.stringify({
          timestamp: Date.now(),
          data: fullRoster
      }));
  };

  // --- RENDER HELPERS ---
  const getRankIcon = (rank: number) => {
      if (rank === 1) return <Crown size={20} className="text-yellow-500 fill-yellow-500/20 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
      if (rank === 2) return <Medal size={20} className="text-gray-300 fill-gray-300/20" />;
      if (rank === 3) return <Medal size={20} className="text-orange-600 fill-orange-600/20" />;
      return <span className="font-mono font-bold text-gray-500 w-6 text-center">{rank}</span>;
  };

  const getTrendIcon = (trend: Trend) => {
      if (trend === 'UP') return <ArrowUp size={12} className="text-green-400" />;
      if (trend === 'DOWN') return <ArrowDown size={12} className="text-red-800 opacity-50" />;
      return <Minus size={12} className="text-gray-800" />;
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
                    <Clock size={10} /> NEXT UPDATE: {timeToNextUpdate}s
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
             {/* Using 'layout' prop for automatic smooth reordering */}
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
                        backgroundColor: isMe ? 'rgba(0, 210, 255, 0.25)' : 'rgba(16, 185, 129, 0.1)'
                    };
                }

                return (
                   <motion.div 
                      layout
                      key={user.id} 
                      // Snappy but heavy physics for card swapping
                      transition={{ 
                          type: "spring", 
                          stiffness: 70, 
                          damping: 12,
                          mass: 0.8
                      }}
                      animate={animationProps}
                      className={`flex items-center justify-between p-3 md:p-4 rounded-xl border relative overflow-hidden ${bgStyle} ${isAscending ? 'border-green-500/30' : ''}`}
                   >
                      {/* Left: Rank & Info */}
                      <div className="flex items-center gap-4 z-10">
                         <div className="flex flex-col items-center justify-center w-8 relative gap-1">
                            {/* Animated Rank Icon/Number */}
                            <motion.div
                                key={rank} // Forces re-render animation when rank changes
                                initial={{ rotateX: -90, opacity: 0 }}
                                animate={{ rotateX: 0, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                {getRankIcon(rank)}
                            </motion.div>
                            
                            {/* Trend Indicator */}
                            <div className="h-3 flex items-center justify-center">
                                {getTrendIcon(user.trend)}
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
                               
                               {/* Persistent Rank Change Indicator */}
                               {isAscending && (
                                   <div className="text-[9px] text-green-400 font-mono flex items-center gap-1 mt-0.5 animate-pulse">
                                       <ArrowUp size={10} /> ASCENDED
                                   </div>
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
                                 <Zap size={8} className="text-yellow-500" fill="currentColor" /> Quest Complete
                             </div>
                         )}
                      </div>
                      
                      {/* Ascension Glow Overlay */}
                      {isAscending && (
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-transparent pointer-events-none" />
                      )}
                   </motion.div>
                );
             })}
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
