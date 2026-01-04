import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Plus, ShoppingBag, X } from 'lucide-react';
import { ShopItem } from '../types';
import ShopItemCard from './ShopItemCard';

interface ShopViewProps {
  gold: number;
  items: ShopItem[];
  purchaseItem: (item: ShopItem) => void;
  addItem: (item: ShopItem) => void;
  removeItem: (id: string) => void;
}

const ShopView: React.FC<ShopViewProps> = ({ gold, items, purchaseItem, addItem, removeItem }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<number>(100);

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

  return (
    <div className="space-y-6">
      {/* Header with Gold Balance */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-system-border pb-4 sticky top-0 bg-system-bg/95 backdrop-blur z-20 pt-2">
         <div>
           <h2 className="text-2xl font-bold text-white font-mono tracking-tighter flex items-center gap-2">
             SYSTEM SHOP
           </h2>
           <p className="text-xs text-gray-500 font-mono">EXCHANGE CURRENCY FOR REWARDS</p>
         </div>

         <div className="flex items-center gap-4">
             {/* Gold Display */}
             <div className="flex items-center gap-3 bg-system-warning/10 border border-system-warning/30 px-4 py-2 rounded-lg">
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

      {/* Item Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
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