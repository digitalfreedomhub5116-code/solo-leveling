
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Coins, CheckCircle, Sparkles, Box, Ghost, Zap } from 'lucide-react';
import { playSystemSoundEffect } from '../utils/soundEngine';
import { DailyReward } from '../types';

interface DailyLoginModalProps {
  reward: DailyReward;
  onClose: () => void;
}

// --- 3D CUBE FACE COMPONENT ---
const CubeFace = ({ rotateX = 0, rotateY = 0, translateZ = 80, isExploding, children }: any) => (
    <motion.div
        className="absolute inset-0 border-2 border-system-neon/50 bg-black/80 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,210,255,0.1)] flex items-center justify-center"
        animate={isExploding ? {
            opacity: 0,
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ + 300}px) scale(0.5)`
        } : {
            opacity: 1,
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(1)`
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // Custom ease for explosive feeling
    >
        {children}
    </motion.div>
);

// --- 3D CUBE COMPONENT ---
const GiftCube = ({ isExploding }: { isExploding: boolean }) => {
  return (
    <div className="relative w-40 h-40 perspective-1000">
      <motion.div
        className="w-full h-full relative preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
        animate={isExploding ? {
            scale: 1.5,
            rotateX: 0,
            rotateY: 0
        } : { 
          rotateX: [15, 25, 15], 
          rotateY: [0, 360],
          y: [0, -10, 0]
        }}
        transition={isExploding ? { duration: 0.4 } : { 
          rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
          rotateX: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        {/* Inner Glow Core - Explodes */}
        <motion.div 
            animate={isExploding ? { scale: 3, opacity: 0 } : { scale: 1, opacity: 0.5 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-4 bg-system-neon rounded-full blur-xl" 
        />

        {/* FRONT */}
        <CubeFace rotateY={0} isExploding={isExploding}>
             <Box className="text-system-neon opacity-80" size={32} />
        </CubeFace>
        
        {/* BACK */}
        <CubeFace rotateY={180} isExploding={isExploding} />
        
        {/* RIGHT */}
        <CubeFace rotateY={90} isExploding={isExploding} />
        
        {/* LEFT */}
        <CubeFace rotateY={-90} isExploding={isExploding} />
        
        {/* TOP */}
        <CubeFace rotateX={90} isExploding={isExploding}>
             <div className="w-full h-full flex items-center justify-center">
                <div className="w-full h-2 bg-system-neon/50 absolute" />
                <div className="h-full w-2 bg-system-neon/50 absolute" />
             </div>
        </CubeFace>
        
        {/* BOTTOM */}
        <CubeFace rotateX={-90} isExploding={isExploding} />

      </motion.div>
      
      {/* Shadow */}
      <motion.div 
        animate={isExploding ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-8 bg-system-neon/20 blur-xl rounded-full" 
      />
    </div>
  );
};

// --- CARD COMPONENT ---
interface RewardCardProps { 
    index: number; 
    isSelected: boolean; 
    isRevealed: boolean; 
    onClick: () => void;
    anyCardRevealed: boolean;
    reward: DailyReward;
}

const RewardCard: React.FC<RewardCardProps> = ({ 
    index, 
    isSelected, 
    isRevealed, 
    onClick, 
    anyCardRevealed,
    reward
}) => {
    const getRewardIcon = () => {
        if (reward.type === 'WELCOME_KEYS' || reward.type === 'KEYS') return <Key className="text-purple-400" size={32} />;
        if (reward.type === 'GOLD') return <Coins className="text-yellow-400" size={32} />;
        if (reward.type === 'XP') return <Zap className="text-blue-400" size={32} />;
        if (reward.type === 'DUNGEON_PASS') return <Ghost className="text-red-500" size={32} />;
        return <Sparkles className="text-white" size={32} />;
    };

    return (
        <motion.div
            // Initial animation: Scale up from center 0 to 1
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ 
                opacity: anyCardRevealed && !isSelected ? 0.3 : 1, 
                scale: isSelected && isRevealed ? 1.1 : 1,
                rotateY: isRevealed ? 180 : 0
            }}
            transition={{ 
                opacity: { duration: 0.3 },
                scale: { 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 20, 
                    delay: index * 0.1 // Staggered appearance
                },
                rotateY: { duration: 0.6 }
            }}
            whileHover={!anyCardRevealed ? { y: -10, scale: 1.05 } : {}}
            onClick={!anyCardRevealed ? onClick : undefined}
            className="relative w-full aspect-[3/4] cursor-pointer perspective-1000"
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* FRONT (Hidden initially) */}
            <div 
                className="absolute inset-0 backface-hidden rounded-xl border-2 border-system-neon bg-gray-900 flex flex-col items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,210,255,0.2)]"
                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-system-neon/10 to-transparent pointer-events-none" />
                <div className="mb-2 animate-pulse">{getRewardIcon()}</div>
                <div className="text-center">
                    <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                        {reward.type === 'WELCOME_KEYS' ? 'STARTER PACK' : 'SYSTEM DROP'}
                    </div>
                    <div className="text-lg font-black text-white leading-none mt-1">
                        {reward.type === 'WELCOME_KEYS' ? '3 KEYS' : `+${reward.amount}`}
                    </div>
                </div>
            </div>

            {/* BACK (Visible initially) */}
            <div 
                className="absolute inset-0 backface-hidden rounded-xl border-2 border-gray-700 bg-black flex items-center justify-center overflow-hidden group"
                style={{ backfaceVisibility: 'hidden' }}
            >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#00d2ff_1px,transparent_1px)] bg-[size:10px_10px]" />
                <div className="w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center group-hover:border-system-neon group-hover:text-system-neon transition-colors text-gray-600">
                    <span className="font-mono font-bold text-lg">?</span>
                </div>
            </div>
        </motion.div>
    );
};

const DailyLoginModal: React.FC<DailyLoginModalProps> = ({ reward, onClose }) => {
  const [phase, setPhase] = useState<'BOX' | 'CARDS' | 'REWARD'>('BOX');
  const [isExploding, setIsExploding] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  // Auto-Open Sequence
  useEffect(() => {
      // 1. Wait for drop animation (1.2s)
      const explodeTimer = setTimeout(() => {
          setIsExploding(true);
          playSystemSoundEffect('PURCHASE'); // Explosion/Pop sound
          
          // 2. Transition to cards after explosion visual (0.5s)
          setTimeout(() => {
              setPhase('CARDS');
          }, 500);
          
      }, 1500);

      return () => clearTimeout(explodeTimer);
  }, []);

  const handleCardClick = (idx: number) => {
      setSelectedCard(idx);
      playSystemSoundEffect('SYSTEM');
      
      setTimeout(() => {
          setPhase('REWARD');
          playSystemSoundEffect('LEVEL_UP');
      }, 800);
  };

  const getRewardColor = () => {
      if (reward.type === 'GOLD') return { border: 'border-yellow-500', text: 'text-yellow-500', shadow: 'shadow-yellow-500/20' };
      if (reward.type === 'XP') return { border: 'border-blue-500', text: 'text-blue-500', shadow: 'shadow-blue-500/20' };
      if (reward.type === 'DUNGEON_PASS') return { border: 'border-red-500', text: 'text-red-500', shadow: 'shadow-red-500/20' };
      return { border: 'border-purple-500', text: 'text-purple-500', shadow: 'shadow-purple-500/20' };
  };

  const colors = getRewardColor();

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-lg relative flex flex-col items-center"
        >
            {/* Background Beams */}
            <div className="absolute inset-0 bg-system-neon/5 blur-[100px] rounded-full animate-pulse pointer-events-none" />
            
            <motion.div 
                layout
                className="bg-[#0a0a0a] border border-gray-800 rounded-3xl p-8 w-full shadow-[0_0_60px_rgba(0,210,255,0.1)] text-center relative z-10 overflow-hidden flex flex-col items-center justify-center min-h-[500px]"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-neon to-transparent opacity-50" />

                <AnimatePresence mode="wait">
                    {/* PHASE 1: 3D BOX (Auto-Explodes) */}
                    {phase === 'BOX' && (
                        <motion.div 
                            key="box"
                            initial={{ y: -300, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.5 }}
                            transition={{ 
                                y: { type: "spring", stiffness: 100, damping: 15 },
                                opacity: { duration: 0.5 },
                                exit: { duration: 0.3 }
                            }}
                            className="flex flex-col items-center gap-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-black text-white font-mono tracking-tighter uppercase">Daily Supply Drop</h2>
                                <p className="text-xs text-system-neon font-mono tracking-[0.3em] animate-pulse">
                                    {isExploding ? 'DECRYPTING...' : 'INCOMING...'}
                                </p>
                            </div>
                            
                            <GiftCube isExploding={isExploding} />
                        </motion.div>
                    )}

                    {/* PHASE 2: CARD SELECTION */}
                    {(phase === 'CARDS' || phase === 'REWARD') && (
                        <motion.div 
                            key="cards"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full flex flex-col items-center h-full"
                        >
                            <motion.div 
                                className="mb-8 text-center"
                                animate={phase === 'REWARD' ? { opacity: 0, height: 0, marginBottom: 0 } : { opacity: 1, height: 'auto' }}
                            >
                                <h2 className="text-xl font-bold text-white font-mono uppercase tracking-widest">Select Your Fate</h2>
                                <p className="text-[10px] text-gray-500 font-mono mt-1">CHOOSE ONE CARD TO REVEAL CONTENTS</p>
                            </motion.div>

                            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 w-full ${phase === 'REWARD' ? 'pointer-events-none' : ''}`}>
                                {[0, 1, 2, 3].map((i) => (
                                    <RewardCard 
                                        key={i} 
                                        index={i} 
                                        isSelected={selectedCard === i}
                                        isRevealed={selectedCard === i}
                                        onClick={() => handleCardClick(i)}
                                        anyCardRevealed={selectedCard !== null}
                                        reward={reward}
                                    />
                                ))}
                            </div>

                            {/* REWARD REVEAL OVERLAY */}
                            {phase === 'REWARD' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className={`mt-8 w-full bg-gray-900/50 border rounded-2xl p-6 relative overflow-hidden ${colors.border}`}
                                >
                                    <div className={`absolute inset-0 animate-pulse opacity-5 ${colors.text.replace('text-', 'bg-')}`} />
                                    
                                    <h3 className={`font-black font-mono text-xl mb-6 tracking-tighter relative z-10 uppercase ${colors.text}`}>
                                        SYSTEM REWARDS ACQUIRED
                                    </h3>

                                    <div className="flex justify-center gap-8 mb-8 relative z-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`w-20 h-20 rounded-full bg-black/50 border flex items-center justify-center ${colors.border} ${colors.shadow} shadow-lg`}>
                                                {reward.type === 'GOLD' && <Coins className={colors.text} size={32} />}
                                                {(reward.type === 'WELCOME_KEYS' || reward.type === 'KEYS') && (
                                                    <div className="relative">
                                                        <Key className={colors.text} size={32} />
                                                        {reward.amount > 1 && (
                                                            <Key className={`absolute top-0 left-2 opacity-50 ${colors.text}`} size={32} style={{ transform: 'rotate(15deg)' }} />
                                                        )}
                                                    </div>
                                                )}
                                                {reward.type === 'XP' && <Zap className={colors.text} size={32} />}
                                                {reward.type === 'DUNGEON_PASS' && <Ghost className={colors.text} size={32} />}
                                            </div>
                                            <span className="text-white font-black font-mono text-2xl mt-2">
                                                +{reward.amount} {reward.type === 'WELCOME_KEYS' ? 'KEYS' : reward.type.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                                                {reward.message}
                                            </span>
                                        </div>
                                    </div>

                                    <motion.button 
                                        onClick={onClose}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-4 bg-white text-black font-black font-mono rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2 relative z-10"
                                    >
                                        <CheckCircle size={18} /> CLAIM REWARDS
                                    </motion.button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    </div>
  );
};

export default DailyLoginModal;
