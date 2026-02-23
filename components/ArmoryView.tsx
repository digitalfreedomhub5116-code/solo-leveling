
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Lock, Plus, Zap, Ghost, 
  Sword, Coins, ShieldCheck 
} from 'lucide-react';
import { OUTFITS, TIERS, calculateStat, SHADOWS } from '../utils/gameData';
import { CombatStats, Shadow, Outfit } from '../types';

interface ArmoryViewProps {
  gold: number;
  unlockedOutfits: string[];
  equippedOutfitId: string;
  onPurchase?: (outfit: Outfit) => void;
  onEquip: (id: string) => void;
}

const ArmoryView: React.FC<ArmoryViewProps> = ({ 
    gold, 
    unlockedOutfits = [], 
    equippedOutfitId, 
    onPurchase,
    onEquip 
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const activeOutfit = OUTFITS[activeIndex];
  const isUnlocked = unlockedOutfits.includes(activeOutfit.id);
  const isEquipped = equippedOutfitId === activeOutfit.id;
  const tierInfo = TIERS[activeOutfit.tier];

  const [shadows, setShadows] = useState<(Shadow | null)[]>([null, SHADOWS[0], null]);

  const cycleOutfit = (dir: number) => {
    let newIndex = activeIndex + dir;
    if (newIndex < 0) newIndex = OUTFITS.length - 1;
    if (newIndex >= OUTFITS.length) newIndex = 0;
    setActiveIndex(newIndex);
  };

  const StatBar = ({ label, statKey, colorClass, icon: Icon }: { label: string, statKey: keyof CombatStats, colorClass: string, icon: any }) => {
    const { total, isCapped, cap } = calculateStat(activeOutfit.baseStats[statKey], activeOutfit.tier, shadows, statKey);
    const percentage = Math.min(100, (total / cap) * 100);

    return (
      <div className="mb-4">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
             <Icon size={12} className={isCapped ? "text-red-500" : "text-gray-500"} /> {label}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold ${isCapped ? 'text-red-500' : 'text-white'}`}>
              {total} <span className="text-gray-600 text-[10px]">/ {cap}</span>
            </span>
            {isCapped && <Lock size={10} className="text-red-500" />}
          </div>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden relative border border-gray-700">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full ${colorClass} relative shadow-[0_0_10px_currentColor]`}
          >
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white opacity-50" />
          </motion.div>
        </div>
        {isCapped && <p className="text-[9px] text-red-500 font-bold mt-1 text-right animate-pulse">TIER CAP REACHED // UPGRADE REQUIRED</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white font-sans pb-24 overflow-hidden flex flex-col items-center bg-transparent">
      
      {/* 1. OUTFIT CAROUSEL */}
      <div className="relative w-full max-w-xl h-[45vh] flex items-center justify-center border-b border-white/10 overflow-hidden bg-black/20 backdrop-blur-sm rounded-b-[2rem]">
        
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />

        {/* Tech Ring Background */}
        <div className="absolute w-[600px] h-[600px] border border-white/5 rounded-full animate-[spin_60s_linear_infinite] pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] border border-white/10 rounded-full animate-[spin_40s_linear_infinite_reverse] pointer-events-none" />

        <AnimatePresence mode='wait'>
          <motion.div
            key={activeOutfit.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 text-center flex flex-col items-center w-full px-8"
          >
            {/* Image Container */}
            <div className="w-48 h-64 md:w-56 md:h-72 bg-[#1C1C1E] rounded-2xl mb-4 border border-white/10 shadow-2xl relative overflow-hidden group">
               {/* Scan Effect */}
               <div className="absolute top-0 w-full h-1 bg-system-neon/50 shadow-[0_0_15px_#85D3E0] animate-[scan_2s_ease-in-out_infinite] z-20 pointer-events-none" />
               
               <img 
                 src={activeOutfit.image} 
                 className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                 alt={activeOutfit.name} 
               />
               
               {!isUnlocked && (
                   <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30 backdrop-blur-sm">
                       <Lock size={32} className="text-gray-500" />
                   </div>
               )}
            </div>
            
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg">
                {activeOutfit.name}
            </h1>
            
            <div className={`inline-block px-3 py-0.5 border border-current rounded-full mt-2 text-[10px] font-bold tracking-widest ${tierInfo.color} bg-black/50 backdrop-blur-md`}>
              TIER {activeOutfit.tier} // CAP: {tierInfo.statCap}
            </div>

            {/* Equip/Buy Button */}
            <div className="mt-4">
                {isUnlocked ? (
                    <button 
                        onClick={() => onEquip(activeOutfit.id)}
                        disabled={isEquipped}
                        className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${isEquipped ? 'bg-[#1C1C1E] text-gray-500 cursor-default' : 'bg-white text-black hover:bg-[#85D3E0] hover:scale-105 shadow-lg'}`}
                    >
                        {isEquipped ? 'EQUIPPED' : 'EQUIP GEAR'}
                    </button>
                ) : (
                    <button 
                        onClick={() => onPurchase && onPurchase(activeOutfit)}
                        className="px-6 py-2 bg-yellow-600 text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-yellow-500 transition-all shadow-lg"
                    >
                        UNLOCK ({activeOutfit.cost} G)
                    </button>
                )}
            </div>

          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <button onClick={() => cycleOutfit(-1)} className="absolute left-2 p-3 text-gray-500 hover:text-white transition-colors z-20">
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button onClick={() => cycleOutfit(1)} className="absolute right-2 p-3 text-gray-500 hover:text-white transition-colors z-20">
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* 2. STATS SECTION */}
      <div className="w-full max-w-xl p-6 space-y-2 card-dark mt-4 mx-4">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
            <Zap size={16} className="text-[#85D3E0]" />
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Performance Metrics</h3>
        </div>
        
        <StatBar label="Attack Power" statKey="attack" colorClass="bg-red-600" icon={Sword} />
        <StatBar label="Loot Multiplier" statKey="loot" colorClass="bg-yellow-500" icon={Coins} />
        <StatBar label="Extraction Rate" statKey="extraction" colorClass="bg-purple-600" icon={Ghost} />
        <StatBar label="Ultimate Charge" statKey="ultimate" colorClass="bg-blue-500" icon={Zap} />
      </div>

      {/* 3. SHADOW ARMY */}
      <div className="w-full max-w-xl p-6 mt-4 card-dark mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-[#D4C4FA] flex items-center gap-2 uppercase tracking-widest">
            <Ghost size={16} /> Shadow Army
          </h3>
          <span className="text-[10px] text-gray-600 font-mono font-bold tracking-wider">3 SLOTS AVAILABLE</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {shadows.map((shadow, index) => (
            <div key={index} className="aspect-square relative group">
              {shadow ? (
                // Equipped Slot
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-full h-full rounded-2xl bg-[#2C2C2E] border border-[#D4C4FA] overflow-hidden relative shadow-lg group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-purple-900/20 flex items-center justify-center text-2xl font-black text-[#D4C4FA] uppercase">
                    {shadow.name[0]}
                  </div>
                  <div className="absolute bottom-0 w-full bg-purple-900/80 backdrop-blur-sm text-white text-[8px] font-bold text-center py-1 uppercase tracking-wider border-t border-purple-500/30">
                    {shadow.rank}
                  </div>
                  <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
                  </div>
                </motion.div>
              ) : (
                // Empty Slot
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full h-full rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-[#85D3E0] hover:bg-[#85D3E0]/10 transition-colors group bg-[#1C1C1E]"
                >
                  <Plus className="text-gray-600 group-hover:text-[#85D3E0] transition-colors" />
                  <span className="text-[8px] text-gray-600 font-bold uppercase tracking-wider group-hover:text-[#85D3E0]">Equip</span>
                </motion.button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ArmoryView;
