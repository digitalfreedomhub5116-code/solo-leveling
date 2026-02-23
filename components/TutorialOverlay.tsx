
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ArrowRight, CheckCircle, Info, Lock, FastForward, ArrowUp, ArrowDown, ShieldAlert, Target } from 'lucide-react';
import { playSystemSoundEffect } from '../utils/soundEngine';

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

interface TutorialOverlayProps {
  currentStep: number;
  onNext: () => void;
  onComplete: () => void;
  dynamicTargetId?: string | null;
  overrideStep?: ScriptStep | null; // Prop to override current step data temporarily
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ currentStep, onNext, onComplete, dynamicTargetId, overrideStep }) => {
  const [dialogPosition, setDialogPosition] = useState<'top' | 'bottom' | 'center'>('bottom');
  const [isError, setIsError] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [spotlightStyles, setSpotlightStyles] = useState<React.CSSProperties>({ opacity: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);
  
  // Previous rect ref to debounce state updates
  const prevRect = useRef<{top: number, left: number, width: number, height: number} | null>(null);

  // Script Configuration - REFINED 10-STEP FLOW
  const SCRIPT: Record<number, ScriptStep> = {
      0: { 
          title: "System Interface",
          body: "This Command Deck visualizes your current capabilities and active focus protocols.",
          buttonText: "Next",
          targetId: 'tut-radar-chart',
          allowInteraction: false, 
      },
      1: { 
          title: "Attribute Matrix",
          body: "Your core stats. Every workout, quest, and meal affects these values directly.",
          buttonText: "Initialize Protocols",
          targetId: 'tut-stats', 
          allowInteraction: false,
          forcePosition: 'bottom'
      },
      2: { 
          title: "Protocol Initiation",
          body: "Establish a daily objective. The System rewards consistency.",
          buttonText: "Tap 'Add Quest'",
          targetId: 'tut-add-quest',
          waitForAction: true,
          allowInteraction: true,
          forcePosition: 'bottom'
      },
      3: { 
          title: "Define Objective",
          body: "Input a specific task. E.g., 'Run 5km' or 'Read 20 pages'.",
          buttonText: "Next",
          targetId: 'tut-quest-title',
          allowInteraction: true,
          requireInput: true,
          forcePosition: 'bottom'
      },
      4: {
          title: "ForgeGuard Analysis",
          body: "The System AI will analyze difficulty and assign Rank & XP.",
          buttonText: "Waiting...",
          targetId: 'tut-analyze-btn',
          waitForAction: true,
          allowInteraction: true,
          forcePosition: 'top'
      },
      5: { 
          title: "System Verdict",
          body: "Review the assigned Rank and reasoning. Higher difficulty = Greater XP.",
          buttonText: "Next",
          targetId: 'tut-analysis-result',
          allowInteraction: false 
      },
      6: { 
          title: "Confirm Protocol",
          body: "Lock in the quest to add it to your daily schedule.",
          buttonText: "Confirm",
          targetId: 'tut-confirm-quest',
          waitForAction: true,
          allowInteraction: true,
          forcePosition: 'top'
      },
      7: { 
          title: "Execution Phase",
          body: "Complete this task now to verify synchronization.",
          buttonText: "Awaiting Completion...",
          targetId: 'quest-list-container', 
          waitForAction: true,
          allowInteraction: true, 
          forcePosition: 'bottom'
      },
      8: { 
          title: "Biometric Dashboard",
          body: "Track BMI, Body Fat %, and physical evolution metrics here.",
          buttonText: "View Nutrition",
          targetId: 'tut-biometric-analysis',
          allowInteraction: false, 
          forcePosition: 'bottom'
      },
      9: { 
          title: "Fuel Management",
          body: "Log intake here. The System calculates energy balance automatically.",
          buttonText: "System Online",
          targetId: 'tut-nutrition-dashboard',
          allowInteraction: true, 
          forcePosition: 'top'
      }
  };

  // Determine active step data
  const stepData = overrideStep || { ...SCRIPT[currentStep] };

  // Dynamic override for Step 7 (Sequential Highlighting)
  if (currentStep === 7 && dynamicTargetId && !overrideStep) {
      stepData.targetId = dynamicTargetId;
      stepData.body = "Mark this protocol as complete to finish calibration.";
      stepData.forcePosition = undefined;
  }

  // --- SCROLL LOCK & AUTO-NAV ---
  useEffect(() => {
    let lockTimer: ReturnType<typeof setTimeout>;

    const lockScroll = () => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.touchAction = 'none'; // Disable touch scroll
    };

    const unlockScroll = () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.touchAction = '';
    };

    if (stepData.hideOverlay) {
        unlockScroll();
        return;
    }

    if (targetElement) {
        // Scroll to target with block 'center' to ensure it's vertically centered
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        // Lock after animation duration (approx 600ms for smooth scroll)
        lockTimer = setTimeout(lockScroll, 600);
    } else {
        // If no target (e.g. text modal), lock immediately to focus user
        lockScroll();
    }

    return () => {
        clearTimeout(lockTimer);
        unlockScroll();
    };
  }, [targetElement, stepData.hideOverlay, currentStep, overrideStep]);

  // --- SPOTLIGHT TRACKING ---
  useEffect(() => {
      const updateSpotlight = () => {
          if (targetElement && stepData && !stepData.hideOverlay) {
              const rect = targetElement.getBoundingClientRect();
              
              // Mobile adjustment: Ensure spotlight covers full touch targets comfortably
              const padding = window.innerWidth < 768 ? 8 : 12;
              
              const newTop = rect.top - padding;
              const newLeft = rect.left - padding;
              const newWidth = rect.width + (padding * 2);
              const newHeight = rect.height + (padding * 2);

              // Debounce check: Only update if values changed significantly (>1px) to prevent micro-jitter loops
              if (prevRect.current && 
                  Math.abs(prevRect.current.top - newTop) < 1 &&
                  Math.abs(prevRect.current.left - newLeft) < 1 &&
                  Math.abs(prevRect.current.width - newWidth) < 1 &&
                  Math.abs(prevRect.current.height - newHeight) < 1
              ) {
                  return;
              }

              prevRect.current = { top: newTop, left: newLeft, width: newWidth, height: newHeight };

              setSpotlightStyles({
                  opacity: 1,
                  top: newTop,
                  left: newLeft,
                  width: newWidth,
                  height: newHeight,
                  borderRadius: '12px',
                  // Use a huge shadow to create the dimming effect around the hole
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)' 
              });

              // Smart Dialog Positioning
              if (!stepData.forcePosition) {
                  const spaceBelow = window.innerHeight - rect.bottom;
                  const spaceAbove = rect.top;
                  const minSpaceNeeded = 200; // Reduced tolerance for faster fit

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
              prevRect.current = null;
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
    // Also block wheel to prevent fighting auto-scroll during lock
    window.addEventListener('wheel', handleInteraction, { capture: true, passive: false });

    return () => {
        window.removeEventListener('click', handleInteraction, true);
        window.removeEventListener('mousedown', handleInteraction, true);
        window.removeEventListener('touchstart', handleInteraction, true);
        window.removeEventListener('keydown', handleInteraction, true);
        window.removeEventListener('wheel', handleInteraction, true);
    };
  }, [stepData, targetElement, currentStep]);


  // --- TARGET ELEMENT FINDER (WITH POLLING) ---
  useEffect(() => {
      // Cleanup previous highlights
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
          el.classList.remove('tutorial-highlight', 'tutorial-highlight-inset');
      });

      if (!stepData || stepData.hideOverlay) {
          setTargetElement(null);
          return;
      }

      let intervalId: ReturnType<typeof setInterval>;
      let attempts = 0;
      const maxAttempts = 50; // 50 * 100ms = 5 seconds max wait

      const findAndSetTarget = () => {
          let targetId = stepData.targetId;
          
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
                  // Stop polling once found
                  clearInterval(intervalId);
              } else {
                  attempts++;
                  // If we exceed max attempts, stop trying and default to center
                  if (attempts >= maxAttempts) {
                      clearInterval(intervalId);
                      setTargetElement(null);
                      setDialogPosition(stepData.forcePosition || 'center');
                  }
              }
          } else {
              setTargetElement(null);
              setDialogPosition(stepData.forcePosition || 'center');
              clearInterval(intervalId);
          }
      };

      // Initial check
      findAndSetTarget();
      
      // Start polling
      intervalId = setInterval(findAndSetTarget, 100);

      return () => {
          clearInterval(intervalId);
          document.querySelectorAll('.tutorial-highlight, .tutorial-highlight-inset').forEach(el => {
              el.classList.remove('tutorial-highlight', 'tutorial-highlight-inset');
          });
      };
  }, [currentStep, stepData.targetId, overrideStep]); 

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

  return createPortal(
    <>
        {/* Inject Styles */}
        <style>{`
            @keyframes tutorial-pulse-fast {
                0% { box-shadow: 0 0 0 2px #00d2ff, 0 0 10px rgba(0,210,255,0.3); }
                50% { box-shadow: 0 0 0 4px #ffffff, 0 0 20px rgba(0,210,255,0.6); }
                100% { box-shadow: 0 0 0 2px #00d2ff, 0 0 10px rgba(0,210,255,0.3); }
            }
            .tutorial-highlight {
                animation: tutorial-pulse-fast 1.5s infinite !important;
                z-index: 9999 !important;
                position: relative !important;
            }
            .tutorial-highlight-inset {
                animation: tutorial-pulse-fast 1.5s infinite !important;
                z-index: 9999 !important;
                position: relative !important;
            }
        `}</style>

        {/* SPOTLIGHT OVERLAY */}
        {targetElement ? (
            <motion.div 
                className="fixed z-[9998] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={spotlightStyles as any}
                // Snappier spring for fast response
                transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
                style={{
                    ...spotlightStyles,
                    border: '1px solid rgba(0, 210, 255, 0.5)',
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
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
                                        key={`content-${currentStep}-${dynamicTargetId || 'static'}-${overrideStep ? 'override' : 'normal'}`}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.15 }}
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
                                SKIP <FastForward size={10} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>

                            <div className="flex justify-end gap-2">
                                <AnimatePresence mode="wait">
                                    {currentStep === 9 && !overrideStep ? ( 
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
                                            {currentStep === 7 ? <Target size={12} /> : <Info size={12} />} {stepData.buttonText}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress Dots */}
                    <div className="bg-black/50 py-1.5 px-4 flex gap-1 justify-center shrink-0">
                        {Array.from({ length: 10 }).map((_, i) => (
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
