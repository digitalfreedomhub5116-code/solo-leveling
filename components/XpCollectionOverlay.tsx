
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowUpCircle } from 'lucide-react';

interface XpCollectionOverlayProps {
  startRect: DOMRect | null;
  xpGained: number;
  currentXp: number; // Snapshot of XP BEFORE the update
  requiredXp: number; // Snapshot of Required XP BEFORE the update
  level: number;      // Snapshot of Level BEFORE the update
  onComplete: () => void;
}

const XpCollectionOverlay: React.FC<XpCollectionOverlayProps> = ({ 
  startRect, 
  xpGained, 
  currentXp, 
  requiredXp, 
  level,
  onComplete 
}) => {
  const [showBar, setShowBar] = useState(false);
  const [fillPercent, setFillPercent] = useState(0);
  
  // Separate states for visual variety
  const [crystals, setCrystals] = useState<any[]>([]);
  const [powder, setPowder] = useState<any[]>([]);
  
  const barRef = useRef<HTMLDivElement>(null);

  // Check if this gain causes a level up
  const willLevelUp = (currentXp + xpGained) >= requiredXp;

  // Calculate percentages based on snapshot data
  const startPercent = Math.min(100, (currentXp / requiredXp) * 100);
  const endPercent = willLevelUp 
    ? 100 
    : Math.min(100, ((currentXp + xpGained) / requiredXp) * 100);

  useEffect(() => {
    if (!startRect) return;

    // Timeline Sequence:
    // 0ms: Component Mounts (Coins are flying from QuestCard logic)
    // 1200ms: Show Bar (Coins impact finished roughly)
    // 1500ms: Spawn Particles & Fill Bar
    // 3500ms: Hide Bar
    // 4100ms: Call onComplete (Triggers Level Up if applicable)

    const COIN_ANIMATION_DURATION = 1200;

    const sequenceTimer = setTimeout(() => {
        // 1. Show Bar (Slides down via initial prop)
        setShowBar(true);
        setFillPercent(startPercent);

        // 2. Spawn Particles & Fill Logic (Delay slightly after bar appears)
        setTimeout(() => {
            if (!barRef.current) return;
            
            const el = barRef.current;
            const finalLeft = el.offsetLeft;
            const finalTop = el.offsetTop;
            const finalW = el.offsetWidth;
            const finalH = el.offsetHeight;
            
            const padding = 16; 
            const trackWidth = finalW - (padding * 2);
            
            const startXPixel = finalLeft + padding + (trackWidth * (startPercent / 100));
            const endXPixel = finalLeft + padding + (trackWidth * (endPercent / 100));
            
            const targetCenterY = finalTop + (finalH / 2);
            const screenWidth = window.innerWidth;
            const safeMargin = 15;

            // --- CRYSTALS ---
            const crystalCount = willLevelUp ? 30 : 15;
            const newCrystals = [];
            for (let i = 0; i < crystalCount; i++) {
                let targetBaseX = willLevelUp ? finalLeft + (finalW / 2) : startXPixel + ((endXPixel - startXPixel) * (i / (crystalCount - 1)));
                const scatterX = (Math.random() * 20) - 10;
                let tx = Math.max(safeMargin, Math.min(targetBaseX + scatterX, screenWidth - safeMargin));

                newCrystals.push({
                    id: i,
                    x: startRect.left + startRect.width / 2 + (Math.random() * 40 - 20),
                    y: startRect.top + startRect.height / 2 + (Math.random() * 40 - 20),
                    tx: tx,
                    ty: targetCenterY + (Math.random() * 10 - 5),
                    delay: i * 0.03,
                    scale: Math.random() * 0.5 + 0.8,
                    rotation: Math.random() * 360,
                    duration: 0.6 + Math.random() * 0.2
                });
            }
            setCrystals(newCrystals);

            // --- POWDER ---
            const powderCount = willLevelUp ? 50 : 25;
            const newPowder = [];
            for (let i = 0; i < powderCount; i++) {
                let targetBaseX = willLevelUp ? finalLeft + (finalW / 2) : endXPixel;
                const scatterX = (Math.random() * 40) - 20;
                let tx = Math.max(safeMargin, Math.min(targetBaseX + scatterX, screenWidth - safeMargin));

                newPowder.push({
                    id: i,
                    x: startRect.left + startRect.width / 2,
                    y: startRect.top + startRect.height / 2,
                    tx: tx,
                    ty: targetCenterY + (Math.random() * 20 - 10),
                    delay: i * 0.015 + 0.05, 
                    scale: Math.random() * 0.5 + 0.5,
                    duration: 0.5 + Math.random() * 0.4
                });
            }
            setPowder(newPowder);

            // 3. Fill Bar Animation
            setTimeout(() => {
                setFillPercent(endPercent);
            }, 300);

            // 4. Exit Sequence
            const holdTime = willLevelUp ? 2000 : 1500; 
            setTimeout(() => {
                setShowBar(false); 
                setTimeout(() => {
                    onComplete(); 
                }, 600); 
            }, 1000 + holdTime);

        }, 300); // Wait 300ms after bar entrance before particles start

    }, COIN_ANIMATION_DURATION);

    return () => clearTimeout(sequenceTimer);
  }, [startRect]);

  const containerClass = `fixed inset-0 z-[200] flex justify-center cursor-wait ${willLevelUp ? 'items-center' : 'items-start pt-24'}`;

  const barInitial = willLevelUp ? { scale: 0.8, opacity: 0 } : { y: -150, opacity: 0 };
  const barAnimate = willLevelUp ? { scale: 1.2, opacity: 1 } : { y: 0, opacity: 1 };
  const barExit = willLevelUp 
      ? { y: -200, opacity: 0, scale: 0.5, transition: { duration: 0.5 } } 
      : { y: -150, opacity: 0, transition: { duration: 0.4 } }; 

  return (
    <div className={containerClass}>
        
        <AnimatePresence>
            {showBar && (
                <motion.div
                    ref={barRef}
                    initial={barInitial}
                    animate={barAnimate}
                    exit={barExit}
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    className={`
                        relative bg-black/95 border border-system-border rounded-xl p-4 backdrop-blur-xl z-[202]
                        ${willLevelUp 
                            ? 'w-[80%] sm:w-[90%] max-w-lg border-system-neon/50 shadow-[0_0_80px_rgba(0,210,255,0.4)]' 
                            : 'w-[90%] max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(168,85,247,0.3)]'
                        }
                    `}
                >
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-2">
                            {willLevelUp ? <ArrowUpCircle size={18} className="text-system-neon animate-bounce" /> : <Sparkles size={14} className="text-purple-500 animate-pulse" />}
                            <span className={`font-black italic uppercase ${willLevelUp ? 'text-base md:text-lg text-white' : 'text-xs text-white'}`}>
                                {willLevelUp ? 'SYSTEM OVERLOAD' : 'System Growth'}
                            </span>
                        </div>
                        <div className="text-xs font-mono text-purple-300">
                            {willLevelUp && fillPercent === 100
                                ? <span className="text-system-neon font-bold animate-pulse">MAXIMUM CAPACITY</span> 
                                : <><span className="text-white">{Math.floor(currentXp + (fillPercent/100 * (requiredXp - currentXp)))}</span> / {requiredXp} XP</>
                            }
                        </div>
                    </div>

                    {/* Progress Track */}
                    <div className={`bg-gray-900 rounded-full overflow-hidden border border-white/10 relative ${willLevelUp ? 'h-6 md:h-8' : 'h-4'}`}>
                        {/* Fill */}
                        <motion.div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"
                            initial={{ width: `${startPercent}%` }}
                            animate={{ width: `${fillPercent}%` }}
                            transition={{ 
                                duration: 1.0, 
                                ease: [0.22, 1, 0.36, 1] 
                            }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]" />
                            {willLevelUp && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            )}
                        </motion.div>
                        
                        {/* Level Indicators */}
                        <div className="absolute inset-0 flex justify-between items-center px-3 font-black text-white/50 mix-blend-overlay font-mono">
                            <span className={willLevelUp ? "text-xs md:text-sm" : "text-[8px]"}>LVL {level}</span>
                            <span className={willLevelUp ? "text-xs md:text-sm text-white" : "text-[8px]"}>LVL {level + 1}</span>
                        </div>
                    </div>

                    <div className="mt-2 text-center">
                        <motion.span 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className={`font-black drop-shadow-[0_0_10px_rgba(0,210,255,0.8)] ${willLevelUp ? 'text-lg md:text-xl text-white' : 'text-sm text-system-neon'}`}
                        >
                            +{xpGained} XP ABSORBED
                        </motion.span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- CRYSTAL PARTICLES --- */}
        {crystals.map((p) => (
            <motion.div
                key={`cry-${p.id}`}
                initial={{ x: p.x, y: p.y, scale: 0, opacity: 1, rotate: 0 }}
                animate={{ 
                    x: p.tx, 
                    y: p.ty, 
                    scale: [0, p.scale * 1.5, 0], 
                    opacity: [1, 1, 0],
                    rotate: p.rotation + 360
                }}
                transition={{ 
                    duration: p.duration, 
                    ease: "easeInOut",
                    delay: p.delay 
                }}
                className="absolute w-4 h-4 z-[205] border border-white/80"
                style={{
                    background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    boxShadow: '0 0 20px rgba(168,85,247,1)',
                    filter: 'drop-shadow(0 0 8px #fff)'
                }}
            />
        ))}

        {/* --- POWDER PARTICLES --- */}
        {powder.map((p) => (
            <motion.div
                key={`pow-${p.id}`}
                initial={{ x: p.x, y: p.y, scale: 0, opacity: 1 }}
                animate={{ 
                    x: p.tx, 
                    y: p.ty, 
                    scale: 0, 
                    opacity: 0
                }}
                transition={{ 
                    duration: p.duration, 
                    ease: "easeInOut",
                    delay: p.delay 
                }}
                className="absolute w-2 h-2 z-[204] rounded-full bg-cyan-400"
                style={{
                    boxShadow: '0 0 10px rgba(0,210,255,1)',
                }}
            />
        ))}

    </div>
  );
};

export default XpCollectionOverlay;
