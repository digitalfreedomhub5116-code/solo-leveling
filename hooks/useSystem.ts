import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerData, Rank, CoreStats, StatTimestamps, ActivityLog, Quest, ShopItem, SystemNotification, NotificationType, HistoryEntry } from '../types';
import { playSystemSoundEffect } from '../utils/soundEngine';
import { supabase } from '../lib/supabase';

const INITIAL_STATS: CoreStats = { strength: 10, intelligence: 10, focus: 10, social: 10, willpower: 10 };
const INITIAL_TIMESTAMPS: StatTimestamps = { 
  strength: Date.now(), 
  intelligence: Date.now(), 
  focus: Date.now(), 
  social: Date.now(), 
  willpower: Date.now() 
};

const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  { id: 'default_1', title: '1 Hour Gaming', description: 'Uninterrupted gaming session.', cost: 100, icon: 'gamepad' },
  { id: 'default_2', title: 'Cheat Meal', description: 'One guilt-free meal of choice.', cost: 300, icon: 'pizza' },
  { id: 'default_3', title: 'Streaming Binge', description: '2 hours of movies or series.', cost: 150, icon: 'tv' },
  { id: 'default_4', title: 'Social Night', description: 'Night out with friends.', cost: 200, icon: 'users' },
  { id: 'default_5', title: 'Rest Day', description: 'Complete recovery day. No quests.', cost: 500, icon: 'moon' },
  { id: 'default_6', title: 'New Equipment', description: 'Purchase gym gear or tech.', cost: 1000, icon: 'shopping-bag' },
];

const getLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const INITIAL_PLAYER_DATA: PlayerData = {
  isConfigured: false,
  name: '',
  username: '',
  pin: '',
  level: 1,
  currentXp: 0,
  requiredXp: 500,
  totalXp: 0,
  dailyXp: 0,
  rank: 'E',
  gold: 0,
  streak: 0,
  stats: INITIAL_STATS,
  lastStatUpdate: INITIAL_TIMESTAMPS,
  history: [],
  hp: 100,
  maxHp: 100,
  mp: 10,
  maxMp: 10,
  fatigue: 0,
  job: 'NONE',
  title: 'WOLF SLAYER',
  lastLoginDate: getLocalDate(),
  dailyQuestComplete: false,
  isPenaltyActive: false,
  penaltyEndTime: undefined,
  logs: [],
  quests: [],
  shopItems: DEFAULT_SHOP_ITEMS,
  awakening: { vision: [], antiVision: [] }
};

const PENALTY_DURATION_MS = 4 * 60 * 60 * 1000; 
const STORAGE_KEY = 'bio_sync_os_data_v1';

const getStatReward = (rank: Rank): number => {
  const points: Record<Rank, number> = { 'E': 1, 'D': 2, 'C': 5, 'B': 10, 'A': 20, 'S': 50 };
  return points[rank] || 1;
};

// Moved outside to be static and accessible
const calculateRank = (level: number): Rank => {
  if (level >= 200) return 'S';
  if (level > 130) return 'A'; // 131 - 199
  if (level > 100) return 'B'; // 101 - 130
  if (level > 60) return 'C';  // 61 - 100
  if (level > 20) return 'D';  // 21 - 60
  return 'E';                  // 1 - 20
};

export const useSystem = () => {
  const [player, setPlayer] = useState<PlayerData>(INITIAL_PLAYER_DATA);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addNotification = useCallback((message: string, type: NotificationType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    playSystemSoundEffect(type);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const createLog = (message: string, type: ActivityLog['type']): ActivityLog => ({
    id: Math.random().toString(36).substr(2, 9),
    message,
    timestamp: Date.now(),
    type
  });

  const localToDb = (local: PlayerData) => ({
      id: local.userId,
      name: local.name,
      username: local.username,
      pin: local.pin,
      level: local.level,
      current_xp: local.currentXp,
      required_xp: local.requiredXp,
      total_xp: local.totalXp,
      daily_xp: local.dailyXp,
      rank: local.rank,
      gold: local.gold,
      streak: local.streak,
      hp: local.hp,
      max_hp: local.maxHp,
      mp: local.mp,
      max_mp: local.maxMp,
      fatigue: local.fatigue,
      job: local.job,
      title: local.title,
      last_login_date: local.lastLoginDate,
      daily_quest_complete: local.dailyQuestComplete,
      is_penalty_active: local.isPenaltyActive,
      penalty_end_time: local.penaltyEndTime,
      stats: local.stats,
      last_stat_update: local.lastStatUpdate,
      history: local.history,
      logs: local.logs,
      quests: local.quests,
      shop_items: local.shopItems,
      awakening: local.awakening,
      updated_at: new Date().toISOString()
  });

  const checkDailyQuests = (playerData: PlayerData): PlayerData => {
    const newData = { ...playerData };
    const now = Date.now();

    if (newData.isConfigured) {
      if (!newData.dailyQuestComplete) {
        // Daily Failure Logic
        if (newData.currentXp > 100) {
           // XP Deduction Logic
           const deduction = 200;
           const loss = Math.min(newData.currentXp, deduction); // Don't go below 0 on current
           newData.currentXp -= loss;
           newData.totalXp = Math.max(0, newData.totalXp - loss);
           
           newData.logs.unshift(createLog(`Daily Quests Incomplete. -${loss} XP Penalty Applied.`, 'PENALTY'));
           addNotification(`Daily Quests Failed. -${loss} XP`, 'DANGER');
        } else {
           // Penalty Zone Logic
           newData.isPenaltyActive = true;
           newData.penaltyEndTime = now + PENALTY_DURATION_MS;
           
           newData.logs.unshift(createLog("Daily Quests Incomplete. Penalty Zone Activated.", 'PENALTY'));
           addNotification("Daily Quests Failed. Penalty Zone Active.", 'DANGER');
        }
      } else {
        // Daily Success Logic (Resetting for new day)
        newData.logs.unshift(createLog("Daily Cycle Reset. New Quests Available.", 'SYSTEM'));
      }
      // Always reset flag for the new day
      newData.dailyQuestComplete = false;
    }

    return newData;
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
      
      const historyEntry: HistoryEntry = {
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
            return { ...q, isCompleted: false };
        }
        return q;
      });
      if (resetCount > 0) {
        newData.logs.unshift(createLog(`Daily Reset: ${resetCount} Quests Refreshed`, 'SYSTEM'));
      }

      // Perform Daily Check (Deductions or Penalty)
      newData = checkDailyQuests(newData);

      const lastLoginDateObj = new Date(lastLogin);
      const todayDateObj = new Date(today);
      const diffTime = Math.abs(todayDateObj.getTime() - lastLoginDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
          // Streak Continues
          newData.streak += 1;
          const streakGold = newData.streak * 20;
          
          newData.gold += streakGold;
          // Calculate new Max MP based on Streak
          const newMaxMp = 10 + (newData.streak * 2);
          newData.maxMp = newMaxMp;
          newData.mp = newMaxMp; // Refill MP on new day
          
          newData.logs.unshift(createLog(`Streak Active: ${newData.streak} Days. +${streakGold} Gold. Max MP Upgraded.`, 'STREAK'));
          addNotification(`Daily Streak! +${streakGold} Gold, Max MP Increased`, 'SUCCESS');
      } else if (diffDays > 1) {
          // Streak Broken
          if (newData.streak > 1) {
             newData.logs.unshift(createLog(`Streak Broken. Reset to 1.`, 'PENALTY'));
             addNotification("Streak Broken. Stats Recalibrating...", 'WARNING');
          }
          newData.streak = 1;
          // Reset Max MP to base + streak calculation
          newData.maxMp = 10 + (newData.streak * 2);
          newData.mp = newData.maxMp;
      }
      // If diffDays === 0, it's the same day, no changes to streak.

      newData.lastLoginDate = today;
    }

    const DECAY_THRESHOLD = 172800000; // 48 Hours
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

    if (newData.isPenaltyActive && newData.penaltyEndTime && now > newData.penaltyEndTime) {
       newData.isPenaltyActive = false;
       newData.penaltyEndTime = undefined;
       newData.logs.unshift(createLog("Penalty Duration Complete.", 'SYSTEM'));
       addNotification("Penalty Served.", 'SUCCESS');
       hasChanges = true;
    }

    if (hasChanges) newData.rank = calculateRank(newData.level);
    if (newData.logs.length > 20) newData.logs = newData.logs.slice(0, 20);

    return newData;
  }, [addNotification]);

  // Actions wrapped to use later
  const registerUser = useCallback((profileOrName: Partial<PlayerData> | string, userId?: string) => {
      let newProfileData: PlayerData;

      if (typeof profileOrName === 'string') {
         newProfileData = {
            ...INITIAL_PLAYER_DATA,
            name: profileOrName,
            username: profileOrName.toLowerCase().replace(/[^a-z0-9]/g, ''),
            userId: userId,
            isConfigured: true,
            streak: 1,
            logs: [createLog(`System Initialized. Welcome, ${profileOrName}.`, 'SYSTEM')]
         };
      } else {
         const incoming = profileOrName as any;
         newProfileData = {
            ...INITIAL_PLAYER_DATA,
            ...profileOrName,
            // Critical Mappings: Snake Case (DB) -> Camel Case (App)
            lastLoginDate: incoming.last_login_date || incoming.lastLoginDate || INITIAL_PLAYER_DATA.lastLoginDate,
            currentXp: incoming.current_xp ?? incoming.currentXp ?? INITIAL_PLAYER_DATA.currentXp,
            requiredXp: incoming.required_xp ?? incoming.requiredXp ?? INITIAL_PLAYER_DATA.requiredXp,
            totalXp: incoming.total_xp ?? incoming.totalXp ?? INITIAL_PLAYER_DATA.totalXp,
            dailyXp: incoming.daily_xp ?? incoming.dailyXp ?? INITIAL_PLAYER_DATA.dailyXp,
            maxHp: incoming.max_hp ?? incoming.maxHp ?? INITIAL_PLAYER_DATA.maxHp,
            maxMp: incoming.max_mp ?? incoming.maxMp ?? INITIAL_PLAYER_DATA.maxMp,
            dailyQuestComplete: incoming.daily_quest_complete ?? incoming.dailyQuestComplete ?? INITIAL_PLAYER_DATA.dailyQuestComplete,
            isPenaltyActive: incoming.is_penalty_active ?? incoming.isPenaltyActive ?? INITIAL_PLAYER_DATA.isPenaltyActive,
            penaltyEndTime: incoming.penalty_end_time ?? incoming.penaltyEndTime ?? INITIAL_PLAYER_DATA.penaltyEndTime,
            shopItems: incoming.shop_items ?? incoming.shopItems ?? INITIAL_PLAYER_DATA.shopItems,

            isConfigured: true,
            stats: incoming.stats || INITIAL_STATS,
            quests: incoming.quests || [],
            logs: incoming.logs || [],
            history: incoming.history || [],
            username: incoming.username || incoming.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || '',
            pin: incoming.pin || '',
            userId: incoming.id || userId, 
         };
         newProfileData = processSystemLogic(newProfileData);
      }
      setPlayer(newProfileData);
  }, [processSystemLogic]);

  // AUTOMATIC MIDNIGHT CHECK
  useEffect(() => {
    const checkMidnight = () => {
      const systemDate = getLocalDate();
      // If the local date has changed since the last update (e.g. crossing midnight while app is open)
      if (player.isConfigured && systemDate !== player.lastLoginDate) {
         // Trigger the daily processing logic
         setPlayer(prev => processSystemLogic(prev));
      }
    };

    // Check every minute
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, [player.isConfigured, player.lastLoginDate, processSystemLogic]);

  // AUTH CHECK ON MOUNT
  useEffect(() => {
    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
                // Fetch profile
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile && !error) {
                    registerUser(profile);
                }
            }
        } catch (err) {
            console.error("Auto-login failed:", err);
        } finally {
            setIsLoaded(true);
        }
    };
    
    checkSession();
  }, [registerUser]);

  // Persistence
  useEffect(() => {
    if (isLoaded && player.isConfigured) {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(async () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
            if (player.userId && !player.userId.startsWith('local-')) {
                const dbPayload = localToDb(player);
                await supabase.from('profiles').upsert(dbPayload);
            }
        }, 1000); 
    }
  }, [player, isLoaded]);

  const updateProfile = (updates: Partial<Pick<PlayerData, 'name' | 'job' | 'title'>>) => {
      setPlayer(prev => ({ ...prev, ...updates }));
      addNotification("Hunter Profile Updated.", 'SYSTEM');
  };

  const updateAwakening = (type: 'vision' | 'antiVision', items: string[]) => {
    setPlayer(prev => ({
      ...prev,
      awakening: { ...prev.awakening, [type]: items }
    }));
  };

  const gainXp = (amount: number) => {
    if (player.isPenaltyActive) {
      addNotification("XP Gain Blocked: Penalty Active", 'DANGER');
      return; 
    }

    setPlayer(prev => {
      let nextXp = prev.currentXp + amount;
      let nextTotalXp = prev.totalXp + amount;
      let nextDailyXp = (prev.dailyXp || 0) + amount;
      let nextLevel = prev.level;
      let nextRequired = prev.requiredXp;
      let nextGold = prev.gold + Math.floor(amount * 0.5);
      const newLogs = [...(prev.logs || [])];
      
      newLogs.unshift(createLog(`Gained +${amount} XP`, 'XP'));

      while (nextXp >= nextRequired) {
        nextXp -= nextRequired;
        nextLevel++;
        nextRequired = nextLevel * 500;
        
        prev.hp = prev.maxHp;
        prev.mp = prev.maxMp;
        newLogs.unshift(createLog(`LEVEL UP! You represent Level ${nextLevel}`, 'LEVEL_UP'));
        addNotification(`LIMIT BREAK! You have reached Level ${nextLevel}`, 'LEVEL_UP');
      }
      
      if (newLogs.length > 20) newLogs.length = 20;

      return {
        ...prev,
        level: nextLevel,
        currentXp: nextXp,
        totalXp: nextTotalXp,
        dailyXp: nextDailyXp,
        requiredXp: nextRequired,
        rank: calculateRank(nextLevel),
        gold: nextGold,
        hp: prev.hp, 
        mp: prev.mp,
        logs: newLogs
      };
    });
  };

  const completeDaily = () => {
    if (player.isPenaltyActive) return;

    if (!player.dailyQuestComplete) {
      setPlayer(prev => {
        const newLogs = [...(prev.logs || [])];
        newLogs.unshift(createLog("Daily Quest Complete", 'SYSTEM'));
        return { ...prev, dailyQuestComplete: true, logs: newLogs };
      });
      gainXp(200);
      addNotification("Daily Quest Complete. +200 XP Rewards Distributed.", 'SUCCESS');
    }
  };

  const updateStatTimestamp = (stat: keyof CoreStats) => {
    setPlayer(prev => ({
      ...prev,
      lastStatUpdate: { ...prev.lastStatUpdate, [stat]: Date.now() }
    }));
  };

  const updateStatValue = (stat: keyof CoreStats, amount: number) => {
    setPlayer(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: Math.min(100, prev.stats[stat] + amount) },
      lastStatUpdate: { ...prev.lastStatUpdate, [stat]: Date.now() }
    }));
  };

  const addQuest = (quest: Quest) => {
    setPlayer(prev => {
      const newLogs = [...(prev.logs || [])];
      newLogs.unshift(createLog(`New Quest Assigned: ${quest.title}`, 'SYSTEM'));
      return { ...prev, quests: [...prev.quests, quest], logs: newLogs };
    });
    addNotification("New Quest Assigned.", 'SYSTEM');
  };

  const completeQuest = (questId: string) => {
    if (player.isPenaltyActive) return;

    const quest = player.quests.find(q => q.id === questId);
    if (!quest || quest.isCompleted) return;

    const statPoints = getStatReward(quest.rank);

    setPlayer(prev => ({
      ...prev,
      quests: prev.quests.map(q => q.id === questId ? { ...q, isCompleted: true } : q)
    }));

    gainXp(quest.xpReward);
    updateStatValue(quest.category, statPoints);
    
    setPlayer(prev => {
      const newLogs = [...prev.logs];
      newLogs.unshift(createLog(`Quest Complete: ${quest.title} (+${quest.xpReward} XP, +${statPoints} ${quest.category.toUpperCase()})`, 'SYSTEM'));
      return { ...prev, logs: newLogs };
    });
    // Explicitly showing XP in the notification
    addNotification(`Quest Completed: ${quest.title} (+${quest.xpReward} XP, +${statPoints} ${quest.category.substring(0,3).toUpperCase()})`, 'SUCCESS');
  };

  const resetQuest = (questId: string) => {
    setPlayer(prev => ({
      ...prev,
      quests: prev.quests.map(q => q.id === questId ? { ...q, isCompleted: false } : q)
    }));
    addNotification("Quest Reset.", 'SYSTEM');
  };

  const deleteQuest = (questId: string) => {
    setPlayer(prev => ({ ...prev, quests: prev.quests.filter(q => q.id !== questId) }));
  };

  const purchaseItem = (item: ShopItem) => {
    if (player.isPenaltyActive) {
      addNotification("Transaction Failed: Penalty Active", 'DANGER');
      return;
    }

    if (player.gold >= item.cost) {
      setPlayer(prev => {
        const newLogs = [...prev.logs];
        newLogs.unshift(createLog(`[PURCHASE] ${item.title} obtained.`, 'PURCHASE'));
        return { ...prev, gold: prev.gold - item.cost, logs: newLogs };
      });
      addNotification(`Item Purchased: ${item.title}`, 'PURCHASE');
    } else {
      addNotification("Insufficient Funds.", 'WARNING');
    }
  };

  const addShopItem = (item: ShopItem) => {
    setPlayer(prev => ({ ...prev, shopItems: [...prev.shopItems, item] }));
    addNotification("New Reward Registered.", 'SYSTEM');
  };

  const removeShopItem = (itemId: string) => {
      setPlayer(prev => ({
          ...prev,
          shopItems: prev.shopItems.filter(i => i.id !== itemId)
      }));
      addNotification("Reward Removed.", 'SYSTEM');
  };

  const reducePenalty = (msAmount: number) => {
    setPlayer(prev => {
       if (!prev.penaltyEndTime || !prev.isPenaltyActive) return prev;
       const newEndTime = prev.penaltyEndTime - msAmount;
       const now = Date.now();

       if (newEndTime <= now) {
          const newLogs = [...prev.logs];
          newLogs.unshift(createLog("Penalty Zone Cleared. Synchronization Restored.", 'SYSTEM'));
          return { ...prev, isPenaltyActive: false, penaltyEndTime: undefined, logs: newLogs };
       }
       return { ...prev, penaltyEndTime: newEndTime };
    });
  };

  const clearPenalty = () => {
    setPlayer(prev => ({ ...prev, isPenaltyActive: false, penaltyEndTime: undefined }));
    addNotification("Penalty Override Executed.", 'SYSTEM');
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const quotes = [
      "The System is watching your progress.",
      "Do not falter. The Shadows are waiting.",
      "Sync rate stabilizing. Continue efforts.",
      "Weakness is a choice. Choose strength.",
      "Your potential is not yet realized.",
      "Analyze. Adapt. Overcome."
    ];

    const interval = setInterval(() => {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      addNotification(randomQuote, 'SYSTEM');
    }, 600000); 

    return () => clearInterval(interval);
  }, [addNotification]);

  return {
    player,
    isLoaded,
    notifications,
    registerUser,
    updateProfile,
    updateAwakening,
    gainXp,
    completeDaily,
    updateStatTimestamp,
    updateStatValue,
    addQuest,
    completeQuest,
    resetQuest,
    deleteQuest,
    clearPenalty,
    reducePenalty,
    purchaseItem,
    addShopItem,
    removeShopItem,
    removeNotification
  };
};