
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PlayerData, Quest, ShopItem, SystemNotification, NotificationType, 
  ActivityLog, HealthProfile, ProgressPhoto, MealLog, WorkoutDay, AdminExercise, DailyReward,
  DuskLook, Outfit
} from '../types';
import { supabase } from '../lib/supabase';
import { playSystemSoundEffect } from '../utils/soundEngine';
import { verifyProof } from '../utils/ai';

// Helper for Video URLs
export const isEmbed = (url: string) => {
    return url && (url.includes('youtube.com/embed') || url.includes('player.vimeo.com'));
};

// --- DUSK LOOKS REGISTRY ---
export const DUSK_LOOKS: DuskLook[] = [
    {
        id: 'default',
        name: 'Initiate Dusk',
        description: 'Standard issue system interface.',
        cost: 0,
        rarity: 'COMMON',
        videoUrl: "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1769167952/Subject_animestyle_shadow_202601231701_vl45_ayicwk.mp4",
        previewImage: "https://res.cloudinary.com/dcnqnbvp0/image/upload/v1771005827/finalimage_zeavky.png",
        color: '#00d2ff'
    },
    {
        id: 'crimson',
        name: 'Crimson Monarch',
        description: 'A variant corrupted by red mana.',
        cost: 1500,
        rarity: 'RARE',
        videoUrl: "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1769167952/Subject_animestyle_shadow_202601231701_vl45_ayicwk.mp4",
        previewImage: "https://res.cloudinary.com/dcnqnbvp0/image/upload/v1771005827/finalimage_zeavky.png",
        color: '#ef4444',
        cssFilter: 'hue-rotate(140deg) saturate(1.5) contrast(1.1)' 
    },
    {
        id: 'void',
        name: 'Void Walker',
        description: 'Stealth protocol active.',
        cost: 3000,
        rarity: 'EPIC',
        videoUrl: "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1769167952/Subject_animestyle_shadow_202601231701_vl45_ayicwk.mp4",
        previewImage: "https://res.cloudinary.com/dcnqnbvp0/image/upload/v1771005827/finalimage_zeavky.png",
        color: '#a855f7',
        cssFilter: 'hue-rotate(240deg) brightness(0.8) contrast(1.2)'
    },
    {
        id: 'gold',
        name: 'Sovereign',
        description: 'The pinnacle of evolution.',
        cost: 10000,
        rarity: 'LEGENDARY',
        videoUrl: "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1769167952/Subject_animestyle_shadow_202601231701_vl45_ayicwk.mp4",
        previewImage: "https://res.cloudinary.com/dcnqnbvp0/image/upload/v1771005827/finalimage_zeavky.png",
        color: '#eab308',
        cssFilter: 'sepia(1) hue-rotate(5deg) saturate(2)'
    }
];

// Legacy Shop Items
const DEFAULT_SHOP_ITEMS: ShopItem[] = [
    {
        id: 'reward_cheat_meal',
        title: 'Cheat Meal',
        description: 'One guilt-free meal of your choice. Vitality restoration.',
        cost: 500,
        icon: 'pizza'
    }
];

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
  stats: { strength: 10, intelligence: 10, focus: 10, social: 10, willpower: 10, discipline: 0 },
  dailyStats: { strength: 0, intelligence: 0, focus: 0, social: 0, willpower: 0, discipline: 0 },
  weeklyStats: { strength: 0, intelligence: 0, focus: 0, social: 0, willpower: 0, discipline: 0 },
  monthlyStats: { strength: 0, intelligence: 0, focus: 0, social: 0, willpower: 0, discipline: 0 },
  lastStatUpdate: { strength: 0, intelligence: 0, focus: 0, social: 0, willpower: 0, discipline: 0 },
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
  lastLoginDate: '', 
  dailyQuestComplete: false,
  isPenaltyActive: false,
  lastDungeonEntry: 0,
  logs: [],
  quests: [],
  questHistory: {}, 
  shopItems: DEFAULT_SHOP_ITEMS,
  unlockedLooks: ['default'],
  activeLookId: 'default',
  equippedOutfitId: 'outfit_starter',
  unlockedOutfits: ['outfit_starter'],
  equippedShadows: [null, null, null],
  combatStats: { attack: 40, loot: 10, ultimate: 5, extraction: 0 },
  awakening: { vision: [], antiVision: [] },
  personalBests: {},
  nutritionLogs: [],
  exerciseDatabase: [],
  focusVideos: {},
  customProtocols: {},
  tournament: { pendingReward: null },
  duskUnreadCount: 0,
  cheatStrikes: 0,
  isBanned: false,
  trustScore: 100,
  startDate: Date.now()
};

export const useSystem = () => {
  const [player, setPlayer] = useState<PlayerData>(() => {
    try {
        const saved = localStorage.getItem('biosync_player_v2');
        if (saved) {
            const parsed = JSON.parse(saved);
            return { 
                ...DEFAULT_PLAYER, 
                ...parsed,
                unlockedLooks: parsed.unlockedLooks || ['default'],
                activeLookId: parsed.activeLookId || 'default',
                equippedOutfitId: parsed.equippedOutfitId || 'outfit_starter',
                unlockedOutfits: parsed.unlockedOutfits || ['outfit_starter'],
                equippedShadows: parsed.equippedShadows || [null, null, null],
                combatStats: parsed.combatStats || DEFAULT_PLAYER.combatStats
            };
        }
    } catch (e) {
        console.error("Failed to load player data", e);
    }
    return DEFAULT_PLAYER;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('biosync_player_v2', JSON.stringify(player));
  }, [player]);

  // --- GLOBAL DATA SYNC ---
  useEffect(() => {
    const initSystem = async () => {
        try {
            // 1. Fetch Videos
            const { data: videoData } = await supabase.from('global_videos').select('*');
            let videoMap: Record<string, string> = {};
            let exerciseDB: AdminExercise[] = [];

            if (videoData && videoData.length > 0) {
                videoData.forEach((row: any) => {
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
            }

            // 2. Fetch Protocols
            const { data: protocolData } = await supabase
                  .from('system_protocols')
                  .select('data')
                  .eq('id', 'MASTER')
                  .maybeSingle();

            // 3. Batch Update State
            setPlayer(prev => ({
                ...prev,
                focusVideos: { ...prev.focusVideos, ...videoMap },
                exerciseDatabase: exerciseDB.length > 0 ? exerciseDB : prev.exerciseDatabase,
                customProtocols: protocolData?.data || prev.customProtocols
            }));

            console.log("System Initialized: Global Assets Loaded");

        } catch (err) {
            console.error("System Init Error", err);
        } finally {
            setIsInitialized(true);
        }
    };

    initSystem();
  }, []);

  const syncToCloud = async (data: PlayerData) => {
    if (data.userId && !data.userId.startsWith('local-')) {
        try {
            const { exerciseDatabase, ...saveableData } = data;
            if (saveableData.logs && saveableData.logs.length > 50) {
                saveableData.logs = saveableData.logs.slice(0, 50);
            }
            const fullPayload = {
                id: data.userId,
                username: data.username || 'Hunter',
                name: data.name || 'Hunter',
                keys: data.keys,
                raw_data: saveableData,
                updated_at: new Date().toISOString()
            };
            const { error } = await supabase.from('profiles').upsert(fullPayload, { onConflict: 'id' });
            if (error) console.warn("Sync Warning:", error.message);
        } catch (e) {
            console.error("Cloud Sync Exception", e);
        }
    }
  };

  useEffect(() => {
      if (!player.userId || player.userId.startsWith('local-')) return;
      const timer = setTimeout(() => {
          syncToCloud(player);
      }, 2000); 
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

  // --- ARMORY ACTIONS ---

  const purchaseLook = (look: { id: string; name: string; cost: number }) => {
      purchaseOutfit(look as Outfit);
  };

  const purchaseOutfit = (outfit: Outfit | { id: string; name: string; cost: number }) => {
      setPlayer(prev => {
          if (prev.gold < outfit.cost) {
              addNotification("Insufficient Gold", "WARNING");
              return prev;
          }
          // Ensure unlockedOutfits array exists
          const currentUnlocked = prev.unlockedOutfits || ['outfit_starter'];
          
          if (currentUnlocked.includes(outfit.id)) {
              return prev; // Already owned
          }

          const updated = {
              ...prev,
              gold: prev.gold - outfit.cost,
              unlockedOutfits: [...currentUnlocked, outfit.id],
              // Also update legacy field for backward compat
              unlockedLooks: [...(prev.unlockedLooks || []), outfit.id], 
              logs: [createLog(`Acquired Gear: ${outfit.name}`, 'PURCHASE'), ...prev.logs]
          };
          
          syncToCloud(updated);
          playSystemSoundEffect('PURCHASE');
          addNotification(`${outfit.name} Acquired`, 'PURCHASE');
          return updated;
      });
  };

  const equipLook = (lookId: string) => {
      equipOutfit(lookId);
  };

  const equipOutfit = (outfitId: string) => {
      setPlayer(prev => {
          const currentUnlocked = prev.unlockedOutfits || ['outfit_starter'];
          if (!currentUnlocked.includes(outfitId)) return prev;
          
          const updated = {
              ...prev,
              activeLookId: outfitId, // Legacy compat
              equippedOutfitId: outfitId,
              logs: [createLog(`Equipped Gear: ${outfitId}`, 'EQUIP'), ...prev.logs]
          };
          syncToCloud(updated);
          playSystemSoundEffect('SYSTEM');
          return updated;
      });
  };

  const registerUser = (profile: any) => {
      setPlayer(prev => {
          const cloudData = profile.raw_data || profile;
          const mergedLooks = cloudData.unlockedLooks || prev.unlockedLooks || ['default'];
          const mergedActive = cloudData.activeLookId || prev.activeLookId || 'default';

          return { 
              ...DEFAULT_PLAYER, 
              ...prev,           
              ...cloudData,      
              userId: profile.id || prev.userId,
              name: profile.name || prev.name,
              unlockedLooks: mergedLooks,
              activeLookId: mergedActive,
              isConfigured: true 
          };
      });
  };

  const recordStrike = () => {
      setPlayer(prev => {
          const newStrikes = (prev.cheatStrikes || 0) + 1;
          const updated = { ...prev, cheatStrikes: newStrikes };
          syncToCloud(updated);
          return updated;
      });
  };

  const removeStrike = () => {
      setPlayer(prev => {
          const newStrikes = Math.max(0, (prev.cheatStrikes || 0) - 1);
          const updated = { ...prev, cheatStrikes: newStrikes };
          syncToCloud(updated);
          return updated;
      });
  };

  const verifyTicket = async (proof: string, reason: string, originalUrl?: string) => {
      addNotification("ForgeGuard: Analyzing Evidence...", "SYSTEM");
      
      try {
          // Call the AI verification
          const result = await verifyProof(proof, reason, "User is appealing a Cheat Warning strike.");
          
          if (result.verdict === 'APPROVED') {
              removeStrike();
              addNotification(`Appeal APPROVED: ${result.analysis}`, "SUCCESS");
              playSystemSoundEffect('SUCCESS');
          } else {
              // Double Down logic could go here (e.g. extra strike)
              recordStrike(); // Add another strike for lying
              addNotification(`Appeal REJECTED: ${result.analysis}`, "DANGER");
              playSystemSoundEffect('DANGER');
          }
      } catch (e) {
          console.error("Verification Error", e);
          addNotification("ForgeGuard Offline. Manual Review Pending.", "WARNING");
      }
  };

  const setDashboardTrigger = (t: string) => {
      sessionStorage.setItem('dashboard_trigger', t);
  };

  const markDuskMessagesRead = () => {
      setPlayer(prev => ({...prev, duskUnreadCount: 0}));
  };

  const saveGlobalProtocols = async (p: any) => {
      console.log("Saving protocols:", p);
  };

  const saveExerciseDatabase = async (e: any) => {
      console.log("Saving exercise DB:", e);
  };

  const updateFocusVideos = async (videos: any) => {
      console.log("Updating focus videos:", videos);
  };

  // Simplified / Stubbed actions for core functionality
  const addQuest = (q: Quest) => setPlayer(p => ({...p, quests: [q, ...p.quests]}));
  
  const completeQuest = (id: string, mini: boolean) => {
      setPlayer(prev => {
          const quest = prev.quests.find(q => q.id === id);
          if (!quest || quest.isCompleted) return prev;

          const xp = mini ? Math.floor(quest.xpReward * 0.1) : quest.xpReward;
          const gold = Math.floor(xp * 0.5);
          
          const updatedQuests = prev.quests.map(q => q.id === id ? { ...q, isCompleted: true, completedAt: Date.now() } : q);
          
          // Stat Gains
          const statKey = quest.category || 'discipline';
          const newStats = { ...prev.stats, [statKey]: (prev.stats[statKey] || 0) + (mini ? 0.1 : 1) };
          
          // Level Logic
          let newXp = prev.currentXp + xp;
          let newLevel = prev.level;
          let newReq = prev.requiredXp;
          let logs = [...prev.logs];

          if (newXp >= newReq) {
              newLevel++;
              newXp -= newReq;
              newReq = Math.floor(newReq * 1.2);
              logs.unshift(createLog(`LEVEL UP! REACHED LEVEL ${newLevel}`, 'LEVEL_UP'));
              playSystemSoundEffect('LEVEL_UP');
          }

          logs.unshift(createLog(`Completed: ${quest.title} (+${xp} XP)`, 'XP'));

          return {
              ...prev,
              quests: updatedQuests,
              stats: newStats,
              currentXp: newXp,
              level: newLevel,
              requiredXp: newReq,
              gold: prev.gold + gold,
              logs
          };
      });
      playSystemSoundEffect('SUCCESS');
  };

  const failQuest = (id: string) => {
      setPlayer(prev => ({
          ...prev,
          quests: prev.quests.map(q => q.id === id ? { ...q, failed: true } : q),
          isPenaltyActive: true,
          penaltyEndTime: Date.now() + (1000 * 60 * 60) // 1 Hour Penalty
      }));
  };

  const resetQuest = (id: string) => {}; 
  const deleteQuest = (id: string) => {
      setPlayer(prev => ({ ...prev, quests: prev.quests.filter(q => q.id !== id) }));
  };

  const purchaseItem = (i: ShopItem) => {}; 
  const addShopItem = (i: ShopItem) => {};
  const removeShopItem = (id: string) => {};
  const saveHealthProfile = (p: HealthProfile, i: string) => setPlayer(prev => ({...prev, healthProfile: p, identity: i}));
  const addProgressPhoto = (p: ProgressPhoto) => {};
  const deleteProgressPhoto = (id: string) => {};
  const logMeal = (m: MealLog) => setPlayer(prev => ({...prev, nutritionLogs: [...prev.nutritionLogs, m]}));
  const deleteMeal = (id: string) => {
      setPlayer(prev => ({...prev, nutritionLogs: prev.nutritionLogs.filter(l => l.id !== id)}));
  };
  
  const completeWorkoutSession = (e: number, t: number, r: any, i: boolean) => {
      // Basic implementation for workout completion
      setPlayer(prev => {
          const xp = e * 50; // 50 XP per exercise
          let newXp = prev.currentXp + xp;
          let newLevel = prev.level;
          let newReq = prev.requiredXp;
          let logs = [...prev.logs];

          if (newXp >= newReq) {
              newLevel++;
              newXp -= newReq;
              newReq = Math.floor(newReq * 1.2);
              logs.unshift(createLog(`LEVEL UP! REACHED LEVEL ${newLevel}`, 'LEVEL_UP'));
              playSystemSoundEffect('LEVEL_UP');
          }
          
          logs.unshift(createLog(`Workout Complete: +${xp} XP`, 'WORKOUT'));
          return {
              ...prev,
              currentXp: newXp,
              level: newLevel,
              requiredXp: newReq,
              streak: prev.streak + 1,
              logs
          };
      });
  };

  const failWorkout = () => {};
  
  const logout = async () => {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.reload();
  };

  const advanceTutorial = (s: number) => setPlayer(p => ({...p, tutorialStep: s}));
  const completeTutorial = () => setPlayer(p => ({...p, tutorialComplete: true}));
  
  const resolvePenalty = () => setPlayer(p => ({...p, isPenaltyActive: false}));
  const reducePenalty = (ms: number) => {};
  const claimTournamentReward = () => {
      setPlayer(prev => {
          if (!prev.tournament.pendingReward) return prev;
          return {
              ...prev,
              gold: prev.gold + prev.tournament.pendingReward.gold,
              tournament: { ...prev.tournament, pendingReward: null }
          };
      });
  };

  const consumeKey = async (n: number) => {
      if (player.keys < n) return false;
      setPlayer(p => ({...p, keys: p.keys - n}));
      return true;
  };

  const checkDailyLogin = () => {
      // Mock logic for daily login check
      const today = new Date().toDateString();
      if (player.lastLoginDate !== today) {
          // Grant login reward
          return { type: 'GOLD', amount: 100, message: 'Daily Login Bonus' } as DailyReward;
      }
      return null;
  };

  const deductGold = (n: number) => {
      if (player.gold < n) return false;
      setPlayer(p => ({...p, gold: p.gold - n}));
      return true;
  };

  const addRewards = (g: number, x: number, k: number) => {
      setPlayer(prev => {
          let newXp = prev.currentXp + x;
          let newLevel = prev.level;
          let newReq = prev.requiredXp;
          let logs = [...prev.logs];

          if (newXp >= newReq) {
              newLevel++;
              newXp -= newReq;
              newReq = Math.floor(newReq * 1.2);
              logs.unshift(createLog(`LEVEL UP! REACHED LEVEL ${newLevel}`, 'LEVEL_UP'));
          }
          
          if (x > 0) logs.unshift(createLog(`Gained ${x} XP`, 'XP'));
          if (g > 0) logs.unshift(createLog(`Gained ${g} Gold`, 'LOOT'));

          return {
              ...prev,
              gold: prev.gold + g,
              keys: prev.keys + k,
              currentXp: newXp,
              level: newLevel,
              requiredXp: newReq,
              logs
          };
      });
  };

  const enterDungeon = async (f: boolean) => true;
  const updateCustomProtocols = (p: any) => {
      setPlayer(prev => ({...prev, customProtocols: p}));
  };

  return {
    player, setPlayer, notifications, registerUser, addQuest, completeQuest, failQuest, resetQuest, deleteQuest, purchaseItem, addShopItem, removeShopItem, removeNotification, saveHealthProfile, addProgressPhoto, deleteProgressPhoto, logMeal, deleteMeal, completeWorkoutSession, failWorkout, logout, advanceTutorial, completeTutorial, resolvePenalty, reducePenalty, claimTournamentReward, 
    updateFocusVideos, 
    updateCustomProtocols, 
    saveGlobalProtocols, 
    addXp: (amount: number, source: string) => {}, 
    consumeKey, checkDailyLogin, deductGold, addRewards, enterDungeon, setDashboardTrigger, markDuskMessagesRead, recordStrike, removeStrike, saveExerciseDatabase, verifyTicket, addNotification, isSystemReady: isInitialized,
    
    // EXPORT NEW ACTIONS
    purchaseLook,
    equipLook,
    purchaseOutfit,
    equipOutfit
  };
};
