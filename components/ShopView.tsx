
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Plus, ShoppingBag, X, Ghost, Timer, Key, Gift } from 'lucide-react';
import { ShopItem } from '../types';
import ShopItemCard from './ShopItemCard';

interface ShopViewProps {
  gold: number;
  items: ShopItem[];
  purchaseItem: (item: ShopItem) => void;
  addItem: (item: ShopItem) => void;
  removeItem: (id: string) => void;
  keys?: number;
  lastDungeonEntry?: number;
  onStartDungeon?: (isFree: boolean) => void;
}

const ShopView: React.FC<ShopViewProps> = ({ 
    gold, 
    items, 
    purchaseItem, 
    addItem, 
    removeItem, 
    keys = 0, 
    lastDungeonEntry = 0, 
    onStartDungeon 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<number>(100);
  
  const [timeUntilFree, setTimeUntilFree] = useState<number>(0);
  const [timeUntilDaily, setTimeUntilDaily] = useState<number>(0);

  // Timer Logic for Dungeon
  useEffect(() => {
      const checkTimer = () => {
          const nextEntry = lastDungeonEntry + (24 * 60 * 60 * 1000);
          const remaining = Math.max(0, nextEntry - Date.now());
          setTimeUntilFree(remaining);
      };
      
      checkTimer();
      const interval = setInterval(checkTimer, 1000);
      return () => clearInterval(interval);
  }, [lastDungeonEntry]);

  // Timer Logic for Daily Reset (Midnight UTC)
  useEffect(() => {
      const updateDailyTimer = () => {
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setUTCHours(24, 0, 0, 0); // Next midnight UTC
          const diff = tomorrow.getTime() - now.getTime();
          setTimeUntilDaily(Math.max(0, diff));
      };
      
      updateDailyTimer();
      const interval = setInterval(updateDailyTimer, 1000);
      return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
      const h = Math.floor(ms / (1000 * 60 * 60));
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((ms % (1000 * 60)) / 1000);
      return `${h}h ${m}m ${s}s`;
  };

  const handleCreate = () => {
    if (!title || cost <= 0) return;

    const newItem: ShopItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      cost,
      icon: 'star' // Default icon for custom items
    };

    addItem(newItem);
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setCost(100);
  };

  const isFreeReady = timeUntilFree <= 0;
  const canAffordPaid = keys >= 3;

  return (
    <div className="space-y-6">
      {/* Header with Gold Balance */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-system-border pb-4 sticky top-20 bg-system-bg/95 backdrop-blur z-20 pt-2 bg-black/80 md:bg-system-bg">
         <div>
           <h2 className="text-2xl font-bold text-white font-mono tracking-tighter flex items-center gap-2">
             SYSTEM REWARDS
           </h2>
           <p className="text-xs text-gray-500 font-mono">EXCHANGE CURRENCY FOR REWARDS</p>
         </div>

         <div className="flex items-center gap-4">
             {/* Gold Display */}
             <div id="tut-gold-display" className="flex items-center gap-3 bg-system-warning/10 border border-system-warning/30 px-4 py-2 rounded-lg">
                <Coins className="text-system-warning animate-pulse" size={24} />
                <div className="flex flex-col items-end">
                   <span className="text-xs text-system-warning/80 font-mono">BALANCE</span>
                   <span className="text-xl font-bold text-white font-mono leading-none">{gold} G</span>
                </div>
             </div>
             
             <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-system-card hover:bg-system-border border border-system-border text-gray-300 p-2 rounded-lg transition-colors"
                title="Add Custom Reward"
             >
                <Plus size={24} />
             </button>
         </div>
      </div>

      {/* --- DUNGEON TOWER WIDGET --- */}
      {onStartDungeon && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-black/60 border border-red-900/50 rounded-xl p-6 relative overflow-hidden group shadow-[0_0_30px_rgba(220,38,38,0.1)]"
          >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-600 via-red-900 to-red-600 opacity-80" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.1),transparent_50%)]" />
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-red-950/30 rounded-full flex items-center justify-center border-2 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                          <Ghost size={32} className="text-red-500 animate-pulse" />
                      </div>
                      <div>
                          <h3 className="text-2xl font-black text-white font-serif tracking-tight uppercase">DUNGEON TOWER</h3>
                          <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] bg-red-900/20 text-red-400 px-2 py-0.5 rounded border border-red-900/30 font-mono tracking-widest uppercase">
                                  HIGH RISK ZONE
                              </span>
                              {!isFreeReady && (
                                  <span className="text-[10px] text-yellow-500 font-mono flex items-center gap-1">
                                      <Timer size={10} /> RESET: {formatTime(timeUntilFree)}
                                  </span>
                              )}
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                      <button 
                          onClick={() => onStartDungeon(true)}
                          disabled={!isFreeReady}
                          className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-mono font-bold text-xs uppercase tracking-widest transition-all
                              ${isFreeReady 
                                  ? 'bg-red-600 text-white hover:bg-white hover:text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
                                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                              }
                          `}
                      >
                          {isFreeReady ? "ENTER (FREE)" : "LOCKED"}
                      </button>

                      <button 
                          onClick={() => onStartDungeon(false)}
                          disabled={!canAffordPaid}
                          className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 justify-center border
                              ${canAffordPaid 
                                  ? 'bg-purple-900/20 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                  : 'bg-gray-900 border-gray-700 text-gray-600 cursor-not-allowed'
                              }
                          `}
                      >
                          <Key size={12} />
                          ENTER (3 KEYS)
                      </button>
                  </div>
              </div>
          </motion.div>
      )}

      {/* --- DAILY REWARD WIDGET --- */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full bg-black/60 border border-blue-900/50 rounded-xl p-6 relative overflow-hidden group shadow-[0_0_30px_rgba(0,210,255,0.1)]"
      >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 via-blue-900 to-blue-600 opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,210,255,0.1),transparent_50%)]" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-950/30 rounded-full flex items-center justify-center border-2 border-blue-500/50 shadow-[0_0_20px_rgba(0,210,255,0.3)]">
                      <Gift size={32} className="text-blue-500 animate-pulse" />
                  </div>
                  <div>
                      <h3 className="text-2xl font-black text-white font-serif tracking-tight uppercase">DAILY SUPPLY DROP</h3>
                      <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded border border-blue-900/30 font-mono tracking-widest uppercase">
                              STATUS: CLAIMED
                          </span>
                      </div>
                  </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto items-center justify-center md:justify-end">
                  <div className="text-right">
                      <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">NEXT DROP IN</div>
                      <div className="text-xl font-bold text-white font-mono flex items-center gap-2 bg-black/40 px-4 py-2 rounded border border-gray-800">
                          <Timer size={16} className="text-system-neon" /> 
                          {formatTime(timeUntilDaily)}
                      </div>
                  </div>
              </div>
          </div>
      </motion.div>

      {/* Item Grid */}
      <div id="tut-shop-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
         {items.map(item => (
           <ShopItemCard 
             key={item.id} 
             item={item} 
             currentGold={gold} 
             onPurchase={purchaseItem}
             onRemove={removeItem}
           />
         ))}
         
         {/* Add New Placeholder Card */}
         <button 
           onClick={() => setIsModalOpen(true)}
           className="border-2 border-dashed border-system-border rounded-lg p-6 flex flex-col items-center justify-center text-gray-600 hover:text-system-warning hover:border-system-warning/50 transition-colors min-h-[200px] group"
         >
            <div className="p-4 rounded-full bg-system-card group-hover:bg-system-warning/10 transition-colors mb-3">
               <Plus size={32} />
            </div>
            <span className="font-mono text-sm font-bold">CREATE CUSTOM REWARD</span>
         </button>
      </div>

      {/* Create Reward Modal */}
      <AnimatePresence>
        {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-system-card border border-system-warning/30 w-full max-w-md rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden"
              >
                 <div className="p-6 border-b border-system-border flex justify-between items-center bg-system-warning/5">
                    <h3 className="text-lg font-bold text-system-warning font-mono flex items-center gap-2">
                       <ShoppingBag size={18} /> NEW REWARD
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                       <X size={20} />
                    </button>
                 </div>

                 <div className="p-6 space-y-4">
                    <div>
                       <label className="block text-xs text-gray-500 mb-1 font-mono">REWARD TITLE</label>
                       <input 
                         value={title}
                         onChange={e => setTitle(e.target.value)}
                         placeholder="e.g. Buy a new game"
                         className="w-full bg-system-bg border border-system-border rounded p-2 text-white focus:border-system-warning focus:outline-none placeholder:text-gray-700"
                         autoFocus
                       />
                    </div>

                    <div>
                       <label className="block text-xs text-gray-500 mb-1 font-mono">DESCRIPTION (OPTIONAL)</label>
                       <textarea 
                         value={description}
                         onChange={e => setDescription(e.target.value)}
                         placeholder="Details..."
                         className="w-full bg-system-bg border border-system-border rounded p-2 text-white focus:border-system-warning focus:outline-none h-20 placeholder:text-gray-700"
                       />
                    </div>

                    <div>
                       <label className="block text-xs text-gray-500 mb-1 font-mono">COST (GOLD)</label>
                       <div className="relative">
                          <input 
                            type="number"
                            value={cost}
                            onChange={e => setCost(Number(e.target.value))}
                            className="w-full bg-system-bg border border-system-border rounded p-2 pl-10 text-white focus:border-system-warning focus:outline-none font-mono"
                          />
                          <div className="absolute left-3 top-2.5 text-system-warning">
                             <Coins size={16} />
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
                      disabled={!title || cost <= 0}
                      className="px-6 py-2 bg-system-warning text-black font-bold rounded text-xs font-mono hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      REGISTER REWARD
                    </button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopView;
