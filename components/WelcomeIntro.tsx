import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeIntroProps {
  onComplete: () => void;
}

const WelcomeIntro: React.FC<WelcomeIntroProps> = ({ onComplete }) => {
  const [text, setText] = useState("INITIALIZING...");
  const [show, setShow] = useState(true);

  useEffect(() => {
    const sequence = async () => {
      // Sequence of system messages
      setTimeout(() => setText("LOADING SHADOW PROTOCOL..."), 1000);
      setTimeout(() => setText("ESTABLISHING SECURE LINK..."), 2000);
      setTimeout(() => setText("SYSTEM ONLINE"), 2800);
      
      // Trigger completion
      setTimeout(() => {
        setShow(false);
        setTimeout(onComplete, 500); // Wait for exit animation
      }, 3500);
    };

    sequence();
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center overflow-hidden"
          exit={{ 
            y: "-100%",
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } // Shutter effect up
          }}
        >
          {/* Glitchy Background Lines */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-full h-[1px] bg-white absolute"
                initial={{ top: `${Math.random() * 100}%`, opacity: 0 }}
                animate={{ 
                  top: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                  opacity: [0, 0.5, 0]
                }}
                transition={{ 
                  duration: 0.2, 
                  repeat: Infinity, 
                  repeatDelay: Math.random() * 0.5 
                }}
              />
            ))}
          </div>

          {/* Main Glitch Text */}
          <div className="relative z-10 text-center">
            <motion.h1 
              key={text}
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              className="text-4xl md:text-6xl font-black text-white font-mono tracking-tighter relative"
            >
              <span className="relative z-10">{text}</span>
              <span className="absolute top-0 left-0 -ml-1 text-red-500 opacity-70 animate-pulse z-0">{text}</span>
              <span className="absolute top-0 left-0 ml-1 text-blue-500 opacity-70 animate-pulse z-0">{text}</span>
            </motion.h1>
            
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "200px" }}
              className="h-1 bg-system-neon mt-4 mx-auto"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeIntro;