
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis 
} from 'recharts';
import { Dumbbell, Brain, Target, Users, Shield, Zap, Activity } from 'lucide-react';
import { PlayerData, CoreStats } from '../types';

interface HunterCommandDeckProps {
  player: PlayerData;
  triggerActionId?: string | null;
  videoMap?: Record<string, string>;
}

// --- MINI CIRCULAR STAT ---
const MiniCircularStat = ({ value, max = 100, label, icon: Icon, colorHex, colorClass }: any) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1 group w-full">
      <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12">
        {/* Background Track */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible">
           <circle cx="50%" cy="50%" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="transparent" />
           {/* Progress Path */}
           <motion.circle 
             initial={{ strokeDashoffset: circumference }}
             animate={{ strokeDashoffset: offset }}
             transition={{ duration: 1.5, ease: "easeOut" }}
             cx="50%" cy="50%" r={radius} 
             stroke={colorHex}
             strokeWidth="3" 
             strokeDasharray={circumference} 
             strokeLinecap="round" 
             fill="transparent" 
             style={{ filter: `drop-shadow(0 0 2px ${colorHex})` }}
           />
        </svg>
        <div className="relative z-10 bg-black/40 rounded-full p-1.5 backdrop-blur-sm border border-white/5 group-hover:border-white/20 transition-colors">
            <Icon size={14} className={colorClass} style={{ filter: `drop-shadow(0 0 5px ${colorHex})` }} />
        </div>
      </div>
      <div className="text-center leading-none mt-1">
        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-[10px] font-mono font-black text-white">{Math.floor(value)}</div>
      </div>
    </div>
  );
};

const HunterCommandDeck: React.FC<HunterCommandDeckProps> = ({ player, triggerActionId, videoMap }) => {
  // Use core stats for the hexagonal chart
  const stats: CoreStats = player.stats;

  // 6-Point Hexagonal Data with Full Names
  const chartData = [
    { subject: 'STR', A: stats.strength, fullMark: 100 },
    { subject: 'INT', A: stats.intelligence, fullMark: 100 },
    { subject: 'FOC', A: stats.focus, fullMark: 100 },
    { subject: 'SOC', A: stats.social, fullMark: 100 },
    { subject: 'WIL', A: stats.willpower, fullMark: 100 },
    { subject: 'DIS', A: stats.discipline, fullMark: 100 },
  ];

  // Icons configuration
  const statConfig = [
      { key: 'strength', label: 'STR', icon: Dumbbell, color: 'text-red-500', glow: '#ef4444' },
      { key: 'intelligence', label: 'INT', icon: Brain, color: 'text-blue-500', glow: '#3b82f6' },
      { key: 'focus', label: 'FOC', icon: Target, color: 'text-cyan-400', glow: '#06b6d4' },
      { key: 'social', label: 'SOC', icon: Users, color: 'text-yellow-500', glow: '#eab308' },
      { key: 'willpower', label: 'WIL', icon: Shield, color: 'text-purple-500', glow: '#a855f7' },
      { key: 'discipline', label: 'DIS', icon: Zap, color: 'text-white', glow: '#ffffff' },
  ];

  const defaultVideo = "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1769167952/Subject_animestyle_shadow_202601231701_vl45_ayicwk.mp4";
  const currentVideo = (triggerActionId && videoMap && videoMap[triggerActionId]) ? videoMap[triggerActionId] : defaultVideo;

  return (
    <div className="w-full md:h-[600px] relative rounded-3xl overflow-hidden shadow-2xl group border border-white/10">
      
      {/* --- LAYER 1: BASE BACKGROUND --- */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* --- LAYER 2: VIBRANT BLOBS (The "Lights" behind the glass) --- */}
      {/* Circles behind the hunter deck, clearly visible faddedly */}
      
      {/* 1. Large Purple/Violet Orb - Top Right */}
      <div className="absolute -top-[150px] -right-[150px] w-[600px] h-[600px] rounded-full bg-purple-700/60 blur-[100px] pointer-events-none" />
      
      {/* 2. Medium Indigo/Blue Orb - Bottom Left */}
      <div className="absolute -bottom-[100px] -left-[100px] w-[500px] h-[500px] rounded-full bg-indigo-700/60 blur-[80px] pointer-events-none" />

      {/* 3. Small Bright Fuchsia Accent - Center Left */}
      <div className="absolute top-[30%] -left-[50px] w-[250px] h-[250px] rounded-full bg-fuchsia-600/40 blur-[70px] pointer-events-none" />

      {/* 4. Small Bright Cyan Accent - Center Right */}
      <div className="absolute bottom-[30%] -right-[50px] w-[250px] h-[250px] rounded-full bg-cyan-600/30 blur-[70px] pointer-events-none" />

      {/* --- LAYER 3: FROSTED GLASS SURFACE (50% Transparent) --- */}
      {/* This layer provides the glass effect over the blobs */}
      <div className="absolute inset-0 bg-[#121212]/50 backdrop-blur-xl" /> 
      
      {/* --- LAYER 4: NOISE TEXTURE (For realism) --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      {/* --- LAYER 5: CONTENT WRAPPER --- */}
      <div className="relative z-10 flex flex-col md:flex-row h-full">
          
          {/* --- LEFT CONTAINER (DATA) --- */}
          <div className="w-full md:w-1/2 flex flex-col bg-transparent relative z-10 shrink-0 md:border-r border-white/5 h-auto md:h-full">
              
              {/* Header */}
              <div className="flex justify-between items-center p-6 pb-2 shrink-0">
                  <div>
                    <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none text-metal drop-shadow-md">
                        HUNTER DECK
                    </h2>
                    <div className="text-[10px] text-system-neon tracking-[0.3em] font-mono mt-2 uppercase font-bold">
                        Sys v3.0 // EVALUATION
                    </div>
                  </div>
              </div>

              {/* Radar Chart Container */}
              <div className="w-full h-[300px] md:h-auto md:flex-1 relative z-10 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                      
                      {/* Background Grid */}
                      <PolarGrid stroke="#ffffff" strokeOpacity={0.1} gridType="polygon" />
                      
                      {/* Axis Labels */}
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' }} 
                      />
                      
                      {/* Scale Axis: Forces chart to 0-100 scale */}
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      
                      {/* Max Potential Boundary (Dashed Line) */}
                      <Radar
                        name="Max"
                        dataKey="fullMark"
                        stroke="#475569"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        fill="transparent"
                        fillOpacity={0}
                      />

                      {/* Player Stats Radar */}
                      <Radar
                        name="Stats"
                        dataKey="A"
                        stroke="#00d2ff"
                        strokeWidth={3}
                        fill="#00d2ff"
                        fillOpacity={0.4}
                        isAnimationActive={true}
                        // Custom Tech Dot
                        dot={(props: any) => {
                            const { cx, cy } = props;
                            if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
                            return (
                                <svg x={cx - 4} y={cy - 4} width={8} height={8} className="overflow-visible">
                                    <circle cx="4" cy="4" r="2" fill="#fff" />
                                    <circle cx="4" cy="4" r="4" fill="none" stroke="#00d2ff" strokeWidth="1" opacity="0.8" />
                                    <circle cx="4" cy="4" r="8" fill="url(#dotGlow)" opacity="0.5" />
                                    <defs>
                                        <radialGradient id="dotGlow">
                                            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.8"/>
                                            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0"/>
                                        </radialGradient>
                                    </defs>
                                </svg>
                            );
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
              </div>

              {/* Circular Stats Grid (Bottom) */}
              <div className="grid grid-cols-3 gap-y-6 gap-x-2 px-4 pb-6 pt-4 justify-items-center mt-auto shrink-0">
                  {statConfig.map((conf) => (
                      <MiniCircularStat 
                        key={conf.key}
                        icon={conf.icon} 
                        colorClass={conf.color} 
                        colorHex={conf.glow} 
                        label={conf.label} 
                        value={(stats as any)[conf.key] || 0} 
                      />
                  ))}
              </div>
          </div>

          {/* --- RIGHT CONTAINER (VIDEO) --- */}
          {/* Fixed height on mobile, full height on desktop */}
          <div className="w-full md:w-1/2 relative bg-black/30 overflow-hidden shrink-0 h-[250px] md:h-full border-t md:border-t-0 md:border-l border-white/5">
             <video 
                key={currentVideo}
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-80 scale-110 origin-center mix-blend-screen grayscale contrast-125"
             >
                 <source src={currentVideo} type="video/mp4" />
             </video>
             
             {/* Side Gradient Overlay */}
             <div className="absolute inset-y-0 left-0 w-12 md:w-24 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent z-10 pointer-events-none" />
             <div className="absolute inset-0 bg-system-neon/5 pointer-events-none mix-blend-overlay" />
             
             {/* Sync Indicator */}
             <div className="absolute top-6 right-6 z-20">
                 <div className="flex items-center gap-3 px-3 py-1.5 bg-black/60 border border-system-neon/30 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(0,210,255,0.2)]">
                     <Activity size={14} className="text-system-neon animate-pulse" />
                     <span className="text-[10px] font-mono font-bold text-white tracking-widest uppercase">LIVE FEED</span>
                 </div>
             </div>

             {/* Decorative Scanline */}
             <motion.div 
                initial={{ top: '-10%' }}
                animate={{ top: '110%' }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 w-full h-[2px] bg-system-neon/40 shadow-[0_0_15px_#00d2ff] z-20 pointer-events-none"
             />
          </div>
      </div>

    </div>
  );
};

export default HunterCommandDeck;
