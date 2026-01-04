import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const systemLogs = [
    "Initializing Bio-Sync OS...",
    "Connecting to neural interface...",
    "Calibrating sensor array...",
    "Loading user profile [PLAYER]...",
    "Synchronizing shadow database...",
    "System ready."
  ];

  useEffect(() => {
    let currentLogIndex = 0;
    
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1; // 1.5s total approx
      });
    }, 20);

    // Log generation
    const logInterval = setInterval(() => {
      if (currentLogIndex < systemLogs.length) {
        setLogs(prev => [...prev, systemLogs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 400);

    // Completion timeout
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
      clearTimeout(completeTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-system-bg text-system-neon font-mono overflow-hidden"
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <div className="w-full max-w-md p-8 relative">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-1 opacity-10 pointer-events-none">
            {Array.from({ length: 72 }).map((_, i) => (
                <div key={i} className="bg-system-accent w-full h-full" />
            ))}
        </div>

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10"
        >
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter flex items-center gap-3">
                <Terminal className="w-8 h-8 text-system-accent" />
                THE SYSTEM
            </h1>
            <div className="h-px w-full bg-gradient-to-r from-system-accent to-transparent mb-6" />

            {/* Terminal Logs */}
            <div className="h-32 mb-6 flex flex-col justify-end">
                {logs.map((log, index) => (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-system-neon/80 mb-1"
                    >
                        {`> ${log}`}
                    </motion.div>
                ))}
            </div>

            {/* Loading Bar */}
            <div className="relative h-2 bg-system-card rounded-full overflow-hidden border border-system-border">
                <motion.div 
                    className="absolute top-0 left-0 h-full bg-system-accent shadow-[0_0_10px_#8b5cf6]"
                    style={{ width: `${progress}%` }}
                />
            </div>
            
            <div className="flex justify-between text-xs mt-2 text-gray-500">
                <span>LOADING ASSETS</span>
                <span>{progress}%</span>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;