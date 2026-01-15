
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Activity, Calendar, BarChart3, Hexagon, TrendingUp, Zap } from 'lucide-react';
import { CoreStats, HistoryEntry } from '../types';

interface EvaluationMatrixProps {
  stats: CoreStats; // Current Totals (Lifetime)
  history: HistoryEntry[];
  dailyXp: number; 
  dailyStats?: CoreStats; 
  weeklyStats?: CoreStats; // New Prop
  monthlyStats?: CoreStats; // New Prop
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
              {Math.floor(value)}
            </span>
            <span className="text-[10px] text-gray-600 font-mono font-bold">PTS</span>
        </div>
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

// Reusable Radar Chart Component
const CustomRadarChart = ({ data, domainMax, onHover, color1, color2, fillOpacity = 0.4 }: any) => {
    const size = 300;
    const center = size / 2;
    const radius = 100; // Max radius fitting in 300x300 with labels
    
    // Safety check for empty data
    if (!data || data.length === 0) return null;

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
        // Clamp value to domainMax to avoid overflow, handle NaNs
        const safeValue = isNaN(d.value) ? 0 : d.value;
        const safeMax = (!domainMax || isNaN(domainMax) || domainMax === 0) ? 100 : domainMax;
        
        const val = Math.min(safeValue, safeMax);
        const valRadius = (val / safeMax) * radius;
        return polarToCartesian(center, center, valRadius, angle);
    });
    
    const pathD = dataPoints.map((p: any, i: number) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';

    const c1 = color1 || "#00d2ff";
    const c2 = color2 || "#8b5cf6";

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible select-none">
            <defs>
                <linearGradient id={`radarStroke-${c1}-${c2}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={c1} />
                    <stop offset="100%" stopColor={c2} />
                </linearGradient>
                <linearGradient id={`radarFill-${c1}-${c2}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c1} stopOpacity={fillOpacity}/>
                    <stop offset="100%" stopColor={c2} stopOpacity={0.05}/>
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
                fill={`url(#radarFill-${c1}-${c2})`}
                stroke="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            />

            {/* Stroke Line (Draw Animation after dots) */}
            <motion.path
                d={pathD}
                fill="none"
                stroke={`url(#radarStroke-${c1}-${c2})`}
                strokeWidth="3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 1, ease: "easeInOut" }}
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
                        stroke={c1}
                        strokeWidth={1}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                    />
                </g>
            ))}
        </svg>
    );
};

const EvaluationMatrix: React.FC<EvaluationMatrixProps> = ({ stats, history, dailyStats, weeklyStats, monthlyStats }) => {
  const [view, setView] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [tooltipConfig, setTooltipConfig] = useState<{data: any, x: number, y: number} | null>(null);

  // Helper to format data for radar
  const getRadarData = (statObj: CoreStats | undefined) => {
      const safeStats = statObj || { strength: 0, intelligence: 0, focus: 0, social: 0, willpower: 0 };
      const values = Object.values(safeStats).map(v => typeof v === 'number' && !isNaN(v) ? v : 0);
      const maxVal = Math.max(...values);
      // Dynamic domain with minimum of 5 for visibility
      const domain = Math.max(5, Math.ceil(maxVal / 5) * 5); 
      
      return {
          data: [
            { subject: 'STRENGTH', value: safeStats.strength || 0, fullMark: domain },
            { subject: 'INTELLIGENCE', value: safeStats.intelligence || 0, fullMark: domain },
            { subject: 'FOCUS', value: safeStats.focus || 0, fullMark: domain },
            { subject: 'SOCIAL', value: safeStats.social || 0, fullMark: domain },
            { subject: 'WILLPOWER', value: safeStats.willpower || 0, fullMark: domain },
          ],
          domain
      };
  };

  // 1. DAILY DATA
  const dailyData = useMemo(() => getRadarData(dailyStats), [dailyStats]);

  // 2. WEEKLY DATA
  const weeklyRadarData = useMemo(() => getRadarData(weeklyStats), [weeklyStats]);

  // 3. MONTHLY DATA
  const monthlyData = useMemo(() => getRadarData(monthlyStats), [monthlyStats]);

  // Handle Tooltip
  const handleRadarHover = (e: React.MouseEvent, data: any) => {
      if (!data) {
          setTooltipConfig(null);
          return;
      }
      const rect = (e.target as Element).getBoundingClientRect();
      setTooltipConfig({
          data,
          x: rect.left + rect.width / 2, 
          y: rect.top
      });
  };

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
              onClick={() => setView('DAILY')}
              className={`px-3 py-1 rounded transition-all duration-300 text-[10px] font-mono font-bold flex items-center gap-1 ${view === 'DAILY' ? 'bg-system-neon text-black shadow-[0_0_10px_#00d2ff]' : 'text-gray-600 hover:text-white'}`}
            >
              <Zap size={10} /> DAILY
            </button>
            <button 
              onClick={() => setView('WEEKLY')}
              className={`px-3 py-1 rounded transition-all duration-300 text-[10px] font-mono font-bold flex items-center gap-1 ${view === 'WEEKLY' ? 'bg-purple-500 text-white shadow-[0_0_10px_#8b5cf6]' : 'text-gray-600 hover:text-white'}`}
            >
              <BarChart3 size={10} /> WEEKLY
            </button>
            <button 
              onClick={() => setView('MONTHLY')}
              className={`px-3 py-1 rounded transition-all duration-300 text-[10px] font-mono font-bold flex items-center gap-1 ${view === 'MONTHLY' ? 'bg-yellow-500 text-black shadow-[0_0_10px_#eab308]' : 'text-gray-600 hover:text-white'}`}
            >
               <Hexagon size={10} /> MONTHLY
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
          
          {/* VIEW: DAILY (NEON BLUE) */}
          {view === 'DAILY' && (
            <motion.div 
              key="radar-daily"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 w-full h-full p-4"
            >
              <CustomRadarChart 
                data={dailyData.data} 
                domainMax={dailyData.domain} 
                onHover={handleRadarHover}
                color1="#00d2ff" // Neon Blue
                color2="#3b82f6" // Blue 500
                fillOpacity={0.6}
              />
              <div className="absolute top-2 left-2 text-[9px] text-system-neon font-mono tracking-widest bg-system-neon/10 px-2 py-1 rounded">24H PERFORMANCE</div>
            </motion.div>
          )}

          {/* VIEW: WEEKLY (PURPLE) */}
          {view === 'WEEKLY' && (
            <motion.div 
              key="radar-weekly"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 w-full h-full p-4"
            >
              <CustomRadarChart 
                data={weeklyRadarData.data} 
                domainMax={weeklyRadarData.domain} 
                onHover={handleRadarHover}
                color1="#a855f7" // Purple
                color2="#d8b4fe" // Light Purple
                fillOpacity={0.3}
              />
              <div className="absolute top-2 left-2 text-[9px] text-purple-400 font-mono tracking-widest bg-purple-900/20 px-2 py-1 rounded">7-DAY ACCUMULATION</div>
            </motion.div>
          )}

          {/* VIEW: MONTHLY (GOLD - IDENTITY) */}
          {view === 'MONTHLY' && (
             <motion.div 
               key="radar-monthly"
               variants={panelVariants}
               initial="hidden"
               animate="visible"
               exit="exit"
               className="absolute inset-0 w-full h-full p-4"
             >
                <CustomRadarChart 
                    data={monthlyData.data} 
                    domainMax={monthlyData.domain} 
                    onHover={handleRadarHover}
                    color1="#fbbf24" // Amber
                    color2="#f59e0b" // Amber Dark
                    fillOpacity={0.15}
                />
                <div className="absolute top-2 left-2 text-[9px] text-yellow-500 font-mono tracking-widest bg-yellow-900/20 px-2 py-1 rounded">30-DAY ACCUMULATION</div>
             </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Manual Tooltip Portal for Radar */}
      {tooltipConfig && (
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
