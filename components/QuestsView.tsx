import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Repeat } from 'lucide-react';
import { Quest, CoreStats, Rank } from '../types';
import QuestCard from './QuestCard';
import { playSystemSoundEffect } from '../utils/soundEngine';

interface QuestsViewProps {
  quests: Quest[];
  addQuest: (quest: Quest) => void;
  completeQuest: (id: string) => void;
  deleteQuest: (id: string) => void;
}

const QuestsView: React.FC<QuestsViewProps> = ({ quests, addQuest, completeQuest, deleteQuest }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
  
  // New Quest Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<keyof CoreStats>('strength');
  const [rank, setRank] = useState<Rank>('E');
  const [isDaily, setIsDaily] = useState(false);

  // Logic: Filter Quests
  const filteredQuests = quests.filter(q => {
    if (filter === 'ACTIVE') return !q.isCompleted;
    if (filter === 'COMPLETED') return q.isCompleted;
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt); // Newest first

  // Feature: Auto-Ranker Logic
  const handleAutoRank = () => {
    const text = (title + ' ' + description).toLowerCase();
    playSystemSoundEffect('SYSTEM');
    
    // Expanded Keyword Dictionaries
    const categoryKeywords: Record<keyof CoreStats, string[]> = {
       strength: ['run', 'gym', 'lift', 'squat', 'push', 'pull', 'muscle', 'train', 'sport', 'cardio', 'hike', 'swim', 'bike', 'yoga', 'stretch', 'physical', 'exercise', 'workout', 'sprint', 'jog'],
       intelligence: ['study', 'read', 'learn', 'code', 'write', 'solve', 'math', 'science', 'history', 'language', 'exam', 'test', 'quiz', 'analyze', 'research', 'debug', 'skill', 'book', 'course', 'class'],
       focus: ['meditate', 'plan', 'organize', 'schedule', 'focus', 'deep work', 'journal', 'reflect', 'clean', 'declutter', 'tidy', 'manage', 'goal', 'priority', 'mindfulness', 'breath'],
       social: ['call', 'meet', 'date', 'talk', 'party', 'social', 'friend', 'family', 'network', 'email', 'text', 'message', 'event', 'gather', 'present', 'speak', 'listen', 'help'],
       willpower: ['fast', 'cold', 'shower', 'resist', 'endure', 'wait', 'quit', 'stop', 'avoid', 'discipline', 'habit', 'wake', 'early', 'sleep', 'diet', 'no sugar', 'challenge']
    };

    const rankKeywords: Record<Rank, string[]> = {
       'S': ['impossible', 'god', 'marathon', 'transformation', 'life-changing', 'mastery', 'perfect', '100%', 'insane', 'ultra', 'championship'],
       'A': ['hard', 'intense', 'heavy', 'grueling', 'severe', 'complex', 'final', 'project', 'difficult', 'record', 'limit'],
       'B': ['tough', 'significant', 'week', 'milestone', 'presentation', 'challenge', 'serious', 'hours'],
       'C': ['medium', 'moderate', 'average', 'standard', 'session', 'routine', 'daily', 'chapter', 'lesson', 'hour'],
       'D': ['basic', 'simple', 'prep', 'chore', 'task', 'maintenance', 'common', 'normal'],
       'E': ['easy', 'quick', 'small', 'tiny', 'micro', 'chat', 'message', '5min', 'instant', 'lite']
    };

    // 1. Scoring System for Category
    let detectedCategory: keyof CoreStats | null = null;
    let maxScore = 0;

    (Object.keys(categoryKeywords) as Array<keyof CoreStats>).forEach(cat => {
       let score = 0;
       categoryKeywords[cat].forEach(word => {
          if (text.includes(word)) score++;
       });
       if (score > maxScore) {
          maxScore = score;
          detectedCategory = cat;
       }
    });

    if (detectedCategory) setCategory(detectedCategory);

    // 2. Hierarchy Check for Rank (S > A > E > B > C > D)
    // We check extremes first.
    let detectedRank: Rank = 'D'; // Default

    if (rankKeywords.S.some(w => text.includes(w))) detectedRank = 'S';
    else if (rankKeywords.A.some(w => text.includes(w))) detectedRank = 'A';
    else if (rankKeywords.E.some(w => text.includes(w))) detectedRank = 'E'; // Check Easy specifically
    else if (rankKeywords.B.some(w => text.includes(w))) detectedRank = 'B';
    else if (rankKeywords.C.some(w => text.includes(w))) detectedRank = 'C';
    
    setRank(detectedRank);
  };

  const handleCreate = () => {
    if (!title) return;
    
    // XP Mapping
    const xpMap: Record<Rank, number> = {
      'E': 10, 'D': 25, 'C': 50, 'B': 100, 'A': 200, 'S': 500
    };

    const newQuest: Quest = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      rank,
      category,
      xpReward: xpMap[rank],
      isCompleted: false,
      createdAt: Date.now(),
      isDaily: isDaily
    };

    addQuest(newQuest);
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setRank('E');
    setIsDaily(false);
  };

  return (
    <div className="space-y-6">
       {/* Header & Controls */}
       <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-system-border pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white font-mono tracking-tighter">QUEST LOG</h2>
            <p className="text-xs text-gray-500 font-mono">MANAGE YOUR ASSIGNMENTS</p>
          </div>
          
          <div className="flex gap-2">
             <div className="flex bg-system-card border border-system-border rounded p-1">
                {(['ACTIVE', 'COMPLETED', 'ALL'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded text-[10px] font-mono transition-colors ${filter === f ? 'bg-system-accent text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {f}
                  </button>
                ))}
             </div>
             
             <button 
               onClick={() => setIsModalOpen(true)}
               className="flex items-center gap-2 px-4 py-2 bg-system-neon text-black font-bold rounded hover:bg-white transition-colors text-xs font-mono"
             >
               <Plus size={16} /> ADD QUEST
             </button>
          </div>
       </div>

       {/* Quest List */}
       <div className="space-y-4 min-h-[50vh]">
          <AnimatePresence mode='popLayout'>
            {filteredQuests.map(quest => (
              <QuestCard 
                key={quest.id} 
                quest={quest} 
                onComplete={completeQuest} 
                onDelete={deleteQuest} 
              />
            ))}
          </AnimatePresence>
          
          {filteredQuests.length === 0 && (
             <div className="text-center py-20 text-gray-600 font-mono text-sm border-2 border-dashed border-system-border rounded-lg">
                NO {filter === 'ALL' ? '' : filter} QUESTS FOUND.
             </div>
          )}
       </div>

       {/* Create Quest Modal */}
       <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-system-card border border-system-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
              >
                 <div className="p-6 border-b border-system-border flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white font-mono">NEW SYSTEM ASSIGNMENT</h3>
                    <button onClick={() => handleAutoRank()} className="text-xs text-system-neon flex items-center gap-1 hover:underline group">
                       <Sparkles size={12} className="group-hover:animate-spin" /> AUTO-ANALYZE
                    </button>
                 </div>
                 
                 <div className="p-6 space-y-4">
                    <div>
                       <label className="block text-xs text-gray-500 mb-1 font-mono">TITLE</label>
                       <input 
                         value={title}
                         onChange={e => setTitle(e.target.value)}
                         placeholder="e.g. Run 5km"
                         className="w-full bg-system-bg border border-system-border rounded p-2 text-white focus:border-system-neon focus:outline-none"
                       />
                    </div>
                    
                    <div>
                       <label className="block text-xs text-gray-500 mb-1 font-mono">DESCRIPTION (OPTIONAL)</label>
                       <textarea 
                         value={description}
                         onChange={e => setDescription(e.target.value)}
                         placeholder="Additional details..."
                         className="w-full bg-system-bg border border-system-border rounded p-2 text-white focus:border-system-neon focus:outline-none h-20"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs text-gray-500 mb-1 font-mono">CATEGORY</label>
                          <select 
                            value={category}
                            onChange={e => setCategory(e.target.value as keyof CoreStats)}
                            className="w-full bg-system-bg border border-system-border rounded p-2 text-white focus:border-system-neon focus:outline-none appearance-none"
                          >
                            <option value="strength">STRENGTH</option>
                            <option value="intelligence">INTELLIGENCE</option>
                            <option value="focus">FOCUS</option>
                            <option value="social">SOCIAL</option>
                            <option value="willpower">WILLPOWER</option>
                          </select>
                       </div>
                       
                       <div>
                          <label className="block text-xs text-gray-500 mb-1 font-mono">DIFFICULTY RANK</label>
                          <div className="flex gap-1">
                             {(['E', 'D', 'C', 'B', 'A', 'S'] as const).map(r => (
                               <button
                                 key={r}
                                 onClick={() => setRank(r)}
                                 className={`flex-1 py-2 rounded text-xs font-bold transition-colors ${rank === r ? 'bg-system-accent text-white' : 'bg-system-bg border border-system-border text-gray-500 hover:text-white'}`}
                               >
                                 {r}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Daily Toggle */}
                    <div className="flex items-center gap-3 pt-2">
                         <button 
                            onClick={() => setIsDaily(!isDaily)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isDaily ? 'bg-system-neon border-system-neon text-black' : 'bg-transparent border-gray-600'}`}
                         >
                            {isDaily && <Repeat size={14} />}
                         </button>
                         <span onClick={() => setIsDaily(!isDaily)} className="text-xs text-gray-400 font-mono cursor-pointer select-none">
                            REPEAT DAILY (RESETS 24H)
                         </span>
                    </div>
                 </div>

                 <div className="p-4 bg-system-bg border-t border-system-border flex justify-end gap-3">
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs font-mono text-gray-500 hover:text-white"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={handleCreate}
                      disabled={!title}
                      className="px-6 py-2 bg-system-neon text-black font-bold rounded text-xs font-mono hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      CONFIRM ASSIGNMENT
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