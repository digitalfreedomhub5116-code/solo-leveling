
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Activity, Calendar, BarChart3, Hexagon, TrendingUp } from 'lucide-react';
import { CoreStats, HistoryEntry } from '../types';

interface EvaluationMatrixProps {
  stats: CoreStats;
  history: HistoryEntry[];
  dailyXp: number;
}

// Animation Variants for Panel Transitions
const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, filter: "blur(4px)" },
  visible: { 
    opacity: 1, 
    scale: 1, 
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    scale: 1.05, 
    filter: "blur(4px)",
    transition: { duration: 0.2 } 
  }
};

// Custom Tooltip for Radar
const RadarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = data.value;
    const growth = data.growth;

    return (
      <div className="bg-black/95 border border-system-neon/50 backdrop-blur-xl p-4 rounded-lg shadow-[0_0_30px_rgba(0,210,255,0.2)] z-50 pointer-events-none min-w-[140px]">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
            <p className="text-system-neon font-mono text-xs font-bold tracking-[0.2em] uppercase">{label}</p>
        </div>
        
        <div className="flex items-baseline gap-2">
            <span className="text-white font-mono text-3xl font-black leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {value}
            </span>
            <span className="text-[10px] text-gray-600 font-mono font-bold">PTS</span>
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-800/50 flex items-center justify-between">
           <span className="text-[9px] text-gray-500 font-mono tracking-wider">GROWTH</span>
           {growth > 0 ? (
             <div className="text-[10px] font-mono text-system-success font-bold flex items-center gap-1 bg-system-success/10 px-2 py-0.5 rounded border border-system-success/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <TrendingUp size={10} />
                <span>+{growth}%</span>
             </div>
           ) : (
             <div className="text-[10px] font-mono text-gray-600 flex items-center gap-1 px-2 py-0.5">
                <span>--%</span>
             </div>
           )}
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
      <div className="bg-black/90 border border-system-accent/50 p-2 rounded text-xs font-mono shadow-lg backdrop-blur-sm">
        <p className="text-gray-400 mb-1 font-bold border-b border-gray-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}: {entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Helper for Custom Radar
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const CustomRadarChart = ({ data, domainMax, onHover }: any) => {
    const size = 300;
    const center = size / 2;
    const radius = 100; // Max radius fitting in 300x300 with labels
    
    // Grid Levels
    const gridLevels = 5;
    const gridPaths = [];
    for (let level = 1; level <= gridLevels; level++) {
        const levelRadius = (radius / gridLevels) * level;
        const pts = data.map((_: any, i: number) => {
            const angle = (360 / 5) * i;
            const { x, y } = polarToCartesian(center, center, levelRadius, angle);
            return `${x},${y}`;
        });
        gridPaths.push(pts.join(' '));
    }

    // Axes Lines
    const axesLines = data.map((_: any, i: number) => {
        const angle = (360 / 5) * i;
        const { x, y } = polarToCartesian(center, center, radius, angle);
        return { x1: center, y1: center, x2: x, y2: y };
    });

    // Data Points & Path
    const dataPoints = data.map((d: any, i: number) => {
        const angle = (360 / 5) * i;
        // Clamp value to domainMax to avoid overflow
        const val = Math.min(d.value, domainMax);
        const valRadius = (val / domainMax) * radius;
        return polarToCartesian(center, center, valRadius, angle);
    });
    
    const pathD = dataPoints.map((p: any, i: number) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible select-none">
            <defs>
                <linearGradient id="radarStrokeGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00d2ff" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="radarFillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d2ff" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
            </defs>

            {/* Grid */}
            {gridPaths.map((pts, i) => (
                <polygon key={`grid-${i}`} points={pts} fill="none" stroke="#333" strokeWidth="1" strokeDasharray="3 3" />
            ))}
            {axesLines.map((line: any, i: number) => (
                <line key={`axis-${i}`} {...line} stroke="#333" strokeWidth="1" strokeDasharray="3 3" />
            ))}

            {/* Labels */}
            {data.map((d: any, i: number) => {
                const angle = (360 / 5) * i;
                const { x, y } = polarToCartesian(center, center, radius + 25, angle);
                return (
                    <text 
                        key={`label-${i}`} 
                        x={x} y={y} 
                        textAnchor="middle" 
                        dominantBaseline="middle" 
                        fill="#9ca3af" 
                        fontSize="9" 
                        fontFamily="JetBrains Mono" 
                        fontWeight="bold"
                        className="drop-shadow-md"
                    >
                        {d.subject}
                    </text>
                );
            })}

            {/* Fill Area (Fade In Last) */}
            <motion.path
                d={pathD}
                fill="url(#radarFillGradient)"
                stroke="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
            />

            {/* Stroke Line (Draw Animation after dots) */}
            <motion.path
                d={pathD}
                fill="none"
                stroke="url(#radarStrokeGradient)"
                strokeWidth="3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
            />

            {/* Dots (Sequential Pop in) */}
            {dataPoints.map((p: any, i: number) => (
                <g 
                    key={`dot-group-${i}`} 
                    onMouseEnter={(e) => onHover(e, data[i])} 
                    onMouseLeave={(e) => onHover(e, null)}
                    style={{ cursor: 'pointer' }}
                >
                    {/* Interaction Target */}
                    <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
                    
                    <motion.circle
                        cx={p.x} cy={p.y} r={4}
                        fill="#fff"
                        stroke="#00d2ff"
                        strokeWidth={1}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.15, type: "spring", stiffness: 300, damping: 20 }}
                    />
                </g>
            ))}
        </svg>
    );
};

const EvaluationMatrix: React.FC<EvaluationMatrixProps> = ({ stats, history, dailyXp }) => {
  const [view, setView] = useState<'CURRENT' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('CURRENT');
  const [tooltipConfig, setTooltipConfig] = useState<{data: any, x: number, y: number} | null>(null);

  // Calculate Growth based on history
  const oldestEntry = history && history.length > 0 ? history[history.length - 1] : null;
  
  const getGrowth = (statKey: keyof CoreStats) => {
      if (!oldestEntry || !oldestEntry.stats) return 0;
      const oldVal = oldestEntry.stats[statKey];
      const currentVal = stats[statKey];
      
      // Handle start from 0 case
      if (!oldVal || oldVal === 0) {
          return currentVal > 0 ? 100 : 0;
      }
      // Calculate percentage increase
      return Math.round(((currentVal - oldVal) / oldVal) * 100);
  };

  // Calculate Dynamic Domain
  const maxStatValue = useMemo(() => {
      return Math.max(
          stats.strength, 
          stats.intelligence, 
          stats.focus, 
          stats.social, 
          stats.willpower
      );
  }, [stats]);

  // Set domain to slightly larger than max stat (min 10) to make small stats visible
  const domainMax = Math.max(10, Math.ceil(maxStatValue * 1.2));

  // Prepare Radar Data
  const radarData = useMemo(() => [
    { subject: 'STRENGTH', value: stats.strength, fullMark: domainMax, growth: getGrowth('strength') },
    { subject: 'INTELLIGENCE', value: stats.intelligence, fullMark: domainMax, growth: getGrowth('intelligence') },
    { subject: 'FOCUS', value: stats.focus, fullMark: domainMax, growth: getGrowth('focus') },
    { subject: 'SOCIAL', value: stats.social, fullMark: domainMax, growth: getGrowth('social') },
    { subject: 'WILLPOWER', value: stats.willpower, fullMark: domainMax, growth: getGrowth('willpower') },
  ], [stats, domainMax]);

  // Handle Tooltip for Custom Radar
  const handleRadarHover = (e: React.MouseEvent, data: any) => {
      if (!data) {
          setTooltipConfig(null);
          return;
      }
      // Get raw coordinate relative to viewport
      const rect = (e.target as Element).getBoundingClientRect();
      setTooltipConfig({
          data,
          x: rect.left + rect.width / 2, 
          y: rect.top
      });
  };

  // Prepare Graph Data
  const sortedHistory = history ? [...history].reverse() : [];

  // Weekly: Last 7 days
  const weeklyData = sortedHistory.slice(-7).map(entry => ({
    name: entry.date ? entry.date.split('-').slice(1).join('/') : '??', // MM/DD
    xp: entry.totalXp,
    str: entry.stats?.strength || 0,
    int: entry.stats?.intelligence || 0
  }));
  
  // Monthly: Last 30 days (Aggregate or raw)
  const monthlyData = sortedHistory.slice(-30).map(entry => ({
    name: entry.date ? entry.date.split('-').slice(1).join('/') : '??',
    xp: entry.totalXp,
  }));

  // Daily: Just Yesterday vs Today
  const yesterdayXp = history && history.length > 0 ? history[0].dailyXp : 0;
  const dailyData = [
    { name: 'YESTERDAY', xp: yesterdayXp },
    { name: 'TODAY', xp: dailyXp }
  ];

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* Header Tabs */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
         <div className="flex items-center gap-2">
            <Activity size={14} className="text-system-accent animate-pulse" />
            <h3 className="text-xs text-gray-400 font-mono tracking-widest">EVALUATION MATRIX</h3>
         </div>
         <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
            <button 
              onClick={() => setView('CURRENT')}
              className={`p-1.5 rounded transition-all duration-300 ${view === 'CURRENT' ? 'bg-system-neon text-black shadow-[0_0_10px_#00d2ff]' : 'text-gray-600 hover:text-white'}`}
              title="Current Stats"
            >
              <Hexagon size={14} />
            </button>
            <button 
              onClick={() => setView('DAILY')}
              className={`p-1.5 rounded transition-all duration-300 ${view === 'DAILY' ? 'bg-system-neon text-black shadow-[0_0_10px_#00d2ff]' : 'text-gray-600 hover:text-white'}`}
              title="Daily Performance"
            >
              <BarChart3 size={14} />
            </button>
            <button 
              onClick={() => setView('WEEKLY')}
              className={`p-1.5 rounded transition-all duration-300 ${view === 'WEEKLY' ? 'bg-system-neon text-black shadow-[0_0_10px_#00d2ff]' : 'text-gray-600 hover:text-white'}`}
              title="Weekly Trend"
            >
              <span className="text-[10px] font-mono font-bold block w-[14px] text-center">7D</span>
            </button>
            <button 
              onClick={() => setView('MONTHLY')}
              className={`p-1.5 rounded transition-all duration-300 ${view === 'MONTHLY' ? 'bg-system-neon text-black shadow-[0_0_10px_#00d2ff]' : 'text-gray-600 hover:text-white'}`}
              title="Monthly Trend"
            >
               <Calendar size={14} />
            </button>
         </div>
      </div>

      <div className="flex-1 relative min-h-[300px] bg-black/20 border border-white/5 rounded-lg overflow-hidden group">
        
        {/* Tech Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
        
        {/* Scanning Line Animation */}
        <motion.div 
            className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-system-neon/20 to-transparent shadow-[0_0_10px_rgba(0,210,255,0.2)] z-0 pointer-events-none"
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
        />

        <AnimatePresence mode="wait">
          
          {/* VIEW: CURRENT (CUSTOM RADAR) */}
          {view === 'CURRENT' && (
            <motion.div 
              key="radar"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 w-full h-full p-4"
            >
              <CustomRadarChart data={radarData} domainMax={domainMax} onHover={handleRadarHover} />
              
              {/* Decorative Tech Corners */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-system-neon/40 rounded-tl-sm"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-system-neon/40 rounded-br-sm"></div>
            </motion.div>
          )}

          {/* VIEW: DAILY (BAR CHART) */}
          {view === 'DAILY' && (
            <motion.div 
              key="daily"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 w-full h-full"
            >
               <div className="absolute top-2 left-3 text-[10px] text-gray-500 font-mono tracking-wider">XP GAINED (24H)</div>
               <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                     <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                     <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                     <Tooltip content={<GraphTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                     <Bar dataKey="xp" name="XP" fill="#00d2ff" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1500} />
                  </BarChart>
               </ResponsiveContainer>
            </motion.div>
          )}

          {/* VIEW: WEEKLY (AREA CHART) */}
          {view === 'WEEKLY' && (
             <motion.div 
               key="weekly"
               variants={panelVariants}
               initial="hidden"
               animate="visible"
               exit="exit"
               className="absolute inset-0 w-full h-full"
             >
                {weeklyData.length < 2 ? (
                   <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono">INSUFFICIENT DATA FOR TREND ANALYSIS</div>
                ) : (
                  <>
                    <div className="absolute top-2 left-3 text-[10px] text-gray-500 font-mono tracking-wider">STATS GROWTH (7 DAYS)</div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={weeklyData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                          <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                          <Tooltip content={<GraphTooltip />} />
                          <Area type="monotone" dataKey="str" name="STR" stackId="1" stroke="#ef4444" fill="none" strokeWidth={2} animationDuration={2000} />
                          <Area type="monotone" dataKey="int" name="INT" stackId="1" stroke="#00d2ff" fill="none" strokeWidth={2} animationDuration={2000} />
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
               variants={panelVariants}
               initial="hidden"
               animate="visible"
               exit="exit"
               className="absolute inset-0 w-full h-full"
             >
                 {monthlyData.length < 2 ? (
                   <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono">INSUFFICIENT DATA FOR TREND ANALYSIS</div>
                ) : (
                  <>
                    <div className="absolute top-2 left-3 text-[10px] text-gray-500 font-mono tracking-wider">TOTAL XP GROWTH (30 DAYS)</div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                          <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                          <Tooltip content={<GraphTooltip />} />
                          <Area type="monotone" dataKey="xp" name="Total XP" stroke="#00d2ff" fill="url(#colorTotal)" strokeWidth={2} animationDuration={2000} />
                        </AreaChart>
                    </ResponsiveContainer>
                  </>
                )}
             </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Manual Tooltip Portal for Radar */}
      {view === 'CURRENT' && tooltipConfig && (
          <div 
            style={{ 
                position: 'fixed', 
                left: tooltipConfig.x, 
                top: tooltipConfig.y, 
                transform: 'translate(-50%, -110%)', 
                zIndex: 100,
                pointerEvents: 'none'
            }}
          >
             <RadarTooltip active={true} label={tooltipConfig.data.subject} payload={[{ payload: tooltipConfig.data }]} />
          </div>
      )}
    </div>
  );
};

export default EvaluationMatrix;
