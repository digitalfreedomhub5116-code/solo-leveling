import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, ArrowUp, ArrowDown, Minus, Target as TargetIcon, Activity, Sparkles } from 'lucide-react';
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
  grindPower: number; // XP per tick (10 seconds)
  lastRank: number; 
  trend: Trend; 
  status: 'GRINDING' | 'RESTING' | 'OVERDRIVE';
}

const ROSTER_SIZE = 15;
const BOT_NAMES = [
    "Arjun", "Reyansh", "Vihaan", "Aditya", "Ishaan", "Shaurya", "Aarav", 
    "Kabir", "Riyan", "Vivaan", "Anaya", "Saanvi", "Aadya", "Kiara", "Diya"
];

const getHunterClass = (rank: number) => {
    if (rank === 1) return "S-RANK MONARCH";
    if (rank <= 3) return "NATIONAL LEVEL";
    if (rank <= 7) return "A-RANK ELITE";
    return "RANK-B HUNTER";
};

const RankingView: React.FC<RankingViewProps> = ({ currentPlayer }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const STORAGE_KEY = `shadow_arena_v11_${currentPlayer.username}_${todayStr}`;
  
  const [roster, setRoster] = useState<LeaderboardEntry[]>([]);
  const [isReady, setIsReady] = useState(false);
  const simInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- INITIALIZATION & TEMPORAL CATCH-UP ---
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let currentRoster: LeaderboardEntry[] = [];
    const now = Date.now();

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        currentRoster = parsed.data;
        
        // Calculate catch-up XP for time spent offline
        const lastUpdate = parsed.lastUpdated || now;
        const secondsPassed = (now - lastUpdate) / 1000;
        
        if (secondsPassed > 10) {
            const ticks = Math.floor(secondsPassed / 10);
            currentRoster = currentRoster.map(h => {
                if (h.isPlayer) return { ...h, xp: currentPlayer.dailyXp || 0 };
                // Simulate random grinding while away (50% efficiency)
                const gained = Math.floor(h.grindPower * ticks * (0.3 + Math.random() * 0.4));
                return { ...h, xp: h.xp + gained };
            });
        } else {
            currentRoster = currentRoster.map(h => h.isPlayer ? { ...h, xp: currentPlayer.dailyXp || 0 } : h);
        }
      } catch (e) { console.error("Sync Failure", e); }
    }

    if (currentRoster.length === 0) {
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
      currentRoster = BOT_NAMES.map((name, i) => ({
        id: `bot_${name}`,
        name,
        isPlayer: false,
        xp: Math.floor(Math.random() * 800), 
        avatarColor: colors[i % colors.length],
        grindPower: Math.floor(Math.random() * 40) + 20,
        lastRank: i + 1,
        trend: 'SAME',
        status: 'GRINDING'
      }));

      currentRoster.push({
        id: 'player_main',
        name: currentPlayer.username || 'You',
        isPlayer: true,
        xp: currentPlayer.dailyXp || 0,
        avatarColor: '#00d2ff',
        grindPower: 0,
        lastRank: ROSTER_SIZE,
        trend: 'SAME',
        status: 'GRINDING'
      });
    }

    const sorted = sortAndLabel(currentRoster);
    setRoster(sorted);
    save(sorted);
    setIsReady(true);
  }, [currentPlayer.dailyXp, STORAGE_KEY]);

  const save = (data: LeaderboardEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lastUpdated: Date.now(),
      data: data
    }));
  };

  const sortAndLabel = (data: LeaderboardEntry[]): LeaderboardEntry[] => {
    const sorted = [...data].sort((a, b) => b.xp - a.xp);
    return sorted.map((entry, index) => {
      const currentRank = index + 1;
      const prevRank = entry.lastRank || currentRank;
      let newTrend: Trend = entry.trend;
      if (currentRank < prevRank) newTrend = 'UP';
      else if (currentRank > prevRank) newTrend = 'DOWN';

      return {
          ...entry,
          trend: newTrend,
          lastRank: currentRank,
          status: entry.isPlayer ? 'GRINDING' : (Math.random() > 0.85 ? 'RESTING' : 'GRINDING')
      };
    });
  };

  // --- ARENA SIMULATION (Every 10 seconds) ---
  useEffect(() => {
    if (!isReady) return;
    simInterval.current = setInterval(() => {
      setRoster(prev => {
        const next = prev.map(h => {
          if (h.isPlayer) return h;
          if (h.status === 'RESTING' && Math.random() > 0.2) return h;
          const gain = Math.floor(Math.random() * h.grindPower);
          return { ...h, xp: h.xp + gain };
        });
        const sorted = sortAndLabel(next);
        save(sorted);
        return sorted;
      });
    }, 10000); 
    return () => { if (simInterval.current) clearInterval(simInterval.current); };
  }, [isReady]);

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

       {/* ARENA LIST - PREMIUM ANIMATIONS */}
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
                      // Premium Heavy Spring Physics
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
                                <Activity size={10} className={user.status === 'GRINDING' ? 'text-system-neon animate-pulse' : ''} />
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