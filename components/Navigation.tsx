import React from 'react';
import { LayoutDashboard, Sword, ShoppingCart, User, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tab, NavItem } from '../types';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems: NavItem[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'HEALTH', label: 'Health', icon: <Activity size={20} /> },
    { id: 'QUESTS', label: 'Quests', icon: <Sword size={20} /> },
    { id: 'SHOP', label: 'Shop', icon: <ShoppingCart size={20} /> },
    { id: 'PROFILE', label: 'ID Card', icon: <User size={20} /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.nav 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-black/90 backdrop-blur-xl border-r border-system-border flex-col z-40 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
      >
        <div className="p-8 border-b border-system-border/50">
          <h1 className="text-xl font-bold tracking-tighter text-white flex items-center gap-2">
            <span className="text-system-accent">BIO-SYNC</span> OS
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-mono">SYSTEM VER 1.0</p>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 relative group overflow-hidden ${
                activeTab === item.id 
                  ? 'text-white bg-system-accent/10 border border-system-accent/20' 
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className={`relative z-10 transition-colors ${activeTab === item.id ? 'text-system-neon' : ''}`}>
                {item.icon}
              </div>
              <span className="font-mono text-sm tracking-wide relative z-10">{item.label}</span>
              
              {/* Active Glow Bar */}
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-nav-glow"
                  className="absolute left-0 top-0 w-1 h-full bg-system-neon shadow-[0_0_10px_#00d2ff]"
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-system-border/50 space-y-2">
           <div className="text-xs text-gray-600 font-mono text-center pt-2">
              SYSTEM ONLINE
           </div>
        </div>
      </motion.nav>

      {/* Mobile Bottom Bar */}
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-black/95 backdrop-blur-xl border-t border-system-border z-40 flex justify-around items-center px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]"
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative ${
              activeTab === item.id ? 'text-system-neon' : 'text-gray-500'
            }`}
          >
            <div className={`${activeTab === item.id ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
                {item.icon}
            </div>
            <span className="text-[10px] font-mono mt-1">{item.label}</span>
            {activeTab === item.id && (
               <motion.div 
                 layoutId="active-mobile-glow"
                 className="absolute -bottom-1 w-1/2 h-0.5 bg-system-neon shadow-[0_0_10px_#00d2ff]"
               />
            )}
          </button>
        ))}
      </motion.nav>
    </>
  );
};

export default Navigation;