import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Calendar, BarChart3, Hexagon } from 'lucide-react';
import { CoreStats, HistoryEntry } from '../types';

interface EvaluationMatrixProps {
  stats: CoreStats;
  history: HistoryEntry[];
  dailyXp: number;
}

// Custom Tooltip for Radar
const RadarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-black/90 border border-system-neon/50 backdrop-blur-md p-3 rounded shadow-[0_0_15px_rgba(0,210,255,0.3)]">
        <p className="text-system-neon font-mono text-xs font-bold tracking-widest uppercase mb-1">{label}</p>
        <div className="flex items-end gap-2">
            <span className="text-white font-mono text-xl font-bold leading-none">{value}</span>
            <span className="text-[10px] text-gray-400 font-mono">/ 100</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Graphs
const GraphTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-system-accent/50 p-2 rounded text-xs font-mono">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EvaluationMatrix: React.FC<EvaluationMatrixProps> = ({ stats, history, dailyXp }) => {
  const [view, setView] = useState<'CURRENT' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('CURRENT');

  // Prepare Radar Data
  const radarData = [
    { subject: 'STR', value: stats.strength, fullMark: 100 },
    { subject: 'INT', value: stats.intelligence, fullMark: 100 },
    { subject: 'FOC', value: stats.focus, fullMark: 100 },
    { subject: 'SOC', value: stats.social, fullMark: 100 },
    { subject: 'WIL', value: stats.willpower, fullMark: 100 },
  ];

  // Prepare Graph Data
  // Reverse history to show oldest to newest (History stored Newest -> Oldest in hook)
  const sortedHistory = [...history].reverse();

  // Weekly: Last 7 days
  const weeklyData = sortedHistory.slice(-7).map(entry => ({
    name: entry.date.split('-').slice(1).join('/'), // MM/DD
    xp: entry.totalXp,
    str: entry.stats.strength,
    int: entry.stats.intelligence
  }));
  
  // If not enough data, pad it for visual (Optional, skipping for raw honesty of system)

  // Monthly: Last 30 days (Aggregate or raw)
  const monthlyData = sortedHistory.slice(-30).map(entry => ({
    name: entry.date.split('-').slice(1).join('/'),
    xp: entry.totalXp,
  }));

  // Daily: Just Today vs Yesterday (Bar Chart)
  // We use history[0] (Yesterday) vs dailyXp (Today)
  const yesterdayXp = history.length > 0 ? history[0].dailyXp : 0;
  const dailyData = [
    { name: 'YESTERDAY', xp: yesterdayXp },
    { name: 'TODAY', xp: dailyXp }
  ];

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* Header Tabs */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
         <div className="flex items-center gap-2">
            <Activity size={14} className="text-system-accent" />
            <h3 className="text-xs text-gray-400 font-mono tracking-widest">EVALUATION MATRIX</h3>
         </div>
         <div className="flex gap-1">
            <button 
              onClick={() => setView('CURRENT')}
              className={`p-1.5 rounded transition-colors ${view === 'CURRENT' ? 'bg-system-neon/20 text-system-neon' : 'text-gray-600 hover:text-white'}`}
              title="Current Stats"
            >
              <Hexagon size={14} />
            </button>
            <button 
              onClick={() => setView('DAILY')}
              className={`p-1.5 rounded transition-colors ${view === 'DAILY' ? 'bg-system-neon/20 text-system-neon' : 'text-gray-600 hover:text-white'}`}
              title="Daily Performance"
            >
              <BarChart3 size={14} />
            </button>
            <button 
              onClick={() => setView('WEEKLY')}
              className={`p-1.5 rounded transition-colors ${view === 'WEEKLY' ? 'bg-system-neon/20 text-system-neon' : 'text-gray-600 hover:text-white'}`}
              title="Weekly Trend"
            >
              <span className="text-[10px] font-mono font-bold">7D</span>
            </button>
            <button 
              onClick={() => setView('MONTHLY')}
              className={`p-1.5 rounded transition-colors ${view === 'MONTHLY' ? 'bg-system-neon/20 text-system-neon' : 'text-gray-600 hover:text-white'}`}
              title="Monthly Trend"
            >
               <Calendar size={14} />
            </button>
         </div>
      </div>

      <div className="flex-1 relative min-h-[250px]">
        <AnimatePresence mode="wait">
          
          {/* VIEW: CURRENT (RADAR) */}
          {view === 'CURRENT' && (
            <motion.div 
              key="radar"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <PolarGrid stroke="#333" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Stats"
                    dataKey="value"
                    stroke="#00d2ff"
                    strokeWidth={2}
                    fill="url(#radarGradient)"
                    fillOpacity={0.6}
                    isAnimationActive={true}
                  />
                  <Tooltip content={<RadarTooltip />} cursor={false} />
                </RadarChart>
              </ResponsiveContainer>
              {/* Decorative Tech Corners */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-system-neon/30"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-system-neon/30"></div>
            </motion.div>
          )}

          {/* VIEW: DAILY (BAR CHART) */}
          {view === 'DAILY' && (
            <motion.div 
              key="daily"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
               <div className="absolute top-0 left-0 text-[10px] text-gray-500 font-mono">XP GAINED (24H)</div>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                     <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                     <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                     <Tooltip content={<GraphTooltip />} cursor={{fill: 'transparent'}} />
                     <Bar dataKey="xp" name="XP" fill="#00d2ff" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </motion.div>
          )}

          {/* VIEW: WEEKLY (AREA CHART) */}
          {view === 'WEEKLY' && (
             <motion.div 
               key="weekly"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0"
             >
                {weeklyData.length < 2 ? (
                   <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono">INSUFFICIENT DATA FOR TREND ANALYSIS</div>
                ) : (
                  <>
                    <div className="absolute top-0 left-0 text-[10px] text-gray-500 font-mono">STATS GROWTH (7 DAYS)</div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                          <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip content={<GraphTooltip />} />
                          <Area type="monotone" dataKey="str" name="STR" stackId="1" stroke="#ef4444" fill="none" strokeWidth={2} />
                          <Area type="monotone" dataKey="int" name="INT" stackId="1" stroke="#00d2ff" fill="none" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                  </>
                )}
             </motion.div>
          )}

          {/* VIEW: MONTHLY (AREA CHART) */}
          {view === 'MONTHLY' && (
             <motion.div 
               key="monthly"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0"
             >
                 {monthlyData.length < 2 ? (
                   <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono">INSUFFICIENT DATA FOR TREND ANALYSIS</div>
                ) : (
                  <>
                    <div className="absolute top-0 left-0 text-[10px] text-gray-500 font-mono">TOTAL XP GROWTH (30 DAYS)</div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                          <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip content={<GraphTooltip />} />
                          <Area type="monotone" dataKey="xp" name="Total XP" stroke="#00d2ff" fill="url(#colorTotal)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                  </>
                )}
             </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default EvaluationMatrix;