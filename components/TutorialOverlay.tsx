
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ArrowRight, CheckCircle, Info, Lock, FastForward, ArrowUp, ArrowDown, ShieldAlert } from 'lucide-react';
import { playSystemSoundEffect } from '../utils/soundEngine';

interface TutorialOverlayProps {
  currentStep: number;
  onNext: () => void;
  onComplete: () => void;
  dynamicTargetId?: string | null;
}

interface ScriptStep {
  title: string;
  body: string;
  buttonText: string;
  targetId?: string;
  mobileTargetId?: string; // Fallback ID for mobile view
  waitForAction?: boolean; 
  allowInteraction?: boolean; 
  hideOverlay?: boolean; 
  requireInput?: boolean; 
  forcePosition?: 'top' | 'bottom' | 'center'; 
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ currentStep, onNext, onComplete, dynamicTargetId }) => {
  const [dialogPosition, setDialogPosition] = useState<'top' | 'bottom' | 'center'>('bottom');
  const [isError, setIsError] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [spotlightStyles, setSpotlightStyles] = useState<React.CSSProperties>({ opacity: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);
  
  // Script Configuration
  const SCRIPT: Record<number, ScriptStep> = {
      0: { 
          title: "Core Attributes",
          body: "Your stats represent who you are becoming.\nEvery action builds Discipline, Health, and Growth.",
          buttonText: "Next",
          targetId: 'tut-stats',
          allowInteraction: true, 
          forcePosition: 'bottom'
      },
      1: { 
          title: "The Compound Effect",
          body: "Motivation fades. Attributes last.\nImproving your stats makes progress automatic.",
          buttonText: "Go to Quests",
          targetId: 'tut-stats', 
          allowInteraction: true,
          forcePosition: 'bottom'
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
          title: "Calibration Required",
          body: "The System has issued 5 Welcome Quests.\n\nYou must complete ALL of them to proceed.\n\nWatch how each completion impacts your Daily, Weekly, and Monthly attributes.",
          buttonText: "Complete Task",
          targetId: 'quest-list-container', 
          waitForAction: true,
          allowInteraction: true, 
          forcePosition: 'bottom'
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

  const stepData = { ...SCRIPT[currentStep] };

  // Dynamic override for Step 7 (Sequential Highlighting)
  if (currentStep === 7 && dynamicTargetId) {
      stepData.targetId = dynamicTargetId;
      stepData.body = "Focus on this specific task.\nComplete it to calibrate your stats.\n\nThe System requires full compliance.";
      // Remove forced position to allow smart positioning to avoid overlap
      stepData.forcePosition = undefined;
  }

  // --- SCROLL LOCK & AUTO-NAV ---
  useEffect(() => {
    // Strict Scroll Locking Logic
    if (targetElement && !stepData.hideOverlay) {
        // 1. Force layout recalculation before locking
        const rect = targetElement.getBoundingClientRect();
        
        // 2. Center element vertically, accounting for sticky headers (approx 100px offset)
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = rect.top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - (window.innerHeight / 2) + (rect.height / 2);

        // Smooth scroll to target
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });

        // 3. Lock Scroll after small delay to allow smooth scroll to finish
        const lockTimer = setTimeout(() => {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none'; // Disable touch scroll on mobile
        }, 600);

        return () => {
            clearTimeout(lockTimer);
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    } else {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
    }
  }, [targetElement, stepData.hideOverlay]);

  // --- SPOTLIGHT TRACKING ---
  useEffect(() => {
      const updateSpotlight = () => {
          if (targetElement && stepData && !stepData.hideOverlay) {
              const rect = targetElement.getBoundingClientRect();
              
              // Mobile adjustment: Ensure spotlight covers full touch targets comfortably
              const padding = window.innerWidth < 768 ? 12 : 12;
              
              setSpotlightStyles({
                  opacity: 1,
                  top: rect.top - padding,
                  left: rect.left - padding,
                  width: rect.width + (padding * 2),
                  height: rect.height + (padding * 2),
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)' 
              });

              // Smart Dialog Positioning
              if (!stepData.forcePosition) {
                  const spaceBelow = window.innerHeight - rect.bottom;
                  const spaceAbove = rect.top;
                  const minSpaceNeeded = 280; // Dialog height approx

                  if (spaceBelow > minSpaceNeeded) {
                      setDialogPosition('bottom');
                  } else if (spaceAbove > minSpaceNeeded) {
                      setDialogPosition('top');
                  } else {
                      setDialogPosition(spaceBelow > spaceAbove ? 'bottom' : 'top');
                  }
              } else {
                  setDialogPosition(stepData.forcePosition);
              }

          } else {
              setSpotlightStyles({ opacity: 0 });
          }
      };

      // Initial Update
      updateSpotlight();
      
      // Setup Resize Observer for robust tracking
      if (targetElement) {
          observerRef.current = new ResizeObserver(updateSpotlight);
          observerRef.current.observe(targetElement);
          observerRef.current.observe(document.body);
      }

      // Animation Frame Loop for smooth tracking during scrolls/transitions
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
          if (observerRef.current) observerRef.current.disconnect();
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
        if (stepData.allowInteraction) {
            // Check if user is clicking inside the highlighted target
            if (targetElement && (targetElement.contains(target) || targetElement === target)) {
                return; // Allow
            }
        }

        // 3. Otherwise: BLOCK
        e.preventDefault();
        e.stopPropagation();
        
        if (['click', 'mousedown', 'touchstart'].includes(e.type)) {
            playSystemSoundEffect('WARNING');
            setIsError(true);
            setTimeout(() => setIsError(false), 300);
        }
    };

    // Capture phase blocking
    window.addEventListener('click', handleInteraction, true);
    window.addEventListener('mousedown', handleInteraction, true);
    window.addEventListener('touchstart', handleInteraction, { capture: true, passive: false });
    window.addEventListener('keydown', handleInteraction, true);

    return () => {
        window.removeEventListener('click', handleInteraction, true);
        window.removeEventListener('mousedown', handleInteraction, true);
        window.removeEventListener('touchstart', handleInteraction, true);
        window.removeEventListener('keydown', handleInteraction, true);
    };
  }, [stepData, targetElement, currentStep]);


  // --- TARGET ELEMENT FINDER ---
  useEffect(() => {
      // Cleanup previous highlights
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
          el.classList.remove('tutorial-highlight', 'tutorial-highlight-inset');
      });

      if (!stepData || stepData.hideOverlay) {
          setTargetElement(null);
          return;
      }

      // Find Target (Retry logic for async rendering)
      const findAndSetTarget = () => {
          let targetId = stepData.targetId;
          
          // Mobile Fallback Logic
          if (window.innerWidth < 768 && stepData.mobileTargetId) {
              targetId = stepData.mobileTargetId;
          }

          if (targetId) {
              const el = document.getElementById(targetId);
              if (el) {
                  setTargetElement(el);
                  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
                      el.classList.add('tutorial-highlight-inset');
                      if (stepData.allowInteraction) el.focus();
                  } else {
                      el.classList.add('tutorial-highlight');
                  }
              }
          } else {
              setTargetElement(null);
              setDialogPosition(stepData.forcePosition || 'center');
          }
      };

      findAndSetTarget();
      // Retry aggressively to catch mount animations/tab switches
      const retryTimer1 = setTimeout(findAndSetTarget, 100);
      const retryTimer2 = setTimeout(findAndSetTarget, 500);
      const retryTimer3 = setTimeout(findAndSetTarget, 1000);

      return () => {
          clearTimeout(retryTimer1);
          clearTimeout(retryTimer2);
          clearTimeout(retryTimer3);
          document.querySelectorAll('.tutorial-highlight, .tutorial-highlight-inset').forEach(el => {
              el.classList.remove('tutorial-highlight', 'tutorial-highlight-inset');
          });
      };
  }, [currentStep, stepData.targetId]); 

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
      'top': 'top-4 md:top-12', 
      'bottom': 'bottom-4 md:bottom-12', 
      'center': 'top-1/2 -translate-y-1/2'
  };

  // --- RENDER VIA PORTAL ---
  // Using Portal ensures the fixed overlay is relative to the VIEWPORT, 
  // ignoring any parent transforms (which caused the "wrong side" issue).
  return createPortal(
    <>
        {/* Inject Styles */}
        <style>{`
            @keyframes tutorial-pulse-aggressive {
                0% { box-shadow: 0 0 0 2px #00d2ff, 0 0 15px rgba(0,210,255,0.3); transform: scale(1); }
                50% { box-shadow: 0 0 0 2px #ffffff, 0 0 30px rgba(0,210,255,0.6); transform: scale(1.02); }
                100% { box-shadow: 0 0 0 2px #00d2ff, 0 0 15px rgba(0,210,255,0.3); transform: scale(1); }
            }
            .tutorial-highlight {
                animation: tutorial-pulse-aggressive 2s infinite !important;
                z-index: 9999 !important;
                position: relative !important;
                /* NOTE: Do NOT set background-color here, it overrides button styles */
            }
            .tutorial-highlight-inset {
                animation: tutorial-pulse-aggressive 2s infinite !important;
                z-index: 9999 !important;
                position: relative !important;
                /* NOTE: Do NOT set background-color here */
            }
        `}</style>

        {/* SPOTLIGHT OVERLAY */}
        {targetElement ? (
            <motion.div 
                className="fixed z-[9998] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={spotlightStyles as any}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                    ...spotlightStyles,
                    // Use a subtle border on the spotlight itself to define the hole
                    border: '1px solid rgba(0, 210, 255, 0.3)',
                }}
            />
        ) : (
            // Full backdrop for text-only steps
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[9998] pointer-events-none bg-black/90 backdrop-blur-sm" 
            />
        )}

        {/* DIALOG BOX */}
        <div className="fixed inset-0 z-[9999] pointer-events-none font-sans flex flex-col items-center justify-center">
            <motion.div 
                id="tutorial-dialog"
                layout 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={isError ? { x: [-10, 10, -10, 10, 0], scale: [1, 1.05, 1] } : { opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className={`absolute left-4 right-4 md:left-auto md:right-auto md:w-[400px] pointer-events-auto ${positionClasses[dialogPosition]}`}
            >
                <div className={`bg-[#0a0a0a] border rounded-xl shadow-2xl overflow-hidden flex flex-col transition-colors ${isError ? 'border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.5)]' : 'border-system-neon shadow-[0_0_30px_rgba(0,210,255,0.3)]'}`}>
                    
                    {/* Header Line */}
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
                                className={`hidden sm:block p-2 rounded-full border shrink-0 ${isError ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-system-neon/10 border-system-neon/20 text-system-neon'}`}
                            >
                                {isError ? <ShieldAlert size={20} /> : <Terminal size={20} />}
                            </motion.div>
                            
                            <div className="flex-1 min-w-0">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`content-${currentStep}-${dynamicTargetId || 'static'}`}
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

                        {/* Interactive Hint */}
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
    </>,
    document.body
  );
};

export default TutorialOverlay;
