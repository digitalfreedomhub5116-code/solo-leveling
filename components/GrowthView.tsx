
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Settings, LogOut, Lock, Calendar, Flame, TrendingUp, Award, Zap, Activity } from 'lucide-react';
import { PlayerData } from '../types';

interface GrowthViewProps {
  player: PlayerData;
  onAdminRequest: () => void;
  onLogout: () => void;
}

// Define explicit type for calendar items
type CalendarItem = 
  | { type: 'empty'; id: string }
  | { 
      type: 'day'; 
      id: string; 
      date: string; 
      dayNum: number; 
      percentage: number; 
      isToday: boolean; 
      isFuture: boolean; 
      stats: string; 
      grade: 'S' | 'A' | 'B' | 'C' | '-';
    };

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

const GrowthView: React.FC<GrowthViewProps> = ({ player, onAdminRequest, onLogout }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number, y: number, date: string, percentage: number, stats: string, grade: string } | null>(null);

  // --- CALENDAR LOGIC ---
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (isNaN(year) || isNaN(month)) return { grid: [], stats: { totalXp: 0, activeDays: 0, grade: 'C' } };

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const safeFirstDay = Math.max(0, Math.min(6, firstDay));
    const safeDaysInMonth = Math.max(28, Math.min(31, daysInMonth));

    const grid: CalendarItem[] = [];
    
    for (let i = 0; i < safeFirstDay; i++) {
        grid.push({ type: 'empty', id: `empty-${i}` });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const playerHistoryMap = new Map<string, { xp: number, completion: number }>(
        player.history.map(h => [h.date, { xp: h.dailyXp, completion: h.questCompletion }])
    );

    let monthTotalXp = 0;
    let activeDaysCount = 0;

    // Live Today Data
    const activeQuests = player.quests;
    const completedToday = activeQuests.filter(q => q.isCompleted).length;
    const totalToday = activeQuests.length;
    const todayCompletion = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    for (let d = 1; d <= safeDaysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const isFuture = new Date(dateStr) > new Date(todayStr);
        
        let percentage = 0;
        let dayXp = 0;
        
        if (isToday) {
            percentage = todayCompletion;
            dayXp = player.dailyXp;
        } else if (playerHistoryMap.has(dateStr)) {
            const h = playerHistoryMap.get(dateStr)!;
            percentage = h.completion;
            dayXp = h.xp;
        }

        if (dayXp > 0 || percentage > 0) {
            monthTotalXp += dayXp;
            activeDaysCount++;
        }

        // Determine Daily Grade
        let dailyGrade: 'S' | 'A' | 'B' | 'C' | '-' = '-';
        if (!isFuture) {
            if (percentage >= 100) dailyGrade = 'S';
            else if (percentage >= 75) dailyGrade = 'A';
            else if (percentage >= 50) dailyGrade = 'B';
            else dailyGrade = 'C';
        }

        grid.push({
            type: 'day',
            id: dateStr,
            date: dateStr,
            dayNum: d,
            percentage,
            isToday,
            isFuture,
            stats: isToday 
                ? `${completedToday}/${totalToday} Quests • ${dayXp} XP` 
                : isFuture ? '-' 
                : `${percentage}% Comp • ${dayXp} XP`,
            grade: dailyGrade
        });
    }

    // Monthly Grade Calculation
    const progressRatio = activeDaysCount / (new Date().getDate()); // Against days passed so far
    let monthlyGrade = 'C';
    if (progressRatio > 0.9) monthlyGrade = 'S';
    else if (progressRatio > 0.7) monthlyGrade = 'A';
    else if (progressRatio > 0.5) monthlyGrade = 'B';

    return { grid, stats: { totalXp: monthTotalXp, activeDays: activeDaysCount, grade: monthlyGrade } };
  }, [currentDate, player.history, player.quests, player.dailyXp]);

  const changeMonth = (delta: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + delta);
      setCurrentDate(newDate);
  };

  const getDayStyle = (percentage: number, isFuture: boolean, isToday: boolean) => {
      if (isFuture) return 'bg-gray-900/30 border-gray-800 text-gray-700';
      if (percentage === 0) return 'bg-gray-900 border-gray-800 text-gray-600';
      
      if (percentage >= 100) return 'bg-system-success/20 border-system-success text-system-success shadow-[0_0_15px_rgba(16,185,129,0.2)]';
      if (percentage >= 50) return 'bg-blue-600/20 border-blue-500 text-blue-400';
      return 'bg-gray-800 border-gray-600 text-gray-400';
  };

  const handleMouseEnter = (e: React.MouseEvent, day: CalendarItem) => {
      if (day.type === 'empty') return;
      if (day.isFuture) return;
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltip({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          date: new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
          percentage: day.percentage, 
          stats: day.stats,
          grade: day.grade
      });
  };

  return (
    <div className="flex flex-col min-h-[80vh] w-full max-w-4xl mx-auto relative px-2 font-mono">
        
        {/* HEADER AREA */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-1 uppercase">
                    Growth <span className="text-system-neon">Engine</span>
                </h1>
                <p className="text-xs text-gray-500 tracking-widest uppercase flex items-center gap-2">
                    <Activity size={12} className="text-system-accent" /> SYSTEM CONSISTENCY TRACKER
                </p>
            </div>
            
            {/* Settings Toggle */}
            <div className="relative">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-500 hover:text-white hover:border-gray-600 transition-colors"
                >
                    <Settings size={20} />
                </button>
                <AnimatePresence>
                    {showSettings && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-black border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50"
                        >
                            <div className="p-1">
                                <button onClick={onAdminRequest} className="w-full text-left px-4 py-3 text-[10px] font-mono text-gray-400 hover:bg-gray-900 hover:text-white flex items-center gap-2">
                                    <Lock size={12} /> ADMIN CONSOLE
                                </button>
                                <button onClick={onLogout} className="w-full text-left px-4 py-3 text-[10px] font-mono text-red-500 hover:bg-red-900/20 flex items-center gap-2">
                                    <LogOut size={12} /> LOGOUT
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* --- STATS DASHBOARD --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900/30 border border-gray-800 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Current Streak</span>
                    <Flame size={16} className="text-orange-500 animate-pulse" />
                </div>
                <div className="text-3xl font-black text-white">{player.streak} <span className="text-sm font-normal text-gray-600">DAYS</span></div>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Monthly XP</span>
                    <Zap size={16} className="text-blue-500" />
                </div>
                <div className="text-3xl font-black text-white">{calendarData.stats.totalXp.toLocaleString()}</div>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Active Days</span>
                    <Calendar size={16} className="text-green-500" />
                </div>
                <div className="text-3xl font-black text-white">{calendarData.stats.activeDays}</div>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Consistency</span>
                    <Award size={16} className="text-purple-500" />
                </div>
                <div className="text-3xl font-black text-system-accent">{calendarData.stats.grade}-RANK</div>
            </div>
        </div>

        {/* --- MAIN CALENDAR CARD --- */}
        <div className="bg-[#050505] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Decoration Lines */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-neon to-transparent opacity-20" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-800 to-transparent opacity-20" />

            {/* Month Controls */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <button onClick={() => changeMonth(-1)} className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-500 hover:text-white hover:border-gray-600 transition-all">
                    <ChevronLeft size={18} />
                </button>
                <div className="text-xl md:text-2xl font-black font-mono text-white tracking-tighter uppercase flex flex-col items-center">
                    {MONTHS[currentDate.getMonth()]} 
                    <span className="text-[10px] text-system-neon tracking-[0.3em] font-normal">{currentDate.getFullYear()}</span>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-500 hover:text-white hover:border-gray-600 transition-all">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Grid */}
            <div className="relative z-10">
                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-2 mb-4 text-center">
                    {DAYS_OF_WEEK.map(d => (
                        <div key={d} className="text-[10px] font-bold text-gray-600 tracking-widest">{d}</div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-2 md:gap-4">
                    <AnimatePresence mode="popLayout">
                        {calendarData.grid.map((day) => (
                            <motion.div
                                key={day.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="aspect-square relative group"
                                onMouseEnter={(e) => handleMouseEnter(e, day)}
                                onMouseLeave={() => setTooltip(null)}
                            >
                                {day.type === 'day' && (
                                    <div 
                                        className={`
                                            w-full h-full rounded-lg border transition-all duration-300 flex flex-col items-center justify-center relative cursor-default
                                            ${getDayStyle(day.percentage, day.isFuture, day.isToday)}
                                            ${day.isToday ? 'ring-2 ring-system-neon ring-offset-2 ring-offset-black' : ''}
                                        `}
                                    >
                                        <span className={`text-[10px] font-bold ${day.isFuture ? 'opacity-30' : 'opacity-100'}`}>{day.dayNum}</span>
                                        
                                        {/* Grade Indicator for past days */}
                                        {!day.isFuture && day.percentage > 0 && (
                                            <div className="mt-1">
                                                {day.percentage === 100 ? (
                                                    <Check size={12} strokeWidth={4} />
                                                ) : (
                                                    <span className="text-[8px] font-bold">{day.grade}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 md:gap-8 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-900 border border-gray-800" /> INACTIVE
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-900/30 border border-blue-800" /> PARTIAL
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-system-success/20 border border-system-success" /> COMPLETE (S-RANK)
            </div>
        </div>

        {/* Tooltip Portal */}
        {tooltip && (
            <div 
                className="fixed z-50 pointer-events-none flex flex-col items-center"
                style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
            >
                <div className="bg-black/90 backdrop-blur border border-system-neon/30 text-white text-xs rounded-lg py-3 px-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] mb-2 text-center min-w-[140px]">
                    <div className="font-black text-system-neon mb-1 uppercase tracking-wider">{tooltip.date}</div>
                    <div className="text-gray-300 font-bold mb-1">{tooltip.stats}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest border-t border-gray-800 pt-1 mt-1">GRADE: {tooltip.grade}</div>
                </div>
                <div className="w-2 h-2 bg-black border-r border-b border-system-neon/30 rotate-45 -mt-3"></div>
            </div>
        )}
    </div>
  );
};

export default GrowthView;
