import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerData, Rank, CoreStats, StatTimestamps, ActivityLog, Quest, ShopItem, SystemNotification, NotificationType, HistoryEntry, AwakeningData } from '../types';
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
  name: 'PLAYER',
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

  // Sound Integration
  const playSystemSound = (type: NotificationType) => {
    playSystemSoundEffect(type);
  };

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

  // --- DATA MAPPING: TypeScript <-> SQL (SnakeCase) ---
  const dbToLocal = (dbData: any): PlayerData => ({
     // Standard fields
     userId: dbData.id,
     name: dbData.name || 'PLAYER',
     level: dbData.level || 1,
     currentXp: dbData.current_xp || 0,
     requiredXp: dbData.required_xp || 500,
     totalXp: dbData.total_xp || 0,
     dailyXp: dbData.daily_xp || 0,
     rank: dbData.rank || 'E',
     gold: dbData.gold || 0,
     hp: dbData.hp || 100,
     maxHp: dbData.max_hp || 100,
     mp: dbData.mp || 10,
     maxMp: dbData.max_mp || 10,
     fatigue: dbData.fatigue || 0,
     job: dbData.job || 'NONE',
     title: dbData.title || 'WOLF SLAYER',
     lastLoginDate: dbData.last_login_date || new Date().toISOString().split('T')[0],
     dailyQuestComplete: dbData.daily_quest_complete || false,
     isPenaltyActive: dbData.is_penalty_active || false,
     penaltyEndTime: dbData.penalty_end_time,

     // JSONB fields (Handle potential nulls)
     stats: dbData.stats || INITIAL_STATS,
     lastStatUpdate: dbData.last_stat_update || INITIAL_TIMESTAMPS,
     history: dbData.history || [],
     logs: dbData.logs || [],
     quests: dbData.quests || [],
     shopItems: (dbData.shop_items && dbData.shop_items.length > 0) ? dbData.shop_items : DEFAULT_SHOP_ITEMS,
     awakening: dbData.awakening || { vision: [], antiVision: [] }
  });

  const localToDb = (local: PlayerData) => ({
      id: local.userId, // Included for Upsert
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

      if (!data.dailyQuestComplete) {
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
      } else {
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

  // Load from Supabase on Mount
  useEffect(() => {
    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Attempt to fetch profile
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            
            if (data) {
                // Profile exists, load it
                const processed = processSystemLogic(dbToLocal(data));
                setPlayer(processed);
            } else {
                 // FAIL-SAFE: Profile doesn't exist (New User or DB Error). 
                 // Create it immediately on the client side to ensure "New Users are Added".
                 console.log("New User Detected. Initializing Database Entry...");
                 
                 // CRITICAL FIX: Use the metadata name if available!
                 const metaName = user.user_metadata?.full_name || 'PLAYER';
                 const newProfile = { ...INITIAL_PLAYER_DATA, userId: user.id, name: metaName };
                 
                 const dbPayload = localToDb(newProfile);
                 
                 // Force insert
                 const { error: insertError } = await supabase.from('profiles').upsert(dbPayload);
                 
                 if (insertError) {
                    console.error("Critical: Failed to initialize user profile.", insertError);
                 } else {
                    setPlayer(newProfile);
                    addNotification(`System Initialization Complete. Welcome, ${metaName}.`, 'SUCCESS');
                 }
            }
        }
        setIsLoaded(true);
    };
    fetchData();
  }, [processSystemLogic]);

  // Save to Supabase (Debounced) - Switched to Upsert
  useEffect(() => {
    if (isLoaded && player.userId) {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        
        saveTimeout.current = setTimeout(async () => {
            const payload = localToDb(player);
            // UPSERT used here to create row if it doesn't exist
            const { error } = await supabase.from('profiles').upsert(payload);
            if (error) console.error("Sync Error:", error);
        }, 2000); // 2 second debounce to prevent DB spam
    }
  }, [player, isLoaded]);

  // --- ACTIONS ---

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