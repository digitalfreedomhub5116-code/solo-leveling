
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ArrowRight, CheckCircle, Info, Lock } from 'lucide-react';

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
  allowInteraction?: boolean; // If true, user can click/type in the highlighted area
  hideOverlay?: boolean; // For steps where user interacts with complex forms (Health)
  requireInput?: boolean; // If true, prevents clicking Next until input has value
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ currentStep, onNext, onComplete }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [dialogPosition, setDialogPosition] = useState<'top' | 'bottom' | 'center'>('bottom');
  const [isError, setIsError] = useState(false);
  const scrollLockedRef = useRef(false);
  
  // Concise Script for Mobile Optimization
  const SCRIPT: Record<number, ScriptStep> = {
      0: { 
          title: "Core Attributes",
          body: "Your stats represent who you are becoming.\nEvery action builds Discipline, Health, and Growth.\nThis is your foundation.",
          buttonText: "Next",
          targetId: 'tut-stats'
      },
      1: { 
          title: "The Compound Effect",
          body: "Motivation fades. Attributes last.\nImproving your stats makes progress automatic.\nFeed the system daily.",
          buttonText: "Go to Quests",
          targetId: 'tut-stats'
      },
      2: { 
          title: "Create a Quest",
          body: "A Quest is a promise to yourself.\nTurn intention into action now.",
          buttonText: "Tap 'Add Quest'",
          targetId: 'tut-add-quest',
          waitForAction: true,
          allowInteraction: true
      },
      3: { 
          title: "Identity & Name",
          body: "Name your goal. Give it power.\nMake it real.",
          buttonText: "Next",
          targetId: 'tut-quest-title',
          allowInteraction: true,
          requireInput: true 
      },
      4: { 
          title: "Mini Quests",
          body: "Too hard? Break it down.\n'Mini Quests' are small wins that build momentum.",
          buttonText: "Next",
          targetId: 'tut-quest-mini',
          allowInteraction: true
      },
      5: { 
          title: "Triggers",
          body: "Don't rely on memory.\nSet a 'Trigger' (e.g. After coffee) to anchor this habit.",
          buttonText: "Next",
          targetId: 'tut-quest-trigger',
          allowInteraction: true
      },
      6: { 
          title: "Alignment",
          body: "Categorize your goal.\nBalance is key to a high-level hunter.",
          buttonText: "Tap 'Confirm'",
          targetId: 'tut-confirm-quest',
          waitForAction: true,
          allowInteraction: true
      },
      7: { 
          title: "Quest Active",
          body: "Excellent.\nCompleting this grants XP and Gold.\nConsistency is the only cheat code.",
          buttonText: "To Shop"
      },
      8: { 
          title: "The Reward Shop",
          body: "Earn Gold by showing up.\nUse it to buy real-life rewards you define.\nEarn your leisure.",
          buttonText: "Setup Health",
          targetId: 'tut-gold-display'
      }
  };

  const stepData = SCRIPT[currentStep];

  useEffect(() => {
      // Helper to lock/unlock scroll without layout shift
      const lockScroll = () => {
          if (scrollLockedRef.current) return;
          const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
          document.body.style.paddingRight = `${scrollbarWidth}px`;
          document.body.style.overflow = 'hidden';
          scrollLockedRef.current = true;
      };
      
      const unlockScroll = () => {
          if (!scrollLockedRef.current) return;
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
          scrollLockedRef.current = false;
      };

      if (stepData?.hideOverlay) {
          setTargetRect(null);
          unlockScroll();
          return;
      }

      const updateRect = () => {
          if (stepData?.targetId) {
              const el = document.getElementById(stepData.targetId);
              if (el) {
                  const rect = el.getBoundingClientRect();
                  // Only update if actually different to prevent render loops
                  setTargetRect(prev => {
                      if (!prev) return rect;
                      if (Math.abs(prev.top - rect.top) < 1 && Math.abs(prev.left - rect.left) < 1 && Math.abs(prev.width - rect.width) < 1) return prev;
                      return rect;
                  });
                  
                  const windowHeight = window.innerHeight;
                  const elementCenterY = rect.top + (rect.height / 2);
                  
                  // Aggressive positioning for mobile
                  if (elementCenterY < windowHeight * 0.45) {
                      setDialogPosition('bottom');
                  } else {
                      setDialogPosition('top');
                  }
              }
          } else {
              setTargetRect(null);
              setDialogPosition('center');
          }
      };

      // 1. Unlock to allow scrolling
      unlockScroll();

      // 2. Scroll and Measure
      if (stepData?.targetId) {
          const el = document.getElementById(stepData.targetId);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
              
              // Multiple checks to catch the end of smooth scroll and layout shifts
              setTimeout(updateRect, 100);
              setTimeout(updateRect, 300);
              setTimeout(() => {
                  lockScroll(); // Lock AFTER scroll finishes
                  updateRect(); // Measure ONE LAST TIME after locking (in case padding shifted things)
              }, 600);
          } else {
              // Retry for delayed renders
              setTimeout(() => {
                  const elRetry = document.getElementById(stepData.targetId!);
                  if (elRetry) {
                      elRetry.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                      updateRect();
                      setTimeout(() => {
                          lockScroll();
                          updateRect();
                      }, 600);
                  }
              }, 500);
          }
      } else {
          updateRect();
          lockScroll();
      }

      window.addEventListener('resize', updateRect);
      window.addEventListener('scroll', updateRect, { capture: true, passive: true });

      return () => {
          window.removeEventListener('resize', updateRect);
          window.removeEventListener('scroll', updateRect, { capture: true });
          unlockScroll();
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

  const positionClasses = {
      'top': 'top-24', 
      'bottom': 'bottom-12',
      'center': 'top-1/2 -translate-y-1/2'
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none font-sans">
        
        {/* Spotlight Overlay & Interaction Blocker */}
        {targetRect ? (
            <>
                <div className="absolute left-0 right-0 top-0 bg-black/80 pointer-events-auto transition-all duration-500 ease-in-out backdrop-blur-[1px]" style={{ height: Math.max(0, targetRect.top - 5) }} />
                <div className="absolute left-0 right-0 bottom-0 bg-black/80 pointer-events-auto transition-all duration-500 ease-in-out backdrop-blur-[1px]" style={{ top: targetRect.bottom + 5 }} />
                <div className="absolute left-0 top-0 bg-black/80 pointer-events-auto transition-all duration-500 ease-in-out backdrop-blur-[1px]" style={{ top: Math.max(0, targetRect.top - 5), height: targetRect.height + 10, width: Math.max(0, targetRect.left - 5) }} />
                <div className="absolute right-0 top-0 bg-black/80 pointer-events-auto transition-all duration-500 ease-in-out backdrop-blur-[1px]" style={{ top: Math.max(0, targetRect.top - 5), height: targetRect.height + 10, left: targetRect.right + 5 }} />
                
                {/* Visual Border - z-50 */}
                <div 
                    className="absolute pointer-events-none transition-all duration-500 ease-in-out z-50"
                    style={{
                        top: targetRect.top - 5,
                        left: targetRect.left - 5,
                        width: targetRect.width + 10,
                        height: targetRect.height + 10,
                    }}
                >
                    <div className={`absolute inset-0 border-2 rounded-lg animate-pulse ${isError ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'border-system-neon/50 shadow-[0_0_40px_rgba(0,210,255,0.4)]'}`} />
                    {!isError && (
                        <>
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-system-neon rounded-tl shadow-[0_0_10px_#00d2ff]" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-system-neon rounded-tr shadow-[0_0_10px_#00d2ff]" />
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-system-neon rounded-bl shadow-[0_0_10px_#00d2ff]" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-system-neon rounded-br shadow-[0_0_10px_#00d2ff]" />
                        </>
                    )}
                </div>

                {!stepData.allowInteraction && (
                    <div 
                        className="absolute pointer-events-auto z-40 transition-all duration-500 ease-in-out"
                        style={{
                            top: targetRect.top - 5,
                            left: targetRect.left - 5,
                            width: targetRect.width + 10,
                            height: targetRect.height + 10,
                        }}
                    />
                )}
            </>
        ) : (
            <div className="absolute inset-0 bg-black/80 pointer-events-auto transition-colors duration-500 backdrop-blur-[1px]" />
        )}

        {/* Dialog Box - Increased z-index to 100 to stay above highlight */}
        <motion.div 
            layout 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={isError ? { x: [-5, 5, -5, 5, 0] } : { opacity: 1, scale: 1, y: 0 }}
            transition={{ 
                layout: { duration: 0.5, type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 } 
            }}
            className={`fixed z-[100] left-4 md:left-1/2 md:-translate-x-1/2 w-[calc(100%-32px)] md:w-[90%] max-w-sm pointer-events-auto transition-all duration-500 ease-in-out ${positionClasses[dialogPosition]}`}
            style={{ 
                marginTop: 'env(safe-area-inset-top)',
                marginBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            <div className={`bg-[#0a0a0a] border rounded-xl shadow-2xl overflow-hidden relative max-h-[60vh] flex flex-col transition-colors ${isError ? 'border-red-500' : 'border-system-border'}`}>
                {/* Decorative Top Bar */}
                <div className={`h-1 w-full shrink-0 ${isError ? 'bg-red-500' : 'bg-gradient-to-r from-system-neon via-system-accent to-system-neon'}`} />
                
                <div className="p-4 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`hidden sm:block p-2 rounded-full border shrink-0 ${isError ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-system-neon/10 border-system-neon/20 text-system-neon'}`}>
                                    {isError ? <Lock size={18} /> : <Terminal size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-sm sm:text-base font-bold font-mono tracking-tight mb-1 flex items-center gap-2 ${isError ? 'text-red-500' : 'text-white'}`}>
                                        <span className={`sm:hidden ${isError ? 'text-red-500' : 'text-system-neon'}`}>
                                            {isError ? <Lock size={14} /> : <Terminal size={14} />}
                                        </span>
                                        {isError ? "INPUT REQUIRED" : stepData.title}
                                    </h3>
                                    <div className="text-[11px] sm:text-sm text-gray-400 font-mono leading-snug whitespace-pre-wrap">
                                        {isError ? "This field is mandatory. Please enter data to proceed." : stepData.body}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 mt-1">
                                {currentStep === 8 ? ( 
                                    <button 
                                        onClick={onComplete}
                                        className="bg-system-neon text-black px-4 py-2 rounded font-bold font-mono text-xs hover:bg-white transition-colors flex items-center gap-2 shadow-[0_0_10px_rgba(0,210,255,0.4)]"
                                    >
                                        {stepData.buttonText} <CheckCircle size={14} />
                                    </button>
                                ) : !stepData.waitForAction ? (
                                    <button 
                                        onClick={handleNextClick}
                                        className={`px-4 py-2 rounded font-bold font-mono text-xs transition-colors flex items-center gap-2 shadow-[0_0_10px_rgba(0,210,255,0.4)] ${isError ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-system-neon text-black hover:bg-white'}`}
                                    >
                                        {stepData.buttonText} <ArrowRight size={14} />
                                    </button>
                                ) : (
                                    <div className="text-[10px] text-system-neon font-mono animate-pulse flex items-center gap-2 px-3 py-2 border border-system-neon/30 rounded bg-system-neon/5">
                                        <Info size={12} /> {stepData.buttonText}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
                
                {/* Progress Indicators */}
                <div className="bg-black py-1.5 px-4 flex gap-0.5 justify-center shrink-0">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-0.5 w-full rounded-full transition-colors ${i <= currentStep ? 'bg-system-neon' : 'bg-gray-800'}`}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    </div>
  );
};

export default TutorialOverlay;
