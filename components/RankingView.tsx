
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, ArrowUp, ArrowDown, Target as TargetIcon, Activity, Sword, Shield, Zap, Skull, Medal } from 'lucide-react';
import { PlayerData } from '../types';

interface RankingViewProps {
  currentPlayer: PlayerData;
}

type Trend = 'UP' | 'DOWN' | 'SAME';

// Extended Interface for internal logic
interface LeaderboardEntry {
  id: string;
  name: string;
  isPlayer: boolean;
  xp: number;
  avatarColor: string;
  grindPower: number; 
  lastRank: number; 
  trend: Trend; 
  status: 'GRINDING' | 'RESTING' | 'OVERDRIVE';
  tier: number; 
  classType: 'ASSASSIN' | 'TANK' | 'MAGE' | 'FIGHTER' | 'HEALER'; // RPG Flavor
}

const ROSTER_SIZE = 15;
const BOT_NAMES = [
    "Arjun", "Reyansh", "Vihaan", "Aditya", "Ishaan", "Shaurya", "Aarav", 
    "Kabir", "Riyan", "Vivaan", "Anaya", "Saanvi", "Aadya", "Kiara", "Diya"
];

// XP BANDS CONFIGURATION
const XP_BANDS = [
    { tier: 1, min: 5600, max: 6210 }, 
    { tier: 2, min: 5200, max: 5590 }, 
    { tier: 3, min: 4800, max: 5190 }, 
    { tier: 6, min: 4200, max: 4790 }, 
    { tier: 10, min: 3000, max: 4190 }, 
    { tier: 15, min: 1000, max: 2990 } 
];

const getBandMax = (tier: number) => {
    const band = XP_BANDS.find(b => tier <= b.tier);
    return band ? band.max : 2990;
};

const getHunterClass = (rank: number) => {
    if (rank === 1) return "NATIONAL LEVEL";
    if (rank <= 3) return "S-RANK";
    if (rank <= 7) return "A-RANK";
    return "B-RANK";
};

const getClassIcon = (type: string) => {
    switch(type) {
        case 'ASSASSIN': return <Sword size={12} />;
        case 'TANK': return <Shield size={12} />;
        case 'MAGE': return <Zap size={12} />;
        case 'HEALER': return <Activity size={12} />;
        default: return <Skull size={12} />;
    }
};

const RankingView: React.FC<RankingViewProps> = ({ currentPlayer }) => {
  const username = currentPlayer.username || 'User';
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Storage Keys
  const CONFIG_KEY = `shadow_arena_config_${username}`; 
  const DAILY_KEY = `shadow_arena_daily_${username}_${todayStr}`; 

  const [roster, setRoster] = useState<LeaderboardEntry[]>([]);
  const [isReady, setIsReady] = useState(false);
  const simInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const now = Date.now();
    
    // 1. Load Long-term Config
    let config = {
        bots: [] as Partial<LeaderboardEntry>[],
        lastTop3Timestamp: 0,
        wasTop3Yesterday: false,
        lastLoginDate: ''
    };
    
    try {
        const savedConfig = localStorage.getItem(CONFIG_KEY);
        if (savedConfig) config = JSON.parse(savedConfig);
    } catch (e) { console.error("Config Load Error", e); }

    // 2. Daily Reset Logic check
    if (config.lastLoginDate !== todayStr) {
        config.lastLoginDate = todayStr;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    }

    // 3. Load Daily State
    let dailyData: { xpMap: Record<string, number>, lastUpdated: number } | null = null;
    try {
        const savedDaily = localStorage.getItem(DAILY_KEY);
        if (savedDaily) dailyData = JSON.parse(savedDaily);
    } catch (e) { console.error("Daily Load Error", e); }

    // 4. Generate Roster
    let currentRoster: LeaderboardEntry[] = [];
    
    // If no bots in config, generate them
    if (!config.bots || config.bots.length === 0) {
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        const classes = ['ASSASSIN', 'TANK', 'MAGE', 'FIGHTER', 'HEALER'];
        const shuffledNames = [...BOT_NAMES].sort(() => 0.5 - Math.random());
        
        config.bots = shuffledNames.slice(0, ROSTER_SIZE - 1).map((name, i) => ({
            id: `bot_${name}`,
            name,
            isPlayer: false,
            avatarColor: colors[i % colors.length],
            grindPower: 1, 
            tier: i + 1, 
            classType: classes[i % classes.length] as any
        }));
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    }

    // Merge Config with Daily XP
    currentRoster = config.bots.map((bot) => {
        const randomStart = 300 + (Math.floor(Math.random() * 11) * 10);
        const startXp = dailyData ? (dailyData.xpMap[bot.id!] || randomStart) : randomStart;
        const tier = bot.tier ?? 15;
        
        return {
            id: bot.id!,
            name: bot.name!,
            isPlayer: false,
            xp: startXp,
            avatarColor: bot.avatarColor!,
            grindPower: tier === 1 ? 1.5 : tier <= 3 ? 1.3 : 1.1,
            tier: tier,
            classType: bot.classType || 'FIGHTER',
            lastRank: 0,
            trend: 'SAME',
            status: 'GRINDING'
        } as LeaderboardEntry;
    });

    // Add Player
    currentRoster.push({
        id: 'player_main',
        name: currentPlayer.username || 'You',
        isPlayer: true,
        xp: currentPlayer.dailyXp || 0,
        avatarColor: '#00d2ff',
        grindPower: 0,
        tier: 0,
        classType: 'ASSASSIN', // Player default
        lastRank: ROSTER_SIZE,
        trend: 'SAME',
        status: 'GRINDING'
    });

    // 5. Offline Catch-up
    if (dailyData) {
        const secondsPassed = (now - dailyData.lastUpdated) / 1000;
        if (secondsPassed > 60) {
            const catchUpTicks = Math.floor(secondsPassed / 30);
            const cappedTicks = Math.min(catchUpTicks, 120); 
            
            currentRoster.forEach(bot => {
                if (!bot.isPlayer) {
                    let gain = 0;
                    for(let i=0; i<cappedTicks; i++) {
                        if(Math.random() > 0.4) gain += 10; 
                    }
                    const max = getBandMax(bot.tier);
                    bot.xp = Math.min(max, bot.xp + gain);
                }
            });
        }
    }

    const sorted = sortAndLabel(currentRoster);
    setRoster(sorted);
    setIsReady(true);
  }, [currentPlayer.username, currentPlayer.dailyXp]);

  // --- AUTO SCROLL ---
  useEffect(() => {
      if (isReady) {
          setTimeout(() => {
              const playerEl = document.getElementById('current-player-card');
              if (playerEl) {
                  playerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
          }, 500);
      }
  }, [isReady]);

  const saveDaily = (data: LeaderboardEntry[]) => {
      const xpMap: Record<string, number> = {};
      data.forEach(d => { if(!d.isPlayer) xpMap[d.id] = d.xp; });
      localStorage.setItem(DAILY_KEY, JSON.stringify({
          xpMap,
          lastUpdated: Date.now()
      }));
  };

  const sortAndLabel = (data: LeaderboardEntry[]): LeaderboardEntry[] => {
    const sorted = [...data].sort((a, b) => b.xp - a.xp);
    return sorted.map((entry, index) => {
      const currentRank = index + 1;
      const prevRank = entry.lastRank || currentRank;
      
      let newTrend: Trend = 'SAME';
      if (currentRank < prevRank) newTrend = 'UP';
      else if (currentRank > prevRank) newTrend = 'DOWN';

      return {
          ...entry,
          trend: newTrend,
          lastRank: currentRank,
          status: entry.isPlayer ? 'GRINDING' : (entry.status === 'OVERDRIVE' ? 'OVERDRIVE' : (Math.random() > 0.7 ? 'GRINDING' : 'RESTING'))
      };
    });
  };

  // --- SIMULATION ENGINE ---
  useEffect(() => {
    if (!isReady) return;

    simInterval.current = setInterval(() => {
      setRoster(prev => {
        const playerXp = currentPlayer.dailyXp || 0; 
        const tempSorted = [...prev].map(p => p.isPlayer ? { ...p, xp: playerXp } : p).sort((a, b) => b.xp - a.xp);
        const playerRank = tempSorted.findIndex(p => p.isPlayer) + 1;
        const topBot = tempSorted.find(p => !p.isPlayer);
        
        let rubberBandMode = false;
        if (playerRank === 1 && topBot) {
            const gap = playerXp - topBot.xp;
            if (gap > 600) rubberBandMode = true;
        }

        const next = prev.map(bot => {
          if (bot.isPlayer) return { ...bot, xp: playerXp };

          let change = 0;
          const roll = Math.random();
          let currentStatus = bot.status;

          if (rubberBandMode && bot.tier <= 5) {
              currentStatus = 'OVERDRIVE';
              const surge = 50 + Math.floor(Math.random() * 200); 
              change = surge;
          } 
          else {
              if (currentStatus === 'OVERDRIVE') currentStatus = 'GRINDING';
              if (roll < 0.50) {
                  const base = (Math.floor(Math.random() * 3) + 1) * 10;
                  change = Math.round((base * bot.grindPower) / 10) * 10;
              } 
              else if (roll < 0.80) {
                  change = -(Math.floor(Math.random() * 2) + 1) * 10;
              }
              const distToPlayer = Math.abs(bot.xp - playerXp);
              if (distToPlayer <= 20) {
                  if (Math.random() > 0.5) change += 10;
                  else change -= 10;
              }
          }

          let max = getBandMax(bot.tier);
          if (rubberBandMode && bot.tier <= 5) max = playerXp + 500;

          let newXp = bot.xp + change;
          if (newXp > max) newXp = max;
          if (newXp < 0) newXp = 0;

          return { ...bot, xp: newXp, status: currentStatus };
        });

        const newSorted = sortAndLabel(next);
        saveDaily(newSorted);
        return newSorted;
      });
    }, 10000);

    return () => { if (simInterval.current) clearInterval(simInterval.current); };
  }, [isReady, currentPlayer.dailyXp]);

  const playerRank = roster.findIndex(u => u.isPlayer) + 1;
  const rival = playerRank > 1 ? roster[playerRank - 2] : null;

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full px-2 font-mono selection:bg-system-neon">
       
       {/* LEAGUE BANNER */}
       <div className="relative mb-6 rounded-2xl overflow-hidden border border-system-border bg-black shadow-[0_0_40px_rgba(0,0,0,0.6)]">
           <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/20 via-black to-blue-900/20 opacity-50" />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
           
           <div className="relative z-10 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center border-4 border-black shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                        <Trophy size={32} className="text-black" />
                   </div>
                   <div>
                       <div className="text-xs text-yellow-500 font-bold uppercase tracking-[0.3em] mb-1">Current League</div>
                       <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">PLATINUM DIVISION</h1>
                       <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] text-gray-400">Season Ends in 12 Days</span>
                           <span className="w-1 h-1 bg-gray-600 rounded-full" />
                           <span className="text-[10px] text-system-neon">Top 10% Advance</span>
                       </div>
                   </div>
               </div>

               {/* Stats Summary */}
               <div className="flex gap-4">
                   <div className="bg-gray-900/60 border border-gray-800 p-3 rounded-xl text-center min-w-[80px]">
                       <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Rank</div>
                       <div className="text-xl font-black text-white">#{playerRank}</div>
                   </div>
                   <div className="bg-gray-900/60 border border-gray-800 p-3 rounded-xl text-center min-w-[80px]">
                       <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Rating</div>
                       <div className="text-xl font-black text-system-neon">{currentPlayer.dailyXp || 0}</div>
                   </div>
               </div>
           </div>
       </div>

       {/* RIVALRY ALERT */}
       {rival && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-red-950/20 border-l-4 border-red-600 p-4 mb-6 rounded-r-lg flex items-center justify-between"
          >
              <div className="flex items-center gap-3">
                  <TargetIcon className="text-red-500 animate-pulse" size={20} />
                  <div>
                      <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Target Acquired</div>
                      <div className="text-sm text-white font-bold">Defeat <span className="text-red-500">{rival.name}</span> to advance</div>
                  </div>
              </div>
              <div className="text-right">
                  <div className="text-xs font-mono text-red-300">GAP</div>
                  <div className="text-lg font-black text-white">-{rival.xp - (currentPlayer.dailyXp || 0)} XP</div>
              </div>
          </motion.div>
       )}

       {/* ARENA LIST */}
       <div className="flex-1 space-y-3 relative pb-20">
          <AnimatePresence mode="popLayout">
            {roster.map((user, idx) => {
                const rank = idx + 1;
                const isMe = user.isPlayer;
                const isAscending = user.trend === 'UP';

                return (
                    <motion.div
                      key={user.id}
                      id={isMe ? "current-player-card" : undefined}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ 
                        opacity: 1, 
                        scale: isAscending ? 1.02 : 1,
                        zIndex: isAscending ? 10 : 1,
                        boxShadow: isAscending ? '0 0 20px rgba(16,185,129,0.2)' : 'none'
                      }}
                      className={`relative flex items-center justify-between p-4 rounded-xl border transition-all duration-500 group ${
                          isMe ? 'border-system-neon bg-system-neon/5' : 
                          'border-gray-800 bg-gray-900/40 hover:bg-gray-800/60'
                      }`}
                    >
                        <div className="flex items-center gap-4 z-10 min-w-0 flex-1">
                            {/* RANK INDICATOR */}
                            <div className="flex flex-col items-center justify-center w-10 shrink-0">
                                {rank === 1 ? <Crown size={24} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" /> :
                                 rank === 2 ? <Medal size={24} className="text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" /> :
                                 rank === 3 ? <Medal size={24} className="text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" /> :
                                 <span className={`text-lg font-black ${isMe ? 'text-system-neon' : 'text-gray-600'}`}>#{rank}</span>}
                                
                                {user.trend !== 'SAME' && (
                                    <div className={`text-[8px] font-bold flex items-center mt-1 ${user.trend === 'UP' ? 'text-system-success' : 'text-red-500'}`}>
                                        {user.trend === 'UP' ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
                                    </div>
                                )}
                            </div>

                            {/* AVATAR & NAME */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-black text-sm shrink-0 shadow-lg relative overflow-hidden" style={{ backgroundColor: user.avatarColor }}>
                                    {user.name.charAt(0)}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold truncate ${isMe ? 'text-system-neon' : 'text-white'}`}>{user.name}</span>
                                        {isMe && <span className="text-[8px] bg-system-neon text-black px-1.5 py-0.5 rounded font-black tracking-wider">YOU</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex items-center gap-1 text-[8px] text-gray-500 font-bold uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded border border-gray-800">
                                            {getClassIcon(user.classType)} {user.classType}
                                        </div>
                                        <div className="text-[8px] text-gray-600 font-bold">{getHunterClass(rank)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STATS RIGHT */}
                        <div className="text-right z-10 shrink-0 pl-2">
                            <div className="flex items-center justify-end gap-2">
                                <span className={`text-lg font-black tabular-nums ${isMe ? 'text-white' : 'text-gray-300'}`}>{user.xp.toLocaleString()}</span>
                                <span className="text-[8px] text-gray-600 font-bold mt-1">XP</span>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-1">
                                <div className={`h-1.5 w-1.5 rounded-full ${user.status === 'OVERDRIVE' ? 'bg-red-500 animate-ping' : user.status === 'GRINDING' ? 'bg-system-success' : 'bg-gray-700'}`} />
                                <span className={`text-[8px] font-bold uppercase tracking-wider ${user.status === 'OVERDRIVE' ? 'text-red-500' : 'text-gray-500'}`}>{user.status}</span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
          </AnimatePresence>
       </div>
    </div>
  );
};

export default RankingView;
