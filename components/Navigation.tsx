
import React from 'react';
import { LayoutGrid, Activity, Swords, ShoppingBag, Users } from 'lucide-react'; 
import { motion } from 'framer-motion';
import { Tab } from '../types';
import SystemGlitchBadge from './SystemGlitchBadge';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  badges?: Record<string, boolean>;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, badges = {} }) => {
  const navItems: { id: Tab; icon: any }[] = [
    { id: 'DASHBOARD', icon: LayoutGrid }, // Home
    { id: 'HEALTH', icon: Activity },      // Activity/Stats
    { id: 'QUESTS', icon: Swords },        // Workouts
    { id: 'ARMORY', icon: ShoppingBag },   // Shop
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.nav 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto bg-[#1C1C1E] border border-white/10 rounded-full px-2 py-2 shadow-2xl flex items-center gap-1 max-w-sm w-full justify-between"
      >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const showBadge = badges[item.id];

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300"
              >
                {/* Active Indicator Background */}
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-[#D4C4FA] rounded-full" // Pastel Purple active state
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                {/* Icon */}
                <div className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-black' : 'text-gray-500'}`}>
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    {showBadge && <SystemGlitchBadge className="-top-1 -right-1" />}
                </div>
              </button>
            );
          })}
          
          {/* Alliance as 5th item */}
           <button
                onClick={() => onTabChange('ALLIANCE')}
                className="relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300"
              >
                {activeTab === 'ALLIANCE' && (
                  <motion.div 
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-[#D4C4FA] rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 transition-colors duration-200 ${activeTab === 'ALLIANCE' ? 'text-black' : 'text-gray-500'}`}>
                    <Users size={24} strokeWidth={activeTab === 'ALLIANCE' ? 2.5 : 2} />
                </div>
            </button>

      </motion.nav>
    </div>
  );
};

export default Navigation;
