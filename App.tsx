
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, TrendingUp, Cpu, Scan, User, Shield, LogOut, Terminal } from 'lucide-react';
import Layout from './components/Layout';
import Navigation from './components/Navigation';
import EvaluationMatrix from './components/StatsRadar';
import QuestsView from './components/QuestsView';
import ShopView from './components/ShopView';
import SystemMessage from './components/SystemMessage'; 
import GrowthView from './components/GrowthView'; // Changed from ProfileView
import AuthView from './components/AuthView';
import SplashScreen from './components/SplashScreen';
import HealthView from './components/HealthView';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import PenaltyZone from './components/PenaltyZone';
import TutorialOverlay from './components/TutorialOverlay';
import RankingView from './components/RankingView'; // New Import
import { useSystem } from './hooks/useSystem';
import { PlayerData, Tab, CoreStats } from './types';

// Animation Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
};

// Helper: Modern Segmented Stat Bar
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
  
  // Flash logic on increase
  const [flash, setFlash] = useState(false);
  const prevVal = useRef(safeCurrent);
  
  useEffect(() => {
    if (safeCurrent > prevVal.current) {
        setFlash(true);
        const timer = setTimeout(() => setFlash(false), 400);
        return () => clearTimeout(timer);
    }
    prevVal.current = safeCurrent;
  }, [safeCurrent]);

  const segments = 24; // Number of distinct cells
  const percentage = Math.min(100, Math.max(0, (safeCurrent / safeMax) * 100));
  const filledSegments = Math.ceil((percentage / 100) * segments);

  return (
    <motion.div variants={staggerItem} className="mb-6 last:mb-0 group">
      <style>{`
         @keyframes flow-bar {
           0% { transform: translateX(-100%) skewX(-20deg); }
           30% { transform: translateX(300%) skewX(-20deg); }
           100% { transform: translateX(300%) skewX(-20deg); }
         }
       `}</style>

      <div className="flex justify-between items-end text-[10px] font-mono mb-2 tracking-widest uppercase">
        <span className={`font-bold transition-colors duration-200 ${flash || isGlitch ? "text-white animate-pulse" : "text-gray-500 group-hover:text-gray-300"}`}>
            {label}
        </span>
        <span className={`font-medium transition-colors duration-200 ${flash ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
            {Math.floor(safeCurrent)} <span className="text-gray-700 text-[8px] mx-0.5">/</span> {safeMax}
        </span>
      </div>
      
      {/* Segmented Track */}
      <div className="relative h-3.5 w-full flex gap-[2px]">
        {Array.from({ length: segments }).map((_, i) => {
           const isFilled = i < filledSegments;
           return (
             <div 
               key={i} 
               className={`
                 relative flex-1 h-full rounded-[1px] transition-all duration-300
                 ${isFilled ? colorClass : 'bg-gray-900 border border-gray-800/60'}
                 ${flash && isFilled ? 'brightness-200 bg-white shadow-[0_0_15px_white]' : ''}
               `}
               style={{ 
                 boxShadow: isFilled && !flash ? `0 0 8px ${shadowColor}` : 'none',
                 opacity: isFilled ? 1 : 0.3
               }}
             >
                {/* Inner shine for filled segments */}
                {isFilled && !flash && (
                   <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-60" />
                )}
             </div>
           );
        })}

        {/* Flowing Light Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[1px] mix-blend-overlay">
           <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[flow-bar_4s_infinite_ease-in-out]" />
        </div>
      </div>
    </motion.div>
  );
};

// Dashboard Content Component
const DashboardView: React.FC<{ 
  player: PlayerData;
  onLogout: () => void;
  onAdminRequest: () => void;
}> = ({ player, onLogout, onAdminRequest }) => {
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

  const statIcons: Record<keyof CoreStats, React.ReactNode> = {
    strength: <Zap size={14} />,
    intelligence: <Cpu size={14} />,
    focus: <Scan size={14} />,
    social: <User size={14} />,
    willpower: <Shield size={14} />,
  };

  return (
    <div className="space-y-6 pb-4 md:pb-0">
      {/* SYSTEM STATUS TICKER */}
      <div className="w-full bg-system-card/30 border-y border-system-border/50 py-1.5 overflow-hidden relative backdrop-blur-sm">
         <div className="whitespace-nowrap animate-[marquee_30s_linear_infinite] font-mono text-[10px] text-system-neon/50 flex gap-16">
            <span>SYSTEM STATUS: ONLINE</span>
            <span>SYNC RATE: {Math.floor(xpPercentage)}%</span>
            <span>NO THREATS DETECTED</span>
            <span>OBJECTIVE: SURVIVE</span>
            <span>SYSTEM STATUS: ONLINE</span>
            <span>SYNC RATE: {Math.floor(xpPercentage)}%</span>
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
           variants={staggerItem}
           initial="hidden"
           animate="show"
           className="text-left"
         >
           <h1 className="text-2xl md:text-4xl font-bold text-white font-mono leading-tight tracking-tight">
             WELCOME, <span className="text-system-neon">{player.identity ? player.identity.toUpperCase() : player.name.toUpperCase()}</span>.
           </h1>
         </motion.div>
      </div>

      {/* --- SECTION 1: EVALUATION MATRIX & ATTRIBUTES --- */}
      <div className="flex justify-center px-2 md:px-0">
        <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="w-full max-w-6xl relative p-6 backdrop-blur-xl bg-system-card/40 rounded-xl border border-system-border/50 shadow-[0_0_40px_rgba(0,0,0,0.4)] overflow-hidden group hover:border-system-border transition-colors duration-500"
        >
             {/* Glowing Corner Brackets (Top) */}
             <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-system-neon/50 rounded-tl-lg" />
             <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-system-neon/50 rounded-tr-lg" />

             <div className="relative z-10 flex flex-col lg:flex-row gap-6">
                 {/* RADAR COLUMN */}
                 <div className="flex-1">
                     <div className="flex justify-between items-center mb-4 border-b border-gray-800/50 pb-4">
                        <h2 className="text-sm text-gray-400 font-mono tracking-widest flex items-center gap-2">
                          EVALUATION MATRIX
                        </h2>
                     </div>
                     
                     <div className="h-[300px] md:h-[350px] w-full">
                        <EvaluationMatrix 
                            // Removed unused props stats/history to fix TS errors, component only uses these:
                            dailyXp={player.dailyXp || 0}
                            dailyStats={player.dailyStats} 
                            weeklyStats={player.weeklyStats} 
                            monthlyStats={player.monthlyStats} 
                        />
                     </div>
                 </div>

                 {/* ATTRIBUTES COLUMN - ID placed here for Tutorial Targeting */}
                 <div className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-800/50 pt-6 lg:pt-0 lg:pl-6 flex flex-col" id="tut-stats">
                     <h3 className="text-sm text-gray-400 font-mono tracking-widest mb-4 flex items-center gap-2">
                        CORE ATTRIBUTES
                     </h3>
                     <div className="space-y-3 flex-1">
                        {Object.entries(player.stats).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-black/40 border border-gray-800/60 rounded hover:border-system-neon/30 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="text-gray-500 group-hover:text-system-neon transition-colors p-1.5 bg-gray-900 rounded">
                                        {statIcons[key as keyof CoreStats]}
                                    </div>
                                    <span className="text-[10px] uppercase font-mono text-gray-400 font-bold tracking-wider">{key}</span>
                                </div>
                                <span className="text-sm font-bold text-white font-mono">{val}</span>
                            </div>
                        ))}
                     </div>
                 </div>
             </div>
        </motion.div>
      </div>

      {/* --- SECTION 2: HUNTER PROFILE & LOGS --- */}
      <div className="flex justify-center px-2 md:px-0">    
        <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="w-full max-w-6xl relative p-6 backdrop-blur-xl bg-system-card/40 rounded-xl border border-system-border/50 shadow-[0_0_40px_rgba(0,0,0,0.4)] overflow-hidden group hover:border-system-border transition-colors duration-500"
        >
            {/* Glowing Corner Brackets (Bottom) */}
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-system-accent/50 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-system-accent/50 rounded-br-lg" />

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8 border-b border-gray-800/50 pb-4">
                <h2 className="text-sm text-gray-400 font-mono tracking-widest flex items-center gap-2">
                  HUNTER PROFILE
                </h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-system-success rounded-full animate-pulse" />
                  <span className="text-[9px] text-system-success/80 font-mono">LIVE</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 font-mono">
                  
                  {/* LEFT COLUMN: Stats */}
                  <div className="space-y-8">
                      {/* Name and Level Header */}
                      <div className="flex justify-between items-end">
                          <div>
                            <div className="text-[10px] text-gray-500 mb-1 tracking-widest">CODENAME</div>
                            <span className="text-xl md:text-2xl font-bold text-white tracking-tighter">
                              {player.username ? player.username.toUpperCase() : player.name.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-col items-end">
                               <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-600 leading-none">
                                 {player.level}
                               </span>
                               <span className="text-[10px] text-system-accent font-bold tracking-[0.3em] mt-1">LEVEL</span>
                            </div>
                          </div>
                      </div>
                      
                      {/* Grid Stats */}
                      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-px bg-gray-800/30 rounded-lg overflow-hidden border border-gray-800">
                          <div className="bg-black/40 p-4">
                              <div className="text-[9px] text-gray-500 tracking-wider mb-1">RANK</div>
                              <div className={`text-lg font-bold ${player.rank === 'S' ? 'text-yellow-400' : 'text-white'}`}>{player.rank}-CLASS</div>
                          </div>
                          <div className="bg-black/40 p-4 text-right">
                              <div className="text-[9px] text-gray-500 tracking-wider mb-1">GOLD</div>
                              <div className="text-xs font-bold text-yellow-500">{player.gold.toLocaleString()} G</div>
                          </div>
                      </motion.div>

                      {/* Modern Stat Bars */}
                      <div className="space-y-4">
                        <StatBar 
                           label={`MP (MANA) ${player.streak > 1 ? `[+${Math.floor(player.streak * 2)} BONUS]` : ''}`}
                           current={player.mp} 
                           max={player.maxMp} 
                           colorClass="bg-blue-600" 
                           shadowColor="rgba(37, 99, 235, 0.4)" 
                        />
                        
                        <div className="pt-2">
                          <StatBar 
                            label="XP (PROGRESS)" 
                            current={player.currentXp} 
                            max={player.requiredXp} 
                            colorClass="bg-system-neon" 
                            shadowColor="rgba(0, 210, 255, 0.5)"
                            isGlitch={isCloseToLevelUp}
                          />
                          <div className="flex justify-between items-center mt-1 text-[9px] font-mono text-gray-600 uppercase tracking-widest pl-1">
                             <span>Next: Lv. {player.level + 1}</span>
                             <span>{player.requiredXp - player.currentXp} XP REMAINING</span>
                          </div>
                        </div>

                        {player.healthProfile && (
                            <motion.div variants={staggerItem} className="mt-4 pt-4 border-t border-gray-800/50">
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
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-system-accent shadow-[0_0_8px_#8b5cf6]"
                                    />
                                </div>
                            </motion.div>
                        )}
                      </div>
                  </div>

                  {/* RIGHT COLUMN: Logs & Controls */}
                  <div className="flex flex-col justify-start gap-4">
                      <motion.div variants={staggerItem} className="border border-gray-800/50 rounded-lg p-4 bg-black/20 h-full max-h-[350px] flex flex-col">
                        <h3 className="text-[10px] text-gray-500 font-mono mb-4 flex items-center gap-2 uppercase tracking-widest border-b border-gray-800 pb-2 shrink-0">
                          <Zap size={10} /> Activity Logs
                        </h3>
                        <div className="space-y-3 pl-2 border-l border-gray-800/50 overflow-y-auto custom-scrollbar pr-2 flex-1">
                          {player.logs && player.logs.length > 0 ? player.logs.map((log) => (
                            <div key={log.id} className="text-[10px] font-mono flex gap-3 items-start opacity-70 hover:opacity-100 transition-opacity">
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
                          )) : (
                              <div className="text-[10px] text-gray-700 italic">NO RECENT ACTIVITY</div>
                          )}
                        </div>
                      </motion.div>

                      {/* System Controls moved here */}
                      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4 mt-auto shrink-0">
                          <button 
                             onClick={onAdminRequest}
                             className="flex items-center justify-center gap-2 text-[10px] text-gray-500 hover:text-white transition-colors font-mono tracking-widest group border border-gray-800 hover:border-gray-500 px-3 py-3 rounded bg-black/40"
                          >
                             <Terminal size={12} className="group-hover:text-system-neon transition-colors" />
                             SYSTEM OVERRIDE
                          </button>
                          
                          <button 
                               onClick={onLogout}
                               className="flex items-center justify-center gap-2 text-[10px] text-red-800 hover:text-red-500 transition-colors font-mono tracking-widest group border border-red-900/20 hover:border-red-500/50 px-3 py-3 rounded bg-red-950/10"
                          >
                               <LogOut size={12} />
                               DISCONNECT
                          </button>
                      </motion.div>
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
    player, registerUser, addQuest, completeQuest, 
    failQuest, resetQuest, deleteQuest, purchaseItem, addShopItem, removeShopItem, 
    notifications, removeNotification, saveHealthProfile, addProgressPhoto, 
    deleteProgressPhoto, logMeal, deleteMeal, completeWorkoutSession, failWorkout,
    logout, advanceTutorial, completeTutorial: completeTutorialAction, resolvePenalty, reducePenalty
  } = useSystem();

  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [showSplash, setShowSplash] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // NEW: State to control Navigation visibility
  const [isNavVisible, setIsNavVisible] = useState(true);

  // Wrapper for tutorial completion to also switch tabs
  const handleTutorialComplete = () => {
      completeTutorialAction();
      setActiveTab('HEALTH');
  };

  // Determine active welcome quest ID for tutorial highlighting
  // Finds the first incomplete quest from the welcome set
  const activeWelcomeQuest = player.quests.find(q => 
      ['wq_1', 'wq_2', 'wq_3', 'wq_4', 'wq_5'].includes(q.id) && !q.isCompleted
  );
  // Note: QuestsView sorts quests, but the ID we pass needs to match the element ID
  const activeWelcomeQuestId = activeWelcomeQuest ? `quest-card-${activeWelcomeQuest.id}` : null;

  // Tutorial Tab Synchronization
  useEffect(() => {
    if (!player.tutorialComplete) {
      if (player.tutorialStep === 2) {
        setActiveTab('QUESTS');
      } else if (player.tutorialStep === 7) {
        setActiveTab('QUESTS'); // Force Quest view on Calibration Step
      } else if (player.tutorialStep === 8) {
        setActiveTab('SHOP');
      }
    }
  }, [player.tutorialStep, player.tutorialComplete]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // 1. AUTH CHECK
  if (!player.isConfigured) {
    if (showAdminLogin) {
        return <AdminLogin onLoginSuccess={() => { setShowAdminLogin(false); setShowAdmin(true); }} onBack={() => setShowAdminLogin(false)} />;
    }
    if (showAdmin) {
        return <AdminDashboard onLogout={() => setShowAdmin(false)} />;
    }
    return <AuthView onLogin={registerUser} onAdminAccess={() => setShowAdminLogin(true)} />;
  }

  // 2. PENALTY ZONE
  if (player.isPenaltyActive && player.penaltyEndTime && Date.now() < player.penaltyEndTime) {
      return (
          <PenaltyZone 
              endTime={player.penaltyEndTime}
              task={player.penaltyTask}
              gold={player.gold}
              onSurvive={resolvePenalty}
              reducePenalty={reducePenalty}
              onSacrifice={() => {
                  if (player.gold >= 500) {
                      purchaseItem({ id: 'penalty_skip', title: 'Divine Intervention', description: 'Skip Penalty', cost: 500, icon: 'lock' });
                      resolvePenalty();
                  }
              }}
          />
      );
  }

  // 3. ADMIN DASHBOARD (Authenticated)
  if (showAdmin) {
      return <AdminDashboard onLogout={() => setShowAdmin(false)} />;
  }

  // 4. MAIN APP
  return (
    <Layout 
      // Conditionally render navigation based on state
      navigation={isNavVisible ? <Navigation activeTab={activeTab} onTabChange={setActiveTab} /> : null}
      playerLevel={player.level}
      streak={player.streak}
    >
      <SystemMessage notifications={notifications} removeNotification={removeNotification} />
      
      {/* TUTORIAL OVERLAY */}
      {!player.tutorialComplete && (
          <TutorialOverlay 
              currentStep={player.tutorialStep} 
              onNext={() => advanceTutorial(player.tutorialStep + 1)}
              onComplete={handleTutorialComplete}
              dynamicTargetId={activeWelcomeQuestId}
          />
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'DASHBOARD' && (
          <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <DashboardView 
                player={player} 
                onLogout={logout} 
                onAdminRequest={() => setShowAdminLogin(true)}
            />
          </motion.div>
        )}

        {activeTab === 'QUESTS' && (
          <motion.div key="quests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <QuestsView 
              quests={player.quests}
              addQuest={addQuest}
              completeQuest={completeQuest}
              failQuest={failQuest}
              resetQuest={resetQuest}
              deleteQuest={deleteQuest}
              tutorialStep={player.tutorialStep}
              onTutorialAction={advanceTutorial}
            />
          </motion.div>
        )}

        {activeTab === 'SHOP' && (
          <motion.div key="shop" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ShopView 
              gold={player.gold}
              items={player.shopItems}
              purchaseItem={purchaseItem}
              addItem={addShopItem}
              removeItem={removeShopItem}
            />
          </motion.div>
        )}

        {activeTab === 'RANKING' && (
          <motion.div key="ranking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <RankingView 
              currentPlayer={player}
            />
          </motion.div>
        )}

        {activeTab === 'GROWTH' && (
          <motion.div key="growth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <GrowthView 
              player={player}
              onAdminRequest={() => setShowAdminLogin(true)}
              onLogout={logout}
            />
          </motion.div>
        )}

        {activeTab === 'HEALTH' && (
          <motion.div key="health" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <HealthView 
               healthProfile={player.healthProfile}
               onSaveProfile={saveHealthProfile}
               onCompleteWorkout={completeWorkoutSession}
               onFailWorkout={failWorkout}
               onAddPhoto={addProgressPhoto}
               onDeletePhoto={deleteProgressPhoto}
               onLogMeal={logMeal}
               onDeleteMeal={deleteMeal}
               playerData={player}
               tutorialStep={player.tutorialStep}
               onTutorialAction={advanceTutorial}
               // Pass control function to HealthView
               onToggleNav={setIsNavVisible}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default App;
