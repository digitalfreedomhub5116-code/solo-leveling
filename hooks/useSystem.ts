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

const INITIAL_PLAYER_DATA: PlayerData = {
  isConfigured: false,
  name: '',
  level: 1,
  currentXp: 0,
  requiredXp: 500,
  totalXp: 0,
  dailyXp: 0,
  rank: 'E',
  gold: 0,
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
  lastLoginDate: new Date().toISOString().split('T')[0],
  dailyQuestComplete: false,
  isPenaltyActive: false,
  penaltyEndTime: undefined,
  logs: [],
  quests: [],
  shopItems: DEFAULT_SHOP_ITEMS,
  awakening: { vision: [], antiVision: [] }
};

const PENALTY_DURATION_MS = 4 * 60 * 60 * 1000; // 4 Hours
const STORAGE_KEY = 'bio_sync_os_data_v1';

// Helper to determine points based on Rank
const getStatReward = (rank: Rank): number => {
  const points: Record<Rank, number> = { 'E': 1, 'D': 2, 'C': 5, 'B': 10, 'A': 20, 'S': 50 };
  return points[rank] || 1;
};

export const useSystem = () => {
  const [player, setPlayer] = useState<PlayerData>(INITIAL_PLAYER_DATA);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notification Logic
  const addNotification = useCallback((message: string, type: NotificationType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    playSystemSoundEffect(type);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // Helper: Calculate Rank
  const calculateRank = (xp: number): Rank => {
    if (xp >= 50000) return 'S';
    if (xp >= 25000) return 'A';
    if (xp >= 10000) return 'B';
    if (xp >= 3000) return 'C';
    if (xp >= 1000) return 'D';
    return 'E';
  };

  // Helper: Create Log Entry
  const createLog = (message: string, type: ActivityLog['type']): ActivityLog => ({
    id: Math.random().toString(36).substr(2, 9),
    message,
    timestamp: Date.now(),
    type
  });

  // Mapper: Local Data -> Database Format
  const localToDb = (local: PlayerData) => ({
      id: local.userId,
      name: local.name,
      level: local.level,
      current_xp: local.currentXp,
      required_xp: local.requiredXp,
      total_xp: local.totalXp,
      daily_xp: local.dailyXp,
      rank: local.rank,
      gold: local.gold,
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

  // Helper: Process Daily Logic
  const processSystemLogic = useCallback((data: PlayerData): PlayerData => {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = data.lastLoginDate;
    const now = Date.now();
    let newData = { ...data };
    let hasChanges = false;

    // Safety checks
    if (!newData.logs) newData.logs = [];
    if (!newData.quests) newData.quests = [];
    if (!newData.history) newData.history = [];

    // 1. Daily Reset & Penalty Check
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
      newData.quests = newData.quests.map(q => q.isDaily ? { ...q, isCompleted: false } : q);

      if (!data.dailyQuestComplete && data.isConfigured) {
        if (newData.totalXp > 0) {
           newData.totalXp = Math.max(0, newData.totalXp - 100);
           newData.currentXp = Math.max(0, newData.currentXp - 100);
           newData.logs.unshift(createLog("[ERROR] Sync Failure: -100 XP", 'PENALTY'));
           addNotification("Sync Failure Detected. XP Deducted.", 'DANGER');
        }
        newData.isPenaltyActive = true;
        newData.penaltyEndTime = now + PENALTY_DURATION_MS;
        newData.logs.unshift(createLog("System Access Restricted: Penalty Zone Active", 'PENALTY'));
        addNotification("PENALTY ZONE ACTIVATED.", 'DANGER');
      } else if (data.isConfigured) {
        newData.dailyQuestComplete = false;
        newData.logs.unshift(createLog("New Daily Quests Available", 'SYSTEM'));
        addNotification("New Daily Quests Available.", 'SYSTEM');
      }
      newData.lastLoginDate = today;
    }

    // 2. Stat Decay
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

    if (newData.isPenaltyActive && newData.penaltyEndTime && now > newData.penaltyEndTime) {
       newData.isPenaltyActive = false;
       newData.penaltyEndTime = undefined;
       newData.logs.unshift(createLog("Penalty Duration Complete. Access Restored.", 'SYSTEM'));
       addNotification("Penalty Served. Access Restored.", 'SUCCESS');
       hasChanges = true;
    }

    if (hasChanges) newData.rank = calculateRank(newData.totalXp);
    if (newData.logs.length > 20) newData.logs = newData.logs.slice(0, 20);

    return newData;
  }, [addNotification]);

  // Load from LocalStorage on Mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Process logic immediately on load
        const processed = processSystemLogic(parsed);
        setPlayer(processed);
      } else {
        // No data found, initialized with defaults
        setIsLoaded(true);
      }
    } catch (e) {
      console.error("Failed to load save data", e);
    } finally {
      setIsLoaded(true);
    }
  }, [processSystemLogic]);

  // Persistence (LocalStorage + Supabase)
  useEffect(() => {
    if (isLoaded) {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        
        saveTimeout.current = setTimeout(async () => {
            // 1. Local Persistence
            localStorage.setItem(STORAGE_KEY, JSON.stringify(player));

            // 2. Cloud Persistence (Sync Quest and other data)
            // Ensure we have a valid userId that isn't a local fallback before syncing
            if (player.userId && !player.userId.startsWith('local-')) {
                const dbPayload = localToDb(player);
                const { error } = await supabase.from('profiles').upsert(dbPayload);
                if (error) console.error("Cloud Sync Error:", error.message);
            }
        }, 1000); 
    }
  }, [player, isLoaded]);

  // --- ACTIONS ---

  const registerUser = (name: string, userId: string) => {
      setPlayer(prev => ({
          ...prev,
          name: name,
          userId: userId, // Store the Supabase ID
          isConfigured: true,
          logs: [createLog(`System Initialized. Welcome, ${name}.`, 'SYSTEM')]
      }));
      playSystemSoundEffect('SUCCESS');
  };

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
        rank: calculateRank(nextTotalXp),
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
      addNotification("Daily Quest Complete. Rewards Distributed.", 'SUCCESS');
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
    addNotification(`Quest Completed: ${quest.title} (+${statPoints} ${quest.category.substring(0,3).toUpperCase()})`, 'SUCCESS');
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
    deleteQuest,
    clearPenalty,
    reducePenalty,
    purchaseItem,
    addShopItem,
    removeNotification
  };
};