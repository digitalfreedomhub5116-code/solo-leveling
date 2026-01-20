
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, LogOut, Dumbbell, Brain, Target, Users, Shield, Sparkles } from 'lucide-react';

import Layout from './components/Layout';
import Navigation from './components/Navigation';
import SplashScreen from './components/SplashScreen';
import AuthView from './components/AuthView';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import QuestsView from './components/QuestsView';
import ShopView from './components/ShopView';
import GrowthView from './components/GrowthView';
import { HealthView } from './components/HealthView';
import RankingView from './components/RankingView';
import EvaluationMatrix from './components/StatsRadar';
import SystemMessage from './components/SystemMessage';
import LevelUpCinematic from './components/LevelUpCinematic';
import WelcomeIntro from './components/WelcomeIntro';
import PenaltyZone from './components/PenaltyZone';
import TournamentResultModal from './components/TournamentResultModal';
import TutorialOverlay from './components/TutorialOverlay';
import DailyLoginModal from './components/DailyLoginModal'; // NEW
import DemonCastle from './components/DemonCastle'; // NEW

import { useSystem } from './hooks/useSystem';
import { Tab, CoreStats } from './types';

const STAT_CONFIG: Record<keyof CoreStats, { icon: any, color: string, bar: string }> = {
    strength: { icon: Dumbbell, color: 'text-red-500', bar: 'bg-red-500' },
    intelligence: { icon: Brain, color: 'text-blue-500', bar: 'bg-blue-500' },
    focus: { icon: Target, color: 'text-system-neon', bar: 'bg-system-neon' },
    social: { icon: Users, color: 'text-yellow-500', bar: 'bg-yellow-500' },
    willpower: { icon: Shield, color: 'text-purple-500', bar: 'bg-purple-500' }
};

const App: React.FC = () => {
  const { 
    player, setPlayer, notifications, 
    registerUser, addQuest, completeQuest, failQuest, resetQuest, deleteQuest, 
    purchaseItem, addShopItem, removeShopItem, 
    removeNotification, saveHealthProfile, 
    logMeal, deleteMeal, completeWorkoutSession, failWorkout, 
    logout, advanceTutorial, completeTutorial, resolvePenalty, reducePenalty, 
    claimTournamentReward, consumeKey, checkDailyLogin,
    deductGold, enterDungeon, addRewards // Added from hook
  } = useSystem();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // Removed showIntro state as it's not needed for logic branching anymore
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const [showDailyBonus, setShowDailyBonus] = useState(false); // NEW
  
  // Dungeon Mode State to lock UI
  const [isDungeonMode, setIsDungeonMode] = useState(false);
  
  // Tutorial State
  const [tutorialTarget, setTutorialTarget] = useState<string | null>(null);

  // Derived state
  const isPenalty = player.isPenaltyActive;

  // Level Up Detection
  useEffect(() => {
      if (player.logs.length > 0 && player.logs[0].type === 'LEVEL_UP') {
          const diff = Date.now() - player.logs[0].timestamp;
          if (diff < 5000) {
              setShowLevelUp(true);
          }
      }
  }, [player.logs, player.level]);

  // Ensure Nav is shown when switching tabs, BUT respect dungeon mode
  useEffect(() => {
      // If we switch tabs, we generally want nav, unless dungeon is active
      if (!isDungeonMode) setShowNav(true);
  }, [activeTab, isDungeonMode]);

  // Initial Daily Login Check (Run once when player is loaded)
  useEffect(() => {
      // Check for tutorial completion before showing daily bonus
      if (player.isConfigured && !loading && player.tutorialComplete) {
          const hasBonus = checkDailyLogin();
          if (hasBonus) {
              setShowDailyBonus(true);
          }
      }
  }, [player.isConfigured, loading, player.tutorialComplete]);

  // Handle Tutorial Steps
  const handleTutorialNext = () => {
      const nextStep = player.tutorialStep + 1;
      
      // Auto-Navigation Logic for Tutorial Flow
      if (nextStep === 2) setActiveTab('QUESTS'); // "Go to Quests"
      if (nextStep === 9) setActiveTab('REWARDS'); // "The Reward Shop" (Updated Index & Tab Name)
      
      advanceTutorial(nextStep);
  };

  const handleTutorialComplete = () => {
      completeTutorial();
  };

  // Sync Tutorial Target
  useEffect(() => {
      if (!player.tutorialComplete) {
          // Updated target step for Calibration List (was 7, now 8)
          if (player.tutorialStep === 8) {
              if (player.quests.length > 0) {
                  setTutorialTarget(`quest-card-${player.quests[0].id}`);
              } else {
                  setTutorialTarget(null);
              }
          } else {
              setTutorialTarget(null);
          }
      }
  }, [player.tutorialStep, player.quests, player.tutorialComplete]);

  if (loading) {
    return <SplashScreen onComplete={() => setLoading(false)} />;
  }

  if (showAdminLogin) {
      return (
          <AdminLogin 
            onLoginSuccess={() => { setShowAdminLogin(false); setIsAdmin(true); }} 
            onBack={() => setShowAdminLogin(false)} 
          />
      );
  }

  if (isAdmin) {
      return <AdminDashboard onLogout={() => setIsAdmin(false)} />;
  }

  if (!player.isConfigured) {
      return (
          <AuthView 
            onLogin={(profile) => {
                registerUser(profile);
                setShowWelcome(true);
            }} 
            onAdminAccess={() => setShowAdminLogin(true)}
          />
      );
  }

  if (showWelcome) {
      // Directly show Intro and then exit, skipping the cinematic with voice
      return <WelcomeIntro onComplete={() => setShowWelcome(false)} />;
  }

  if (isPenalty) {
      return (
          <PenaltyZone 
            endTime={player.penaltyEndTime}
            task={player.penaltyTask}
            gold={player.gold}
            onSurvive={resolvePenalty}
            reducePenalty={reducePenalty}
            onSacrifice={() => {
                if (player.gold >= 500) {
                    purchaseItem({ id: 'penalty-bribe', title: 'Divine Intervention', description: 'Skip Penalty', cost: 500, icon: 'lock' });
                    resolvePenalty();
                }
            }}
          />
      );
  }

  // Determine navigation visibility
  // Hide nav if user explicitly toggled it off OR if dungeon is active
  const shouldShowNav = showNav && !isDungeonMode;

  return (
    <>
      <SystemMessage notifications={notifications} removeNotification={removeNotification} />
      
      <AnimatePresence>
        {showLevelUp && (
            <LevelUpCinematic level={player.level} onComplete={() => setShowLevelUp(false)} />
        )}
        {player.tournament.pendingReward && (
            <TournamentResultModal reward={player.tournament.pendingReward} onClaim={claimTournamentReward} />
        )}
        {/* Daily Bonus Modal */}
        {showDailyBonus && (
            <DailyLoginModal onClose={() => setShowDailyBonus(false)} />
        )}
      </AnimatePresence>

      {!player.tutorialComplete && (
          <TutorialOverlay 
            currentStep={player.tutorialStep} 
            onNext={handleTutorialNext} 
            onComplete={handleTutorialComplete}
            dynamicTargetId={tutorialTarget}
          />
      )}

      <Layout 
        navigation={shouldShowNav ? <Navigation activeTab={activeTab} onTabChange={setActiveTab} /> : null}
        playerLevel={player.level}
        streak={player.streak}
        gold={player.gold}
        keys={player.keys}
        // Disable header interactions if dungeon is active
        headerDisabled={isDungeonMode}
        // Only trigger navigation if NOT in dungeon mode
        onGoldClick={!isDungeonMode ? () => setActiveTab('REWARDS') : undefined}
      >
        <AnimatePresence mode="wait">
            {activeTab === 'DASHBOARD' && (
                <motion.div 
                    key="dashboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    <div className="lg:col-span-2 space-y-6">
                        <div id="tut-stats" className="h-[400px]">
                            <EvaluationMatrix 
                                dailyXp={player.dailyXp} 
                                dailyStats={player.dailyStats} 
                                weeklyStats={player.weeklyStats} 
                                monthlyStats={player.monthlyStats} 
                            />
                        </div>

                        {/* Core Attributes Table */}
                        <div className="bg-system-card border border-system-border rounded-xl overflow-hidden p-0 relative group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-border to-transparent opacity-50" />
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black/40 text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-800">
                                        <th className="p-4 pl-6">Core Attribute</th>
                                        <th className="p-4">Level</th>
                                        <th className="p-4 w-full pr-6">System Analysis</th>
                                    </tr>
                                </thead>
                                <tbody className="font-mono text-xs">
                                    {(Object.keys(STAT_CONFIG) as Array<keyof CoreStats>).map((key) => {
                                        const config = STAT_CONFIG[key];
                                        const value = player.stats[key] || 0;
                                        return (
                                            <tr key={key} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors last:border-0">
                                                <td className="p-3 pl-6 flex items-center gap-3">
                                                    <div className={`p-2 rounded bg-gray-900/50 border border-gray-800 ${config.color}`}>
                                                        <config.icon size={14} />
                                                    </div>
                                                    <span className="font-bold text-gray-300 uppercase tracking-tight">{key}</span>
                                                </td>
                                                <td className="p-3 font-black text-white text-base tabular-nums">
                                                    {Math.floor(value)}
                                                </td>
                                                <td className="p-3 pr-6">
                                                    <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(value, 100)}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className={`h-full ${config.bar} shadow-[0_0_10px_currentColor] relative`}
                                                        >
                                                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                        </motion.div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col justify-start gap-4">
                        {/* XP Progress Module */}
                        <div className="bg-system-card border border-system-border rounded-xl p-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-system-accent/5 group-hover:bg-system-accent/10 transition-colors pointer-events-none" />
                            
                            <div className="relative z-10 flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <Sparkles size={12} className="text-system-accent" /> System Level
                                    </h3>
                                    <div className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                                        {player.level}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">XP Required</div>
                                    <div className="text-xl font-bold text-gray-300 font-mono">
                                        <span className="text-system-neon">{player.currentXp}</span> 
                                        <span className="text-gray-600 text-sm"> / {player.requiredXp}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative h-3 bg-black rounded-full overflow-hidden border border-gray-800 z-10">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((player.currentXp / player.requiredXp) * 100, 100)}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-system-neon via-blue-500 to-system-accent shadow-[0_0_15px_#00d2ff] relative"
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
                                </motion.div>
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center text-[9px] font-mono text-gray-600">
                                <span>PROGRESS</span>
                                <span>{Math.floor((player.currentXp / player.requiredXp) * 100)}%</span>
                            </div>
                        </div>

                        {/* System Controls */}
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setShowAdminLogin(true)}
                                className="flex items-center justify-center gap-2 text-[10px] text-gray-500 hover:text-white transition-colors font-mono tracking-widest group border border-gray-800 hover:border-gray-500 px-3 py-3 rounded bg-black/40"
                            >
                                <Terminal size={12} className="group-hover:text-system-neon transition-colors" />
                                ADMIN
                            </button>
                            
                            <button 
                                onClick={logout}
                                className="flex items-center justify-center gap-2 text-[10px] text-red-800 hover:text-red-500 transition-colors font-mono tracking-widest group border border-red-900/20 hover:border-red-500/50 px-3 py-3 rounded bg-red-950/10"
                            >
                                <LogOut size={12} />
                                LOGOUT
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* NEW: CASTLE TAB */}
            {activeTab === 'CASTLE' && (
                <motion.div key="castle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <DemonCastle 
                        gold={player.gold}
                        keys={player.keys}
                        lastDungeonEntry={player.lastDungeonEntry}
                        onDeductGold={deductGold}
                        onConsumeKey={consumeKey}
                        onEnterDungeon={enterDungeon}
                        onAddRewards={addRewards}
                        onPlayStateChange={setIsDungeonMode}
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
                        tutorialStep={player.tutorialStep}
                        onTutorialAction={advanceTutorial}
                    />
                </motion.div>
            )}

            {activeTab === 'HEALTH' && (
                <motion.div key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <HealthView 
                        healthProfile={player.healthProfile}
                        onSaveProfile={saveHealthProfile}
                        onCompleteWorkout={completeWorkoutSession}
                        onFailWorkout={failWorkout}
                        onLogMeal={logMeal}
                        onDeleteMeal={deleteMeal}
                        playerData={player}
                        onToggleNav={setShowNav}
                        onConsumeKey={consumeKey}
                    />
                </motion.div>
            )}

            {activeTab === 'REWARDS' && (
                <motion.div key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <RankingView currentPlayer={player} />
                </motion.div>
            )}

            {activeTab === 'GROWTH' && (
                <motion.div key="growth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <GrowthView player={player} onAdminRequest={() => setShowAdminLogin(true)} onLogout={logout} />
                </motion.div>
            )}
        </AnimatePresence>
      </Layout>
    </>
  );
};

export default App;
