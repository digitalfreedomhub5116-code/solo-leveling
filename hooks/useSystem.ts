
import { useState, useEffect } from 'react';
import { 
  PlayerData, Quest, ShopItem, SystemNotification, NotificationType, 
  ActivityLog, HealthProfile, ProgressPhoto, MealLog, WorkoutDay, 
  TournamentReward, Rank, CoreStats
} from '../types';
import { supabase } from '../lib/supabase';
import { playSystemSoundEffect, speakSystemMessage } from '../utils/soundEngine';

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
  lastLoginDate: new Date().toISOString().split('T')[0],
  dailyQuestComplete: false,
  isPenaltyActive: false,
  logs: [],
  quests: [],
  shopItems: [],
  awakening: { vision: [], antiVision: [] },
  personalBests: {},
  nutritionLogs: [],
  exerciseDatabase: [],
  focusVideos: {},
  tournament: { pendingReward: null }
};

export const useSystem = () => {
  const [player, setPlayer] = useState<PlayerData>(() => {
    const saved = localStorage.getItem('biosync_player_v2');
    return saved ? JSON.parse(saved) : DEFAULT_PLAYER;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('biosync_player_v2', JSON.stringify(player));
  }, [player]);

  // Sync to Cloud (Debounced or immediate)
  const syncToCloud = async (data: PlayerData) => {
    if (data.userId && !data.userId.startsWith('local-')) {
        try {
            await supabase.from('profiles').update({
                raw_data: data,
                updated_at: new Date().toISOString()
            }).eq('id', data.userId);
        } catch (e) {
            console.error("Cloud Sync Error", e);
        }
    }
  };

  const addNotification = (message: string, type: NotificationType) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 5s
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

  const registerUser = (profile: Partial<PlayerData>) => {
      setPlayer(prev => {
          const updated = { ...prev, ...profile, isConfigured: true };
          syncToCloud(updated);
          return updated;
      });
      playSystemSoundEffect('SYSTEM');
  };

  const updateFocusVideos = (videos: Record<string, string>) => {
      setPlayer(prev => {
          const updated = { ...prev, focusVideos: videos };
          syncToCloud(updated);
          return updated;
      });
  };

  const logout = () => {
      localStorage.removeItem('biosync_player_v2');
      window.location.reload();
  };

  // XP & Leveling Logic
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
              // Restore HP/MP on level up
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

          // Update stats
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
          
          // Trigger XP add externally or handle here (handling here for simplicity of atomic update)
          // Since addXp is separate, we'll just chain it or duplicate logic. 
          // Duplicating logic inside setState is safer for atomic updates.
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
          
          // Penalty Logic
          const penaltyAmount = 50; // XP loss
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

  // Shop
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

  // Health & Nutrition
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
          // Recovery Mechanic: Eating restores a small amount of HP
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
          // XP Calculation
          const baseXp = exercisesCompleted * 50;
          const bonusXp = intensityModifier ? 100 : 0;
          const totalReward = baseXp + bonusXp;
          const goldReward = Math.floor(totalReward / 10);

          // Update Strength & Health Stats
          const stats = { ...prev.stats };
          stats.strength += 2;
          stats.willpower += 1;
          if (intensityModifier) stats.strength += 1;

          // Merge Personal Bests
          const newPBs = { ...prev.personalBests };
          Object.entries(results).forEach(([key, val]) => {
              // Simplified PB logic: if val > existing, update
              // Key format: "ExerciseName_SetX" -> simplified to just name check?
              // For now, let's assume raw results are saved directly to PBs if key doesn't exist or is higher
              // A real app would parse the exercise name
              if (!newPBs[key] || val > newPBs[key]) {
                  newPBs[key] = val;
              }
          });

          // Leveling Logic (Reused)
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

  // Tutorial
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

  // Penalty
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
          const updated = { ...prev, penaltyEndTime: prev.penaltyEndTime - ms };
          // If reduced to now, resolve it
          if (updated.penaltyEndTime <= Date.now()) {
              updated.isPenaltyActive = false;
              updated.penaltyEndTime = undefined;
              updated.penaltyTask = undefined;
              addNotification("Penalty Lifted.", "SUCCESS");
          }
          return updated; // Local update only for performance, sync on resolve
      });
  };

  // Tournament
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
    updateFocusVideos
  };
};
