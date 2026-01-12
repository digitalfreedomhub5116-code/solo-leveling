import { useState, useEffect, useCallback } from 'react';
import { PlayerData, Quest, SystemNotification, NotificationType, ShopItem, ActivityLog, Rank, CoreStats, HealthProfile, AdminExercise } from '../types';

export const DUMMY_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-human-body-scan-9662-large.mp4';

export const sanitizeVideoUrl = (url?: string) => {
  if (!url) return DUMMY_VIDEO;
  // Ensure we don't break the app with bad URLs, though simple return is fine for now
  return url;
};

const INITIAL_PLAYER_DATA: PlayerData = {
  isConfigured: false,
  name: 'Hunter',
  level: 1,
  currentXp: 0,
  requiredXp: 100,
  totalXp: 0,
  dailyXp: 0,
  rank: 'E',
  gold: 0,
  streak: 1,
  stats: { strength: 1, intelligence: 1, focus: 1, social: 1, willpower: 1 },
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
  shopItems: [],
  awakening: { vision: [], antiVision: [] },
  personalBests: {},
  exerciseDatabase: [], 
  focusVideos: {}
};

export const useSystem = () => {
  const [player, setPlayer] = useState<PlayerData>(INITIAL_PLAYER_DATA);
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
     // Placeholder for daily quest logic
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
    if (newData.streak === undefined) newData.streak = 1;

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

  // Load Data
  useEffect(() => {
    const savedData = localStorage.getItem('shadow_system_data_v2');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const processed = processSystemLogic(parsed);
        setPlayer({ ...INITIAL_PLAYER_DATA, ...processed });
      } catch (e) {
        console.error("Save Corrupt", e);
        setPlayer(INITIAL_PLAYER_DATA);
      }
    } else {
        setPlayer(INITIAL_PLAYER_DATA);
    }
    setIsLoaded(true);
  }, [processSystemLogic]);

  // Persist Data
  useEffect(() => {
    if (isLoaded) {
        localStorage.setItem('shadow_system_data_v2', JSON.stringify(player));
    }
  }, [player, isLoaded]);

  // Actions
  const registerUser = (profile: Partial<PlayerData>) => {
      setPlayer(prev => ({ ...prev, ...profile, isConfigured: true }));
      addNotification("Identity Confirmed. System Link Established.", "SUCCESS");
  };

  const updateProfile = (data: { name: string; job: string; title: string }) => {
      setPlayer(prev => ({ ...prev, ...data }));
      addNotification("Profile Updated", "SUCCESS");
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

          const reward = asMini ? Math.floor(quest.xpReward * 0.1) : quest.xpReward;
          const logMsg = asMini ? `Quest Activated (Mini): ${quest.title} (+${reward} XP)` : `Quest Complete: ${quest.title} (+${reward} XP)`;
          const statKey = quest.category;
          const newStats = { ...prev.stats };
          newStats[statKey] += 1;
          const goldReward = asMini ? 5 : 20;
          
          let newXp = prev.currentXp + reward;
          let newTotalXp = prev.totalXp + reward;
          let newDailyXp = (prev.dailyXp || 0) + reward;
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
               addNotification(`Quest Complete +${reward} XP`, "SUCCESS");
          }

          return {
              ...prev,
              quests: updatedQuests,
              currentXp: newXp,
              totalXp: newTotalXp,
              dailyXp: newDailyXp,
              level: newLevel,
              requiredXp: newRequiredXp,
              gold: prev.gold + goldReward,
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

  const completeWorkoutSession = (completed: number, total: number, results: Record<string, number>, intensityModifier: boolean) => {
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
      setPlayer(prev => ({ ...prev, isConfigured: false }));
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
    completeWorkoutSession,
    logout,
    updateExerciseDatabase,
    updateFocusVideos
  };
};
