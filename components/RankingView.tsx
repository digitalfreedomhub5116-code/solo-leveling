import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, ArrowUp, ArrowDown, Minus, Target as TargetIcon, Activity, Sparkles } from 'lucide-react';
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
  grindPower: number; // Used as base potential multiplier
  lastRank: number; 
  trend: Trend; 
  status: 'GRINDING' | 'RESTING' | 'OVERDRIVE';
  // New Fields for Logic
  tier: number; // 1-15, determines XP Band cap
  accumulatedXp: number; // Float for precise increments
}

const ROSTER_SIZE = 15;
const BOT_NAMES = [
    "Arjun", "Reyansh", "Vihaan", "Aditya", "Ishaan", "Shaurya", "Aarav", 
    "Kabir", "Riyan", "Vivaan", "Anaya", "Saanvi", "Aadya", "Kiara", "Diya"
];

// XP BANDS CONFIGURATION
const XP_BANDS = [
    { tier: 1, min: 5600, max: 6213 }, // Rank 1 Potential
    { tier: 2, min: 5200, max: 5599 }, // Rank 2
    { tier: 3, min: 4800, max: 5199 }, // Rank 3
    { tier: 6, min: 4200, max: 4799 }, // Rank 4-6
    { tier: 10, min: 3000, max: 4199 }, // Rank 7-10
    { tier: 15, min: 1000, max: 2999 }  // Rank 11-15
];

const getBandMax = (tier: number) => {
    const band = XP_BANDS.find(b => tier <= b.tier);
    return band ? band.max : 2999;
};

const getHunterClass = (rank: number) => {
    if (rank === 1) return "S-RANK MONARCH";
    if (rank <= 3) return "NATIONAL LEVEL";
    if (rank <= 7) return "A-RANK ELITE";
    return "RANK-B HUNTER";
};

const RankingView: React.FC<RankingViewProps> = ({ currentPlayer }) => {
  const username = currentPlayer.username || 'User';
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Storage Keys
  const CONFIG_KEY = `shadow_arena_config_${username}`; // Persists identities & long-term stats
  const DAILY_KEY = `shadow_arena_daily_${username}_${todayStr}`; // Persists today's XP

  const [roster, setRoster] = useState<LeaderboardEntry[]>([]);
  const [isReady, setIsReady] = useState(false);
  const simInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const now = Date.now();
    
    // 1. Load Long-term Config (Identities, Motivation Stats)
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
        // It's a new day (or first run)
        // Check yesterday's performance if possible (simplified here to assume calculation happened at EOD yesterday)
        // For robustness, we just reset XP.
        // If we want to track "Was Top 3 Yesterday", we'd ideally store it at 23:59 previous day.
        // Here we rely on the persisted value.
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
        // Shuffle bot names for randomness
        const shuffledNames = [...BOT_NAMES].sort(() => 0.5 - Math.random());
        
        config.bots = shuffledNames.slice(0, ROSTER_SIZE - 1).map((name, i) => ({
            id: `bot_${name}`,
            name,
            isPlayer: false,
            avatarColor: colors[i % colors.length],
            grindPower: 1, // Multiplier
            tier: i + 1, // Assign potential tier (1 = best)
        }));
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    }

    // Merge Config with Daily XP
    currentRoster = config.bots.map((bot) => {
        // Base XP if daily data missing (start of day) is random low amount to simulate morning activity
        const startXp = dailyData ? (dailyData.xpMap[bot.id!] || 0) : Math.floor(Math.random() * 100);
        
        return {
            id: bot.id!,
            name: bot.name!,
            isPlayer: false,
            xp: startXp,
            accumulatedXp: startXp,
            avatarColor: bot.avatarColor!,
            grindPower: bot.tier === 1 ? 1.2 : bot.tier <= 3 ? 1.1 : 1.0,
            tier: bot.tier || 15,
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
        accumulatedXp: currentPlayer.dailyXp || 0,
        avatarColor: '#00d2ff',
        grindPower: 0,
        tier: 0, // Player has no cap
        lastRank: ROSTER_SIZE,
        trend: 'SAME',
        status: 'GRINDING'
    });

    // 5. Offline Catch-up (Simulate missed time)
    if (dailyData) {
        const secondsPassed = (now - dailyData.lastUpdated) / 1000;
        if (secondsPassed > 60) { // Only calculate if > 1 min passed
            const catchUpTicks = Math.floor(secondsPassed / 10);
            // Limit catchup to avoid huge jumps (max 2 hours)
            const cappedTicks = Math.min(catchUpTicks, 720); 
            
            currentRoster.forEach(bot => {
                if (!bot.isPlayer) {
                    // Avg 40 XP per 30 mins -> ~0.22 XP per tick
                    const gain = cappedTicks * 0.22 * bot.grindPower * (0.5 + Math.random());
                    const max = getBandMax(bot.tier);
                    bot.accumulatedXp = Math.min(max, bot.accumulatedXp + gain);
                    bot.xp = Math.floor(bot.accumulatedXp);
                }
            });
        }
    }

    // Initial Sort
    const sorted = sortAndLabel(currentRoster);
    setRoster(sorted);
    setIsReady(true);
  }, [currentPlayer.username, currentPlayer.dailyXp]);

  // --- SAVE STATE ---
  const saveDaily = (data: LeaderboardEntry[]) => {
      const xpMap: Record<string, number> = {};
      data.forEach(d => { if(!d.isPlayer) xpMap[d.id] = d.accumulatedXp; });
      localStorage.setItem(DAILY_KEY, JSON.stringify({
          xpMap,
          lastUpdated: Date.now()
      }));
  };

  const sortAndLabel = (data: LeaderboardEntry[]): LeaderboardEntry[] => {
    const sorted = [...data].sort((a, b) => b.xp - a.xp);
    return sorted.map((entry, index) => {
      const currentRank = index + 1;
      // Initialize lastRank if 0
      const prevRank = entry.lastRank || currentRank;
      
      let newTrend: Trend = 'SAME';
      if (currentRank < prevRank) newTrend = 'UP';
      else if (currentRank > prevRank) newTrend = 'DOWN';

      return {
          ...entry,
          trend: newTrend,
          lastRank: currentRank,
          status: entry.isPlayer ? 'GRINDING' : (Math.random() > 0.8 ? 'RESTING' : 'GRINDING')
      };
    });
  };

  // --- SIMULATION ENGINE (Every 10s) ---
  useEffect(() => {
    if (!isReady) return;

    simInterval.current = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const minutes = now.getMinutes();
      
      // Load Motivation Config
      let config = { wasTop3Yesterday: false, lastTop3Timestamp: 0 };
      try {
          const c = localStorage.getItem(CONFIG_KEY);
          if (c) config = JSON.parse(c);
      } catch {}

      // Pity System Check
      const hoursSinceTop3 = (Date.now() - (config.lastTop3Timestamp || 0)) / (1000 * 60 * 60);
      const isMotivationMode = hoursSinceTop3 > 72; // 3 Days without Top 3

      // Top 3 Anti-Camp Logic (8PM+)
      const isLateGame = hour >= 20;
      
      // Emergency Surge (11:50 PM)
      const isEmergency = hour === 23 && minutes >= 50;

      setRoster(prev => {
        // Find Player XP for gravity
        const playerEntry = prev.find(p => p.isPlayer);
        const playerXp = currentPlayer.dailyXp || 0; // Sync with prop
        const playerRank = prev.findIndex(p => p.isPlayer) + 1;

        const next = prev.map(bot => {
          if (bot.isPlayer) {
              return { ...bot, xp: playerXp, accumulatedXp: playerXp };
          }

          // 1. BASE GAIN
          // Target: Random 20-60 XP per 30 mins
          // Per 10s Tick: Avg 0.22 XP
          // Base Variance: 0.1 to 0.4
          let gain = (0.1 + Math.random() * 0.3); 
          
          // Apply Grind Power (Tier based multiplier)
          gain *= bot.grindPower;

          // 2. ACTIVITY CYCLE (Inactivity Simulation)
          // 10% chance to lose small XP (AFK/decay simulation) or just 0 gain
          if (Math.random() < 0.1) gain = -0.5; 

          // 3. GRAVITY SYSTEM
          // If close to player, adjust tension
          const distToPlayer = Math.abs(bot.xp - playerXp);
          if (distToPlayer < 200) {
              // If user is climbing fast, bots speed up slightly to maintain challenge
              gain *= 1.15;
          }

          // 4. TOP 3 CONTROL (Anti-Camp)
          if (config.wasTop3Yesterday && isLateGame && playerRank <= 3) {
              // If user is top 3 again, boost ranks 4-6 to threaten overtake
              // Bot must be close to user to matter
              const botRank = prev.indexOf(bot) + 1;
              if (botRank >= 4 && botRank <= 6) {
                  gain *= 2.0; // Significant boost
                  bot.status = 'OVERDRIVE';
              }
          }

          // 5. EMERGENCY FALLBACK
          // If 11:50 PM and user still Top 3 after being Top 3 yesterday
          if (isEmergency && config.wasTop3Yesterday && playerRank <= 3) {
              const botRank = prev.indexOf(bot) + 1;
              // Pick the bot immediately behind player
              if (botRank === playerRank + 1) {
                  const overtakeNeeded = (playerXp - bot.xp) + 15;
                  if (overtakeNeeded > 0 && overtakeNeeded < 100) {
                      gain += overtakeNeeded; // Instant surge
                      bot.status = 'OVERDRIVE';
                  }
              }
          }

          // 6. MOTIVATION ENGINE (Pity)
          // If user hasn't won in 3 days, slow down bots above user slightly
          if (isMotivationMode && bot.xp > playerXp) {
              gain *= 0.8;
          }

          // 7. XP BAND CLAMPING
          const max = getBandMax(bot.tier);
          let newAccumulated = bot.accumulatedXp + gain;
          
          // Hard cap check
          if (newAccumulated > max) newAccumulated = max;
          if (newAccumulated < 0) newAccumulated = 0;

          return {
              ...bot,
              accumulatedXp: newAccumulated,
              xp: Math.floor(newAccumulated)
          };
        });

        // Store Top 3 Timestamp if player is currently Top 3
        // Only update once per day effectively to avoid spam, or update timestamp to 'now' so diff remains 0
        const newSorted = sortAndLabel(next);
        const newPlayerRank = newSorted.findIndex(p => p.isPlayer) + 1;
        
        if (newPlayerRank <= 3) {
            const currentConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
            if (Date.now() - (currentConfig.lastTop3Timestamp || 0) > 3600000) { // Update hourly
                currentConfig.lastTop3Timestamp = Date.now();
                localStorage.setItem(CONFIG_KEY, JSON.stringify(currentConfig));
            }
        }

        saveDaily(newSorted);
        return newSorted;
      });
    }, 10000); // 10s Tick

    return () => { if (simInterval.current) clearInterval(simInterval.current); };
  }, [isReady, currentPlayer.dailyXp, CONFIG_KEY]);

  // --- RENDER HELPERS ---
  const playerRank = roster.findIndex(u => u.isPlayer) + 1;
  const rival = playerRank > 1 ? roster[playerRank - 2] : null;

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full px-2 font-mono selection:bg-system-neon">
       
       {/* HEADER */}
       <div className="bg-system-card border border-system-border p-6 mb-8 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="absolute inset-0 bg-gradient-to-br from-system-neon/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
              <Trophy className="text-yellow-500" size={40} />
              <div>
                  <h1 className="text-3xl font-black text-white tracking-tighter uppercase">SHADOW ARENA</h1>
                  <p className="text-[10px] text-gray-500 tracking-[0.3em] uppercase">Global Ranking Engine // Live Sync</p>
              </div>
          </div>

          {rival && (
              <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex items-center gap-4 relative z-10">
                  <div className="flex flex-col items-center">
                      <TargetIcon className="text-red-600 animate-pulse" size={20} />
                      <span className="text-[8px] text-red-700 font-bold uppercase mt-1">Target</span>
                  </div>
                  <div>
                      <div className="text-[9px] text-red-400 uppercase font-bold">RIVAL: {rival.name}</div>
                      <div className="text-lg font-black text-white leading-none">
                        -{rival.xp - (currentPlayer.dailyXp || 0)} <span className="text-[10px] text-gray-600">XP</span>
                      </div>
                  </div>
              </div>
          )}
       </div>

       {/* ARENA LIST */}
       <div className="flex-1 space-y-4 relative pb-20">
          <AnimatePresence mode="popLayout">
            {roster.map((user, idx) => {
                const rank = idx + 1;
                const isMe = user.isPlayer;
                const isAscending = user.trend === 'UP';

                return (
                    <motion.div
                      key={user.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ 
                        opacity: 1, 
                        scale: isAscending ? 1.05 : 1,
                        zIndex: isAscending ? 100 : 10,
                        y: 0 
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ 
                        layout: { 
                            type: "spring", 
                            stiffness: 40, 
                            damping: 15, 
                            mass: 3 
                        },
                        scale: { duration: 0.6 },
                        opacity: { duration: 0.4 }
                      }}
                      className={`relative flex items-center justify-between p-5 rounded-2xl border transition-colors duration-700 ${
                          isMe ? 'border-system-neon bg-system-neon/10 ring-1 ring-system-neon/30 shadow-[0_0_30px_rgba(0,210,255,0.1)]' : 
                          'border-gray-800 bg-gray-900/40 hover:border-gray-700'
                      }`}
                    >
                        {/* ASCENSION GLOW EFFECT */}
                        {isAscending && (
                             <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.4, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-system-success/10 rounded-2xl pointer-events-none" 
                             />
                        )}

                        <div className="flex items-center gap-6 z-10">
                            <div className="flex flex-col items-center w-8">
                                <motion.span 
                                    layout="position"
                                    className={`text-2xl font-black ${isMe ? 'text-system-neon' : 'text-gray-700'}`}
                                >
                                    {rank}
                                </motion.span>
                                {isAscending && <ArrowUp size={14} className="text-system-success mt-1" />}
                                {user.trend === 'DOWN' && <ArrowDown size={14} className="text-red-700 mt-1" />}
                                {user.trend === 'SAME' && <Minus size={14} className="text-gray-800 mt-1" />}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-black text-xl" style={{ backgroundColor: user.avatarColor }}>
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${isMe ? 'text-system-neon' : 'text-white'}`}>{user.name.toUpperCase()}</span>
                                        {isMe && <span className="text-[8px] bg-system-neon text-black px-1.5 rounded font-black">YOU</span>}
                                    </div>
                                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{getHunterClass(rank)}</div>
                                    {isAscending && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-system-success text-[8px] font-black mt-1">
                                            <Sparkles size={10} /> ASCENDING
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-right z-10">
                            <div className="flex items-center gap-3 justify-end">
                                {rank <= 3 && <Crown className={rank === 1 ? "text-yellow-500" : "text-purple-500"} size={18} />}
                                <span className="text-xl font-black text-white tabular-nums">{user.xp.toLocaleString()}</span>
                            </div>
                            <div className="text-[8px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2 justify-end">
                                <Activity size={10} className={user.status === 'OVERDRIVE' ? 'text-red-500 animate-bounce' : user.status === 'GRINDING' ? 'text-system-neon animate-pulse' : ''} />
                                {user.status}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
          </AnimatePresence>
       </div>

       {/* FOOTER MARQUEE */}
       <div className="fixed bottom-0 left-0 w-full bg-black/95 border-t border-gray-800 h-10 overflow-hidden z-30">
            <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] font-mono text-[9px] text-gray-600 items-center h-full gap-20">
                <span>SYSTEM STATUS: STABLE</span>
                <span>ARENA SYNC: LIVE</span>
                <span>CATCH-UP ENGINE: ACTIVE</span>
                <span>LIMIT BREAKER DETECTED</span>
                <span>SYSTEM STATUS: STABLE</span>
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
       </div>
    </div>
  );
};

export default RankingView;