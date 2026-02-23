
import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Gamepad2, Pizza, Tv, Moon, Users, Star, Lock, Trash2,
  Coffee, Music, Smartphone, Plane, Car, Home, Gift, Zap, Heart, Smile, 
  Trophy, Crown, Cpu, Shirt, Watch, Headphones, Beer, Utensils, 
  MonitorPlay, Clapperboard, Ghost, Key 
} from 'lucide-react';
import { ShopItem } from '../types';

interface ShopItemCardProps {
  item: ShopItem;
  currentGold: number;
  onPurchase: (item: ShopItem) => void;
  onRemove: (id: string) => void;
}

// Vast Icon Mapper
const getIcon = (iconName: string, className: string = "") => {
  const props = { size: 60, className }; // Reduced size to 60px
  switch (iconName) {
    case 'gamepad': return <Gamepad2 {...props} />;
    case 'pizza': return <Pizza {...props} />;
    case 'coffee': return <Coffee {...props} />;
    case 'beer': return <Beer {...props} />;
    case 'utensils': return <Utensils {...props} />;
    case 'tv': return <Tv {...props} />;
    case 'music': return <Music {...props} />;
    case 'headphones': return <Headphones {...props} />;
    case 'clapperboard': return <Clapperboard {...props} />;
    case 'monitor-play': return <MonitorPlay {...props} />;
    case 'smartphone': return <Smartphone {...props} />;
    case 'cpu': return <Cpu {...props} />;
    case 'moon': return <Moon {...props} />;
    case 'zap': return <Zap {...props} />;
    case 'shirt': return <Shirt {...props} />;
    case 'watch': return <Watch {...props} />;
    case 'gift': return <Gift {...props} />;
    case 'shopping-bag': return <ShoppingBag {...props} />;
    case 'heart': return <Heart {...props} />;
    case 'smile': return <Smile {...props} />;
    case 'users': return <Users {...props} />;
    case 'trophy': return <Trophy {...props} />;
    case 'crown': return <Crown {...props} />;
    case 'plane': return <Plane {...props} />;
    case 'car': return <Car {...props} />;
    case 'home': return <Home {...props} />;
    case 'ghost': return <Ghost {...props} />;
    case 'key': return <Key {...props} />;
    default: return <Star {...props} />;
  }
};

const ShopItemCard: React.FC<ShopItemCardProps> = ({ item, currentGold, onPurchase, onRemove }) => {
  const canAfford = currentGold >= item.cost;
  
  // Colors for dynamic border SVG
  const borderColorClass = canAfford ? 'bg-system-warning' : 'bg-white/10';
  const strokeColorClass = canAfford ? 'text-system-warning' : 'text-gray-600';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative mt-12 w-full"
    >
        {/* Floating Icon Container - FIXED POSITION at 38% */}
        <motion.div 
            className={`
                absolute -top-10 left-[38%] -translate-x-1/2 w-20 h-20 rounded-2xl 
                flex items-center justify-center z-20 shadow-xl backdrop-blur-md
                ${canAfford 
                    ? 'bg-black/60 border border-system-warning/50 shadow-system-warning/20' 
                    : 'bg-black/60 border border-white/10 grayscale opacity-70'}
            `}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
                boxShadow: canAfford ? '0 10px 30px -5px rgba(245, 158, 11, 0.3)' : '0 10px 20px -5px rgba(0,0,0,0.5)',
            }}
        >
            {/* Inner highlight for 3D effect */}
            <div className="absolute inset-0 rounded-2xl border-t border-l border-white/20 pointer-events-none" />
            
            {/* The Icon */}
            {getIcon(item.icon, canAfford ? "text-system-warning drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" : "text-gray-500")}
        </motion.div>

        {/* Main Card Body */}
        <div 
            className={`
                relative pt-14 pb-5 px-3 rounded-xl flex flex-col justify-between h-full group overflow-visible w-full glass-card
                ${canAfford ? 'border-system-warning/30 hover:border-system-warning' : ''}
            `}
            style={{
                // Create the hole for the depression - MOVED TO 50%
                maskImage: 'radial-gradient(circle at 50% 0, transparent 42px, black 42.5px)',
                WebkitMaskImage: 'radial-gradient(circle at 50% 0, transparent 42px, black 42.5px)'
            }}
        >
            {/* --- CUSTOM TOP BORDER WITH DEPRESSION --- */}
            <div className="absolute top-0 left-0 w-full h-12 pointer-events-none overflow-visible">
                {/* Left Line - Adjusted for 50% center */}
                <div className={`absolute top-0 left-0 w-[50%] -mr-[42px] h-[1px] ${borderColorClass} opacity-30 group-hover:opacity-100 transition-opacity rounded-tl-xl`} style={{ right: 'auto', width: 'calc(50% - 42px)' }} />
                {/* Right Line - Adjusted for 50% center */}
                <div className={`absolute top-0 right-0 w-[50%] -ml-[42px] h-[1px] ${borderColorClass} opacity-30 group-hover:opacity-100 transition-opacity rounded-tr-xl`} style={{ left: 'auto', width: 'calc(50% - 42px)' }} />
                
                {/* Center Curve SVG - Positioned at 50% */}
                <div className="absolute top-0 left-[50%] -translate-x-1/2 w-[84px] h-[30px]">
                    <svg width="84" height="30" viewBox="0 0 84 30" fill="none" className="overflow-visible">
                       {/* The dip curve */}
                       <path 
                         d="M 0 0 Q 42 40 84 0" 
                         stroke="currentColor" 
                         strokeWidth="1" 
                         fill="none" 
                         className={`${strokeColorClass} opacity-30 group-hover:opacity-100 transition-opacity`}
                       />
                    </svg>
                </div>
            </div>

            {/* Top Right: Delete Action */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                }}
                className="absolute top-2 right-2 text-gray-700 hover:text-system-danger transition-colors p-1.5 z-30"
                title="Remove Item"
            >
                <Trash2 size={14} />
            </button>

            {/* Price Tag */}
            <div className="flex justify-center mb-2">
                <span className={`font-mono font-bold text-sm ${canAfford ? 'text-system-warning' : 'text-gray-500'}`}>
                    {item.cost} G
                </span>
            </div>

            <div className="text-center mb-4">
                <h3 className="font-bold text-gray-200 text-sm mb-1 font-mono uppercase tracking-tight leading-tight">{item.title}</h3>
                {item.description && (
                    <p className="text-[10px] text-gray-500 leading-snug line-clamp-2 font-mono">{item.description}</p>
                )}
            </div>

            <button 
                onClick={() => onPurchase(item)}
                disabled={!canAfford}
                className={`w-full py-2.5 px-3 rounded-lg font-mono text-[10px] font-bold tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-95 uppercase
                ${canAfford 
                    ? 'bg-system-warning text-black hover:bg-white hover:shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                    : 'bg-black/40 text-gray-600 cursor-not-allowed border border-white/5'
                }`}
            >
                {canAfford ? (
                'BUY'
                ) : (
                <>
                    <Lock size={10} /> LOCKED
                </>
                )}
            </button>
        </div>
    </motion.div>
  );
};

export default ShopItemCard;
