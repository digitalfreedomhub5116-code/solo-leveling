
import React, { useEffect, useState, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
  isReady: boolean;
}

// Critical Assets to Preload
const CRITICAL_VIDEOS = [
  "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1771008540/Untitled_video_-_Made_with_Clipchamp_21_ehz8d1.mp4", // Daily Chest
  "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1771014509/tdthgf_-_Made_with_Clipchamp_2_qf8zyy.mp4",       // Legendary Chest
  "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1771015223/The_chest_should_202602140208_znzx6_1_mya5vc.mp4", // Alliance Chest
  "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1771057514/Subject_shadow_hunter_202601260131_jknp7_zorhsa_1_1_na5ppi.mp4", // Dusk Entrance (Intro) - UPDATED
  "https://res.cloudinary.com/dcnqnbvp0/video/upload/f_auto,q_auto,w_600/v1770828792/Animate_the_blue_202602112220_fete1_dsjvdd.mp4" // Dusk Widget (Dashboard)
];

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isReady }) => {
  const [isFinished, setIsFinished] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Generate random crystal particles
  const crystals = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 10 + 4, // 4px to 14px
      duration: Math.random() * 4 + 3, // 3s to 7s float time
      delay: Math.random() * 2,
      // Mix of deep purple and bright violet
      color: Math.random() > 0.5 ? '#7c3aed' : '#d8b4fe', 
      opacity: Math.random() * 0.5 + 0.2
    }));
  }, []);

  useEffect(() => {
    const preloadVideo = (url: string): Promise<void> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.src = url;
            video.preload = 'auto';
            video.muted = true;
            video.playsInline = true;
            
            // Resolve when enough data is loaded to play
            const onLoaded = () => {
                cleanup();
                resolve();
            };

            const onError = () => {
                console.warn(`Failed to preload video: ${url}`);
                cleanup();
                resolve(); // Resolve anyway to not block app
            };

            const cleanup = () => {
                video.removeEventListener('canplay', onLoaded);
                video.removeEventListener('error', onError);
            };

            video.addEventListener('canplay', onLoaded);
            video.addEventListener('error', onError);
            
            // Timeout fallback (5 seconds max per video)
            setTimeout(() => {
                cleanup();
                resolve(); 
            }, 5000);
        });
    };

    const loadAssets = async () => {
        const minTimePromise = new Promise(resolve => setTimeout(resolve, 2800)); // Aesthetic minimum
        
        const videoPromises = CRITICAL_VIDEOS.map(async (url) => {
            await preloadVideo(url);
            setLoadProgress(prev => prev + (100 / CRITICAL_VIDEOS.length));
        });

        await Promise.all([minTimePromise, ...videoPromises]);
        setIsFinished(true);
    };

    loadAssets();
  }, []);

  // Only trigger completion when animation is done AND system data is ready
  useEffect(() => {
    if (isFinished && isReady) {
      onComplete();
    }
  }, [isFinished, isReady, onComplete]);

  // --- ANIMATION VARIANTS ---

  const pathVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        duration: 1.5, 
        ease: "easeInOut",
        opacity: { duration: 0.2 } 
      }
    }
  };

  const fillVariants: Variants = {
    hidden: { fillOpacity: 0, strokeWidth: 1 },
    visible: { 
      fillOpacity: 1, 
      strokeWidth: 0,
      transition: { 
        delay: 1.5, 
        duration: 0.5 
      }
    }
  };

  const glowVariants: Variants = {
    hidden: { filter: "drop-shadow(0 0 0px rgba(6,182,212,0))" },
    visible: { 
      filter: "drop-shadow(0 0 15px rgba(6,182,212,0.8))",
      transition: { delay: 1.6, duration: 0.5 }
    }
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { delay: 1.8, duration: 0.2 } 
    },
    glitch: {
      opacity: [1, 0.8, 1, 0, 1],
      x: [0, -2, 2, 0],
      skewX: [0, 10, -10, 0],
      transition: { 
        delay: 2.0, 
        duration: 0.4, 
        times: [0, 0.2, 0.4, 0.6, 1] 
      }
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
      exit={{ opacity: 0, filter: "blur(10px)", scale: 1.1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Grid - Subtle */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* --- FLOATING PURPLE CRYSTALS --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {crystals.map((crystal) => (
            <motion.div
                key={crystal.id}
                className="absolute backdrop-blur-[1px]"
                style={{
                    left: crystal.left,
                    top: crystal.top,
                    width: crystal.size,
                    height: crystal.size,
                    backgroundColor: crystal.color,
                    // Diamond Shape
                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    boxShadow: `0 0 ${crystal.size}px ${crystal.color}`,
                }}
                initial={{ y: 100, opacity: 0, rotate: 0 }}
                animate={{ 
                    y: -150, 
                    opacity: [0, crystal.opacity, 0], 
                    rotate: 360 
                }}
                transition={{
                    duration: crystal.duration,
                    delay: crystal.delay,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
        ))}
      </div>

      {/* --- SWORD SVG --- */}
      <motion.div 
        className="relative w-48 h-48 md:w-64 md:h-64 mb-8 z-10"
        initial="hidden"
        animate="visible"
      >
        <motion.svg 
          viewBox="0 0 100 100" 
          className="w-full h-full overflow-visible"
          variants={glowVariants}
        >
          {/* Blade Group */}
          <motion.g variants={fillVariants} fill="#050505">
            {/* Blade Outline */}
            <motion.path 
              d="M 50 5 L 55 70 L 50 75 L 45 70 Z" 
              fill="inherit"
              stroke="#06b6d4" 
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={pathVariants}
            />
            
            {/* Center Fuller Line (Detail) */}
            <motion.path 
              d="M 50 15 L 50 70" 
              stroke="#06b6d4" 
              strokeWidth="0.5"
              fill="none"
              variants={pathVariants}
            />

            {/* Crossguard */}
            <motion.path 
              d="M 35 70 L 65 70 L 65 74 L 50 78 L 35 74 Z" 
              fill="inherit"
              stroke="#06b6d4" 
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={pathVariants}
            />

            {/* Grip */}
            <motion.path 
              d="M 48 78 L 48 90 Q 48 92 50 92 Q 52 92 52 90 L 52 78" 
              fill="inherit"
              stroke="#06b6d4" 
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={pathVariants}
            />

            {/* Pommel */}
            <motion.circle 
              cx="50" cy="94" r="2.5" 
              fill="inherit"
              stroke="#06b6d4" 
              strokeWidth="1"
              variants={pathVariants}
            />
          </motion.g>
        </motion.svg>
      </motion.div>

      {/* --- TEXT REVEAL --- */}
      <div className="relative overflow-hidden h-12 flex items-center justify-center z-10">
        <motion.h1 
          className="text-4xl md:text-5xl font-black tracking-[0.3em] text-[#06b6d4] font-mono relative z-10"
          variants={textVariants}
          initial="hidden"
          animate={["visible", "glitch"]}
        >
          REFORGE
        </motion.h1>
      </div>

      {/* Loading Status */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2">
          {!isFinished ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-[10px] text-[#06b6d4]/70 font-mono animate-pulse uppercase tracking-widest"
              >
                BUFFERING HOLO-DATA... {Math.round(loadProgress)}%
              </motion.div>
          ) : !isReady ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-[10px] text-[#06b6d4]/50 font-mono animate-pulse uppercase tracking-widest"
              >
                SYNCHRONIZING CORE SYSTEMS...
              </motion.div>
          ) : null}
      </div>

    </motion.div>
  );
};

export default SplashScreen;
