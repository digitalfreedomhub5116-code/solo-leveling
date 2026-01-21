
import React from 'react';
import { LayoutDashboard, Sword, Gift, TrendingUp, Activity, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tab, NavItem } from '../types';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems: NavItem[] = [
    { id: 'DASHBOARD', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { id: 'HEALTH', label: 'Health', icon: <Activity size={20} /> },
    { id: 'QUESTS', label: 'Quests', icon: <Sword size={20} /> },
    { id: 'REWARDS', label: 'Rewards', icon: <Gift size={20} /> },
    { id: 'RANKING', label: 'Rank', icon: <Trophy size={20} /> },
    { id: 'GROWTH', label: 'Growth', icon: <TrendingUp size={20} /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.nav 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-black/95 backdrop-blur-xl border-r border-gray-800 flex-col z-40"
      >
        <div className="p-8 border-b border-gray-800/50">
          <h1 className="text-xl font-bold tracking-tighter text-white flex items-center gap-2">
            <span className="text-system-accent">BIO-SYNC</span>
          </h1>
          <p className="text-[10px] text-gray-500 mt-1 font-mono tracking-[0.2em]">OPERATING SYSTEM</p>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tut-nav-${item.id.toLowerCase()}`}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 relative group overflow-hidden ${
                  isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-desktop"
                    className="absolute inset-0 bg-gray-800/50 border border-gray-700/50 rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-system-neon' : ''}`}>
                  {item.icon}
                </div>
                <span className="font-mono text-sm tracking-wide relative z-10 font-medium">{item.label}</span>
                
                {isActive && (
                   <motion.div 
                     layoutId="active-indicator"
                     className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-system-neon rounded-r-full shadow-[0_0_10px_#00d2ff]"
                   />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6 border-t border-gray-800/50">
           <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono">
              <div className="w-1.5 h-1.5 bg-system-success rounded-full animate-pulse" />
              SYSTEM ONLINE
           </div>
        </div>
      </motion.nav>

      {/* Mobile Bottom Bar */}
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="md:hidden fixed bottom-4 left-2 right-2 z-40 pointer-events-none"
      >
        <div
          className="h-16 bg-[#0a0a0a]/95 backdrop-blur-xl border border-gray-800 rounded-2xl grid grid-cols-6 items-center shadow-2xl pointer-events-auto px-1"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isQuest = item.id === 'QUESTS';

            return (
              <button
                key={item.id}
                id={`tut-nav-${item.id.toLowerCase()}-mob`}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center justify-center h-full relative"
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-mobile"
                    className="absolute inset-x-0.5 inset-y-1 bg-gray-800/60 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <div className={`relative z-10 transition-all duration-300 ${isActive ? 'text-system-neon -translate-y-2' : 'text-gray-500'} ${isQuest && isActive ? 'drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]' : ''}`}>
                    {item.icon}
                </div>
                
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-1.5 text-[8px] font-mono text-system-neon font-bold tracking-tight"
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
};

export default Navigation;
