
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Coins, CheckCircle, Box } from 'lucide-react';
import { playSystemSoundEffect } from '../utils/soundEngine';

interface DailyLoginModalProps {
  onClose: () => void;
}

const DailyLoginModal: React.FC<DailyLoginModalProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'LOCKED' | 'SHAKING' | 'OPENING' | 'REVEALED'>('LOCKED');

  const handleOpen = () => {
    if (status !== 'LOCKED') return;
    
    // Sequence
    setStatus('SHAKING');
    playSystemSoundEffect('WARNING'); // Mechanical stress sound
    
    setTimeout(() => {
        setStatus('OPENING');
        playSystemSoundEffect('PURCHASE'); // Pop sound
        
        setTimeout(() => {
            setStatus('REVEALED');
            playSystemSoundEffect('LEVEL_UP'); // Success sound
        }, 400);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm relative flex flex-col items-center"
        >
            {/* Background Beams */}
            <div className="absolute inset-0 bg-system-neon/10 blur-[80px] rounded-full animate-pulse pointer-events-none" />
            
            <motion.div 
                className="bg-system-card border-2 border-system-neon/30 rounded-3xl p-10 w-full shadow-[0_0_60px_rgba(0,210,255,0.15)] text-center relative z-10 overflow-visible min-h-[420px] flex flex-col items-center justify-center"
            >
                <AnimatePresence mode="wait">
                    {status !== 'REVEALED' ? (
                        <div key="crate-container" className="relative cursor-pointer group" onClick={handleOpen}>
                            <motion.div
                                className="relative z-20"
                                animate={
                                    status === 'LOCKED' ? { scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] } :
                                    status === 'SHAKING' ? { x: [-8, 8, -8, 8, 0], rotate: [-5, 5, -5, 5, 0], scale: 1.1 } :
                                    {}
                                }
                                transition={status === 'LOCKED' ? { repeat: Infinity, duration: 3 } : { duration: 0.5 }}
                            >
                                {/* CRATE LID */}
                                <motion.div 
                                    className="w-40 h-10 bg-system-neon border-4 border-white rounded-t-xl mx-auto relative z-30 flex items-center justify-center shadow-[0_0_20px_#00d2ff]"
                                    animate={status === 'OPENING' ? { y: -200, rotate: -45, opacity: 0, scale: 1.2 } : {}}
                                    transition={{ duration: 0.5, ease: "easeIn" }}
                                >
                                    <div className="w-20 h-1.5 bg-black/20 rounded-full" />
                                </motion.div>

                                {/* CRATE BODY */}
                                <div className="w-40 h-32 bg-gray-900 border-4 border-system-neon border-t-0 rounded-b-xl mx-auto relative z-20 flex items-center justify-center shadow-2xl overflow-hidden group-hover:shadow-[0_0_30px_#00d2ff] transition-shadow duration-500">
                                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#00d2ff10_10px,#00d2ff10_20px)]" />
                                    <Box size={48} className="text-system-neon opacity-80" />
                                    
                                    {/* Inner Light */}
                                    <motion.div 
                                        className="absolute inset-0 bg-white"
                                        initial={{ opacity: 0 }}
                                        animate={status === 'OPENING' ? { opacity: [0, 1, 0] } : {}}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </motion.div>
                            
                            {status === 'LOCKED' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-10 text-center"
                                >
                                    <p className="text-xs font-mono text-system-neon animate-pulse tracking-[0.3em] font-bold">TAP TO DECRYPT</p>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        /* REVEALED STATE */
                        <motion.div 
                            key="rewards"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full flex flex-col items-center"
                        >
                            <motion.h2 
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-3xl font-black text-white font-mono tracking-tighter uppercase mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            >
                                SUPPLY DROP
                            </motion.h2>
                            <p className="text-xs text-gray-400 font-mono mb-10 tracking-widest uppercase">
                                RESOURCES ACQUIRED
                            </p>

                            <div className="flex gap-8 mb-10">
                                <motion.div 
                                    initial={{ y: 100, opacity: 0, scale: 0.5 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <div className="w-20 h-20 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                                        <Key size={36} className="text-purple-500 drop-shadow-md" />
                                    </div>
                                    <span className="text-2xl font-black text-white">+1</span>
                                </motion.div>

                                <motion.div 
                                    initial={{ y: 100, opacity: 0, scale: 0.5 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                                        <Coins size={36} className="text-yellow-500 drop-shadow-md" />
                                    </div>
                                    <span className="text-2xl font-black text-white">+50</span>
                                </motion.div>
                            </div>

                            <motion.button 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                onClick={onClose}
                                className="w-full py-4 bg-system-neon text-black font-black font-mono rounded-xl shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:bg-white transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} /> CLAIM
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    </div>
  );
};

export default DailyLoginModal;
