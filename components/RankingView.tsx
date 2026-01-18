
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
          if (bot.status === 'GRINDING' || bot.status === 'OVERDRIVE') {
              if (Math.random() > 0.4) {
                  const baseGain = 15;
                  const multiplier = bot.status === 'OVERDRIVE' ? 2.5 : (bot.grindPower || 1);
                  change = Math.floor(Math.random() * baseGain * multiplier);
                  
                  if (rubberBandMode && bot.id === topBot?.id) {
                      change = Math.floor(change * 0.5); // Slow down top bot if too far ahead
                  }
              }
          }

          // Cap at band max
          const bandMax = getBandMax(bot.tier);
          const newXp = Math.min(bandMax, bot.xp + change);
          
          // Status Rotation
          let newStatus = bot.status;
          if (Math.random() > 0.98) {
             newStatus = bot.status === 'RESTING' ? 'GRINDING' : 'RESTING';
             if (Math.random() > 0.9 && newStatus === 'GRINDING') newStatus = 'OVERDRIVE';
          }

          return { ...bot, xp: newXp, status: newStatus };
        });

        // Sort and re-rank
        const sortedNext = sortAndLabel(next);
        
        // Save Daily State
        if (Math.random() > 0.9) saveDaily(sortedNext);

        return sortedNext;
      });
    }, 3000); 

    return () => {
        if (simInterval.current) clearInterval(simInterval.current);
    };
  }, [isReady, currentPlayer.dailyXp]);

  return (
    <div className="w-full max-w-2xl mx-auto pb-20">
       {/* Header */}
       <div className="mb-6 flex items-end justify-between px-4">
           <div>
               <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Global Rankings</h1>
               <div className="text-[10px] font-mono text-gray-500 tracking-widest flex items-center gap-2">
                   <Activity size={12} className="text-system-neon animate-pulse" /> LIVE FEED
               </div>
           </div>
           <div className="text-right">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Your Rank</div>
                <div className="text-4xl font-black text-system-neon leading-none">
                    #{roster.find(p => p.isPlayer)?.lastRank || '-'}
                </div>
           </div>
       </div>

       {/* List */}
       <div className="space-y-2 px-2">
           <AnimatePresence mode="popLayout">
               {roster.map((entry) => (
                   <motion.div
                       layout
                       key={entry.id}
                       id={entry.isPlayer ? 'current-player-card' : undefined}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.3 }}
                       className={`
                           relative flex items-center p-3 rounded-xl border transition-all
                           ${entry.isPlayer 
                               ? 'bg-system-neon/10 border-system-neon/50 shadow-[0_0_20px_rgba(0,210,255,0.2)] z-10' 
                               : 'bg-gray-900/40 border-gray-800'
                           }
                       `}
                   >
                       <div className="w-12 text-center shrink-0 flex flex-col items-center justify-center">
                           {entry.lastRank <= 3 ? (
                               <Crown size={20} className={
                                   entry.lastRank === 1 ? 'text-yellow-500' :
                                   entry.lastRank === 2 ? 'text-gray-300' : 'text-orange-700'
                               } />
                           ) : (
                               <span className="text-sm font-bold text-gray-500 font-mono">#{entry.lastRank}</span>
                           )}
                       </div>

                       <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 shrink-0 relative overflow-hidden bg-gray-800">
                           <div className="absolute inset-0 opacity-20" style={{ backgroundColor: entry.avatarColor }} />
                           <div className="relative z-10 text-white/80">
                               {getClassIcon(entry.classType)}
                           </div>
                       </div>

                       <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                               <span className={`font-bold text-sm truncate ${entry.isPlayer ? 'text-white' : 'text-gray-300'}`}>
                                   {entry.name}
                               </span>
                               {entry.isPlayer && (
                                   <span className="text-[8px] bg-system-neon text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">YOU</span>
                               )}
                               {entry.status === 'OVERDRIVE' && (
                                   <Zap size={12} className="text-yellow-500 animate-pulse" fill="currentColor" />
                               )}
                           </div>
                           <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                               <span>{getHunterClass(entry.lastRank)}</span>
                               <span>•</span>
                               <span>{entry.classType}</span>
                           </div>
                       </div>

                       <div className="text-right shrink-0 min-w-[80px]">
                           <div className="font-mono font-bold text-white text-sm">{entry.xp.toLocaleString()} XP</div>
                           <div className={`text-[10px] font-bold flex items-center justify-end gap-1 ${
                               entry.trend === 'UP' ? 'text-system-success' : 
                               entry.trend === 'DOWN' ? 'text-red-500' : 'text-gray-600'
                           }`}>
                               {entry.trend === 'UP' && <ArrowUp size={10} />}
                               {entry.trend === 'DOWN' && <ArrowDown size={10} />}
                               {entry.trend === 'SAME' && '-'}
                           </div>
                       </div>
                   </motion.div>
               ))}
           </AnimatePresence>
       </div>
    </div>
  );
};

export default RankingView;
