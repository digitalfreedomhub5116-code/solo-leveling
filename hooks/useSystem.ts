
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PlayerData, Quest, ShopItem, SystemNotification, NotificationType, 
  ActivityLog, HealthProfile, ProgressPhoto, MealLog, WorkoutDay, AdminExercise, DailyReward
} from '../types';
import { supabase } from '../lib/supabase';
import { playSystemSoundEffect } from '../utils/soundEngine';

// Helper for Video URLs
export const isEmbed = (url: string) => {
    return url.includes('youtube.com/embed') || url.includes('player.vimeo.com');
};

const DEFAULT_PLAYER: PlayerData = {
  isConfigured: false,
  tutorialStep: 0,
  tutorialComplete: false,
  name: '',
  level: 1,
  currentXp: 0,
  requiredXp: 100,
  totalXp: 0,
  dailyXp: 0,
  rank: 'E',
  gold: 0,
  keys: 0,
  streak: 0,
  stats: { strength: 10, intelligence: 10, focus: 10, social: 10, willpower: 10 },
  dailyStats: { strength: 0, intelligence: 0, focus: 0, social: 0, willpower: 0 },
  weeklyStats: { strength: 0, intelligence: 0, focus: 0, social: 0, willpower: 0 },
  monthlyStats: { strength: 0, intelligence: 0, focus: 0, social: 0, willpower: 0 },
  lastStatUpdate: { strength: 0, intelligence: 0, focus: 0, social: 0, willpower: 0 },
  lastDailyReset: Date.now(),
  lastWeeklyReset: Date.now(),
  lastMonthlyReset: Date.now(),
  history: [],
  hp: 100,
  maxHp: 100,
  mp: 100,
  maxMp: 100,
  fatigue: 0,
  job: 'Civilian',
  title: 'None',
  lastLoginDate: '', // Empty initially
  dailyQuestComplete: false,
  isPenaltyActive: false,
  lastDungeonEntry: 0,
  logs: [],
  quests: [],
  shopItems: [],
  awakening: { vision: [], antiVision: [] },
  personalBests: {},
  nutritionLogs: [],
  exerciseDatabase: [],
  focusVideos: {},
  customProtocols: {},
  tournament: { pendingReward: null }
};

export const useSystem = () => {
  const [player, setPlayer] = useState<PlayerData>(() => {
    const saved = localStorage.getItem('biosync_player_v2');
    return saved ? JSON.parse(saved) : DEFAULT_PLAYER;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  
  // Ref to track if initial load is done to prevent overwriting cloud data with defaults
  const isLoaded = useRef(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('biosync_player_v2', JSON.stringify(player));
  }, [player]);

  // --- GLOBAL VIDEO SYNC ---
  useEffect(() => {
    const fetchGlobalVideos = async () => {
      try {
        const { data, error } = await supabase.from('global_videos').select('*');
        if (error) return;
        
        if (data && data.length > 0) {
          const videoMap: Record<string, string> = {};
          const exerciseDB: AdminExercise[] = [];

          data.forEach((row: any) => {
            if (row.key && row.url) {
              videoMap[row.key] = row.url;
              exerciseDB.push({
                  id: row.id?.toString() || row.key,
                  name: row.key,
                  videoUrl: row.url,
                  imageUrl: '',
                  muscleGroup: 'General',
                  difficulty: 'Intermediate',
                  caloriesBurn: 0
              });
            }
          });

          setPlayer(prev => ({
            ...prev,
            focusVideos: { ...prev.focusVideos, ...videoMap },
            exerciseDatabase: exerciseDB
          }));
        }
      } catch (err) {
        console.error("Global Video Sync Error", err);
      }
    };

    fetchGlobalVideos();
  }, []);

  // Sync to Cloud (UPSERT)
  const syncToCloud = async (data: PlayerData) => {
    if (data.userId && !data.userId.startsWith('local-')) {
        try {
            // Using upsert ensures we create the row if it's missing (e.g. race condition on signup)
            // or update it if it exists.
            await supabase.from('profiles').upsert({
                id: data.userId,
                username: data.username || 'Hunter',
                name: data.name || 'Hunter',
                keys: data.keys,
                raw_data: data, // Save the entire state blob
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
            
            console.log("Cloud Sync Success");
        } catch (e) {
            console.error("Cloud Sync Error", e);
        }
    }
  };

  // Auto-Sync Effect (Debounced)
  useEffect(() => {
      if (!player.userId || player.userId.startsWith('local-')) return;
      
      const timer = setTimeout(() => {
          syncToCloud(player);
      }, 2000); // 2s debounce to save after changes stop

      return () => clearTimeout(timer);
  }, [player]);

  const addNotification = (message: string, type: NotificationType) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const createLog = (message: string, type: ActivityLog['type']): ActivityLog => ({
      id: Math.random().toString(36).substring(2, 9),
      message,
      timestamp: Date.now(),
      type
  });

  // --- ACTIONS ---

  const registerUser = (profile: any) => {
      setPlayer(prev => {
          // Merge incoming profile data (from cloud) with default structure to ensure all fields exist
          // Priority: Cloud Data > Existing State > Default
          const cloudData = profile.raw_data || {};
          
          let currentKeys = profile.keys !== undefined ? profile.keys : (cloudData.keys || prev.keys);

          // --- SPECIAL OVERRIDE FOR psp5116 ---
          if (profile.username === 'psp5116' || cloudData.username === 'psp5116') {
              if (currentKeys < 100) {
                  currentKeys = 100;
              }
          }
          // ------------------------------------

          // --- NEW USER WELCOME QUESTS (24H Expiry) ---
          let currentQuests = cloudData.quests || prev.quests || [];
          
          // Only inject if it's a fresh registration (no cloud data) and quest list is empty
          if (!profile.raw_data && currentQuests.length === 0) {
             const now = Date.now();
             const oneDay = 24 * 60 * 60 * 1000;
             currentQuests = [
                 {
                     id: `init_q1_${now}`,
                     title: "System Calibration",
                     description: "Review your Stats Matrix to sync with the System.",
                     rank: 'E',
                     priority: 'HIGH',
                     category: 'intelligence',
                     xpReward: 50,
                     isCompleted: false,
                     createdAt: now,
                     expiresAt: now + oneDay,
                     isDaily: false,
                     miniQuest: "Check Stats"
                 },
                 {
                     id: `init_q2_${now}`,
                     title: "Physical Baseline",
                     description: "Perform 10 Push-ups.",
                     rank: 'E',
                     priority: 'MEDIUM',
                     category: 'strength',
                     xpReward: 50,
                     isCompleted: false,
                     createdAt: now,
                     expiresAt: now + oneDay,
                     isDaily: false,
                     miniQuest: "10 Push-ups"
                 },
                 {
                     id: `init_q3_${now}`,
                     title: "Hydration Sync",
                     description: "Consume 500ml of water.",
                     rank: 'E',
                     priority: 'MEDIUM',
                     category: 'willpower',
                     xpReward: 50,
                     isCompleted: false,
                     createdAt: now,
                     expiresAt: now + oneDay,
                     isDaily: false,
                     miniQuest: "Drink Water"
                 }
             ];
          }
          // -------------------------------------------

          const updated = { 
              ...DEFAULT_PLAYER, // Start with defaults to fill gaps
              ...prev,           // Override with current local state (if any)
              ...cloudData,      // Override with Cloud Data
              userId: profile.id || prev.userId,
              name: profile.name || cloudData.name || prev.name,
              keys: currentKeys,
              quests: currentQuests,
              isConfigured: true 
          };
          
          return updated;
      });
      playSystemSoundEffect('SYSTEM');
  };

  const logout = async () => {
      try {
          // 1. Force a final Sync to Cloud
          if (player.userId && !player.userId.startsWith('local-')) {
              console.log("Saving final state...");
              await syncToCloud(player);
          }
          
          // 2. Sign out of Supabase
          await supabase.auth.signOut();
          
          // 3. Clear Local Storage
          localStorage.removeItem('biosync_player_v2');
          
          // 4. Redirect
          window.location.href = '/';
      } catch (err) {
          console.error("Logout Error:", err);
          // Force reload anyway
          localStorage.removeItem('biosync_player_v2');
          window.location.href = '/';
      }
  };

  // Used for traps/revives (consumes `amount` keys, default 1)
  const consumeKey = async (amount: number = 1): Promise<boolean> => {
      if (player.keys >= amount) {
          const newKeys = player.keys - amount;
          const updated = { ...player, keys: newKeys };
          setPlayer(updated); 
          // Immediate sync for currency changes
          await syncToCloud(updated);
          return true;
      }
      return false;
  };

  // Used for Dungeon Entry (Logic for Free vs Paid)
  const enterDungeon = async (isFree: boolean): Promise<boolean> => {
      if (isFree) {
          // Update the last entry time to start 24h cooldown
          const updated = { ...player, lastDungeonEntry: Date.now() };
          setPlayer(updated);
          syncToCloud(updated);
          return true;
      } else {
          // Paid entry: Costs 3 keys, does NOT reset the free timer
          const COST = 3;
          if (player.keys >= COST) {
              const newKeys = player.keys - COST;
              const updated = { 
                  ...player, 
                  keys: newKeys,
                  logs: [createLog(`Dungeon Access Purchased (-${COST} Keys)`, 'PURCHASE'), ...player.logs]
              };
              setPlayer(updated); 
              await syncToCloud(updated);
              return true;
          }
          return false;
      }
  };

  const checkDailyLogin = (): DailyReward | null => {
      const today = new Date().toISOString().split('T')[0];
      
      if (player.lastLoginDate === today) {
          return null;
      }

      let reward: DailyReward;

      if (!player.lastLoginDate) {
          reward = {
              type: 'WELCOME_KEYS',
              amount: 3,
              message: 'Welcome Bonus: 3 Keys Acquired'
          };
      } else {
          const rand = Math.random();
          if (rand < 0.4) {
              reward = { type: 'GOLD', amount: 100, message: 'Daily Stipend: 100 Gold' };
          } else if (rand < 0.7) {
              reward = { type: 'XP', amount: 100, message: 'Experience Boost: 100 XP' };
          } else if (rand < 0.9) {
              reward = { type: 'KEYS', amount: 1, message: 'Dungeon Key Found' };
          } else {
              reward = { type: 'DUNGEON_PASS', amount: 3, message: 'Dungeon Pass (3 Keys)' };
          }
      }

      setPlayer(prev => {
          let { currentXp, requiredXp, level, totalXp, dailyXp, gold, keys } = prev;
          
          if (reward.type === 'GOLD') gold += reward.amount;
          if (reward.type === 'WELCOME_KEYS' || reward.type === 'KEYS' || reward.type === 'DUNGEON_PASS') keys += reward.amount;
          if (reward.type === 'XP') {
              currentXp += reward.amount;
              totalXp += reward.amount;
              dailyXp += reward.amount;
          }

          let leveledUp = false;
          if (reward.type === 'XP') {
              while (currentXp >= requiredXp) {
                  currentXp -= requiredXp;
                  level++;
                  requiredXp = Math.floor(requiredXp * 1.2);
                  leveledUp = true;
              }
          }

          const logs = [createLog(`Daily Reward: ${reward.message}`, 'SYSTEM'), ...prev.logs];
          if (leveledUp) {
              logs.unshift(createLog(`LEVEL UP! REACHED LEVEL ${level}`, 'LEVEL_UP'));
              playSystemSoundEffect('LEVEL_UP');
          }

          const updated = {
              ...prev,
              lastLoginDate: today,
              gold,
              keys,
              currentXp, requiredXp, level, totalXp, dailyXp,
              logs
          };
          
          if (leveledUp) {
              updated.hp = updated.maxHp;
              updated.mp = updated.maxMp;
          }

          syncToCloud(updated);
          return updated;
      });

      return reward;
  };

  const deductGold = (amount: number): boolean => {
      if (player.gold >= amount) {
          setPlayer(prev => {
              const updated = { 
                  ...prev, 
                  gold: prev.gold - amount 
              };
              syncToCloud(updated);
              return updated;
          });
          return true;
      }
      return false;
  };

  const addRewards = (gold: number, xp: number, keys: number = 0) => {
      setPlayer(prev => {
          let { currentXp, requiredXp, level, totalXp, dailyXp } = prev;
          
          currentXp += xp;
          totalXp += xp;
          dailyXp += xp;

          let leveledUp = false;
          while (currentXp >= requiredXp) {
              currentXp -= requiredXp;
              level++;
              requiredXp = Math.floor(requiredXp * 1.2);
              leveledUp = true;
          }

          const newLogs = [...prev.logs];
          if (gold > 0 || keys > 0) newLogs.unshift(createLog(`Loot Acquired: ${gold} G, ${keys} Keys, ${xp} XP`, 'LOOT'));
          if (leveledUp) {
              newLogs.unshift(createLog(`LEVEL UP! REACHED LEVEL ${level}`, 'LEVEL_UP'));
              addNotification(`LEVEL UP! You are now Level ${level}`, 'LEVEL_UP');
              playSystemSoundEffect('LEVEL_UP');
          }

          const updated = {
              ...prev,
              gold: prev.gold + gold,
              keys: prev.keys + keys,
              currentXp, requiredXp, level, totalXp, dailyXp,
              logs: newLogs
          };
          
          if (leveledUp) {
              updated.hp = updated.maxHp;
              updated.mp = updated.maxMp;
          }

          syncToCloud(updated);
          return updated;
      });
  };

  const updateFocusVideos = async (videos: Record<string, string>) => {
      setPlayer(prev => {
          const updated = { ...prev, focusVideos: { ...prev.focusVideos, ...videos } };
          return updated;
      });

      try {
          const upsertData = Object.entries(videos).map(([key, url]) => ({
              key,
              url,
              updated_at: new Date().toISOString()
          }));
          await supabase.from('global_videos').upsert(upsertData);
      } catch (err: any) {
          console.error("Failed to sync videos:", err.message);
      }
  };

  const updateCustomProtocols = (protocols: Record<string, WorkoutDay[]>) => {
      setPlayer(prev => {
          const updated = { ...prev, customProtocols: protocols };
          syncToCloud(updated);
          return updated;
      });
  };

  const addXp = (amount: number, source: string) => {
      setPlayer(prev => {
          let { currentXp, requiredXp, level, totalXp, dailyXp } = prev;
          currentXp += amount;
          totalXp += amount;
          dailyXp += amount;

          let leveledUp = false;
          while (currentXp >= requiredXp) {
              currentXp -= requiredXp;
              level++;
              requiredXp = Math.floor(requiredXp * 1.2);
              leveledUp = true;
          }

          const newLogs = [createLog(`Gained ${amount} XP (${source})`, 'XP'), ...prev.logs];
          if (leveledUp) {
              newLogs.unshift(createLog(`LEVEL UP! REACHED LEVEL ${level}`, 'LEVEL_UP'));
              addNotification(`LEVEL UP! You are now Level ${level}`, 'LEVEL_UP');
              playSystemSoundEffect('LEVEL_UP');
          }

          const updated = { ...prev, currentXp, requiredXp, level, totalXp, dailyXp, logs: newLogs };
          if (leveledUp) {
              updated.hp = updated.maxHp;
              updated.mp = updated.maxMp;
          }
          syncToCloud(updated);
          return updated;
      });
  };

  // Quests
  const addQuest = (quest: Quest) => {
      setPlayer(prev => {
          const updated = { ...prev, quests: [quest, ...prev.quests] };
          syncToCloud(updated);
          return updated;
      });
      addNotification("New Quest Protocol Initialized", "SYSTEM");
  };

  const completeQuest = (id: string, asMini: boolean = false) => {
      setPlayer(prev => {
          const quests = [...prev.quests];
          const qIndex = quests.findIndex(q => q.id === id);
          if (qIndex === -1) return prev;

          const quest = quests[qIndex];
          if (quest.isCompleted || quest.failed) return prev;

          const reward = asMini ? Math.floor(quest.xpReward * 0.1) : quest.xpReward;
          const goldReward = asMini ? 5 : 20;

          quests[qIndex] = { ...quest, isCompleted: true, completedAsMini: asMini };

          const stats = { ...prev.stats };
          const dailyStats = { ...prev.dailyStats };
          
          if (quest.category) {
              stats[quest.category] = (stats[quest.category] || 0) + (asMini ? 0.2 : 1);
              dailyStats[quest.category] = (dailyStats[quest.category] || 0) + (asMini ? 0.2 : 1);
          }

          const updated = {
              ...prev,
              quests,
              gold: prev.gold + goldReward,
              stats,
              dailyStats,
              logs: [createLog(`Completed Quest: ${quest.title} (+${reward} XP)`, 'XP'), ...prev.logs]
          };
          
          let { currentXp, requiredXp, level, totalXp, dailyXp } = updated;
          currentXp += reward;
          totalXp += reward;
          dailyXp += reward;
          
          let leveledUp = false;
          while (currentXp >= requiredXp) {
              currentXp -= requiredXp;
              level++;
              requiredXp = Math.floor(requiredXp * 1.2);
              leveledUp = true;
          }
          
          if (leveledUp) {
              updated.logs.unshift(createLog(`LEVEL UP! REACHED LEVEL ${level}`, 'LEVEL_UP'));
              playSystemSoundEffect('LEVEL_UP');
          } else {
              playSystemSoundEffect('SUCCESS');
          }

          updated.currentXp = currentXp;
          updated.requiredXp = requiredXp;
          updated.level = level;
          updated.totalXp = totalXp;
          updated.dailyXp = dailyXp;

          syncToCloud(updated);
          return updated;
      });
  };

  const failQuest = (id: string) => {
      setPlayer(prev => {
          const quests = [...prev.quests];
          const qIndex = quests.findIndex(q => q.id === id);
          if (qIndex === -1) return prev;

          quests[qIndex] = { ...quests[qIndex], failed: true };
          
          const penaltyAmount = 50; 
          let { currentXp } = prev;
          currentXp = Math.max(0, currentXp - penaltyAmount);

          const updated = {
              ...prev,
              quests,
              currentXp,
              logs: [createLog(`Failed Quest: ${quests[qIndex].title} (-${penaltyAmount} XP)`, 'PENALTY'), ...prev.logs]
          };
          syncToCloud(updated);
          return updated;
      });
      playSystemSoundEffect('DANGER');
      addNotification("Quest Failed. Penalty Applied.", "DANGER");
  };

  const resetQuest = (id: string) => {
      setPlayer(prev => {
          const quests = prev.quests.map(q => q.id === id ? { ...q, isCompleted: false, failed: false, completedAsMini: false } : q);
          const updated = { ...prev, quests };
          syncToCloud(updated);
          return updated;
      });
  };

  const deleteQuest = (id: string) => {
      setPlayer(prev => {
          const updated = { ...prev, quests: prev.quests.filter(q => q.id !== id) };
          syncToCloud(updated);
          return updated;
      });
  };

  const purchaseItem = (item: ShopItem) => {
      setPlayer(prev => {
          if (prev.gold < item.cost) {
              addNotification("Insufficient Funds", "WARNING");
              return prev;
          }
          const updated = {
              ...prev,
              gold: prev.gold - item.cost,
              logs: [createLog(`Purchased: ${item.title} (-${item.cost} G)`, 'PURCHASE'), ...prev.logs]
          };
          syncToCloud(updated);
          addNotification(`Acquired: ${item.title}`, "PURCHASE");
          playSystemSoundEffect('PURCHASE');
          return updated;
      });
  };

  const addShopItem = (item: ShopItem) => {
      setPlayer(prev => {
          const updated = { ...prev, shopItems: [...prev.shopItems, item] };
          syncToCloud(updated);
          return updated;
      });
  };

  const removeShopItem = (id: string) => {
      setPlayer(prev => {
          const updated = { ...prev, shopItems: prev.shopItems.filter(i => i.id !== id) };
          syncToCloud(updated);
          return updated;
      });
  };

  const saveHealthProfile = (profile: HealthProfile, identity: string) => {
      setPlayer(prev => {
          const updated = { ...prev, healthProfile: profile, identity };
          syncToCloud(updated);
          return updated;
      });
      addNotification("Biometrics Updated. System Calibrated.", "SUCCESS");
  };

  const addProgressPhoto = (photo: ProgressPhoto) => {
      setPlayer(prev => {
          const profile = prev.healthProfile;
          if (!profile) return prev;
          const photos = [photo, ...(profile.progressPhotos || [])];
          const updated = { ...prev, healthProfile: { ...profile, progressPhotos: photos } };
          syncToCloud(updated);
          return updated;
      });
  };

  const deleteProgressPhoto = (id: string) => {
      setPlayer(prev => {
          const profile = prev.healthProfile;
          if (!profile) return prev;
          const photos = (profile.progressPhotos || []).filter(p => p.id !== id);
          const updated = { ...prev, healthProfile: { ...profile, progressPhotos: photos } };
          syncToCloud(updated);
          return updated;
      });
  };

  const logMeal = (meal: MealLog) => {
      setPlayer(prev => {
          const recoveryAmount = 5;
          const newHp = Math.min(prev.maxHp, prev.hp + recoveryAmount);
          
          const updated = {
              ...prev,
              hp: newHp,
              nutritionLogs: [...(prev.nutritionLogs || []), meal],
              logs: [createLog(`Nutrition Logged: ${meal.label} (${meal.totalCalories} kcal) [+${recoveryAmount} HP]`, 'SYSTEM'), ...prev.logs]
          };
          syncToCloud(updated);
          return updated;
      });
      addNotification(`Meal Logged: ${meal.totalCalories} kcal. Vitality Restored.`, "SUCCESS");
  };

  const deleteMeal = (id: string) => {
      setPlayer(prev => {
          const updated = { ...prev, nutritionLogs: prev.nutritionLogs.filter(m => m.id !== id) };
          syncToCloud(updated);
          return updated;
      });
  };

  const completeWorkoutSession = (exercisesCompleted: number, totalExercises: number, results: Record<string, number>, intensityModifier: boolean) => {
      setPlayer(prev => {
          const baseXp = exercisesCompleted * 50;
          const bonusXp = intensityModifier ? 100 : 0;
          const totalReward = baseXp + bonusXp;
          const goldReward = Math.floor(totalReward / 10);

          const stats = { ...prev.stats };
          stats.strength += 2;
          stats.willpower += 1;
          if (intensityModifier) stats.strength += 1;

          const newPBs = { ...prev.personalBests };
          Object.entries(results).forEach(([key, val]) => {
              if (!newPBs[key] || val > newPBs[key]) {
                  newPBs[key] = val;
              }
          });

          let { currentXp, requiredXp, level, totalXp, dailyXp } = prev;
          currentXp += totalReward;
          totalXp += totalReward;
          dailyXp += totalReward;
          
          let leveledUp = false;
          while (currentXp >= requiredXp) {
              currentXp -= requiredXp;
              level++;
              requiredXp = Math.floor(requiredXp * 1.2);
              leveledUp = true;
          }

          const updated = {
              ...prev,
              currentXp, requiredXp, level, totalXp, dailyXp,
              stats,
              personalBests: newPBs,
              gold: prev.gold + goldReward,
              logs: [createLog(`Workout Completed: ${exercisesCompleted}/${totalExercises} Exercises (+${totalReward} XP)`, 'WORKOUT'), ...prev.logs]
          };

          if (leveledUp) {
              updated.logs.unshift(createLog(`LEVEL UP! REACHED LEVEL ${level}`, 'LEVEL_UP'));
              playSystemSoundEffect('LEVEL_UP');
          }

          syncToCloud(updated);
          return updated;
      });
      addNotification("Dungeon Cleared. Rewards Added.", "SUCCESS");
  };

  const failWorkout = () => {
      addNotification("Workout Aborted. No Rewards.", "WARNING");
  };

  const advanceTutorial = (step: number) => {
      setPlayer(prev => {
          const updated = { ...prev, tutorialStep: step };
          syncToCloud(updated);
          return updated;
      });
  };

  const completeTutorial = () => {
      setPlayer(prev => {
          const updated = { ...prev, tutorialComplete: true };
          syncToCloud(updated);
          return updated;
      });
      addNotification("Tutorial Protocol Complete. System Fully Operational.", "SUCCESS");
  };

  const resolvePenalty = () => {
      setPlayer(prev => {
          const updated = { ...prev, isPenaltyActive: false, penaltyEndTime: undefined, penaltyTask: undefined };
          syncToCloud(updated);
          return updated;
      });
      addNotification("Penalty Lifted. System Normalized.", "SUCCESS");
  };

  const reducePenalty = (ms: number) => {
      setPlayer(prev => {
          if (!prev.penaltyEndTime) return prev;
          const newEndTime = prev.penaltyEndTime - ms;
          
          if (newEndTime <= Date.now()) {
              const updated = { 
                  ...prev, 
                  isPenaltyActive: false, 
                  penaltyEndTime: undefined, 
                  penaltyTask: undefined 
              };
              addNotification("Penalty Lifted.", "SUCCESS");
              return updated;
          }
          
          const updated = { ...prev, penaltyEndTime: newEndTime };
          return updated; 
      });
  };

  const claimTournamentReward = () => {
      setPlayer(prev => {
          const reward = prev.tournament?.pendingReward;
          if (!reward) return prev;

          const updated = {
              ...prev,
              gold: prev.gold + reward.gold,
              tournament: { ...prev.tournament, pendingReward: null },
              logs: [createLog(`Claimed Tournament Reward: #${reward.rank} (+${reward.gold} G)`, 'TOURNAMENT'), ...prev.logs]
          };
          syncToCloud(updated);
          return updated;
      });
  };

  return {
    player,
    setPlayer,
    notifications,
    registerUser,
    addQuest,
    completeQuest,
    failQuest,
    resetQuest,
    deleteQuest,
    purchaseItem,
    addShopItem,
    removeShopItem,
    removeNotification,
    saveHealthProfile,
    addProgressPhoto,
    deleteProgressPhoto,
    logMeal,
    deleteMeal,
    completeWorkoutSession,
    failWorkout,
    logout,
    advanceTutorial,
    completeTutorial,
    resolvePenalty,
    reducePenalty,
    claimTournamentReward,
    updateFocusVideos,
    updateCustomProtocols,
    addXp,
    consumeKey,
    checkDailyLogin,
    deductGold,
    addRewards,
    enterDungeon // Exported
  };
};
