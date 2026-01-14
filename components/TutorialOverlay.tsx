
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ArrowRight, CheckCircle, Info, Lock, FastForward, ArrowUp, ArrowDown, ShieldAlert } from 'lucide-react';
import { playSystemSoundEffect } from '../utils/soundEngine';

interface TutorialOverlayProps {
  currentStep: number;
  onNext: () => void;
  onComplete: () => void;
}

interface ScriptStep {
  title: string;
  body: string;
  buttonText: string;
  targetId?: string;
  waitForAction?: boolean; // If true, Next button is hidden (user must perform action)
  allowInteraction?: boolean; // If true, allows clicking the TARGET only.
  hideOverlay?: boolean; // Fully hidden (for background processing)
  requireInput?: boolean; 
  forcePosition?: 'top' | 'bottom' | 'center'; 
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ currentStep, onNext, onComplete }) => {
  const [dialogPosition, setDialogPosition] = useState<'top' | 'bottom' | 'center'>('bottom');
  const [isError, setIsError] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [spotlightStyles, setSpotlightStyles] = useState<React.CSSProperties>({ opacity: 0 });
  
  // Script Configuration
  const SCRIPT: Record<number, ScriptStep> = {
      0: { 
          title: "Core Attributes",
          body: "Your stats represent who you are becoming.\nEvery action builds Discipline, Health, and Growth.",
          buttonText: "Next",
          targetId: 'tut-stats',
          allowInteraction: true, 
          forcePosition: 'center'
      },
      1: { 
          title: "The Compound Effect",
          body: "Motivation fades. Attributes last.\nImproving your stats makes progress automatic.",
          buttonText: "Go to Quests",
          targetId: 'tut-stats',
          allowInteraction: true,
          forcePosition: 'center'
      },
      2: { 
          title: "Create a Quest",
          body: "A Quest is a promise to yourself.\nTurn intention into action now.",
          buttonText: "Tap 'Add Quest'",
          targetId: 'tut-add-quest',
          waitForAction: true,
          allowInteraction: true,
          forcePosition: 'bottom'
      },
      3: { 
          title: "Identity & Name",
          body: "Name your goal. Give it power.\nMake it real.",
          buttonText: "Next",
          targetId: 'tut-quest-title',
          allowInteraction: true,
          requireInput: true,
          forcePosition: 'bottom'
      },
      4: { 
          title: "Mini Quests",
          body: "Too hard? Break it down.\n'Mini Quests' are small wins that build momentum.",
          buttonText: "Next",
          targetId: 'tut-quest-mini',
          allowInteraction: true,
          forcePosition: 'top'
      },
      5: { 
          title: "Triggers",
          body: "Don't rely on memory.\nSet a 'Trigger' (e.g. After coffee) to anchor this habit.",
          buttonText: "Next",
          targetId: 'tut-quest-trigger',
          allowInteraction: true,
          forcePosition: 'top'
      },
      6: { 
          title: "Alignment",
          body: "Categorize your goal.\nBalance is key to a high-level hunter.",
          buttonText: "Tap 'Confirm'",
          targetId: 'tut-confirm-quest',
          waitForAction: true,
          allowInteraction: true,
          forcePosition: 'top'
      },
      7: { 
          title: "Quest Active",
          body: "Excellent.\nCompleting this grants XP and Gold.\nConsistency is the only cheat code.",
          buttonText: "To Shop",
          forcePosition: 'center'
      },
      8: { 
          title: "The Reward Shop",
          body: "Earn Gold by showing up.\nUse it to buy real-life rewards you define.",
          buttonText: "Setup Health",
          targetId: 'tut-gold-display',
          allowInteraction: true, 
          forcePosition: 'bottom'
      }
  };

  const stepData = SCRIPT[currentStep];

  // --- SPOTLIGHT TRACKING ---
  useEffect(() => {
      const updateSpotlight = () => {
          if (targetElement && stepData && !stepData.hideOverlay) {
              const rect = targetElement.getBoundingClientRect();
              // Calculate slight padding
              const padding = 8;
              setSpotlightStyles({
                  opacity: 1,
                  top: rect.top - padding,
                  left: rect.left - padding,
                  width: rect.width + (padding * 2),
                  height: rect.height + (padding * 2),
                  borderRadius: '12px',
                  // The box-shadow creates the dark overlay everywhere EXCEPT the element
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)' 
              });
          } else {
              setSpotlightStyles({ opacity: 0 });
          }
      };

      updateSpotlight();
      
      // Update on scroll/resize or when target animates (using rAF loop)
      const frameId = requestAnimationFrame(function loop() {
          updateSpotlight();
          requestAnimationFrame(loop);
      });

      window.addEventListener('resize', updateSpotlight);
      window.addEventListener('scroll', updateSpotlight, true);

      return () => {
          cancelAnimationFrame(frameId);
          window.removeEventListener('resize', updateSpotlight);
          window.removeEventListener('scroll', updateSpotlight, true);
      };
  }, [targetElement, stepData]);

  // --- STRICT INTERACTION BLOCKER ---
  useEffect(() => {
    if (!stepData || stepData.hideOverlay) return;

    const handleInteraction = (e: Event) => {
        const target = e.target as Node;
        
        // 1. Always allow interaction with the Tutorial Dialog itself
        const dialog = document.getElementById('tutorial-dialog');
        if (dialog && dialog.contains(target)) {
            return; // Allow
        }

        // 2. If allowInteraction is ON, check if target is the highlighted element
        if (stepData.allowInteraction && targetElement) {
            // Check if clicking inside the target
            if (targetElement.contains(target) || targetElement === target) {
                return; // Allow
            }
        }

        // 3. Otherwise: BLOCK
        e.preventDefault();
        e.stopPropagation();
        
        // Visual/Audio Feedback for blocked action
        if (e.type === 'click' || e.type === 'mousedown') {
            playSystemSoundEffect('WARNING');
            setIsError(true);
            setTimeout(() => setIsError(false), 300);
        }
    };

    // Use capture phase to intercept before React or other listeners
    window.addEventListener('click', handleInteraction, true);
    window.addEventListener('mousedown', handleInteraction, true);
    window.addEventListener('keydown', handleInteraction, true);

    return () => {
        window.removeEventListener('click', handleInteraction, true);
        window.removeEventListener('mousedown', handleInteraction, true);
        window.removeEventListener('keydown', handleInteraction, true);
    };
  }, [stepData, targetElement]);


  // --- HIGHLIGHT LOGIC ---
  useEffect(() => {
      // 1. Cleanup previous highlights
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
          el.classList.remove('tutorial-highlight', 'tutorial-highlight-inset');
      });

      if (!stepData || stepData.hideOverlay) {
          setTargetElement(null);
          return;
      }

      // 2. Find and Highlight new target
      if (stepData.targetId) {
          const el = document.getElementById(stepData.targetId);
          if (el) {
              setTargetElement(el);
              
              if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                  el.classList.add('tutorial-highlight-inset');
                  // Auto focus inputs for better UX
                  if (stepData.allowInteraction) el.focus();
              } else {
                  el.classList.add('tutorial-highlight');
              }
              
              // Smooth Scroll
              el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

              // Position Dialog
              if (!stepData.forcePosition) {
                  const rect = el.getBoundingClientRect();
                  if (rect.top > window.innerHeight / 2) {
                      setDialogPosition('top');
                  } else {
                      setDialogPosition('bottom');
                  }
              } else {
                  setDialogPosition(stepData.forcePosition);
              }
          } else {
              // Retry for async renders
              setTimeout(() => {
                  const retryEl = document.getElementById(stepData.targetId!);
                  if (retryEl) {
                      setTargetElement(retryEl);
                      if (retryEl.tagName === 'INPUT' || retryEl.tagName === 'TEXTAREA' || retryEl.tagName === 'SELECT') {
                          retryEl.classList.add('tutorial-highlight-inset');
                      } else {
                          retryEl.classList.add('tutorial-highlight');
                      }
                  }
              }, 500);
          }
      } else {
          setTargetElement(null);
          setDialogPosition(stepData.forcePosition || 'center');
      }

      return () => {
          document.querySelectorAll('.tutorial-highlight, .tutorial-highlight-inset').forEach(el => {
              el.classList.remove('tutorial-highlight', 'tutorial-highlight-inset');
          });
      };
  }, [currentStep, stepData]);

  const handleNextClick = () => {
      if (stepData?.requireInput && stepData.targetId) {
          const el = document.getElementById(stepData.targetId) as HTMLInputElement;
          if (el && (!el.value || el.value.trim() === '')) {
              setIsError(true);
              setTimeout(() => setIsError(false), 500);
              el.focus();
              return;
          }
      }
      onNext();
  };

  if (!stepData || stepData.hideOverlay) return null;

  // Dialog Position Classes
  const positionClasses = {
      'top': 'top-4', 
      'bottom': 'bottom-24 md:bottom-12', 
      'center': 'top-1/2 -translate-y-1/2'
  };

  return (
    <>
        {/* Inject Styles for Aggressive Highlighting */}
        <style>{`
            @keyframes tutorial-pulse-aggressive {
                0% { border-color: #00d2ff; transform: scale(1); box-shadow: 0 0 10px rgba(0,210,255,0.2); }
                50% { border-color: #ffffff; transform: scale(1.01); box-shadow: 0 0 25px rgba(0,210,255,0.5); }
                100% { border-color: #00d2ff; transform: scale(1); box-shadow: 0 0 10px rgba(0,210,255,0.2); }
            }
            .tutorial-highlight {
                animation: tutorial-pulse-aggressive 2s infinite !important;
                z-index: 9999 !important; /* Must rise above spotlight */
                position: relative !important;
                border-radius: 8px !important;
                border: 2px solid #00d2ff !important;
                transition: all 0.2s ease;
            }
            .tutorial-highlight-inset {
                animation: tutorial-pulse-aggressive 2s infinite !important;
                z-index: 9999 !important;
                position: relative !important;
                border: 2px solid #00d2ff !important;
            }
        `}</style>

        {/* 
            DYNAMIC SPOTLIGHT
            - Creates a 'hole' over the target using box-shadow.
            - pointer-events-none ensures it's purely visual.
            - The Strict Interaction Blocker handles the actual logic.
        */}
        {targetElement ? (
            <div 
                className="fixed z-[9998] pointer-events-none transition-all duration-300 ease-out"
                style={{
                    ...spotlightStyles,
                    // Note: We use a massive box-shadow to darken the rest of the screen
                }}
            />
        ) : (
            // Full backdrop for text-only steps
            <div className="fixed inset-0 z-[9998] pointer-events-none bg-black/85 backdrop-blur-sm" />
        )}

        {/* 
            UI LAYER (DIALOG)
            - z-[9999]: Floats above everything.
        */}
        <div className="fixed inset-0 z-[9999] pointer-events-none font-sans flex flex-col items-center justify-center">
            
            {/* Tutorial Dialog Box */}
            <motion.div 
                id="tutorial-dialog"
                layout 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={isError ? { x: [-10, 10, -10, 10, 0], scale: [1, 1.05, 1] } : { opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className={`absolute left-4 right-4 md:left-auto md:right-auto md:w-[400px] pointer-events-auto ${positionClasses[dialogPosition]}`}
            >
                <div className={`bg-[#0a0a0a] border rounded-xl shadow-2xl overflow-hidden flex flex-col transition-colors ${isError ? 'border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.5)]' : 'border-system-neon shadow-[0_0_30px_rgba(0,210,255,0.3)]'}`}>
                    
                    {/* Decorative Header */}
                    <motion.div 
                        layoutId="tutorial-header-line"
                        className={`h-1 w-full shrink-0 ${isError ? 'bg-red-500' : 'bg-gradient-to-r from-system-neon via-system-accent to-system-neon'}`} 
                    />
                    
                    <div className="p-5">
                        <div className="flex items-start gap-4">
                            <motion.div 
                                key={currentStep}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={`hidden sm:block p-2 rounded-full border shrink-0 ${isError ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-system-neon/10 border-system-neon/20 text-system-neon'}`}
                            >
                                {isError ? <ShieldAlert size={20} /> : <Terminal size={20} />}
                            </motion.div>
                            
                            <div className="flex-1 min-w-0">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`content-${currentStep}`}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <h3 className={`text-sm md:text-base font-bold font-mono tracking-tight mb-2 flex items-center gap-2 ${isError ? 'text-red-500' : 'text-white'}`}>
                                            <span className="sm:hidden text-system-neon">{isError ? <Lock size={16} /> : <Terminal size={16} />}</span>
                                            {isError ? "ACCESS DENIED" : stepData.title}
                                        </h3>
                                        <div className="text-xs md:text-sm text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                                            {isError ? "Please follow the active protocol instruction." : stepData.body}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Interactive Hint Arrow */}
                        {stepData.targetId && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4 flex items-center gap-2 text-[10px] text-system-neon font-mono animate-pulse font-bold bg-system-neon/5 p-1 rounded"
                            >
                                {dialogPosition === 'top' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                                <span>TARGET LOCKED: INTERACT WITH HIGHLIGHT</span>
                            </motion.div>
                        )}

                        <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-800/50">
                            <button 
                                onClick={onComplete}
                                className="text-[10px] text-gray-600 hover:text-red-400 font-mono tracking-wider transition-colors px-2 py-1 flex items-center gap-1 group"
                            >
                                ABORT <FastForward size={10} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>

                            <div className="flex justify-end gap-2">
                                <AnimatePresence mode="wait">
                                    {currentStep === 8 ? ( 
                                        <motion.button 
                                            key="btn-complete"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            onClick={onComplete}
                                            className="bg-system-neon text-black px-5 py-2 rounded font-bold font-mono text-xs hover:bg-white transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.4)]"
                                        >
                                            {stepData.buttonText} <CheckCircle size={14} />
                                        </motion.button>
                                    ) : !stepData.waitForAction ? (
                                        <motion.button 
                                            key="btn-next"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            onClick={handleNextClick}
                                            className={`px-5 py-2 rounded font-bold font-mono text-xs transition-colors flex items-center gap-2 shadow-lg ${isError ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-system-neon text-black hover:bg-white'}`}
                                        >
                                            {stepData.buttonText} <ArrowRight size={14} />
                                        </motion.button>
                                    ) : (
                                        <motion.div 
                                            key="btn-wait"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-[10px] text-system-neon font-mono animate-pulse flex items-center gap-2 px-3 py-2 border border-system-neon/30 rounded bg-system-neon/5"
                                        >
                                            <Info size={12} /> {stepData.buttonText}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress Dots */}
                    <div className="bg-black/50 py-1.5 px-4 flex gap-1 justify-center shrink-0">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <motion.div 
                                key={i}
                                layout 
                                className={`h-1 rounded-full ${i === currentStep ? 'bg-system-neon shadow-[0_0_8px_#00d2ff]' : 'bg-gray-800'}`}
                                animate={{ 
                                    width: i === currentStep ? 24 : 8,
                                    opacity: i <= currentStep ? 1 : 0.5 
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    </>
  );
};

export default TutorialOverlay;
