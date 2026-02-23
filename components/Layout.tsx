
import React from 'react';
import { User, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { SystemCoin } from './icons/SystemCoin';
import { SystemKey } from './icons/SystemKey';

interface LayoutProps {
  children: React.ReactNode;
  navigation?: React.ReactNode;
  playerLevel?: number;
  streak?: number;
  gold?: number;
  keys?: number;
  currentXp?: number;
  requiredXp?: number;
  username?: string;
  avatarUrl?: string;
  totalXp?: number;
  onGoldClick?: () => void;
  hideHeader?: boolean;
  headerDisabled?: boolean;
  desktopBackgroundImage?: string;
  mobileBackgroundImage?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  navigation, 
  gold = 0, 
  keys = 0, 
  username = "Hunter",
  avatarUrl,
  onGoldClick, 
  hideHeader = false,
  headerDisabled = false,
}) => {

  const getValueSizeClass = (value: number) => {
      const valStr = Math.round(value).toString();
      if (valStr.length > 6) return 'text-xs';
      return 'text-sm';
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#85D3E0] selection:text-black overflow-x-hidden">
      
      {/* Main Content Area */}
      <div className={`relative z-10 ${navigation ? 'pb-32' : ''}`}>
        
        {/* Minimalist Reference Header */}
        {!hideHeader && (
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md pt-safe-top">
               <div className="max-w-md mx-auto px-6 py-4 flex justify-between items-center">
                   
                   {/* Profile / Greeting */}
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2C2C2E] overflow-hidden border border-[#333]">
                          {avatarUrl ? (
                              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                  <User size={20} className="text-gray-400" />
                              </div>
                          )}
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">HELLO</span>
                          <span className="text-sm font-black text-white uppercase">{username}</span>
                      </div>
                   </div>
                   
                   {/* Resources / Notification */}
                   <div className="flex items-center gap-4">
                      {/* Gold */}
                      <button 
                          onClick={headerDisabled ? undefined : onGoldClick}
                          disabled={headerDisabled}
                          className="flex items-center gap-1.5 bg-[#1C1C1E] px-3 py-1.5 rounded-full hover:bg-[#2C2C2E] transition-colors"
                      >
                          <SystemCoin size={16} />
                          <span id="user-wallet-balance" className={`font-bold ${getValueSizeClass(gold)}`}>{Math.round(gold).toLocaleString()}</span>
                      </button>

                      {/* Keys */}
                      <div className="flex items-center gap-1.5 bg-[#1C1C1E] px-3 py-1.5 rounded-full">
                          <SystemKey size={16} />
                          <span className={`font-bold ${getValueSizeClass(keys)}`}>{Math.round(keys).toLocaleString()}</span>
                      </div>

                      {/* Notification Bell (Visual Only for Ref) */}
                      <div className="w-10 h-10 rounded-full bg-[#1C1C1E] flex items-center justify-center relative">
                          <Bell size={18} className="text-gray-300" />
                          <div className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full" />
                      </div>
                   </div>
               </div>
            </header>
        )}

        <main className={`max-w-md mx-auto w-full px-4 ${!hideHeader ? 'pt-24' : ''}`}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Render Navigation (Bottom) */}
      {navigation}
    </div>
  );
};

export default Layout;
