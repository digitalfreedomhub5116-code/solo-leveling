import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { Quest, CoreStats, Rank } from '../types';
import QuestCard from './QuestCard';

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

  // Logic: Filter Quests
  const filteredQuests = quests.filter(q => {
    if (filter === 'ACTIVE') return !q.isCompleted;
    if (filter === 'COMPLETED') return q.isCompleted;
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt); // Newest first

  // Feature: Auto-Ranker Logic
  const handleAutoRank = () => {
    const text = (title + ' ' + description).toLowerCase();
    
    // 1. Guess Category
    if (text.match(/run|walk|gym|lift|push|squat|muscle|train/)) setCategory('strength');
    else if (text.match(/read|study|learn|code|write|solve|math/)) setCategory('intelligence');
    else if (text.match(/meditate|focus|plan|organize|schedule/)) setCategory('focus');
    else if (text.match(/call|meet|date|talk|party|social/)) setCategory('social');
    else if (text.match(/resist|fast|cold|endure|discipline|wait/)) setCategory('willpower');

    // 2. Guess Rank
    if (text.match(/impossible|god|marathon|project/)) setRank('S');
    else if (text.match(/hard|long|intense|heavy|exam/)) setRank('A');
    else if (text.match(/medium|hour|class/)) setRank('C');
    else if (text.match(/easy|quick|small|chat/)) setRank('E');
    else setRank('D'); // Default
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
      createdAt: Date.now()
    };

    addQuest(newQuest);
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setRank('E');
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
                    <button onClick={() => handleAutoRank()} className="text-xs text-system-neon flex items-center gap-1 hover:underline">
                       <Sparkles size={12} /> AUTO-ANALYZE
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