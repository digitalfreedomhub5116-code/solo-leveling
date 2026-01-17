import React from 'react';
import { Shield, Flame, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  navigation?: React.ReactNode;
  playerLevel?: number;
  streak?: number;
  gold?: number;
  onGoldClick?: () => void;
  hideHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, navigation, playerLevel = 1, streak = 0, gold = 0, onGoldClick, hideHeader = false }) => {
  const isShadowMonarch = playerLevel >= 10;

  return (
    <div className="min-h-screen bg-system-bg text-gray-200 font-sans selection:bg-system-accent selection:text-white overflow-x-hidden">
      
      {/* Background ambient glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-system-accent/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-system-neon/10 rounded-full blur-[100px]" />
        
        {/* SHADOW EASTER EGG: Smoke Effect for Level 10+ */}
        {isShadowMonarch && (
           <div className="absolute inset-0 opacity-30 mix-blend-screen">
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent animate-pulse" />
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-200 animate-[pulse_5s_ease-in-out_infinite]" />
           </div>
        )}
      </div>

      {/* Render Navigation (Fixed Position) */}
      {navigation}

      {/* Main Content Area */}
      {/* Added md:pl-64 for desktop sidebar and pb-24 for mobile bottom bar spacing */}
      <div className="relative z-10 md:pl-64 pb-24 md:pb-6 transition-all duration-300">
        <main className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col min-h-screen">
          
          {/* Top Bar Status - SCROLLS WITH PAGE */}
          {!hideHeader && (
              <header className="flex justify-between items-center mb-8 py-2 border-b border-system-border/50 px-2 relative">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Shield className={`w-5 h-5 ${isShadowMonarch ? 'text-system-accent' : 'text-system-neon'} animate-pulse`} />
                        <span className={`font-mono text-xs ${isShadowMonarch ? 'text-system-accent' : 'text-system-neon'} tracking-widest hidden sm:inline`}>
                          {isShadowMonarch ? 'SHADOW MONARCH' : 'SYSTEM ONLINE'}
                        </span>
                    </div>
                    
                    {/* Streak Counter */}
                    {streak > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-900/20 border border-orange-500/30 text-orange-500">
                         <Flame size={12} className="fill-orange-500 animate-pulse" />
                         <span className="text-[10px] font-mono font-bold">{streak} DAY STREAK</span>
                      </div>
                    )}
                 </div>
                 
                 {/* Gold Counter - Scrollable */}
                 <button 
                    onClick={onGoldClick}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:bg-yellow-500/20 hover:border-yellow-500/40 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-all duration-300 group active:scale-95 backdrop-blur-md"
                 >
                    <Coins size={18} className="fill-yellow-500/20 group-hover:scale-110 transition-transform" />
                    {/* Added ID here for the animation target */}
                    <span id="user-wallet-balance" className="font-mono text-sm md:text-lg font-black tabular-nums tracking-wide leading-none">{gold.toLocaleString()} G</span>
                 </button>
              </header>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;