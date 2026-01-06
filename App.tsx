
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';
import Layout from './components/Layout';
import Navigation from './components/Navigation';
import EvaluationMatrix from './components/StatsRadar';
import QuestsView from './components/QuestsView';
import ShopView from './components/ShopView';
import SystemMessage from './components/SystemMessage'; 
import ProfileView from './components/ProfileView';
import AuthView from './components/AuthView';
import WelcomeCinematic from './components/WelcomeCinematic';
import SplashScreen from './components/SplashScreen';
import AwakeningView from './components/AwakeningView';
import HealthView from './components/HealthView';
import AdminLogin from './components/AdminLogin'; // New Import
import AdminDashboard from './components/AdminDashboard'; // New Import
import { useSystem } from './hooks/useSystem';
import { PlayerData, Tab } from './types';

// Helper: Modern Continuous Stat Bar
const StatBar: React.FC<{ 
  current: number; 
  max: number; 
  colorClass: string; 
  shadowColor: string;
  label: string;
  isGlitch?: boolean;
}> = ({ current, max, colorClass, shadowColor, label, isGlitch }) => {
  const safeCurrent = Number(current) || 0;
  const safeMax = Number(max) || 1;
  const percentage = Math.min(100, Math.max(0, (safeCurrent / safeMax) * 100));

  return (
    <div className="mb-5 last:mb-0 group">
      <div className="flex justify-between items-end text-[10px] font-mono mb-2 tracking-widest uppercase">
        <span className={`font-bold transition-colors duration-300 ${isGlitch ? "text-system-neon animate-pulse" : "text-gray-500 group-hover:text-gray-300"}`}>
            {label}
        </span>
        <span className="text-gray-400 font-medium group-hover:text-white transition-colors">
            {Math.floor(safeCurrent)} <span className="text-gray-700 text-[8px] mx-0.5">/</span> {safeMax}
        </span>
      </div>
      
      {/* Track */}
      <div className="relative h-2 w-full bg-[#0a0a0a] border border-gray-800/60 rounded-[1px] overflow-hidden">
        {/* Subtle grid pattern in background */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4px_100%]" />

        {/* Fill */}
        <motion.div 
          initial={{ width: "0%" }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          className={`h-full relative ${colorClass}`}
          style={{ boxShadow: `0 0 15px ${shadowColor}` }}
        >
           {/* White leading edge */}
           <div className="absolute top-0 right-0 w-[2px] h-full bg-white/80 shadow-[0_0_8px_white] z-10" />
           
           {/* Shimmer Effect */}
           <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[shimmer_2s_infinite]" />
        </motion.div>
      </div>
      
      {/* Glitch Overlay for XP if close to level up */}
      {isGlitch && (
         <div className="h-[1px] w-full bg-system-neon/40 mt-1 animate-pulse blur-[1px]" />
      )}
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }
      `}</style>
    </div>
  );
};

// Extracted Dashboard Component
const Dashboard: React.FC<{ player: PlayerData; gainXp: (amount: number) => void; completeDaily: () => void }> = ({ player }) => {
  // Check if close to leveling up (> 80%)
  const xpPercentage = Math.min(100, (player.currentXp / player.requiredXp) * 100);
  const isCloseToLevelUp = xpPercentage > 80;

  // Calculate Awakening Progress based on weight
  let weightProgress = 0;
  if (player.healthProfile && player.healthProfile.startingWeight && player.healthProfile.targetWeight) {
      const start = player.healthProfile.startingWeight;
      const target = player.healthProfile.targetWeight;
      const current = player.healthProfile.weight;
      const totalLoss = start - target;
      const currentLoss = start - current;
      if (totalLoss > 0) {
          weightProgress = Math.min(100, Math.max(0, (currentLoss / totalLoss) * 100));
      }
  }

  return (
    <div className="space-y-6 pb-4 md:pb-0">
      {/* SYSTEM STATUS TICKER */}
      <div className="w-full bg-system-card/50 border-y border-system-border py-1 overflow-hidden relative">
         <div className="absolute inset-0 bg-system-neon/5 z-0" />
         <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] font-mono text-[10px] text-system-neon/70 flex gap-10">
            <span>SYSTEM STATUS: ONLINE</span>
            <span>SYNC RATE: {Math.floor(xpPercentage)}%</span>
            <span>ANALYZING BIOMETRICS...</span>
            <span>NO THREATS DETECTED</span>
            <span>CURRENT OBJECTIVE: SURVIVE AND THRIVE</span>
            <span>SYSTEM STATUS: ONLINE</span>
            <span>SYNC RATE: {Math.floor(xpPercentage)}%</span>
            <span>ANALYZING BIOMETRICS...</span>
         </div>
         <style>{`
            @keyframes marquee {
               0% { transform: translateX(0); }
               100% { transform: translateX(-50%); }
            }
         `}</style>
      </div>
      
      {/* PERSONALIZED GREETING */}
      <div className="max-w-6xl mx-auto mb-2 px-2 md:px-0">
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-left"
         >
           <h1 className="text-2xl md:text-4xl font-bold text-white font-mono leading-tight">
             HELLO <span className="text-system-neon">{player.identity ? player.identity.toUpperCase() : player.name.toUpperCase()}</span>.
           </h1>
           <p className="text-gray-500 font-mono text-xs md:text-sm mt-1">
             SYSTEM READY. WHAT IS YOUR COMMAND?
           </p>
         </motion.div>
      </div>

      <div className="flex justify-center px-2 md:px-0">    
        {/* Player Status & Stats - Futuristic Container */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-full max-w-6xl relative p-6 backdrop-blur-xl bg-system-card/40 rounded-lg border border-system-neon/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden group"
        >
            {/* Scanline Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-10 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

            {/* Glowing Corner Brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-system-neon opacity-70 rounded-tl-lg drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-system-accent opacity-70 rounded-br-lg drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-600 opacity-50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-600 opacity-50" />

            {/* Decorative Background Blur */}
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-system-accent/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-system-neon/10 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-sm text-gray-400 mb-6 font-mono flex justify-between items-center tracking-widest border-b border-gray-800 pb-2">
                HUNTER PROFILE
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-system-success rounded-full animate-pulse shadow-[0_0_5px_#10b981]" />
                  <span className="text-[10px] text-system-neon bg-system-neon/5 px-2 py-0.5 rounded border border-system-neon/20">CONNECTED</span>
                </div>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 font-mono">
                  
                  {/* LEFT COLUMN */}
                  <div className="space-y-6">
                      {/* Name and Level Header */}
                      <div className="flex justify-between items-end">
                          <div>
                            <div className="text-[10px] text-gray-500 mb-1 tracking-widest">CODENAME</div>
                            <span className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-md">
                              {player.username ? player.username.toUpperCase() : player.name.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-col items-end">
                               <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-system-neon to-system-accent leading-none filter drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                                 {player.level}
                               </span>
                               <span className="text-[10px] text-system-accent font-bold tracking-[0.2em] mt-1">LEVEL</span>
                            </div>
                          </div>
                      </div>
                      
                      {/* Grid Stats */}
                      <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded border border-gray-800">
                          <div>
                              <div className="text-[10px] text-gray-500 tracking-wider">RANK</div>
                              <div className={`text-lg font-bold ${player.rank === 'S' ? 'text-yellow-400' : 'text-white'}`}>{player.rank}-CLASS</div>
                          </div>
                          <div className="text-right">
                              <div className="text-[10px] text-gray-500 tracking-wider">JOB</div>
                              <div className="text-lg font-bold text-white">{player.job}</div>
                          </div>
                          <div>
                              <div className="text-[10px] text-gray-500 tracking-wider">TITLE</div>
                              <div className="text-xs font-bold text-system-neon">{player.title}</div>
                          </div>
                          <div className="text-right">
                              <div className="text-[10px] text-gray-500 tracking-wider">GOLD</div>
                              <div className="text-xs font-bold text-yellow-500">{player.gold.toLocaleString()} G</div>
                          </div>
                      </div>

                      {/* Modern Stat Bars */}
                      <div className="space-y-2 mt-6">
                        {/* HP and Fatigue Removed as requested */}
                        <StatBar 
                           label={`MP (MANA) ${player.streak > 1 ? `[+${Math.floor(player.streak * 2)} BONUS]` : ''}`}
                           current={player.mp} 
                           max={player.maxMp} 
                           colorClass="bg-blue-600" 
                           shadowColor="rgba(37, 99, 235, 0.4)" 
                        />
                        
                        {/* XP Special Bar */}
                        <div className="mt-6 pt-2 border-t border-dashed border-gray-800/50">
                          <StatBar 
                            label="XP (PROGRESS)" 
                            current={player.currentXp} 
                            max={player.requiredXp} 
                            colorClass="bg-system-neon" 
                            shadowColor="rgba(0, 210, 255, 0.5)"
                            isGlitch={isCloseToLevelUp}
                          />
                          <div className="flex justify-between items-center mt-1 text-[8px] font-mono text-gray-500 uppercase tracking-widest px-0.5">
                             <span>Next: Level {player.level + 1}</span>
                             <span className="text-system-neon">{player.requiredXp - player.currentXp} XP REMAINING</span>
                          </div>
                        </div>

                        {/* Awakening Progress (Only if Profile Exists) */}
                        {player.healthProfile && (
                            <div className="mt-4">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase flex items-center gap-2">
                                        <TrendingUp size={10} /> AWAKENING PROGRESS
                                    </span>
                                    <span className="text-[10px] font-bold text-system-accent">{Math.round(weightProgress)}%</span>
                                </div>
                                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${weightProgress}%` }}
                                        className="h-full bg-system-accent shadow-[0_0_8px_#8b5cf6]"
                                    />
                                </div>
                            </div>
                        )}
                      </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="flex flex-col justify-between">
                      {/* Statistics Evaluation Matrix */}
                      <div className="relative flex-1 min-h-[300px] flex items-center justify-center">
                        <div className="w-full max-w-[350px] aspect-square relative z-10">
                           <EvaluationMatrix stats={player.stats} history={player.history} dailyXp={player.dailyXp || 0} />
                        </div>
                      </div>

                      {/* System Logs */}
                      <div className="border-t border-system-border pt-4 mt-6">
                        <h3 className="text-[10px] text-gray-600 font-mono mb-3 flex items-center gap-2 uppercase tracking-widest">
                          <Zap size={10} /> Recent Logs
                        </h3>
                        <div className="space-y-2 pl-2 border-l border-gray-800">
                          {player.logs && player.logs.slice(0, 4).map((log) => (
                            <div key={log.id} className="text-[10px] font-mono flex gap-3 items-start opacity-90">
                              <span className="text-gray-600 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              <span className={
                                log.type === 'PENALTY' ? "text-red-400" : 
                                log.type === 'LEVEL_UP' ? "text-system-neon" :
                                "text-gray-400"
                              }>
                                {log.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                  </div>
              </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { 
    player, 
    isLoaded, 
    notifications, 
    registerUser, 
    updateProfile, 
    updateAwakening,
    gainXp, 
    completeDaily, 
    addQuest, 
    completeQuest, 
    failQuest,
    failWorkout,
    resetQuest, 
    deleteQuest, 
    purchaseItem, 
    addShopItem, 
    removeShopItem, 
    removeNotification,
    saveHealthProfile,
    completeWorkoutSession,
    logout // Destructured logout
  } = useSystem();

  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [adminMode, setAdminMode] = useState<'NONE' | 'LOGIN' | 'DASHBOARD'>('NONE');
  const [showSplash, setShowSplash] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // Handle Splash Screen
  useEffect(() => {
    // Splash screen handles its own timer and calls onComplete
  }, []);

  // Handle Welcome Cinematic trigger
  useEffect(() => {
     // Show welcome if it's a new user (level 1, no XP) and hasn't seen it in this session/local storage
     if (!showSplash && player.isConfigured && player.level === 1 && player.currentXp === 0 && !localStorage.getItem('welcome_shown')) {
         setShowWelcome(true);
         localStorage.setItem('welcome_shown', 'true');
     }
  }, [showSplash, player.isConfigured, player.level, player.currentXp]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!isLoaded) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center text-system-neon font-mono">
              LOADING SYSTEM...
          </div>
      );
  }

  // --- ADMIN VIEW ROUTING ---
  if (adminMode === 'LOGIN') {
      return (
          <AdminLogin 
            onLoginSuccess={() => setAdminMode('DASHBOARD')}
            onBack={() => setAdminMode('NONE')}
          />
      );
  }

  if (adminMode === 'DASHBOARD') {
      return (
          <AdminDashboard 
            onLogout={() => setAdminMode('NONE')}
          />
      );
  }

  if (!player.isConfigured) {
    return <AuthView onLogin={registerUser} onAdminAccess={() => setAdminMode('LOGIN')} />;
  }

  if (showWelcome) {
     return <WelcomeCinematic username={player.username || player.name} onComplete={() => setShowWelcome(false)} />;
  }

  return (
    <Layout 
       playerLevel={player.level} 
       streak={player.streak}
       navigation={<Navigation activeTab={activeTab} onTabChange={setActiveTab} />}
    >
      <SystemMessage notifications={notifications} removeNotification={removeNotification} />
      
      <AnimatePresence mode="wait">
        {activeTab === 'DASHBOARD' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <Dashboard player={player} gainXp={gainXp} completeDaily={completeDaily} />
          </motion.div>
        )}
        
        {activeTab === 'HEALTH' && (
            <motion.div key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <HealthView 
                  healthProfile={player.healthProfile} 
                  onSaveProfile={saveHealthProfile}
                  onCompleteWorkout={completeWorkoutSession}
                  onFailWorkout={failWorkout}
                  playerData={player}
               />
            </motion.div>
        )}

        {activeTab === 'QUESTS' && (
          <motion.div key="quests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <QuestsView 
                quests={player.quests} 
                addQuest={addQuest} 
                completeQuest={completeQuest} 
                failQuest={failQuest}
                resetQuest={resetQuest}
                deleteQuest={deleteQuest} 
             />
          </motion.div>
        )}

        {activeTab === 'SHOP' && (
          <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <ShopView 
                gold={player.gold} 
                items={player.shopItems} 
                purchaseItem={purchaseItem} 
                addItem={addShopItem}
                removeItem={removeShopItem} 
             />
          </motion.div>
        )}

        {activeTab === 'PROFILE' && (
           <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ProfileView 
                      player={player} 
                      onUpdate={updateProfile} 
                      onAdminRequest={() => setAdminMode('LOGIN')} 
                      onLogout={logout} // Passed logout prop
                  />
                  <AwakeningView data={player.awakening} updateData={updateAwakening} />
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default App;
