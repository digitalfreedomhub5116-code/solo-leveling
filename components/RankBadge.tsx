
import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Zap, Crown, Sparkles, Lock } from 'lucide-react';

export type RankType = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

interface RankBadgeProps {
  rank: RankType;
  status: 'LOCKED' | 'ACTIVE' | 'COMPLETED';
}

const RankBadge: React.FC<RankBadgeProps> = ({ rank, status }) => {
  const isLocked = status === 'LOCKED';
  const isActive = status === 'ACTIVE';

  const baseScale = isActive ? 1.2 : 1;
  // Subtle dimming for locked items, but keeping full color visibility
  const containerStyle = isLocked ? { filter: 'brightness(0.7)' } : {};

  // --- RENDERERS FOR EACH RANK ---

  // Rank E: The Rusty "Awakened" Slab
  const RenderRankE = () => (
    <div className="relative w-24 h-28 flex items-center justify-center">
      {/* Stone Tablet Shape */}
      <div 
        className="absolute inset-0 bg-stone-800 border-b-4 border-stone-900 rounded-sm shadow-2xl"
        style={{ 
            clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)',
            backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg"), linear-gradient(to bottom right, #57534e, #292524)'
        }}
      >
         {/* Cracks/Scratches */}
         <div className="absolute top-2 left-2 w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_11px)]" />
      </div>
      
      {/* Inner Frame */}
      <div className="absolute inset-2 border-2 border-stone-600/50 opacity-50 rounded-sm" style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)' }} />

      {/* Rust Details */}
      <div className="absolute bottom-0 right-0 w-12 h-12 bg-orange-900/40 blur-xl rounded-full" />
      <div className="absolute top-0 left-0 w-8 h-8 bg-orange-900/30 blur-lg rounded-full" />
      
      <span className="relative z-10 font-serif text-5xl font-black text-stone-400 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]">E</span>
    </div>
  );

  // Rank D: The Honed Bronze Plate
  const RenderRankD = () => (
    <div className="relative w-24 h-28 flex items-center justify-center">
      {/* Bronze Shield */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-orange-800 via-amber-900 to-orange-950 shadow-xl border-t border-orange-500/20"
        style={{ 
            clipPath: 'path("M12 0 H88 L100 20 V80 L88 100 H12 L0 80 V20 Z")', // Octagonal-ish plate
        }}
      >
          {/* Metallic Sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-orange-500/10 to-transparent opacity-50" />
      </div>

      {/* Rivets */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-orange-950 border border-orange-700 shadow-sm" />
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-950 border border-orange-700 shadow-sm" />
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-orange-950 border border-orange-700 shadow-sm" />
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-orange-950 border border-orange-700 shadow-sm" />

      {/* Center Circle */}
      <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-orange-900/50 bg-black/20" />
      </div>
      
      <span className="relative z-10 font-mono text-5xl font-bold text-orange-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">D</span>
    </div>
  );

  // Rank C: The Knight’s Crest
  const RenderRankC = () => (
    <div className="relative w-24 h-28 flex items-center justify-center">
        {/* Silver Shield */}
        <div 
            className="absolute inset-0 bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            style={{ clipPath: 'path("M 0 0 H 100 V 60 C 100 90 50 100 50 100 C 50 100 0 90 0 60 V 0 Z")' }}
        >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,white_50%,transparent_60%)] opacity-20" />
        </div>

        {/* Blue Core */}
        <div className="absolute w-12 h-12 bg-blue-900/80 rounded-full blur-md" />
        
        {/* Gears (Static decoration or subtle spin) */}
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute z-10 text-slate-800 opacity-40"
        >
            <Settings size={50} />
        </motion.div>

        <span className="relative z-20 font-black text-5xl text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">C</span>
        
        {/* Shine */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" style={{ clipPath: 'path("M 0 0 H 100 V 60 C 100 90 50 100 50 100 C 50 100 0 90 0 60 V 0 Z")' }} />
    </div>
  );

  // Rank B: The Cobalt Guardian
  const RenderRankB = () => (
    <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Diamond Star Shape */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-900 rotate-45 border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                {/* Tech Lines */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-[1px] h-full bg-cyan-400 animate-pulse" />
            </div>
        </div>
        
        {/* Extended Spikes */}
        <div className="absolute -top-2 w-1 h-8 bg-cyan-500 shadow-[0_0_10px_cyan]" />
        <div className="absolute -bottom-2 w-1 h-8 bg-cyan-500 shadow-[0_0_10px_cyan]" />
        <div className="absolute -left-2 w-8 h-1 bg-cyan-500 shadow-[0_0_10px_cyan]" />
        <div className="absolute -right-2 w-8 h-1 bg-cyan-500 shadow-[0_0_10px_cyan]" />

        <div className="relative z-10 font-black text-5xl text-cyan-50 drop-shadow-[0_0_10px_rgba(6,182,212,1)] flex items-center justify-center">
            B
        </div>
    </div>
  );

  // Rank A: The Golden Sovereign
  const RenderRankA = () => (
    <div className="relative w-28 h-32 flex items-center justify-center">
        {/* Sunburst Back */}
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center opacity-50"
        >
            {Array.from({ length: 8 }).map((_, i) => (
                <div 
                    key={i} 
                    className="absolute w-1 h-32 bg-gradient-to-b from-yellow-500/0 via-yellow-500/50 to-yellow-500/0"
                    style={{ transform: `rotate(${i * 45}deg)` }}
                />
            ))}
        </motion.div>
        
        {/* Main Plaque */}
        <div className="w-20 h-24 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 rounded-lg border-2 border-yellow-100 shadow-[0_0_40px_rgba(234,179,8,0.6)] flex items-center justify-center relative z-10">
            {/* Inner Border */}
            <div className="absolute inset-1 border border-yellow-900/30 rounded" />
            
            {/* Gemstones */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-600 rounded-full border border-red-400 shadow-[0_0_5px_red]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-red-400 shadow-[0_0_5px_red]" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-red-600 rounded-full border border-red-400 shadow-[0_0_5px_red]" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-red-400 shadow-[0_0_5px_red]" />
            
            <span className="font-serif font-black text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white to-yellow-200 drop-shadow-[0_2px_4px_rgba(161,98,7,0.8)]">A</span>
        </div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
             <motion.div 
                animate={{ y: -60, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-yellow-200 rounded-full shadow-[0_0_5px_gold]"
            />
        </div>
    </div>
  );

  // Rank S: The Monarch’s Void
  const RenderRankS = () => (
    <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Chaotic Aura */}
        <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-purple-600/30 rounded-full blur-xl"
        />
        
        {/* Orbiting Shards */}
        <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 z-0"
        >
            <div className="absolute top-0 left-1/2 w-3 h-3 bg-black border border-purple-500 rotate-45 shadow-[0_0_10px_purple]" />
            <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-black border border-purple-500 rotate-45 shadow-[0_0_10px_purple]" />
            <div className="absolute left-0 top-1/2 w-3 h-3 bg-black border border-purple-500 rotate-45 shadow-[0_0_10px_purple]" />
            <div className="absolute right-0 top-1/2 w-3 h-3 bg-black border border-purple-500 rotate-45 shadow-[0_0_10px_purple]" />
        </motion.div>

        {/* Void Core */}
        <div className="w-20 h-20 bg-black rounded-xl border border-purple-500/50 shadow-[0_0_50px_rgba(147,51,234,0.8)] flex items-center justify-center relative z-10 overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#581c87_120%)]" />
            
            {/* Glitch Effect */}
            <motion.div 
                animate={{ x: [-2, 2, -2], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                className="relative z-20"
            >
                <span className="font-black text-6xl text-white drop-shadow-[0_0_15px_#a855f7]">
                    S
                </span>
            </motion.div>
            
            {/* Leaking Smoke */}
            <motion.div 
                animate={{ y: [0, 20], opacity: [0.8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/50 to-transparent blur-sm"
            />
        </div>
        
        {isActive && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-8 text-xs text-purple-300 font-mono tracking-[0.3em] uppercase font-bold drop-shadow-md"
            >
                Monarch
            </motion.div>
        )}
    </div>
  );

  return (
    <motion.div
        animate={{ scale: baseScale }}
        style={containerStyle}
        className="flex flex-col items-center justify-center relative"
    >
        {/* LOCKED OVERLAY TEXT */}
        {isLocked && (
            <div className="absolute inset-0 z-50 flex items-center justify-center">
                <div className="bg-black/80 px-2 py-1 rounded border border-gray-600/50 backdrop-blur-[2px]">
                    <span className="text-[10px] md:text-xs font-black text-white tracking-widest font-mono flex items-center gap-1">
                        <Lock size={10} /> LOCKED
                    </span>
                </div>
            </div>
        )}

        {rank === 'E' && <RenderRankE />}
        {rank === 'D' && <RenderRankD />}
        {rank === 'C' && <RenderRankC />}
        {rank === 'B' && <RenderRankB />}
        {rank === 'A' && <RenderRankA />}
        {rank === 'S' && <RenderRankS />}
        
        {isActive && (
            <motion.div 
                layoutId="active-rank-indicator"
                className="mt-6 text-[10px] font-bold bg-white text-black px-3 py-1 rounded-full font-mono tracking-widest uppercase shadow-[0_0_15px_white]"
            >
                CURRENT
            </motion.div>
        )}
    </motion.div>
  );
};

export default RankBadge;
