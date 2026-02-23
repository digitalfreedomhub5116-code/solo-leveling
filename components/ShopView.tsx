
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, ShoppingBag, X, Ghost, Timer, Gift, ChevronLeft, ChevronRight, Zap, TrendingUp, Sparkles, Lock,
  Gamepad2, Pizza, Coffee, Beer, Utensils, Tv, Music, Headphones, Clapperboard, MonitorPlay, Smartphone, 
  Cpu, Moon, Shirt, Watch, Heart, Smile, Users, Trophy, Crown, Plane, Car, Home, Star 
} from 'lucide-react';
import { ShopItem } from '../types';
import ShopItemCard from './ShopItemCard';
import PurchaseCelebration from './PurchaseCelebration';
import { SystemCoin } from './icons/SystemCoin';
import { SystemKey } from './icons/SystemKey';

interface ShopViewProps {
  gold: number;
  items: ShopItem[];
  purchaseItem: (item: ShopItem) => void;
  addItem: (item: ShopItem) => void;
  removeItem: (id: string) => void;
  keys?: number;
  lastDungeonEntry?: number;
  onStartDungeon?: (isFree: boolean) => void;
  onToggleNav?: (visible: boolean) => void;
}

const ICON_OPTIONS = [
  { id: 'star', icon: Star },
  { id: 'gamepad', icon: Gamepad2 },
  { id: 'pizza', icon: Pizza },
  { id: 'coffee', icon: Coffee },
  { id: 'beer', icon: Beer },
  { id: 'utensils', icon: Utensils },
  { id: 'tv', icon: Tv },
  { id: 'music', icon: Music },
  { id: 'headphones', icon: Headphones },
  { id: 'clapperboard', icon: Clapperboard },
  { id: 'monitor-play', icon: MonitorPlay },
  { id: 'smartphone', icon: Smartphone },
  { id: 'cpu', icon: Cpu },
  { id: 'moon', icon: Moon },
  { id: 'zap', icon: Zap },
  { id: 'shirt', icon: Shirt },
  { id: 'watch', icon: Watch },
  { id: 'gift', icon: Gift },
  { id: 'shopping-bag', icon: ShoppingBag },
  { id: 'heart', icon: Heart },
  { id: 'smile', icon: Smile },
  { id: 'users', icon: Users },
  { id: 'trophy', icon: Trophy },
  { id: 'crown', icon: Crown },
  { id: 'plane', icon: Plane },
  { id: 'car', icon: Car },
  { id: 'home', icon: Home },
  { id: 'ghost', icon: Ghost },
  { id: 'key', icon: SystemKey }, 
];

const ShopView: React.FC<ShopViewProps> = ({ 
    gold, 
    items, 
    purchaseItem, 
    addItem, 
    removeItem, 
    keys = 0, 
    lastDungeonEntry = 0, 
    onStartDungeon,
    onToggleNav 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<number>(100);
  const [selectedIcon, setSelectedIcon] = useState('star');
  
  const [timeUntilFree, setTimeUntilFree] = useState<number>(0);
  const [purchasedItem, setPurchasedItem] = useState<ShopItem | null>(null);

  // --- NAVIGATION CONTROL ---
  useEffect(() => {
      if (onToggleNav) {
          onToggleNav(!isModalOpen && !purchasedItem);
      }
      return () => {
          if (onToggleNav) onToggleNav(true);
      }
  }, [isModalOpen, purchasedItem, onToggleNav]);

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

  const handleCreate = () => {
    if (!title || cost <= 0) return;

    const newItem: ShopItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      cost,
      icon: selectedIcon
    };

    addItem(newItem);
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setCost(100);
    setSelectedIcon('star');
  };

  const handlePurchase = (item: ShopItem) => {
      if (gold >= item.cost) {
          purchaseItem(item);
          setPurchasedItem(item);
      }
  };

  const isFreeReady = timeUntilFree <= 0;
  const canAffordPaid = keys >= 3;

  return (
    <div className="w-full max-w-6xl mx-auto pb-24 px-4 md:px-0">
        <AnimatePresence>
            {purchasedItem && (
                <PurchaseCelebration item={purchasedItem} onClose={() => setPurchasedItem(null)} />
            )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-800 pb-6 gap-4">
            <div>
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                    REWARDS
                </h1>
                <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
                    Convert Discipline into Dopamine
                </p>
            </div>
            
            <div className="flex gap-6">
                <div className="text-right">
                    <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Treasury</div>
                    <div className="text-2xl font-black text-yellow-500 font-mono flex items-center justify-end gap-2">
                        {Math.round(gold).toLocaleString()} <SystemCoin size={20} />
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Keys</div>
                    <div className="text-2xl font-black text-purple-500 font-mono flex items-center justify-end gap-2">
                        {Math.round(keys)} <SystemKey size={20} />
                    </div>
                </div>
            </div>
        </div>

        {/* Dungeon Widget */}
        {onStartDungeon && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="w-full relative rounded-xl overflow-hidden group shadow-[0_0_30px_rgba(220,38,38,0.3)] border border-red-900/50">
                    {/* Background Image - Fitted Fully (Height Auto) */}
                    <img 
                        src="https://res.cloudinary.com/dcnqnbvp0/image/upload/v1771066637/Image_202602141625_tlkmvf.jpg" 
                        alt="Dungeon Tower" 
                        className="w-full h-auto block"
                    />
                    
                    {/* Gradient Overlay for buttons visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

                    {/* Reset Timer Badge (Top Right) */}
                    {!isFreeReady && (
                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono font-bold tracking-widest shadow-lg z-20">
                            <Timer size={14} className="animate-pulse" />
                            <span>
                                {Math.floor(timeUntilFree / (1000 * 60 * 60))}H {Math.floor((timeUntilFree % (1000 * 60 * 60)) / (1000 * 60))}M
                            </span>
                        </div>
                    )}

                    {/* Buttons Container (Bottom) - Small & Side-by-Side */}
                    <div className="absolute bottom-0 w-full p-6 flex justify-center items-center gap-4 z-20">
                        {/* Free Entry */}
                        <button 
                            onClick={() => onStartDungeon(true)}
                            disabled={!isFreeReady}
                            className={`px-5 py-2.5 rounded-lg font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all shadow-lg flex items-center justify-center gap-2 backdrop-blur-sm
                                ${isFreeReady 
                                    ? 'bg-red-600 text-white hover:bg-white hover:text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
                                    : 'bg-gray-900/90 text-gray-500 cursor-not-allowed border border-gray-800'
                                }
                            `}
                        >
                            {isFreeReady ? (
                                <>
                                    <Zap size={14} fill="currentColor" /> PLAY FREE
                                </>
                            ) : (
                                <>
                                    <Lock size={12} /> COOLING DOWN
                                </>
                            )}
                        </button>

                        {/* Paid Entry */}
                        <button 
                            onClick={() => onStartDungeon(false)}
                            disabled={!canAffordPaid}
                            className={`px-5 py-2.5 rounded-lg font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all shadow-lg flex items-center justify-center gap-2 backdrop-blur-sm
                                ${canAffordPaid 
                                    ? 'bg-purple-600 text-white hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                                    : 'bg-gray-900/90 text-gray-500 cursor-not-allowed border border-gray-800'
                                }
                            `}
                        >
                            <SystemKey size={14} /> 3 KEYS
                        </button>
                    </div>
                </div>
            </motion.div>
        )}

        {/* Shop Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            
            {/* Create Card */}
            <motion.button
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="aspect-[4/5] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center gap-4 group hover:border-system-neon/50 hover:bg-system-neon/5 transition-all mt-12"
            >
                <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center group-hover:bg-system-neon group-hover:text-black transition-colors">
                    <Plus size={32} />
                </div>
                <span className="text-xs font-bold text-gray-500 group-hover:text-system-neon tracking-widest uppercase">
                    Add Reward
                </span>
            </motion.button>

            {items.map((item) => (
                <ShopItemCard 
                    key={item.id}
                    item={item}
                    currentGold={gold}
                    onPurchase={handlePurchase}
                    onRemove={removeItem}
                />
            ))}
        </div>

        {/* Create Modal */}
        <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[#0a0a0a] border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Create Reward</h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                        </div>

                        <div className="space-y-4">
                            <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Reward Title"
                                className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white text-sm focus:border-system-neon outline-none"
                            />
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description (Optional)"
                                className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white text-sm focus:border-system-neon outline-none h-20 resize-none"
                            />
                            
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Cost (Gold)</label>
                                <input 
                                    type="number"
                                    value={cost}
                                    onChange={(e) => setCost(Number(e.target.value))}
                                    className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white text-sm focus:border-system-neon outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Icon</label>
                                <div className="grid grid-cols-6 gap-2 h-32 overflow-y-auto custom-scrollbar p-1">
                                    {ICON_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSelectedIcon(opt.id)}
                                            className={`p-2 rounded border flex items-center justify-center transition-colors ${selectedIcon === opt.id ? 'bg-system-neon text-black border-system-neon' : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-white'}`}
                                        >
                                            <opt.icon size={16} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleCreate}
                                disabled={!title || cost <= 0}
                                className="w-full py-4 bg-system-neon text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all disabled:opacity-50"
                            >
                                Add to Shop
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
