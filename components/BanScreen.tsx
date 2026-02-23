
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Lock, Skull } from 'lucide-react';

const BanScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
        {/* Background Glitch */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none" />

        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 max-w-lg w-full bg-black border-2 border-red-600 p-8 rounded-xl shadow-[0_0_100px_rgba(220,38,38,0.5)]"
        >
            <div className="flex justify-center mb-6">
                <div className="p-6 bg-red-950/50 rounded-full border border-red-600 animate-pulse">
                    <Skull size={64} className="text-red-500" />
                </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-red-600 tracking-tighter uppercase mb-2" style={{ textShadow: "0 0 20px #dc2626" }}>
                SYSTEM LOCKOUT
            </h1>
            
            <div className="h-1 w-full bg-red-600/50 my-6" />

            <h2 className="text-xl text-white font-mono font-bold mb-4 uppercase tracking-widest">
                Account Terminated
            </h2>

            <p className="text-red-400 font-mono text-xs md:text-sm leading-relaxed mb-8">
                Multiple violations of the Fair Play Protocol detected. 
                Your hunter license has been revoked due to excessive XP Boosting and Integrity Violations.
                <br/><br/>
                "The System rewards effort, not deception."
            </p>

            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono border border-gray-800 p-2 rounded bg-gray-900">
                <Lock size={12} /> ERROR_CODE: INTEGRITY_FATAL_ERROR
            </div>
        </motion.div>
    </div>
  );
};

export default BanScreen;
