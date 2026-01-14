
import { useState, useEffect, useCallback } from 'react';
import { PlayerData, Quest, SystemNotification, NotificationType, ShopItem, ActivityLog, Rank, CoreStats, HealthProfile, AdminExercise, ProgressPhoto, MealLog } from '../types';

export const DUMMY_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-human-body-scan-9662-large.mp4';

export const sanitizeVideoUrl = (url?: string) => {
  if (!url) return DUMMY_VIDEO;
  // Ensure we don't break the app with bad URLs, though simple return is fine for now
  return url;
};

// Check if string looks like a video embed URL or just a file path
// Logic updated to allow query parameters at end of file extension
export const isEmbed = (url: string) => {
    if (!url) return false;
    const clean = url.toLowerCase();
    // Matches .mp4, .webm, .ogg, .mov followed by end of string OR a query parameter start
    const hasDirectExtension = /\.(mp4|webm|ogg|mov)($|\?)/.test(clean);
    const isKnownEmbed = clean.includes('youtube') || clean.includes('youtu.be') || clean.includes('vimeo');
    return isKnownEmbed || !hasDirectExtension; // If it doesn't look like a file, assume it's a web page/embed
};

const INITIAL_PLAYER_DATA: PlayerData = {
  isConfigured: false,
  tutorialStep: 0,
  tutorialComplete: false,
  name: 'Hunter',
  level: 1,
  currentXp: 0,
  requiredXp: 100,
  totalXp: 0,
  dailyXp: 0,
  rank: 'E',
  gold: 0,
  streak: 1,
  stats: { strength: 0, intelligence: 0, focus: 0, social: 0, willpower: 0 },
  lastStatUpdate: { strength: Date.now(), intelligence: Date.now(), focus: Date.now(), social: Date.now(), willpower: Date.now() },
  history: [],
  hp: 100,
  maxHp: 100,
  mp: 100,
  maxMp: 100,
  fatigue: 0,
  job: 'None',
  title: 'None',
  lastLoginDate: new Date().toISOString().split('T')[0],
  dailyQuestComplete: false,
  isPenaltyActive: false,
  logs: [],
  quests: [],
  shopItems: [
    {
        id: 's_def_1',
        title: 'Cheat Meal (Biryani)',
        description: 'Guilt-free feast.',
        cost: 200,
        icon: 'pizza'
    },
    {
        id: 's_def_2',
        title: 'OTT Subscription',
        description: '1 Month of Netflix/Prime/Hotstar.',
        cost: 300,
        icon: 'tv'
    },
    {
        id: 's_def_3',
        title: 'Cinema Outing',
        description: 'Movie ticket with friends.',
        cost: 500,
        icon: 'users'
    },
    {
        id: 's_def_4',
        title: 'Gaming Session',
        description: '3 hours of uninterrupted play.',
        cost: 150,
        icon: 'gamepad'
    },
    {
        id: 's_def_5',
        title: 'Tech Fund',
        description: 'Contribution to new gadget savings.',
        cost: 1000,
        icon: 'shopping-bag'
    }
  ],
  awakening: { vision: [], antiVision: [] },
  personalBests: {},
  exerciseDatabase: [], 
  focusVideos: {},
  nutritionLogs: []
};

// Helper to ensure clean initial state copy
const getInitialState = (): PlayerData => JSON.parse(JSON.stringify(INITIAL_PLAYER_DATA));

export const useSystem = () => {
  const [player, setPlayer] = useState<PlayerData>(getInitialState());
  const [isLoaded, setIsLoaded] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Helpers
  const getLocalDate = () => new Date().toISOString().split('T')[0];

  const createLog = (message: string, type: ActivityLog['type']): ActivityLog => ({
    id: Math.random().toString(36).substr(2, 9),
    message,
    timestamp: Date.now(),
    type
  });

  const calculateRank = (level: number): Rank => {
    if (level >= 100) return 'S';
    if (level >= 75) return 'A';
    if (level >= 50) return 'B';
    if (level >= 25) return 'C';
    if (level >= 10) return 'D';
    return 'E';
  };

  const addNotification = useCallback((message: string, type: NotificationType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const checkDailyQuests = (data: PlayerData): PlayerData => {
     // Placeholder for daily quest logic extension if needed
     return data;
  };

  const processSystemLogic = useCallback((data: PlayerData): PlayerData => {
    const today = getLocalDate();
    const lastLogin = data.lastLoginDate;
    const now = Date.now();
    let newData = { ...data };
    let hasChanges = false;

    if (!newData.logs) newData.logs = [];
    if (!newData.quests) newData.quests = [];
    if (!newData.history) newData.history = [];
    if (!newData.nutritionLogs) newData.nutritionLogs = [];
    if (newData.streak === undefined) newData.streak = 1;
    // Default tutorial state if missing from old saves
    if (newData.tutorialStep === undefined) newData.tutorialStep = 0;
    if (newData.tutorialComplete === undefined) newData.tutorialComplete = false;

    if (today !== lastLogin) {
      hasChanges = true;
      
      const historyEntry = {
        date: lastLogin,
        stats: { ...data.stats },
        totalXp: data.totalXp,
        dailyXp: data.dailyXp || 0
      };
      
      newData.history = [historyEntry, ...newData.history].slice(0, 30);
      newData.dailyXp = 0;
      
      // DAILY RESET: Clear Nutrition Logs
      newData.nutritionLogs = [];
      
      let resetCount = 0;
      newData.quests = newData.quests.map(q => {
        if (q.isDaily && q.isCompleted) {
            resetCount++;
            return { ...q, isCompleted: false, completedAsMini: false }; 
        }
        return q;
      });
      if (resetCount > 0) {
        newData.logs.unshift(createLog(`Daily Reset: ${resetCount} Quests Refreshed`, 'SYSTEM'));
      }

      newData = checkDailyQuests(newData);

      const lastLoginDateObj = new Date(lastLogin);
      const todayDateObj = new Date(today);
      const diffTime = Math.abs(todayDateObj.getTime() - lastLoginDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
          newData.streak += 1;
          const streakGold = Math.min(500, newData.streak * 50);
          newData.gold += streakGold;
          const manaGrowth = 2;
          newData.maxMp += manaGrowth;
          newData.mp = newData.maxMp; 
          
          newData.logs.unshift(createLog(`Streak Active: ${newData.streak} Days. +${streakGold} G, +${manaGrowth} Max MP.`, 'STREAK'));
          addNotification(`Daily Streak! +${streakGold} G, +${manaGrowth} Max MP`, 'SUCCESS');
      } else if (diffDays > 1) {
          if (newData.streak > 1) {
             newData.logs.unshift(createLog(`Streak Broken (${newData.streak} days). Reset to 1.`, 'PENALTY'));
             addNotification("Streak Broken. Momentum Lost.", 'WARNING');
          }
          newData.streak = 1;
          const baseGold = 50;
          newData.gold += baseGold;
          newData.mp = newData.maxMp; 
          newData.logs.unshift(createLog(`Daily Login. +${baseGold} G.`, 'SYSTEM'));
      }

      newData.lastLoginDate = today;
    }

    const DECAY_THRESHOLD = 172800000; 
    const statKeys = Object.keys(newData.stats) as (keyof CoreStats)[];
    statKeys.forEach((key) => {
      const lastActivity = newData.lastStatUpdate[key];
      if (now - lastActivity > DECAY_THRESHOLD) {
        if (newData.stats[key] > 1) {
          newData.stats[key] -= 1;
          newData.lastStatUpdate[key] = now;
          hasChanges = true;
          newData.logs.unshift(createLog(`Stat Decay: -1 ${key.toUpperCase()}`, 'SYSTEM'));
          addNotification(`Stat Decay Detected: ${key.toUpperCase()} -1`, 'WARNING');
        }
      }
    });

    if (newData.isPenaltyActive) {
       newData.isPenaltyActive = false;
       newData.penaltyEndTime = undefined;
       newData.penaltyTask = undefined;
       hasChanges = true;
    }

    if (hasChanges) newData.rank = calculateRank(newData.level);
    if (newData.logs.length > 20) newData.logs = newData.logs.slice(0, 20);

    return newData;
  }, [addNotification]);

  // Init - Auto Login Check
  useEffect(() => {
    const lastUser = localStorage.getItem('shadow_system_last_user');
    
    if (lastUser) {
        const key = `shadow_system_v4_${lastUser}`;
        const savedData = localStorage.getItem(key);
        
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Process logic to handle day changes while offline
                const processed = processSystemLogic(parsed);
                setPlayer({ ...processed, isConfigured: true });
                console.log(`Auto-login successful: ${lastUser}`);
            } catch (e) {
                console.error("Auto-login failed: Data corruption", e);
            }
        }
    }
    
    // System ready
    setIsLoaded(true);
  }, [processSystemLogic]);

  // Persist Data (User-Specific Key)
  useEffect(() => {
    if (isLoaded && player.isConfigured && player.username) {
        const key = `shadow_system_v4_${player.username}`;
        localStorage.setItem(key, JSON.stringify(player));
    }
  }, [player, isLoaded]);

  // Actions
  const registerUser = (profile: Partial<PlayerData>) => {
      const username = profile.username || profile.name || 'Hunter';
      const key = `shadow_system_v4_${username}`;
      const savedData = localStorage.getItem(key);
      
      let finalData: PlayerData;

      if (savedData) {
          try {
              const parsed = JSON.parse(savedData);
              const processed = processSystemLogic(parsed);
              // CRITICAL: Prefer local game state (stats, xp) over auth profile data to prevent reset/corruption
              finalData = { 
                  ...processed, 
                  // Only update identity fields from auth profile
                  name: profile.name || processed.name,
                  username: profile.username || processed.username,
                  pin: profile.pin || processed.pin,
                  userId: profile.userId || processed.userId,
                  // Explicitly preserve local stats if they exist
                  stats: processed.stats || INITIAL_PLAYER_DATA.stats,
                  isConfigured: true 
              };
              addNotification(`Welcome back, ${finalData.username || finalData.name}.`, "SUCCESS");
          } catch (e) {
              console.error("Save Corrupt", e);
              // Fallback to fresh if corrupt
              finalData = { ...getInitialState(), ...profile, username, isConfigured: true };
          }
      } else {
          // New User Setup - Stats will be 0 from getInitialState()
          finalData = { ...getInitialState(), ...profile, username, isConfigured: true };
          addNotification("Identity Confirmed. System Link Established.", "SUCCESS");
      }
      
      // Store Last User for Auto-Login
      localStorage.setItem('shadow_system_last_user', username);
      
      setPlayer(finalData);
  };

  const updateProfile = (data: { name: string; job: string; title: string }) => {
      setPlayer(prev => ({ ...prev, ...data }));
      addNotification("Profile Updated", "SUCCESS");
  };

  // --- TUTORIAL ACTIONS ---
  const advanceTutorial = (step: number) => {
      setPlayer(prev => ({
          ...prev,
          tutorialStep: step
      }));
  };

  const completeTutorial = () => {
      setPlayer(prev => ({
          ...prev,
          tutorialComplete: true,
          tutorialStep: 999
      }));
      addNotification("System Tutorial Complete. Full Access Granted.", "SUCCESS");
  };

  const gainXp = (amount: number) => {
      setPlayer(prev => {
          let newXp = prev.currentXp + amount;
          let newTotalXp = prev.totalXp + amount;
          let newDailyXp = (prev.dailyXp || 0) + amount;
          let newLevel = prev.level;
          let newRequiredXp = prev.requiredXp;
          let leveledUp = false;

          while (newXp >= newRequiredXp) {
              newXp -= newRequiredXp;
              newLevel++;
              newRequiredXp = Math.floor(newRequiredXp * 1.5);
              leveledUp = true;
          }

          if (leveledUp) {
              addNotification(`LEVEL UP! REACHED LEVEL ${newLevel}`, "LEVEL_UP");
              return {
                  ...prev,
                  currentXp: newXp,
                  totalXp: newTotalXp,
                  dailyXp: newDailyXp,
                  level: newLevel,
                  requiredXp: newRequiredXp,
                  hp: prev.maxHp,
                  mp: prev.maxMp,
                  logs: [createLog(`Reached Level ${newLevel}`, 'LEVEL_UP'), ...prev.logs]
              };
          }

          return {
              ...prev,
              currentXp: newXp,
              totalXp: newTotalXp,
              dailyXp: newDailyXp
          };
      });
  };

  const completeDaily = () => {};

  const addQuest = (quest: Quest) => {
      setPlayer(prev => ({
          ...prev,
          quests: [quest, ...prev.quests],
          logs: [createLog(`New Quest: ${quest.title}`, 'SYSTEM'), ...prev.logs]
      }));
      addNotification("New Quest Assigned", "SYSTEM");
  };

  const completeQuest = (id: string, asMini: boolean = false) => {
      setPlayer(prev => {
          const quest = prev.quests.find(q => q.id === id);
          if (!quest || quest.isCompleted) return prev;

          // REWARD SCALING TABLE
          const RANK_REWARDS: Record<Rank, { xp: number, gold: number }> = {
              'E': { xp: 10, gold: 10 },
              'D': { xp: 25, gold: 25 },
              'C': { xp: 50, gold: 50 },
              'B': { xp: 100, gold: 100 },
              'A': { xp: 200, gold: 250 },
              'S': { xp: 400, gold: 300 }
          };

          const tier = RANK_REWARDS[quest.rank] || RANK_REWARDS['E'];

          // Use the quest's stored XP if available (for custom values), otherwise default to tier
          const baseXp = quest.xpReward > 0 ? quest.xpReward : tier.xp;
          // Force gold to match tier structure
          const baseGold = tier.gold;

          const rewardXp = asMini ? Math.floor(baseXp * 0.1) : baseXp;
          const rewardGold = asMini ? Math.floor(baseGold * 0.1) : baseGold;

          const logMsg = asMini 
            ? `Quest Activated (Mini): ${quest.title} (+${rewardXp} XP, +${rewardGold} G)` 
            : `Quest Complete: ${quest.title} (+${rewardXp} XP, +${rewardGold} G)`;
            
          const statKey = quest.category;
          const newStats = { ...prev.stats };
          newStats[statKey] += 1;
          
          let newXp = prev.currentXp + rewardXp;
          let newTotalXp = prev.totalXp + rewardXp;
          let newDailyXp = (prev.dailyXp || 0) + rewardXp;
          let newLevel = prev.level;
          let newRequiredXp = prev.requiredXp;
          let leveledUp = false;

          while (newXp >= newRequiredXp) {
              newXp -= newRequiredXp;
              newLevel++;
              newRequiredXp = Math.floor(newRequiredXp * 1.5);
              leveledUp = true;
          }

          const updatedQuests = prev.quests.map(q => q.id === id ? { ...q, isCompleted: true, completedAsMini: asMini } : q);

          if (leveledUp) {
               addNotification(`LEVEL UP! REACHED LEVEL ${newLevel}`, "LEVEL_UP");
          } else {
               addNotification(`Quest Complete +${rewardXp} XP, +${rewardGold} G`, "SUCCESS");
          }

          return {
              ...prev,
              quests: updatedQuests,
              currentXp: newXp,
              totalXp: newTotalXp,
              dailyXp: newDailyXp,
              level: newLevel,
              requiredXp: newRequiredXp,
              gold: prev.gold + rewardGold,
              stats: newStats,
              lastStatUpdate: { ...prev.lastStatUpdate, [statKey]: Date.now() },
              logs: [createLog(logMsg, 'XP'), ...prev.logs]
          };
      });
  };

  const failQuest = (id: string) => {
       setPlayer(prev => {
           const quest = prev.quests.find(q => q.id === id);
           if (!quest) return prev;
           return {
               ...prev,
               quests: prev.quests.filter(q => q.id !== id),
               logs: [createLog(`Quest Failed: ${quest.title}`, 'PENALTY'), ...prev.logs]
           };
       });
       addNotification("Quest Failed", "WARNING");
  };
  
  const resetQuest = (id: string) => {
      setPlayer(prev => ({
          ...prev,
          quests: prev.quests.map(q => q.id === id ? { ...q, isCompleted: false, completedAsMini: false } : q)
      }));
  };

  const deleteQuest = (id: string) => {
      setPlayer(prev => ({
          ...prev,
          quests: prev.quests.filter(q => q.id !== id)
      }));
  };

  const purchaseItem = (item: ShopItem) => {
      setPlayer(prev => {
          if (prev.gold < item.cost) {
              addNotification("Insufficient Gold", "WARNING");
              return prev;
          }
          return {
              ...prev,
              gold: prev.gold - item.cost,
              logs: [createLog(`Purchased: ${item.title}`, 'PURCHASE'), ...prev.logs]
          };
      });
      addNotification("Item Purchased", "PURCHASE");
  };

  const addShopItem = (item: ShopItem) => {
      setPlayer(prev => ({
          ...prev,
          shopItems: [...prev.shopItems, item]
      }));
  };

  const removeShopItem = (id: string) => {
      setPlayer(prev => ({
          ...prev,
          shopItems: prev.shopItems.filter(i => i.id !== id)
      }));
  };

  const saveHealthProfile = (profile: HealthProfile, identity: string) => {
      setPlayer(prev => ({
          ...prev,
          healthProfile: profile,
          identity: identity,
          logs: [createLog(`Health Protocol Updated: ${identity}`, 'SYSTEM'), ...prev.logs]
      }));
      addNotification("Health Profile Saved", "SUCCESS");
  };

  const addProgressPhoto = (photo: ProgressPhoto) => {
      setPlayer(prev => {
          if (!prev.healthProfile) return prev;
          
          const currentPhotos = prev.healthProfile.progressPhotos || [];
          return {
              ...prev,
              healthProfile: {
                  ...prev.healthProfile,
                  progressPhotos: [...currentPhotos, photo]
              },
              logs: [createLog(`Progress Photo Uploaded`, 'SYSTEM'), ...prev.logs]
          };
      });
      addNotification("Scan Uploaded. Sync Complete.", "SUCCESS");
  };

  const deleteProgressPhoto = (id: string) => {
      setPlayer(prev => {
          if (!prev.healthProfile || !prev.healthProfile.progressPhotos) return prev;
          
          return {
              ...prev,
              healthProfile: {
                  ...prev.healthProfile,
                  progressPhotos: prev.healthProfile.progressPhotos.filter(p => p.id !== id)
              }
          };
      });
      addNotification("Record Deleted.", "SYSTEM");
  };

  // --- NUTRITION LOGIC ---
  const logMeal = (meal: MealLog) => {
      setPlayer(prev => {
          return {
              ...prev,
              nutritionLogs: [...(prev.nutritionLogs || []), meal],
              logs: [createLog(`Nutrition Logged: ${meal.label} (${meal.totalCalories} kcal)`, 'SYSTEM'), ...prev.logs]
          };
      });
      addNotification(`Meal Logged: ${meal.totalCalories} kcal`, "SUCCESS");
  };

  const deleteMeal = (id: string) => {
      setPlayer(prev => ({
          ...prev,
          nutritionLogs: (prev.nutritionLogs || []).filter(log => log.id !== id)
      }));
      addNotification("Meal Record Deleted", "SYSTEM");
  };

  const completeWorkoutSession = (completed: number, _total: number, results: Record<string, number>, intensityModifier: boolean) => {
      const baseXp = 100;
      const bonus = completed * 10;
      const intensityBonus = intensityModifier ? 50 : 0;
      const totalReward = baseXp + bonus + intensityBonus;
      
      gainXp(totalReward);
      
      setPlayer(prev => ({
          ...prev,
          stats: { ...prev.stats, strength: prev.stats.strength + 1 },
          lastStatUpdate: { ...prev.lastStatUpdate, strength: Date.now() },
          personalBests: { ...prev.personalBests, ...results },
          logs: [createLog(`Workout Complete: +${totalReward} XP`, 'WORKOUT'), ...prev.logs]
      }));
      addNotification(`Workout Complete! +${totalReward} XP`, "SUCCESS");
  };

  const failWorkout = () => {
      addNotification("Workout Aborted. No XP awarded.", "WARNING");
  };

  const logout = () => {
      // Clear persistence token
      localStorage.removeItem('shadow_system_last_user');
      // Reset to unconfigured state (which will show AuthView). 
      setPlayer(getInitialState());
  };

  const updateExerciseDatabase = (exercises: AdminExercise[]) => {
      setPlayer(prev => ({
          ...prev,
          exerciseDatabase: exercises
      }));
  };

  const updateFocusVideos = (videos: Record<string, string>) => {
      setPlayer(prev => ({
          ...prev,
          focusVideos: videos
      }));
  };

  return {
    player,
    isLoaded,
    notifications,
    registerUser,
    updateProfile,
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
    addNotification,
    saveHealthProfile,
    addProgressPhoto,
    deleteProgressPhoto,
    logMeal,
    deleteMeal,
    completeWorkoutSession,
    logout,
    updateExerciseDatabase,
    updateFocusVideos,
    advanceTutorial,
    completeTutorial
  };
};
