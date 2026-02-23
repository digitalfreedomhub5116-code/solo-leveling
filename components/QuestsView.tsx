
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Plus, Calendar, Skull, AlertTriangle, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, X, RotateCcw, Trash2, Check, XCircle, BrainCircuit, Loader2, Clock } from 'lucide-react';
import { Quest, CoreStats, Rank, Priority, HistoryEntry, PlayerData } from '../types';
import QuestCard, { STAT_COLORS } from './QuestCard';
import { playSystemSoundEffect } from '../utils/soundEngine';
import { analyzeQuest } from '../utils/ai';

interface QuestsViewProps {
  quests: Quest[];
  playerData: PlayerData;
  addQuest: (quest: Quest) => void;
  completeQuest: (id: string, asMini?: boolean, rect?: DOMRect) => void; 
  failQuest: (id: string) => void;
  resetQuest: (id: string) => void; 
  deleteQuest: (id: string) => void;
  tutorialStep?: number;
  onTutorialAction?: (step: number) => void;
  onAnalysisEvent?: (status: 'SUCCESS' | 'ERROR') => void;
  toggleQuestDaily?: (id: string) => void;
  history?: HistoryEntry[];
  recordStrike?: () => void;
  onToggleNav?: (visible: boolean) => void;
}

// ... (HexagonProgress, QuestCalendar Components remain unchanged, preserving them for brevity) ...
// --- HEXAGON PROGRESS COMPONENT ---
const HexagonProgress: React.FC<{ 
    progress: number; 
    isToday: boolean; 
    isFuture: boolean; 
    dayNum: number; 
    label: string; 
    index: number;
    completionState: 'FULL' | 'NONE' | 'PARTIAL' | 'FUTURE';
}> = ({ 
    progress, isToday, isFuture, dayNum, label, index, completionState 
}) => {
    // Hexagon math
    const size = 52;
    const strokeWidth = 2;
    const path = "M26 2 L47 13.5 L47 38.5 L26 50 L5 38.5 L5 13.5 Z";
    const pathLength = 138; // Approx perimeter

    // Calculate offset
    const offset = pathLength - (progress / 100) * pathLength;

    const strokeColor = isToday ? '#00d2ff' : completionState === 'FULL' ? '#10b981' : completionState === 'NONE' ? '#ef4444' : '#374151';
    
    // Floating animation variant
    const floatVariants: Variants = {
        float: {
            y: [0, -4, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.15 // Stagger effect
            }
        }
    };

    return (
        <motion.div 
            className="flex flex-col items-center gap-2 min-w-[56px] snap-center group"
            variants={floatVariants}
            animate="float"
        >
            <div className={`relative w-14 h-14 transition-transform duration-300 ${isToday ? 'scale-110' : 'group-hover:scale-105'}`}>
                <div 
                    className="absolute inset-0 z-0"
                    style={{
                        clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                        background: isToday 
                            ? 'linear-gradient(135deg, rgba(0, 210, 255, 0.15), rgba(0, 210, 255, 0.05))' 
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
                        backdropFilter: 'blur(4px)',
                        boxShadow: isToday ? '0 0 15px rgba(0,210,255,0.2)' : 'none',
                        borderTop: '1px solid rgba(255,255,255,0.2)',
                        borderLeft: '1px solid rgba(255,255,255,0.1)'
                    }}
                />
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 w-full h-full drop-shadow-md overflow-visible z-10">
                    <path d={path} fill="none" stroke={isToday ? 'rgba(0,210,255,0.3)' : 'rgba(255,255,255,0.1)'} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                    {completionState === 'PARTIAL' && (
                        <motion.path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={pathLength} strokeLinecap="round" strokeLinejoin="round" initial={{ strokeDashoffset: pathLength }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: "easeOut" }} style={{ filter: `drop-shadow(0 0 2px ${strokeColor})` }} />
                    )}
                </svg>
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                    {completionState === 'FULL' ? (
                        <Check size={24} className="text-system-success drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" strokeWidth={3} />
                    ) : completionState === 'NONE' ? (
                        <XCircle size={24} className="text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                    ) : (
                        <span className={`font-mono font-bold text-sm ${isToday ? 'text-white' : 'text-gray-400'}`}>{dayNum}</span>
                    )}
                </div>
                {isToday && <div className="absolute inset-0 bg-system-neon/20 blur-xl -z-10 rounded-full" />}
            </div>
            <span className={`text-[9px] font-mono font-bold tracking-wider ${isToday ? 'text-system-neon' : 'text-gray-600'}`}>{label}</span>
        </motion.div>
    );
};

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

const getDaysInMonth = (date: Date) => {
    if (!date || isNaN(date.getTime())) return [];
    const year = date.getFullYear();
    const month = date.getMonth();
    // Safety check for invalid dates
    if (isNaN(year) || isNaN(month)) return [];
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Clamp to valid range (1-31)
    const safeCount = Math.max(1, Math.min(31, isNaN(daysInMonth) ? 0 : daysInMonth));
    
    return Array.from({ length: safeCount }).map((_, i) => new Date(year, month, i + 1));
};

const QuestCalendar: React.FC<{ history: HistoryEntry[], currentQuests: Quest[], selectedDate: Date, onDateChange: (d: Date) => void }> = ({ history, currentQuests, selectedDate, onDateChange }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const today = new Date();
    const days = useMemo(() => getDaysInMonth(selectedDate), [selectedDate]);
    const historyMap = useMemo(() => new Map(history.map(h => [h.date, h.questCompletion])), [history]);
    const activeTodayCount = currentQuests.length;
    const completedTodayCount = currentQuests.filter(q => q.isCompleted).length;
    const todayProgress = activeTodayCount > 0 ? (completedTodayCount / activeTodayCount) * 100 : 0;

    useEffect(() => {
        if (selectedDate.getMonth() === today.getMonth() && scrollRef.current) {
            const scrollPos = (today.getDate() - 1) * 64 - (scrollRef.current.clientWidth / 2) + 32;
            scrollRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
        } else if (scrollRef.current) {
            scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
    }, [selectedDate.getMonth()]);

    const changeMonth = (delta: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + delta);
        onDateChange(newDate);
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4 px-2">
                <button onClick={() => changeMonth(-1)} className="p-2 bg-gray-900/50 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-gray-800"><ChevronLeft size={16} /></button>
                <h2 className="text-xl font-black text-white font-mono tracking-tighter uppercase flex items-center gap-2"><Calendar size={18} className="text-system-neon" />{MONTHS[selectedDate.getMonth()]} <span className="text-gray-600 text-base">{selectedDate.getFullYear()}</span></h2>
                <button onClick={() => changeMonth(1)} className="p-2 bg-gray-900/50 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-gray-800"><ChevronRight size={16} /></button>
            </div>
            <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-20 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-20 pointer-events-none" />
                <div ref={scrollRef} data-no-swipe="true" className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-6 px-4 bg-[#0a0a0a]/50 rounded-2xl border border-gray-800/50 snap-x snap-mandatory">
                    {days.map((date, i) => {
                        if (!date || isNaN(date.getTime())) return null;
                        const dateStr = date.toISOString().split('T')[0];
                        const isToday = date.toDateString() === today.toDateString();
                        const isFuture = date.setHours(0,0,0,0) > today.setHours(0,0,0,0);
                        let progress = 0;
                        if (isToday) progress = todayProgress;
                        else if (historyMap.has(dateStr)) progress = historyMap.get(dateStr) || 0;
                        let state: 'FULL' | 'NONE' | 'PARTIAL' | 'FUTURE' = 'PARTIAL';
                        if (isFuture) state = 'FUTURE';
                        else { if (progress >= 100) state = 'FULL'; else if (progress === 0 && !isToday) state = 'NONE'; else state = 'PARTIAL'; }
                        return <HexagonProgress key={i} index={i} progress={progress} isToday={isToday} isFuture={isFuture} dayNum={date.getDate()} label={DAYS[date.getDay()].substring(0, 3)} completionState={state} />;
                    })}
                </div>
            </div>
        </div>
    );
};

const QuestsView: React.FC<QuestsViewProps> = ({ quests, playerData, addQuest, completeQuest, failQuest, resetQuest, deleteQuest, tutorialStep, onTutorialAction, onAnalysisEvent, toggleQuestDaily, history = [], onToggleNav }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Failure Logic State
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [failingQuestId, setFailingQuestId] = useState<string | null>(null);
  const [failReason, setFailReason] = useState("");
  const [failAnalysis, setFailAnalysis] = useState("");

  // New Quest Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
      rank: Rank;
      xp: number;
      reasoning: string;
      isSpam: boolean;
      category: keyof CoreStats;
      estimatedDuration: number;
      suggestedTime?: string;
  } | null>(null);

  const [isDaily, setIsDaily] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  // --- NAVIGATION CONTROL ---
  useEffect(() => {
      if (onToggleNav) {
          onToggleNav(!isModalOpen && !isFailModalOpen);
      }
      return () => {
          if (onToggleNav) onToggleNav(true);
      }
  }, [isModalOpen, isFailModalOpen, onToggleNav]);

  // Logic: Timeline Sorting
  const timelineQuests = [...quests].sort((a, b) => b.createdAt - a.createdAt);
  const activeCount = quests.filter(q => !q.isCompleted && !q.failed).length;

  // --- AI ANALYSIS HANDLER ---
  const handleAnalyze = async () => {
      if (!title.trim()) {
          setError("Input required for analysis.");
          return;
      }
      
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      try {
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const context = {
              currentTime: now,
              country: playerData.country || "Unknown",
              timezone: playerData.timezone || "UTC"
          };

          const result = await analyzeQuest(title, playerData.healthProfile || {} as any, playerData.stats, context);
          
          if (result.isSpam) {
              setError(`FORGEGUARD REJECTED: ${result.reasoning || "Trivial/Nonsense/Specifics Required."}`);
              playSystemSoundEffect('DANGER');
              if (onAnalysisEvent) onAnalysisEvent('ERROR');
          } else {
              setAnalysisResult(result);
              playSystemSoundEffect('SYSTEM');
              
              // Auto-fill schedule if suggested
              if (result.suggestedTime) {
                  setScheduledTime(result.suggestedTime);
              }

              if (onAnalysisEvent) onAnalysisEvent('SUCCESS');
              // Tutorial Trigger
              if (tutorialStep === 4 && onTutorialAction) onTutorialAction(5);
          }
      } catch (e) {
          setError("Connection to ForgeGuard failed.");
          if (onAnalysisEvent) onAnalysisEvent('ERROR');
      } finally {
          setIsAnalyzing(false);
      }
  };

  const validateTime = (timeStr: string) => {
      if (!timeStr) return true;
      const now = new Date();
      const [hours, mins] = timeStr.split(':').map(Number);
      
      // Create date object for scheduled time today
      const schedDate = new Date();
      schedDate.setHours(hours, mins, 0, 0);

      // Check if time is in the past (allowing 5 min buffer for clock sync issues)
      // NOTE: We only block if the user attempts to set a time that is clearly passed TODAY.
      // If it's 3 PM and they set 10 PM, it's valid.
      // If it's 3 PM and they set 7 AM, it's invalid for *today*.
      if (schedDate.getTime() < now.getTime() - 5 * 60 * 1000) {
          setError("Time Paradox: Cannot schedule quests in the past.");
          return false;
      }
      setError(null);
      return true;
  };

  const handleConfirm = () => {
    if (!analysisResult) return;
    
    // Final check on time
    if (scheduledTime && !validateTime(scheduledTime)) {
        return;
    }

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const newQuest: Quest = {
      id: Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      description: description.trim() || analysisResult.reasoning,
      rank: analysisResult.rank,
      priority: 'MEDIUM', // Auto-set or analyze
      category: analysisResult.category,
      xpReward: analysisResult.xp,
      isCompleted: false,
      failed: false,
      createdAt: now,
      expiresAt: now + oneDay,
      isDaily: isDaily,
      scheduledTime: scheduledTime || undefined,
      estimatedDuration: analysisResult.estimatedDuration,
      aiReasoning: analysisResult.reasoning
    };

    addQuest(newQuest);
    setIsModalOpen(false);
    resetForm();

    if (tutorialStep === 6 && onTutorialAction) onTutorialAction(7);
  };

  const resetForm = () => {
      setTitle(''); setDescription(''); setScheduledTime(''); setIsDaily(false); setError(null); setAnalysisResult(null);
  };

  const initiateFail = (id: string) => {
      setFailingQuestId(id);
      setFailReason("");
      setFailAnalysis("");
      setIsFailModalOpen(true);
  };

  const confirmFail = () => {
      if (failingQuestId) {
          failQuest(failingQuestId);
          setIsFailModalOpen(false);
          setFailingQuestId(null);
      }
  };

  return (
    <div className="min-h-screen pb-20 max-w-2xl mx-auto w-full">
       
       {/* CALENDAR STRIP */}
       <QuestCalendar 
            history={history} 
            currentQuests={quests} 
            selectedDate={calendarDate} 
            onDateChange={setCalendarDate}
       />

       {/* TASKS SECTION HEADER */}
       <div className="flex justify-between items-center mb-4">
           <div className="flex items-center gap-3">
               <h2 className="text-xl font-bold text-white font-mono tracking-tight glow-text">TODAY TASKS</h2>
               <div className="bg-[#1f1f1f] text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-700">
                   {activeCount} Active
               </div>
           </div>
           
           <button 
             id="tut-add-quest"
             onClick={() => {
                 resetForm();
                 setIsModalOpen(true);
                 if (tutorialStep === 2 && onTutorialAction) onTutorialAction(3);
             }}
             className="w-8 h-8 rounded-full bg-system-neon text-black flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_15px_#00d2ff]"
           >
               <Plus size={18} />
           </button>
       </div>

       {/* QUEST LIST */}
       <div id="quest-list-container" className="space-y-4">
          <AnimatePresence mode='popLayout'>
            {timelineQuests.map((quest, index) => (
              <motion.div
                key={quest.id}
                id={`quest-card-${quest.id}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                  <QuestCard 
                    quest={quest} 
                    onComplete={completeQuest} 
                    onFail={initiateFail} // Pass the initiator, not direct fail
                    onReset={() => {}} // Disabled as requested
                    onDelete={deleteQuest}
                    onToggleDaily={toggleQuestDaily}
                  />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {timelineQuests.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 text-gray-700 border-2 border-dashed border-gray-800 rounded-2xl">
                <Calendar size={40} className="mb-4 opacity-50" />
                <p className="font-mono text-sm">NO ACTIVE PROTOCOLS</p>
                <p className="text-[10px] uppercase tracking-widest mt-1">Initiate a new quest</p>
             </div>
          )}
       </div>

       {/* FORGEGUARD CREATE MODAL */}
       <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center md:p-4 bg-black/90 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0a0a0a] border-t md:border border-gray-800 w-full h-full md:h-auto md:max-w-lg rounded-none md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:max-h-[100dvh]"
              >
                 <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/30 pt-12 md:pt-5 shrink-0">
                    <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                        <BrainCircuit size={18} className="text-system-neon" /> FORGEGUARD PROTOCOL
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                 </div>
                 
                 <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                    {/* Error Banner */}
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                id="tut-quest-error"
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                className="bg-red-900/20 border border-red-500/50 p-3 rounded text-xs text-red-400 font-mono flex items-center gap-2"
                            >
                                <AlertTriangle size={14} /> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Objective</label>
                            <input 
                                id="tut-quest-title"
                                value={title}
                                onChange={e => {
                                    setTitle(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder="e.g. Run 5km, Study 2 hours..."
                                className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white text-sm focus:border-system-neon focus:outline-none transition-colors"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            />
                            <p className="text-[9px] text-gray-600 mt-1">Be specific. "Run" will be rejected. "Run 20 mins" is accepted.</p>
                        </div>

                        {/* Analysis Result Display */}
                        <AnimatePresence>
                            {analysisResult && (
                                <motion.div 
                                    id="tut-analysis-result"
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-gray-900/50 border border-system-neon/30 p-4 rounded-xl space-y-3"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-[10px] text-system-neon font-bold uppercase tracking-widest mb-1">System Evaluation</div>
                                            <div className="text-xs text-gray-300 italic">"{analysisResult.reasoning}"</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-white">{analysisResult.rank}-RANK</div>
                                            <div className="text-[10px] text-system-neon font-mono">{analysisResult.xp} XP</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase border-t border-gray-700 pt-2">
                                        <span>CATEGORY: {analysisResult.category.toUpperCase()}</span>
                                        {analysisResult.estimatedDuration && <span className="ml-auto flex items-center gap-1"><Clock size={10}/> EST: {analysisResult.estimatedDuration} MIN</span>}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Optional Schedule inputs */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Schedule Time (Optional)</label>
                                <input 
                                    type="time"
                                    value={scheduledTime}
                                    onChange={e => {
                                        setScheduledTime(e.target.value);
                                        validateTime(e.target.value);
                                    }}
                                    className={`w-full bg-black border rounded-lg p-2 text-white text-xs focus:outline-none font-mono ${error && error.includes('Paradox') ? 'border-red-500 text-red-500' : 'border-gray-800 focus:border-gray-600'}`}
                                />
                            </div>
                            <div className="flex items-center">
                                <p className="text-[8px] text-gray-600 leading-tight">
                                    Setting a time enables strict deadlines. Early completion is restricted.
                                </p>
                            </div>
                        </div>
                    </div>
                 </div>

                 <div className="p-5 border-t border-gray-800 bg-gray-900/30 flex justify-end gap-3 shrink-0 pb-safe md:pb-5">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-lg text-gray-500 font-bold text-xs hover:text-white">CANCEL</button>
                    
                    {!analysisResult ? (
                        <button 
                            id="tut-analyze-btn"
                            onClick={handleAnalyze} 
                            disabled={isAnalyzing || !title.trim()}
                            className="px-8 py-3 bg-system-neon text-black font-black rounded-lg text-xs tracking-widest hover:bg-white shadow-[0_0_15px_rgba(0,210,255,0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <BrainCircuit size={14} />}
                            ANALYZE
                        </button>
                    ) : (
                        <button 
                            id="tut-confirm-quest"
                            onClick={handleConfirm} 
                            disabled={!!error}
                            className="px-8 py-3 bg-system-success text-black font-black rounded-lg text-xs tracking-widest hover:bg-white shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check size={14} />
                            CONFIRM
                        </button>
                    )}
                 </div>
              </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* FAILURE MODAL */}
       <AnimatePresence>
           {isFailModalOpen && (
               <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-red-950/30 backdrop-blur-sm">
                   <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-black border border-red-600 w-full max-w-md rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-hidden"
                   >
                       <div className="p-6 bg-red-950/20 border-b border-red-900/50 flex items-center gap-4">
                           <div className="p-3 bg-red-900/20 rounded-full border border-red-600/50">
                               <Skull size={24} className="text-red-500 animate-pulse" />
                           </div>
                           <div>
                               <h3 className="text-xl font-black text-red-500 font-mono tracking-tighter uppercase">MISSION FAILURE</h3>
                               <p className="text-[10px] text-red-400 font-mono uppercase tracking-widest">Protocol Aborted</p>
                           </div>
                       </div>

                       <div className="p-6 space-y-4">
                           <div>
                               <label className="text-[10px] text-red-700 font-bold uppercase tracking-widest block mb-2">Primary Cause</label>
                               <input 
                                   value={failReason}
                                   onChange={e => setFailReason(e.target.value)}
                                   placeholder="Why did you fail?"
                                   className="w-full bg-black border border-red-900 rounded p-3 text-red-200 text-xs focus:border-red-500 focus:outline-none placeholder:text-red-900/50 font-mono"
                                   autoFocus
                               />
                           </div>
                           <div>
                               <label className="text-[10px] text-red-700 font-bold uppercase tracking-widest block mb-2">Self Analysis (Optional)</label>
                               <textarea 
                                   value={failAnalysis}
                                   onChange={e => setFailAnalysis(e.target.value)}
                                   placeholder="What went wrong? How to fix next time?"
                                   className="w-full bg-black border border-red-900 rounded p-3 text-red-200 text-xs focus:border-red-500 focus:outline-none placeholder:text-red-900/50 font-mono h-20 resize-none"
                               />
                           </div>
                       </div>

                       <div className="p-4 border-t border-red-900/50 bg-red-950/10 flex justify-between gap-4">
                           <button 
                               onClick={() => setIsFailModalOpen(false)}
                               className="flex-1 py-3 text-red-400 font-bold text-xs uppercase hover:text-white transition-colors"
                           >
                               CANCEL
                           </button>
                           <button 
                               onClick={confirmFail}
                               className="flex-1 py-3 bg-red-600 text-black font-black text-xs uppercase tracking-widest rounded hover:bg-white transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                           >
                               ACCEPT PENALTY
                           </button>
                       </div>
                   </motion.div>
               </div>
           )}
       </AnimatePresence>
    </div>
  );
};

export default QuestsView;
