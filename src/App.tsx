import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, LogOut, Dumbbell, Brain, Target, Users, Shield, Sparkles, Zap } from 'lucide-react';

import Layout from './components/Layout';
import Navigation from './components/Navigation';
import SplashScreen from './components/SplashScreen';
import ShadowLoading from './components/ShadowLoading'; 
import DashboardWidgets from './components/DashboardWidgets'; 
import HunterCommandDeck from './components/HunterCommandDeck'; 
import LevelProgressCard from './components/LevelProgressCard'; 
import RankRoadmap from './components/RankRoadmap'; 
import SystemMessage from './components/SystemMessage';
import MobileFloatingMenu from './components/MobileFloatingMenu';
import SkeletonDashboard from './components/SkeletonDashboard'; 

// --- LAZY LOAD HEAVY MODULES ---
const AuthView = React.lazy(() => import('./components/AuthView'));
const AdminLogin = React.lazy(() => import('./components/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const QuestsView = React.lazy(() => import('./components/QuestsView'));
const ArmoryView = React.lazy(() => import('./components/ArmoryView')); // NEW
const GrowthView = React.lazy(() => import('./components/GrowthView'));
const HealthView = React.lazy(() => import('./components/HealthView').then(module => ({ default: module.HealthView }))) as React.FC<any>;
const RankingView = React.lazy(() => import('./components/RankingView'));
const LevelUpCinematic = React.lazy(() => import('./components/LevelUpCinematic'));
const LevelDownCinematic = React.lazy(() => import('./components/LevelDownCinematic'));
const WelcomeIntro = React.lazy(() => import('./components/WelcomeIntro'));
const PenaltyZone = React.lazy(() => import('./components/PenaltyZone'));
const TournamentResultModal = React.lazy(() => import('./components/TournamentResultModal'));
const TutorialOverlay = React.lazy(() => import('./components/TutorialOverlay'));
const DailyLoginModal = React.lazy(() => import('./components/DailyLoginModal'));
const DemonCastle = React.lazy(() => import('./components/DemonCastle'));
const DuskWelcome = React.lazy(() => import('./components/DuskWelcome'));
const CalibrationFlow = React.lazy(() => import('./components/CalibrationFlow'));
const NameOnboarding = React.lazy(() => import('./components/NameOnboarding'));
const XpCollectionOverlay = React.lazy(() => import('./components/XpCollectionOverlay'));
const DuskChat = React.lazy(() => import('./components/DuskChat'));
const GuildsView = React.lazy(() => import('./components/GuildsView'));
const BanScreen = React.lazy(() => import('./components/BanScreen'));
const CheatWarningModal = React.lazy(() => import('./components/CheatWarningModal'));
const SystemAgreement = React.lazy(() => import('./components/SystemAgreement'));
const AvatarGenerator = React.lazy(() => import('./components/AvatarGenerator'));

import { useSystem } from './hooks/useSystem';
import { useCoinReward } from './hooks/useCoinReward'; 
import { Tab, CoreStats, DailyReward, HealthProfile } from './types';
import { playSystemSoundEffect } from './utils/soundEngine';

const STAT_CONFIG: Record<keyof CoreStats, { icon: any, color: string, bar: string }> = {
    strength: { icon: Dumbbell, color: 'text-red-500', bar: 'bg-red-500' },
    intelligence: { icon: Brain, color: 'text-blue-500', bar: 'bg-blue-500' },
    focus: { icon: Target, color: 'text-system-neon', bar: 'bg-system-neon' },
    social: { icon: Users, color: 'text-yellow-500', bar: 'bg-yellow-500' },
    willpower: { icon: Shield, color: 'text-purple-500', bar: 'bg-purple-500' },
    discipline: { icon: Zap, color: 'text-white', bar: 'bg-white' }
};

type OnboardingPhase = 'SPLASH' | 'INTRO' | 'AGREEMENT' | 'NAMING' | 'CALIBRATION' | 'ANALYSIS' | 'AUTH' | 'AVATAR' | 'APP';

interface ScriptStep {
  title: string;
  body: string;
  buttonText: string;
  targetId?: string;
  mobileTargetId?: string;
  waitForAction?: boolean; 
  allowInteraction?: boolean; 
  hideOverlay?: boolean; 
  requireInput?: boolean; 
  forcePosition?: 'top' | 'bottom' | 'center'; 
}

const App: React.FC = () => {
  const { 
    player, setPlayer, notifications, isSystemReady, 
    registerUser, addQuest, completeQuest, failQuest, deleteQuest, 
    purchaseItem, purchaseOutfit, equipOutfit, // NEW
    removeNotification, saveHealthProfile, 
    logMeal, deleteMeal, completeWorkoutSession, failWorkout, 
    logout, advanceTutorial, completeTutorial, resolvePenalty, reducePenalty, 
    claimTournamentReward, consumeKey, checkDailyLogin,
    deductGold, enterDungeon, addRewards, setDashboardTrigger,
    markDuskMessagesRead, recordStrike, removeStrike, verifyTicket,
    addNotification
  } = useSystem();

  const { triggerCoinReward } = useCoinReward();

  const [onboardingPhase, setOnboardingPhase] = useState<OnboardingPhase>('SPLASH');
  const [tempHealthProfile, setTempHealthProfile] = useState<HealthProfile | null>(null);
  const [tempStats, setTempStats] = useState<CoreStats | null>(null);
  const [tempUserData, setTempUserData] = useState<{username: string, country: string, timezone: string} | null>(null);

  const [isContentLoading, setIsContentLoading] = useState(true);

  useEffect(() => {
      const hasSeenIntro = localStorage.getItem('hasSeenIntro_v1');
      if (player.isConfigured) {
          if (!player.avatarUrl) {
              setOnboardingPhase('AVATAR');
          } else {
              setOnboardingPhase('APP');
          }
          setTimeout(() => setIsContentLoading(false), 500); 
      } else if (hasSeenIntro === 'true') {
          setOnboardingPhase('AUTH');
          setIsContentLoading(false);
      } else {
          setOnboardingPhase('SPLASH');
          setIsContentLoading(false);
      }
  }, [player.isConfigured, player.avatarUrl]);

  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLevelDown, setShowLevelDown] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const [showDailyBonus, setShowDailyBonus] = useState(false); 
  const [dailyReward, setDailyReward] = useState<DailyReward | null>(null);
  
  const [homeVideoTrigger, setHomeVideoTrigger] = useState<string | null>(null);
  const [isDungeonMode, setIsDungeonMode] = useState(false);
  const [showCheatWarning, setShowCheatWarning] = useState(false);

  const [tutorialTarget, setTutorialTarget] = useState<string | null>(null);
  const [tutorialOverride, setTutorialOverride] = useState<ScriptStep | null>(null);

  const [showDuskChat, setShowDuskChat] = useState(false);

  const [xpCollection, setXpCollection] = useState<{
      rect: DOMRect;
      amount: number;
      snapshotXp: number;
      snapshotLevel: number;
      snapshotRequiredXp: number;
  } | null>(null);

  const isPenalty = player.isPenaltyActive;

  useEffect(() => {
      if (showCheatWarning) return;
      if (player.logs.length > 0 && player.logs[0].type === 'LEVEL_UP') {
          const diff = Date.now() - player.logs[0].timestamp;
          if (diff < 5000) {
              setShowLevelUp(true);
          }
      }
  }, [player.logs, player.level, showCheatWarning]);

  useEffect(() => {
      if (showCheatWarning) return;
      if (player.logs.length > 0 && player.logs[0].type === 'LEVEL_DOWN') {
          const diff = Date.now() - player.logs[0].timestamp;
          if (diff < 5000) {
              setShowLevelDown(true);
          }
      }
  }, [player.logs, player.level, showCheatWarning]);

  useEffect(() => {
      if (!isDungeonMode && !showCheatWarning) setShowNav(true);
  }, [activeTab, isDungeonMode, showCheatWarning]);

  useEffect(() => {
      if (activeTab === 'DASHBOARD') {
          const triggerType = sessionStorage.getItem('dashboard_trigger');
          if (triggerType) {
              setHomeVideoTrigger(triggerType);
              sessionStorage.removeItem('dashboard_trigger');
              setTimeout(() => setHomeVideoTrigger(null), 8000);
          } else {
              setHomeVideoTrigger(null);
          }
      } else {
          setHomeVideoTrigger(null);
      }
  }, [activeTab]);

  const handleTabChange = (newTab: Tab) => {
      if (activeTab === 'ALLIANCE' && newTab === 'DASHBOARD') {
          setDashboardTrigger('growth_visit');
      }
      setActiveTab(newTab);
  };

  useEffect(() => {
      if (player.isConfigured && onboardingPhase === 'APP' && player.tutorialComplete && !showCheatWarning) {
          const reward = checkDailyLogin();
          if (reward) {
              setDailyReward(reward);
              setShowDailyBonus(true);
          }
      }
  }, [player.isConfigured, onboardingPhase, player.tutorialComplete, showCheatWarning]);

  const handleQuestComplete = (id: string, asMini: boolean = false, rect?: DOMRect) => {
      const quest = player.quests.find(q => q.id === id);
      if (!quest) return;

      if (quest.estimatedDuration) {
          const now = Date.now();
          const elapsed = now - quest.createdAt;
          const minDuration = (quest.estimatedDuration * 60 * 1000) * 0.50; 
          
          if (elapsed < minDuration) {
              playSystemSoundEffect('DANGER');
              setShowCheatWarning(true);
              return; 
          }
      }

      const snapshotXp = player.currentXp;
      const snapshotLevel = player.level;
      const snapshotRequiredXp = player.requiredXp;
      
      completeQuest(id, asMini);
      
      if (rect) {
          triggerCoinReward(rect);
          const base = quest.xpReward;
          const amount = asMini ? Math.floor(base * 0.1) : base;
          setXpCollection({
              rect,
              amount,
              snapshotXp,
              snapshotLevel,
              snapshotRequiredXp
          });
      }

      if (!player.tutorialComplete && player.tutorialStep === 7) {
          let currentCount = player.quests.filter(q => q.id.startsWith('init_q') && q.isCompleted).length;
          if (id.startsWith('init_q')) {
              currentCount += 1; 
          }
          if (currentCount >= 1) {
              setTimeout(() => {
                  advanceTutorial(8);
                  setActiveTab('HEALTH'); 
              }, 1500); 
          }
      }
  };

  const handleXpAnimComplete = () => {
      const snap = xpCollection;
      setXpCollection(null); 
      if (snap && player.level > snap.snapshotLevel && !showCheatWarning) {
          setShowLevelUp(true);
      }
  };

  const handleTutorialNext = () => {
      if (tutorialOverride) {
          if (tutorialOverride.targetId === 'tut-quest-error') {
              setTutorialOverride({
                  title: "Refine Objective",
                  body: "Add specific details like duration or quantity.",
                  buttonText: "Next", 
                  targetId: "tut-quest-title",
                  allowInteraction: true,
                  waitForAction: false, 
                  forcePosition: 'top'
              });
              return;
          }
          if (tutorialOverride.targetId === 'tut-quest-title') {
              setTutorialOverride({
                  title: "Retry Analysis",
                  body: "Submit your refined protocol for re-evaluation.",
                  buttonText: "Waiting...",
                  targetId: "tut-analyze-btn",
                  allowInteraction: true,
                  waitForAction: true, 
                  forcePosition: 'top'
              });
              return;
          }
      }

      const nextStep = player.tutorialStep + 1;
      if (nextStep === 2) setActiveTab('QUESTS'); 
      if (nextStep === 8) setActiveTab('HEALTH'); 
      
      advanceTutorial(nextStep);
  };

  const handleQuestAnalysisEvent = (status: 'SUCCESS' | 'ERROR') => {
      if (status === 'ERROR') {
          setTutorialOverride({
              title: "FORGEGUARD ALERT",
              body: "Reforge AI detects generic Inputs.",
              buttonText: "Next",
              targetId: "tut-quest-error",
              allowInteraction: true,
              forcePosition: "bottom"
          });
      } else {
          setTutorialOverride(null); 
      }
  };

  const handleTutorialComplete = () => {
      completeTutorial();
  };

  useEffect(() => {
      if (!player.tutorialComplete) {
          if (player.tutorialStep === 7) {
              const dummyQuests = player.quests.filter(q => q.id.startsWith('init_q') && !q.isCompleted);
              const targetQuest = dummyQuests.length > 0 ? dummyQuests[0] : player.quests.find(q => !q.isCompleted);
              const completedCount = player.quests.filter(q => q.id.startsWith('init_q') && q.isCompleted).length;
              
              if (targetQuest) {
                  setTutorialTarget(`quest-card-${targetQuest.id}`);
                  const newOverride: ScriptStep = {
                      title: "System Calibration",
                      body: "Complete 1 Initial Protocol to synchronize.",
                      buttonText: `${completedCount}/1 Completed`,
                      targetId: `quest-card-${targetQuest.id}`,
                      waitForAction: true,
                      allowInteraction: true,
                      forcePosition: 'bottom'
                  };
                  if (JSON.stringify(tutorialOverride) !== JSON.stringify(newOverride)) {
                      setTutorialOverride(newOverride);
                  }
              }
          } else {
              setTutorialTarget(null);
              if (tutorialOverride?.title === "System Calibration") {
                  setTutorialOverride(null);
              }
          }
      }
  }, [player.tutorialStep, player.quests, player.tutorialComplete]);

  const handleStartDungeon = async (isFree: boolean) => {
      const allowed = await enterDungeon(isFree);
      if (allowed) {
          setIsDungeonMode(true);
          setActiveTab('CASTLE');
      }
  };

  const handleSplashComplete = () => setOnboardingPhase('INTRO');
  const handleIntroComplete = () => setOnboardingPhase('AGREEMENT');
  const handleAgreementComplete = () => setOnboardingPhase('NAMING');
  const handleNamingComplete = (name: string, country: string, timezone: string) => {
      setTempUserData({ username: name, country, timezone });
      setOnboardingPhase('CALIBRATION');
  };
  const handleCalibrationComplete = (profile: HealthProfile, stats: CoreStats) => {
      setTempHealthProfile(profile);
      setTempStats(stats);
      setOnboardingPhase('ANALYSIS');
  };
  const handleAnalysisComplete = () => {
      localStorage.setItem('hasSeenIntro_v1', 'true');
      setOnboardingPhase('AUTH');
  };
  const handleAuthComplete = (profileData: any) => {
      const mergedProfile = { ...profileData };
      if (tempHealthProfile) mergedProfile.healthProfile = tempHealthProfile;
      if (tempStats) mergedProfile.stats = tempStats;
      if (tempUserData) {
          mergedProfile.username = tempUserData.username;
          mergedProfile.country = tempUserData.country;
          mergedProfile.timezone = tempUserData.timezone;
          if (!mergedProfile.name || mergedProfile.name === 'Hunter') {
              mergedProfile.name = tempUserData.username;
          }
      }
      registerUser(mergedProfile);
      setOnboardingPhase('AVATAR');
  };
  const handleAvatarComplete = (avatarUrl: string, originalUrl: string) => {
      registerUser({ ...player, avatarUrl, originalSelfieUrl: originalUrl });
      setShowWelcome(false); 
      setOnboardingPhase('APP');
      setIsContentLoading(true);
      setTimeout(() => setIsContentLoading(false), 800); 
  };

  if (player.isBanned) return <Suspense fallback={<ShadowLoading />}><BanScreen /></Suspense>;
  if (onboardingPhase === 'SPLASH') return <SplashScreen onComplete={handleSplashComplete} isReady={isSystemReady} />;
  if (onboardingPhase === 'INTRO') return <Suspense fallback={<ShadowLoading />}><DuskWelcome text="Hello i am dusk i have came from the shadows from now on i will be your accountiblity partner and coach." secondaryText="First, let's establish your identity in the System." buttonLabel="INITIALIZE" onComplete={handleIntroComplete} /></Suspense>;
  if (onboardingPhase === 'AGREEMENT') return <Suspense fallback={<ShadowLoading />}><SystemAgreement onComplete={handleAgreementComplete} /></Suspense>;
  if (onboardingPhase === 'NAMING') return <Suspense fallback={<ShadowLoading />}><NameOnboarding onComplete={handleNamingComplete} /></Suspense>;
  if (onboardingPhase === 'CALIBRATION') return <Suspense fallback={<ShadowLoading />}><CalibrationFlow onComplete={handleCalibrationComplete} /></Suspense>;
  if (onboardingPhase === 'ANALYSIS') return <Suspense fallback={<ShadowLoading />}><DuskWelcome text="Analysis Complete." secondaryText="yes their current stats are low but we will work on them together but before starting we will need to save our data" buttonLabel="CONTINUE" onComplete={handleAnalysisComplete} /></Suspense>;
  if (showAdminLogin) return <Suspense fallback={<ShadowLoading />}><AdminLogin onLoginSuccess={() => { setShowAdminLogin(false); setIsAdmin(true); }} onBack={() => setShowAdminLogin(false)} /></Suspense>;
  if (isAdmin) return <Suspense fallback={<ShadowLoading />}><AdminDashboard onLogout={() => setIsAdmin(false)} /></Suspense>;
  if (onboardingPhase === 'AUTH') return <Suspense fallback={<ShadowLoading />}><AuthView onLogin={handleAuthComplete} onAdminAccess={() => setShowAdminLogin(true)} /></Suspense>;
  if (onboardingPhase === 'AVATAR') return <Suspense fallback={<ShadowLoading />}><AvatarGenerator onComplete={handleAvatarComplete} /></Suspense>;
  if (showWelcome) return <Suspense fallback={<ShadowLoading />}><WelcomeIntro onComplete={() => setShowWelcome(false)} /></Suspense>;
  if (isPenalty) return <Suspense fallback={<ShadowLoading />}><PenaltyZone endTime={player.penaltyEndTime} task={player.penaltyTask} gold={player.gold} onSurvive={resolvePenalty} reducePenalty={reducePenalty} onSacrifice={() => { if (player.gold >= 500) { purchaseItem({ id: 'penalty-bribe', title: 'Divine Intervention', description: 'Skip Penalty', cost: 500, icon: 'lock' }); resolvePenalty(); } }} /></Suspense>;

  const shouldShowNav = showNav && !isDungeonMode && !showCheatWarning;

  return (
    <>
      <SystemMessage notifications={notifications} removeNotification={removeNotification} />
      
      <AnimatePresence>
        {showCheatWarning && (
            <div className="fixed inset-0 z-[9999] bg-black/50">
               <Suspense fallback={<ShadowLoading />}>
                   <CheatWarningModal 
                       strikes={player.cheatStrikes || 0}
                       onAcknowledge={() => {
                           recordStrike();
                           setShowCheatWarning(false);
                       }}
                       originalSelfieUrl={player.originalSelfieUrl} 
                       onRemoveStrike={() => {
                           removeStrike();
                           setShowCheatWarning(false);
                       }}
                       onVerifyTicket={(proof, reason) => {
                           verifyTicket(proof, reason, player.originalSelfieUrl);
                       }}
                   />
               </Suspense>
            </div>
        )}

        {showDuskChat && !showCheatWarning && (
            <Suspense fallback={null}>
                <DuskChat player={player} onClose={() => setShowDuskChat(false)} onMarkRead={markDuskMessagesRead} />
            </Suspense>
        )}
        
        {!showCheatWarning && showLevelUp && (
            <Suspense fallback={null}>
                <LevelUpCinematic level={player.level} onComplete={() => setShowLevelUp(false)} />
            </Suspense>
        )}
        
        {!showCheatWarning && showLevelDown && (
            <Suspense fallback={null}>
                <LevelDownCinematic onClose={() => setShowLevelDown(false)} />
            </Suspense>
        )}

        {!showCheatWarning && player.tournament.pendingReward && (
            <Suspense fallback={null}>
                <TournamentResultModal reward={player.tournament.pendingReward} onClaim={claimTournamentReward} />
            </Suspense>
        )}
        
        {!showCheatWarning && showDailyBonus && dailyReward && (
            <Suspense fallback={null}>
                <DailyLoginModal reward={dailyReward} onClose={() => setShowDailyBonus(false)} />
            </Suspense>
        )}
        
        {!showCheatWarning && xpCollection && (
            <Suspense fallback={null}>
                <XpCollectionOverlay 
                    startRect={xpCollection.rect}
                    xpGained={xpCollection.amount}
                    currentXp={xpCollection.snapshotXp}
                    requiredXp={xpCollection.snapshotRequiredXp}
                    level={xpCollection.snapshotLevel}
                    onComplete={handleXpAnimComplete}
                />
            </Suspense>
        )}
      </AnimatePresence>

      {!isDungeonMode && !showCheatWarning && !isPenalty && onboardingPhase === 'APP' && activeTab === 'DASHBOARD' && (
          <MobileFloatingMenu 
              gold={player.gold} 
              onEnterDungeon={handleStartDungeon} 
              keys={player.keys}
              onConsumeKey={consumeKey}
              onAddRewards={addRewards}
              onAddNotification={(msg, type) => addNotification(msg, type)}
          />
      )}

      {!player.tutorialComplete && !showCheatWarning && !isContentLoading && (
          <Suspense fallback={null}>
              <TutorialOverlay 
                currentStep={player.tutorialStep} 
                onNext={handleTutorialNext} 
                onComplete={handleTutorialComplete}
                dynamicTargetId={tutorialTarget}
                overrideStep={tutorialOverride}
              />
          </Suspense>
      )}

      <Layout 
        navigation={shouldShowNav ? <Navigation activeTab={activeTab} onTabChange={handleTabChange} /> : null}
        playerLevel={player.level}
        streak={player.streak}
        gold={player.gold}
        keys={player.keys}
        currentXp={player.currentXp}
        requiredXp={player.requiredXp}
        username={player.username || player.name || "Hunter"}
        avatarUrl={player.avatarUrl}
        totalXp={player.totalXp}
        headerDisabled={isDungeonMode || showCheatWarning}
        onGoldClick={!isDungeonMode && !showCheatWarning ? () => setActiveTab('ARMORY') : undefined}
      >
        <AnimatePresence mode="wait">
            {activeTab === 'DASHBOARD' && (
                <motion.div 
                    key="dashboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-6"
                >
                    {isContentLoading ? (
                        <SkeletonDashboard />
                    ) : (
                        <>
                            <div id="tut-radar-chart">
                                <HunterCommandDeck 
                                    player={player} 
                                    triggerActionId={homeVideoTrigger} 
                                    videoMap={player.focusVideos} 
                                />
                            </div>

                            <LevelProgressCard 
                                level={player.level}
                                currentXP={player.currentXp}
                                maxXP={player.requiredXp}
                            />

                            <DashboardWidgets 
                                player={player}
                                onOpenDuskChat={() => setShowDuskChat(true)} 
                                unreadCount={player.duskUnreadCount} 
                            />

                            <RankRoadmap player={player} />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div id="tut-stats" className="lg:col-span-2 bg-system-card border border-system-border rounded-xl overflow-hidden p-0 relative group">
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
                                                    <tr key={key as string} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors last:border-0">
                                                        <td className="p-3 pl-6 flex items-center gap-3">
                                                            <div className={`p-2 rounded bg-gray-900/50 border border-gray-800 ${config.color}`}>
                                                                <config.icon size={14} />
                                                            </div>
                                                            <span className="font-bold text-gray-300 uppercase tracking-tight">{key as string}</span>
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

                                <div className="flex flex-col justify-start gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setShowAdminLogin(true)}
                                            className="flex items-center justify-center gap-2 text-[10px] text-gray-500 hover:text-white transition-colors font-mono tracking-widest group border border-gray-800 hover:border-gray-500 px-3 py-4 rounded bg-black/40"
                                        >
                                            <Terminal size={14} className="group-hover:text-system-neon transition-colors" />
                                            ADMIN
                                        </button>
                                        
                                        <button 
                                            onClick={logout}
                                            className="flex items-center justify-center gap-2 text-[10px] text-red-800 hover:text-red-500 transition-colors font-mono tracking-widest group border border-red-900/20 hover:border-red-500/50 px-3 py-4 rounded bg-red-950/10"
                                        >
                                            <LogOut size={14} />
                                            LOGOUT
                                        </button>
                                    </div>
                                    
                                    <div className="bg-black/40 border border-gray-800 rounded-xl p-4 flex items-center justify-between text-[10px] font-mono text-gray-600">
                                        <span>SYSTEM UPTIME: 99.9%</span>
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-system-success rounded-full animate-pulse" /> ONLINE
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {activeTab === 'CASTLE' && (
                <motion.div key="castle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Suspense fallback={<ShadowLoading />}>
                        <DemonCastle 
                            gold={player.gold}
                            keys={player.keys}
                            lastDungeonEntry={player.lastDungeonEntry}
                            onDeductGold={deductGold}
                            onConsumeKey={consumeKey}
                            onEnterDungeon={enterDungeon}
                            onAddRewards={addRewards}
                            onPlayStateChange={setIsDungeonMode}
                            initialMode="PLAYING"
                            onExit={() => {
                                setIsDungeonMode(false);
                                setActiveTab('ARMORY');
                            }}
                        />
                    </Suspense>
                </motion.div>
            )}

            {activeTab === 'QUESTS' && (
                <motion.div key="quests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Suspense fallback={<ShadowLoading />}>
                        <QuestsView 
                            quests={player.quests}
                            playerData={player}
                            addQuest={addQuest}
                            completeQuest={handleQuestComplete} 
                            failQuest={failQuest}
                            resetQuest={() => {}}
                            deleteQuest={deleteQuest}
                            tutorialStep={player.tutorialStep}
                            onTutorialAction={advanceTutorial}
                            onAnalysisEvent={handleQuestAnalysisEvent}
                            onToggleNav={setShowNav}
                        />
                    </Suspense>
                </motion.div>
            )}

            {/* REPLACED REWARDS WITH ARMORY */}
            {activeTab === 'ARMORY' && (
                <motion.div key="armory" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Suspense fallback={<ShadowLoading />}>
                        <ArmoryView 
                            gold={player.gold}
                            unlockedOutfits={player.unlockedOutfits}
                            equippedOutfitId={player.equippedOutfitId}
                            onPurchase={purchaseOutfit}
                            onEquip={equipOutfit}
                        />
                    </Suspense>
                </motion.div>
            )}

            {activeTab === 'ALLIANCE' && (
                <motion.div key="alliance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Suspense fallback={<ShadowLoading />}>
                        <GuildsView 
                            player={player} 
                            onJoin={(id) => setPlayer({...player, allianceId: id})}
                            onLeave={() => setPlayer({...player, allianceId: undefined})}
                        />
                    </Suspense>
                </motion.div>
            )}

            {activeTab === 'HEALTH' && (
                <motion.div key="health" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Suspense fallback={<ShadowLoading />}>
                        <HealthView 
                            healthProfile={player.healthProfile}
                            onSaveProfile={saveHealthProfile}
                            onCompleteWorkout={completeWorkoutSession}
                            onFailWorkout={failWorkout}
                            onLogMeal={logMeal}
                            onDeleteMeal={deleteMeal}
                            playerData={player}
                            onTutorialAction={advanceTutorial}
                            tutorialStep={player.tutorialStep}
                            onToggleNav={(visible) => setShowNav(visible)}
                            onConsumeKey={consumeKey}
                        />
                    </Suspense>
                </motion.div>
            )}

            {activeTab === 'RANKING' && (
                <motion.div key="ranking" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Suspense fallback={<ShadowLoading />}>
                        <RankingView currentPlayer={player} />
                    </Suspense>
                </motion.div>
            )}
        </AnimatePresence>
      </Layout>
    </>
  );
};

export default App;