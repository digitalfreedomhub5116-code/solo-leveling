
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Zap, Sparkles, CheckCircle } from 'lucide-react';
import { playSystemSoundEffect } from '../utils/soundEngine';
import { DailyReward } from '../types';
import { SystemCoin } from './icons/SystemCoin';
import { SystemKey } from './icons/SystemKey';

interface DailyLoginModalProps {
  reward: DailyReward;
  onClose: () => void;
}

// --- SMOKE / SHADOW AURA PARTICLES ---
const SmokeAura = () => {
  // Generate denser, more turbulent smoke particles
  const particles = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    width: Math.random() * 100 + 60,
    height: Math.random() * 100 + 60,
    xStart: (Math.random() - 0.5) * 30, // Start tight
    xEnd: (Math.random() - 0.5) * 250,  // Spread wide
    yStart: 20,
    yEnd: -150 - Math.random() * 100,   // Rise high
    delay: Math.random() * 2,
    duration: 2.5 + Math.random() * 2,
    opacityMax: 0.4 + Math.random() * 0.4,
    // Mostly black/shadow, some deep purple hints
    background: i % 4 === 0 
      ? 'radial-gradient(circle, rgba(59, 7, 100, 0.4) 0%, rgba(0,0,0,0) 70%)' 
      : 'radial-gradient(circle, rgba(0, 0, 0, 0.9) 0%, rgba(0,0,0,0) 70%)',
  })), []);
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
      {/* Central dense core shadow */}
      <div className="absolute w-32 h-32 bg-black rounded-full blur-[40px] opacity-80" />
      
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            background: p.background,
            width: p.width,
            height: p.height,
            filter: 'blur(20px)',
          }}
          initial={{ opacity: 0, scale: 0.3, x: p.xStart, y: p.yStart }}
          animate={{
            opacity: [0, p.opacityMax, 0],
            scale: [0.3, 1.5, 2],
            y: [p.yStart, p.yEnd],
            x: [p.xStart, p.xEnd],
            rotate: Math.random() * 180 - 90
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut",
            times: [0, 0.2, 1]
          }}
        />
      ))}
    </div>
  );
};

// --- EXPLOSION SHARDS ---
const ParticleBurst = ({ active, color }: { active: boolean; color: string }) => {
  const particles = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    angle: (i * 12) * (Math.PI / 180),
    dist: 120 + Math.random() * 150,
    size: 2 + Math.random() * 6,
    speed: 0.5 + Math.random() * 0.5,
    delay: Math.random() * 0.1
  })), []);

  if (!active) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ 
            x: Math.cos(p.angle) * p.dist, 
            y: Math.sin(p.angle) * p.dist, 
            opacity: 0,
            scale: 0
          }}
          transition={{ duration: 0.8, ease: "easeOut", delay: p.delay }}
          className="absolute rounded-full"
          style={{ 
            backgroundColor: color,
            width: p.size,
            height: p.size,
            boxShadow: `0 0 15px ${color}`
          }}
        />
      ))}
    </div>
  );
};

// --- HIGH FIDELITY CRACKED ORB ---
const CrackedOrb = ({ isExploding }: { isExploding: boolean }) => {
  return (
    <motion.div
      initial={{ y: -600, opacity: 0 }}
      animate={isExploding 
        ? { scale: 2.5, opacity: 0, filter: "brightness(2) blur(10px)" } 
        : { y: 0, opacity: 1, filter: "brightness(1) blur(0px)" }
      }
      transition={isExploding 
        ? { duration: 0.4, ease: "circIn" } 
        : { type: "spring", stiffness: 60, damping: 12 }
      }
      className="relative z-30"
    >
      {/* Volumetric Smoke Behind */}
      <div className="absolute inset-0 -z-10 scale-150">
        <SmokeAura />
      </div>

      <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full">
        {/* --- ROTATING CORE --- 
            This layer spins. It contains the texture and the cracks. 
        */}
        <motion.div
            className="absolute inset-0 w-full h-full rounded-full overflow-hidden bg-black"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
            {/* Base Gradient for the core material */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2e1065] to-black" />

            {/* Surface Texture (Noise) */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-cover mix-blend-overlay" />

            {/* --- CRACKS SVG --- */}
            {/* Attached to this rotating container so they spin with the 'ball' */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 2px #d8b4fe)' }}>
                <defs>
                    <filter id="crack-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="blur"/>
                        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                    </filter>
                </defs>
                
                <motion.g
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    {/* Deep Magma Glow */}
                    <path 
                        d="M50 50 L60 35 L55 25 L75 10 M50 50 L40 65 L45 75 L25 90 M50 50 L25 45 L15 50 M50 50 L58 58" 
                        fill="none" 
                        stroke="#7e22ce" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#crack-glow)"
                        opacity="0.8"
                    />
                    {/* Surface Fracture */}
                    <path 
                        d="M50 50 L60 35 L55 25 L75 10 M50 50 L40 65 L45 75 L25 90 M50 50 L25 45 L15 50 M50 50 L58 58" 
                        fill="none" 
                        stroke="#e9d5ff" 
                        strokeWidth="0.8" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </motion.g>
            </svg>
        </motion.div>

        {/* --- STATIC LIGHTING OVERLAY --- 
            This sits ON TOP of the rotating core but DOES NOT ROTATE.
            This creates the 3D sphere illusion where the light source is fixed.
        */}
        <div 
            className="absolute inset-0 w-full h-full rounded-full pointer-events-none z-20"
            style={{
                // Highlight top-left, Shadow bottom-right
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0.95) 100%)',
                // Inner rim lighting
                boxShadow: 'inset -5px -5px 30px rgba(0,0,0,0.9), inset 2px 2px 10px rgba(168,85,247,0.3), 0 0 40px rgba(168,85,247,0.2)'
            }}
        />

        {/* Specular Highlight (The shiny spot) */}
        <div className="absolute top-4 left-4 w-1/3 h-1/3 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-xl pointer-events-none z-20" />
      </div>
    </motion.div>
  );
};

// --- GACHA CARD ---
interface GachaCardProps {
  index: number;
  isSelected: boolean;
  isRevealed: boolean;
  reward: DailyReward;
  onSelect: () => void;
  otherCardSelected: boolean;
}

const GachaCard: React.FC<GachaCardProps> = ({ index, isSelected, isRevealed, reward, onSelect, otherCardSelected }) => {
  const getIcon = () => {
    switch(reward.type) {
        case 'GOLD': return <SystemCoin size={64} />;
        case 'XP': return <Zap size={40} className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />;
        case 'KEYS': 
        case 'WELCOME_KEYS': return <SystemKey size={64} />;
        case 'DUNGEON_PASS': return <Ghost size={40} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />;
        default: return <Sparkles size={40} className="text-white" />;
    }
  };

  if (otherCardSelected && !isSelected) return null;

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ 
        scale: isSelected ? 1.1 : 1, 
        opacity: 1,
        y: 0,
        rotateY: isRevealed ? 180 : 0,
        zIndex: isSelected ? 50 : 1
      }}
      transition={{ 
        type: "spring", stiffness: 120, damping: 15,
        layout: { duration: 0.4 },
        delay: index * 0.05 
      }}
      onClick={!otherCardSelected ? onSelect : undefined}
      className={`
        relative cursor-pointer perspective-1000
        ${isSelected 
            ? 'fixed inset-0 m-auto w-64 h-80 z-50' 
            : 'w-full aspect-[3/4] md:w-40 md:h-64'
        }
      `}
      style={{ transformStyle: 'preserve-3d' }}
    >
        {/* BACK OF CARD */}
        <div 
            className="absolute inset-0 w-full h-full backface-hidden bg-black border border-purple-500/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(88,28,135,0.2)] flex items-center justify-center group hover:border-purple-400 transition-colors"
            style={{ backfaceVisibility: 'hidden' }}
        >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(139,92,246,0.1)_50%,transparent_75%)] bg-[length:20px_20px] opacity-50" />
            <div className="w-12 h-12 rounded-full border border-purple-500/50 flex items-center justify-center bg-purple-900/20 group-hover:bg-purple-500/20 transition-colors">
                <span className="font-mono text-purple-400 font-bold text-lg">?</span>
            </div>
        </div>

        {/* FRONT OF CARD (REWARD) */}
        <div 
            className="absolute inset-0 w-full h-full backface-hidden bg-[#0a0a0a] border-2 border-system-neon rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,210,255,0.3)] flex flex-col items-center justify-center p-4 text-center"
            style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
        >
            <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: isRevealed ? 1 : 0 }} 
                transition={{ delay: 0.2, type: "spring" }}
                className="mb-4 md:mb-6"
            >
                {getIcon()}
            </motion.div>
            
            <div className="text-3xl md:text-4xl font-black text-white font-mono leading-none mb-2">
                {reward.type === 'WELCOME_KEYS' ? '3' : `+${reward.amount}`}
            </div>
            
            <div className="text-[10px] md:text-xs text-system-neon font-mono uppercase tracking-widest bg-system-neon/10 px-2 py-1 rounded border border-system-neon/20">
                {reward.type === 'WELCOME_KEYS' ? 'KEYS' : reward.type}
            </div>
        </div>
    </motion.div>
  );
};

// --- MAIN MODAL ---
const DailyLoginModal: React.FC<DailyLoginModalProps> = ({ reward, onClose }) => {
  const [phase, setPhase] = useState<'ARRIVAL' | 'EXPLODE' | 'SELECTION' | 'REVEAL'>('ARRIVAL');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
      playSystemSoundEffect('SYSTEM'); 

      const timerShake = setTimeout(() => {
          setPhase('EXPLODE');
          playSystemSoundEffect('DANGER');
      }, 2000);

      const timerBurst = setTimeout(() => {
          setPhase('SELECTION');
          playSystemSoundEffect('PURCHASE');
      }, 2300);

      return () => {
          clearTimeout(timerShake);
          clearTimeout(timerBurst);
      };
  }, []);

  const handleCardSelect = (index: number) => {
      setSelectedCard(index);
      playSystemSoundEffect('TICK');
      
      setTimeout(() => {
          setPhase('REVEAL');
          setShowConfetti(true);
          playSystemSoundEffect('LEVEL_UP');
      }, 600);
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl overflow-hidden p-4">
        
        {/* Background Ambience */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.15),transparent_70%)] pointer-events-none" 
        />

        <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center">
            
            {/* Header Text */}
            <motion.div 
                className="absolute top-8 md:top-16 text-center z-20 w-full"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h2 className="text-2xl md:text-5xl font-black text-white font-mono tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {phase === 'REVEAL' ? 'SYSTEM REWARD' : 'DAILY SUPPLY'}
                </h2>
                <p className="text-[10px] md:text-sm text-purple-400 font-mono tracking-[0.3em] mt-2 uppercase">
                    {phase === 'ARRIVAL' ? 'UNSTABLE ENERGY DETECTED' : 
                     phase === 'SELECTION' ? 'CHOOSE YOUR REWARD' : 
                     phase === 'REVEAL' ? 'ACQUIRED' : 'BREACHING...'}
                </p>
            </motion.div>

            {/* --- PHASE 1 & 2: THE ORB --- */}
            <AnimatePresence>
                {(phase === 'ARRIVAL' || phase === 'EXPLODE') && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <CrackedOrb isExploding={phase === 'EXPLODE'} />
                    </div>
                )}
            </AnimatePresence>

            {/* --- EXPLOSION PARTICLES --- */}
            <ParticleBurst active={phase === 'SELECTION'} color="#d8b4fe" />

            {/* --- PHASE 3: THE CARDS --- */}
            {(phase === 'SELECTION' || phase === 'REVEAL') && (
                <div className={`
                    w-full z-40 transition-all duration-500 ease-out
                    ${phase === 'SELECTION' 
                        ? 'grid grid-cols-2 gap-4 place-items-center max-w-sm md:flex md:flex-row md:gap-6 md:max-w-4xl' 
                        : 'flex items-center justify-center'
                    }
                `}>
                    {[0, 1, 2, 3].map((i) => (
                        <GachaCard 
                            key={i}
                            index={i}
                            isSelected={selectedCard === i}
                            isRevealed={phase === 'REVEAL' && selectedCard === i}
                            reward={reward}
                            onSelect={() => handleCardSelect(i)}
                            otherCardSelected={selectedCard !== null && selectedCard !== i}
                        />
                    ))}
                </div>
            )}

            {/* --- REVEAL CONFETTI --- */}
            <ParticleBurst active={showConfetti} color="#00d2ff" />

            {/* --- PHASE 4: CLAIM BUTTON --- */}
            <AnimatePresence>
                {phase === 'REVEAL' && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="absolute bottom-12 md:bottom-24 z-50 w-full max-w-xs px-6"
                    >
                        <button
                            onClick={onClose}
                            className="w-full group relative py-4 bg-white text-black font-black font-mono text-sm uppercase tracking-widest rounded-xl hover:bg-system-neon hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <CheckCircle size={18} /> CLAIM REWARD
                            </span>
                        </button>
                        <div className="text-center mt-4 text-[10px] text-gray-500 font-mono">
                            {reward.message}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    </div>
  );
};

export default DailyLoginModal;
