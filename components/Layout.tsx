import React from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  navigation?: React.ReactNode;
  playerLevel?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, navigation, playerLevel = 1 }) => {
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
          
          {/* Top Bar Status */}
          <header className="flex justify-between items-center mb-8 py-2 border-b border-system-border/50 backdrop-blur-sm sticky top-0 z-30 bg-system-bg/80 px-2">
             <div className="flex items-center gap-2">
                <Shield className={`w-5 h-5 ${isShadowMonarch ? 'text-system-accent' : 'text-system-neon'} animate-pulse`} />
                <span className={`font-mono text-xs ${isShadowMonarch ? 'text-system-accent' : 'text-system-neon'} tracking-widest`}>
                  {isShadowMonarch ? 'SHADOW MONARCH' : 'SYSTEM ONLINE'}
                </span>
             </div>
             <div className="font-mono text-xs text-gray-500">
                BIO-SYNC OS v1.0
             </div>
          </header>

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