
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, Zap } from 'lucide-react';

interface LevelUpOverlayProps {
  oldLevel: number;
  newLevel: number;
  onClose: () => void;
}

const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({ oldLevel, newLevel, onClose }) => {
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    // Lock interaction for 3 seconds to ensure cinematic is felt
    const timer = setTimeout(() => {
        setCanClose(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
      if (canClose) onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl ${canClose ? 'cursor-pointer' : 'cursor-wait'}`}
      onClick={handleClose}
    >
      {/* Background Burst */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 20, opacity: 0.1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute inset-0 bg-system-neon rounded-full blur-[100px]"
      />

      {/* Main Content */}
      <div className="relative z-10 text-center select-none">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            <ArrowUpCircle size={100} className="text-system-neon drop-shadow-[0_0_30px_#00d2ff]" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 bg-system-neon rounded-full blur-xl -z-10" 
            />
          </div>
        </motion.div>

        <motion.h1 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-6xl md:text-8xl font-black italic tracking-tighter text-white mb-2 font-mono"
          style={{ textShadow: "0 0 30px #00d2ff" }}
        >
          LEVEL UP
        </motion.h1>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="h-1 bg-gradient-to-r from-transparent via-system-neon to-transparent mb-8"
        />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-2"
        >
          <div className="text-4xl font-mono font-bold text-system-accent flex items-center justify-center gap-4">
             <span className="text-gray-600 line-through text-2xl">{oldLevel}</span>
             <span className="flex items-center gap-2"><Zap size={24} className="animate-pulse" /> {newLevel}</span>
          </div>
          <p className="text-gray-400 font-mono text-sm tracking-widest mt-4 uppercase">
            Capacity Increased
          </p>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">
            Limits Transcended
          </p>
        </motion.div>

        {/* Interaction Prompt */}
        <AnimatePresence>
            {canClose && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 text-center"
                >
                    <div className="inline-block px-4 py-2 border border-system-neon/30 rounded bg-system-neon/10 text-system-neon text-xs font-mono animate-pulse">
                        [ CLICK TO CONTINUE ]
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      
      {/* Scan lines overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[110] bg-[length:100%_2px,3px_100%] opacity-20" />
    </motion.div>
  );
};

export default LevelUpOverlay;
