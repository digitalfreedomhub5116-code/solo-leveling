import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpCircle } from 'lucide-react';

interface LevelUpCinematicProps {
  level: number;
  onComplete: () => void;
}

const LevelUpCinematic: React.FC<LevelUpCinematicProps> = ({ level, onComplete }) => {
  
  useEffect(() => {
    // Sound is now handled by useSystem hook when the event occurs
    const timer = setTimeout(() => {
      onComplete();
    }, 4000); // Duration of the cinematic
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl"
    >
      {/* Background Burst */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 20, opacity: 0.1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute inset-0 bg-system-neon rounded-full blur-[100px]"
      />

      {/* Main Content */}
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            <ArrowUpCircle size={100} className="text-system-neon" />
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
          <div className="text-4xl font-mono font-bold text-system-accent">
            LEVEL {level} REACHED
          </div>
          <p className="text-gray-400 font-mono text-sm tracking-widest mt-4">
            ALL STATS RECOVERED
          </p>
          <p className="text-gray-500 font-mono text-xs">
            LIMITS TRANSCENDED
          </p>
        </motion.div>
      </div>
      
      {/* Scan lines overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[110] bg-[length:100%_2px,3px_100%] opacity-20" />
    </motion.div>
  );
};

export default LevelUpCinematic;