import React from 'react';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';

export const ShadowLoading: React.FC = () => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden">
       <div className="relative">
           {/* Purple Neon Pulse */}
           <motion.div
             animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             className="absolute inset-0 bg-system-accent rounded-full blur-xl"
           />
           
           {/* Rotating Ring */}
           <motion.div
             animate={{ rotate: 360 }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             className="relative z-10 w-20 h-20 border-t-2 border-b-2 border-system-accent rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]"
           />
           
           {/* Center Icon */}
           <div className="absolute inset-0 flex items-center justify-center z-20">
              <Database size={24} className="text-system-accent animate-pulse" />
           </div>
       </div>
       
       <motion.div
         className="mt-8 flex flex-col items-center gap-2"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
       >
          <div className="text-system-accent font-mono text-xs font-bold tracking-[0.2em] animate-pulse drop-shadow-[0_0_5px_rgba(139,92,246,0.8)]">
            SYNCHRONIZING BIO-DATA...
          </div>
          
          {/* Data Processing Bars */}
          <div className="flex gap-1 h-4 items-end">
             {[0, 1, 2, 3, 4].map((i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [4, 16, 4] }} 
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.1 }}
                  className="w-1 bg-system-accent/70 shadow-[0_0_5px_rgba(139,92,246,0.5)]" 
                />
             ))}
          </div>
       </motion.div>
       
       {/* CRT Scanlines Overlay */}
       <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20" />
    </div>
  );
};

export default ShadowLoading;