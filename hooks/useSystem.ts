
import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerData, Rank, CoreStats, StatTimestamps, ActivityLog, Quest, ShopItem, SystemNotification, NotificationType, HistoryEntry, HealthProfile, AdminExercise } from '../types';
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

// Default videos for regions
const INITIAL_FOCUS_VIDEOS: Record<string, string> = {
    'CHEST': 'https://cdn.pixabay.com/video/2019/04/14/22908-330568669_large.mp4',
    'BACK': 'https://cdn.pixabay.com/video/2016/09/21/5302-183786483_large.mp4',
    // Updated video link for Shoulders as requested
    'SHOULDERS': 'https://github.com/digitalfreedomhub5116-code/solo-leveling/raw/refs/heads/main/A_highquality_2d_202601061949_9g6lc.mp4', 
    'LEGS': 'https://cdn.pixabay.com/video/2020/05/25/40157-424930064_large.mp4',
    'ARMS': 'https://cdn.pixabay.com/video/2016/11/29/6532-193798994_large.mp4',
    'CORE': 'https://cdn.pixabay.com/video/2021/02/24/66225-516629929_large.mp4', 
    'CARDIO': 'https://cdn.pixabay.com/video/2020/06/29/43339-434743235_large.mp4', 
    'REST': ''
};

// Initial Mock DB for exercises so the app isn't empty on first load
const INITIAL_EXERCISE_DB: AdminExercise[] = [
    { id: '1', name: 'Barbell Bench Press', muscleGroup: 'Chest', difficulty: 'Intermediate', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=500&q=80', videoUrl: '', caloriesBurn: 10 },
    { id: '2', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', difficulty: 'Intermediate', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=500&q=80', videoUrl: '', caloriesBurn: 8 },
    { id: '3', name: 'Cable Flys', muscleGroup: 'Chest', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 6 },
    { id: '4', name: 'Push-Ups', muscleGroup: 'Chest', difficulty: 'Beginner', imageUrl: 'https://images.unsplash.com/photo-1598971639058-211a74a96aea?auto=format&fit=crop&w=500&q=80', videoUrl: '', caloriesBurn: 5 },
    { id: '5', name: 'Tricep Rope Pushdown', muscleGroup: 'Triceps', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 5 },
    { id: '6', name: 'Skullcrushers', muscleGroup: 'Triceps', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 7 },
    { id: '7', name: 'Deadlift', muscleGroup: 'Back', difficulty: 'Advanced', imageUrl: '', videoUrl: '', caloriesBurn: 15 },
    { id: '8', name: 'Pull-Ups', muscleGroup: 'Back', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 10 },
    { id: '9', name: 'Dumbbell Rows', muscleGroup: 'Back', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 8 },
    { id: '10', name: 'Face Pulls', muscleGroup: 'Shoulders', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 6 },
    { id: '11', name: 'Barbell Squat', muscleGroup: 'Legs', difficulty: 'Advanced', imageUrl: '', videoUrl: '', caloriesBurn: 12 },
    { id: '12', name: 'Leg Extensions', muscleGroup: 'Legs', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 6 },
];

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
  identity: '', // Default empty
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
  mp: 0, // Zero-Mana Economy: Starts at 0
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
  awakening: { vision: [], antiVision: [] },
  personalBests: {},
  exerciseDatabase: INITIAL_EXERCISE_DB,
  focusVideos: INITIAL_FOCUS_VIDEOS
};

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
      identity: local.identity, // Store Identity
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
      penalty_task: local.penaltyTask,
      stats: local.stats,
      last_stat_update: local.lastStatUpdate,
      history: local.history,
      logs: local.logs,
      quests: local.quests,
      shop_items: local.shopItems,
      awakening: local.awakening,
      personal_bests: local.personalBests,
      exercise_database: local.exerciseDatabase, // Persist DB
      focus_videos: local.focusVideos, // Persist Focus Videos
      updated_at: new Date().toISOString()
  });

  const checkDailyQuests = (playerData: PlayerData): PlayerData => {
    const newData = { ...playerData };
    
    if (newData.isConfigured) {
      if (!newData.dailyQuestComplete) {
        // Daily Failure Logic - Pure Resource Deduction
        const deductionXP = 200;
        const deductionGold = 100;

        const lossXP = Math.min(newData.currentXp, deductionXP); 
        newData.currentXp -= lossXP;
        newData.totalXp = Math.max(0, newData.totalXp - lossXP);
        
        const lossGold = Math.min(newData.gold, deductionGold);
        newData.gold -= lossGold;
        
        newData.logs.unshift(createLog(`Daily Quests Incomplete. -${lossXP} XP, -${lossGold} Gold.`, 'PENALTY'));
        addNotification(`Daily Failure. -${lossXP} XP, -${lossGold} Gold`, 'DANGER');
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
            return { ...q, isCompleted: false, completedAsMini: false }; // Reset mini status too
        }
        return q;
      });
      if (resetCount > 0) {
        newData.logs.unshift(createLog(`Daily Reset: ${resetCount} Quests Refreshed`, 'SYSTEM'));
      }

      // Perform Daily Check (Deductions)
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
          
          newData.logs.unshift(createLog(`Streak Active: ${newData.streak} Days. +${streakGold} Gold.`, 'STREAK'));
          addNotification(`Daily Streak! +${streakGold} Gold`, 'SUCCESS');
      } else if (diffDays > 1) {
          // Streak Broken
          if (newData.streak > 1) {
             newData.logs.unshift(createLog(`Streak Broken. Reset to 1.`, 'PENALTY'));
             addNotification("Streak Broken. Stats Recalibrating...", 'WARNING');
          }
          newData.streak = 1;
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

    // Clean up any stale penalty state if it exists from old version
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
         const incoming = profileOrName as Record<string, any>;
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
            mp: incoming.mp ?? INITIAL_PLAYER_DATA.mp,
            dailyQuestComplete: incoming.daily_quest_complete ?? incoming.dailyQuestComplete ?? INITIAL_PLAYER_DATA.dailyQuestComplete,
            isPenaltyActive: false, 
            penaltyEndTime: undefined,
            penaltyTask: undefined,
            shopItems: incoming.shop_items ?? incoming.shopItems ?? INITIAL_PLAYER_DATA.shopItems,
            personalBests: incoming.personal_bests ?? incoming.personalBests ?? {},
            identity: incoming.identity ?? incoming.identity ?? INITIAL_PLAYER_DATA.identity, 
            exerciseDatabase: incoming.exercise_database ?? incoming.exerciseDatabase ?? INITIAL_EXERCISE_DB,
            
            // Fix: Map focus_videos (snake_case from DB) to focusVideos (camelCase in App)
            // Prioritize incoming DB data over local constants
            focusVideos: { 
                ...INITIAL_FOCUS_VIDEOS, 
                ...(incoming.focus_videos || incoming.focusVideos || {}) 
            }, 

            isConfigured: true,
            stats: incoming.stats || INITIAL_STATS,
            quests: incoming.quests || [],
            logs: incoming.logs || [],
            history: incoming.history || [],
            username: incoming.username || incoming.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || '',
            pin: incoming.pin || '',
            userId: incoming.id || userId,
            // Preserve healthProfile if passed directly in profileOrName (e.g. from local storage load)
            healthProfile: (incoming as any).healthProfile || undefined
         };
         newProfileData = processSystemLogic(newProfileData);
      }
      setPlayer(newProfileData);
  }, [processSystemLogic]);

  // LOGOUT ACTION
  const logout = useCallback(async () => {
      try {
          await supabase.auth.signOut();
          localStorage.removeItem(STORAGE_KEY);
          setPlayer(INITIAL_PLAYER_DATA);
          addNotification("System Disconnected.", 'SYSTEM');
      } catch (e) {
          console.error("Logout error", e);
      }
  }, [addNotification]);

  // AUTOMATIC MIDNIGHT CHECK
  useEffect(() => {
    const checkMidnight = () => {
      const systemDate = getLocalDate();
      if (player.isConfigured && systemDate !== player.lastLoginDate) {
         setPlayer(prev => processSystemLogic(prev));
      }
    };
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, [player.isConfigured, player.lastLoginDate, processSystemLogic]);

  // AUTH & PERSISTENCE LOAD
  useEffect(() => {
    const checkSession = async () => {
        let localData: PlayerData | null = null;
        
        // 1. Try Local Storage
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                localData = JSON.parse(stored);
                if (localData) {
                    // MIGRATION: Ensure Focus Videos are populated if missing/empty
                    const currentVideos = localData.focusVideos || {};
                    const mergedVideos = { ...INITIAL_FOCUS_VIDEOS };
                    
                    Object.keys(currentVideos).forEach((k) => {
                        if (currentVideos[k] && currentVideos[k].trim() !== '') {
                            mergedVideos[k] = currentVideos[k];
                        }
                    });
                    localData.focusVideos = mergedVideos;

                    setPlayer(localData);
                }
            }
        } catch (e) {
            console.error("Local load error", e);
        }

        // 2. Try Supabase
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
                // Fetch profile
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                // --- NEW: Fetch Master Exercise DB to ensure fresh data (video links) ---
                const { data: masterExercises } = await supabase
                    .from('exercises')
                    .select('*');
                
                let exerciseDB = INITIAL_EXERCISE_DB;
                
                if (masterExercises && masterExercises.length > 0) {
                     exerciseDB = masterExercises.map((e: any) => ({
                        id: e.id,
                        name: e.name,
                        muscleGroup: e.muscle_group,
                        subTarget: e.sub_target,
                        difficulty: e.difficulty,
                        equipmentNeeded: e.equipment_needed,
                        environment: e.environment,
                        imageUrl: e.image_url,
                        videoUrl: e.video_url,
                        caloriesBurn: e.calories_burn || 5
                    }));
                }

                if (profile && !error) {
                    // Fetch Health Data
                    const { data: healthData } = await supabase.from('health_profiles').select('*').eq('id', session.user.id).single();
                    
                    let healthProfile: HealthProfile | undefined = undefined;
                    
                    if (healthData) {
                        healthProfile = {
                            gender: healthData.gender,
                            age: healthData.age,
                            height: healthData.height,
                            weight: healthData.weight,
                            targetWeight: healthData.target_weight,
                            startingWeight: healthData.starting_weight,
                            neck: healthData.neck,
                            waist: healthData.waist,
                            hip: healthData.hip,
                            activityLevel: healthData.activity_level,
                            goal: healthData.goal,
                            equipment: healthData.equipment,
                            injuries: healthData.injuries || [],
                            bmi: healthData.biometrics?.bmi,
                            bmr: healthData.biometrics?.bmr,
                            bodyFat: healthData.biometrics?.bodyFat,
                            category: healthData.biometrics?.category,
                            workoutPlan: healthData.workout_plan,
                            macros: healthData.nutrition_plan,
                            lastWorkoutDate: healthData.last_workout_date,
                            sessionDuration: healthData.session_duration || 60,
                            intensity: healthData.intensity || 'MODERATE'
                        };
                    } else if (localData?.healthProfile) {
                        // Keep local health profile if DB missing (sync lag or offline creation)
                        healthProfile = localData.healthProfile;
                    }

                    // Register/Merge
                    const mergedData = {
                        ...profile,
                        healthProfile,
                        exerciseDatabase: exerciseDB // Overwrite with fresh DB from Supabase
                    };
                    registerUser(mergedData, session.user.id);
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

  // Persistence Save
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

  const updateExerciseDatabase = (exercises: AdminExercise[]) => {
      setPlayer(prev => ({ ...prev, exerciseDatabase: exercises }));
  };

  const updateFocusVideos = (videos: Record<string, string>) => {
      setPlayer(prev => ({ ...prev, focusVideos: videos }));
      addNotification("Visual Database Updated.", 'SYSTEM');
  };

  const updateAwakening = (type: 'vision' | 'antiVision', items: string[]) => {
    setPlayer(prev => ({
      ...prev,
      awakening: { ...prev.awakening, [type]: items }
    }));
  };

  const saveHealthProfile = async (profile: HealthProfile, identity: string) => {
    setPlayer(prev => ({ 
        ...prev, 
        healthProfile: profile,
        identity: identity 
    }));
    
    // Save to local storage immediately via Effect, but also trigger DB save if connected
    if (player.userId && !player.userId.startsWith('local-')) {
        const payload = {
            id: player.userId,
            gender: profile.gender,
            age: profile.age,
            height: profile.height,
            weight: profile.weight,
            target_weight: profile.targetWeight,
            starting_weight: profile.startingWeight,
            neck: profile.neck,
            waist: profile.waist,
            hip: profile.hip,
            activity_level: profile.activityLevel,
            goal: profile.goal,
            equipment: profile.equipment,
            biometrics: { bmi: profile.bmi, bmr: profile.bmr, bodyFat: profile.bodyFat, category: profile.category },
            workout_plan: profile.workoutPlan,
            nutrition_plan: profile.macros,
            injuries: profile.injuries,
            last_workout_date: profile.lastWorkoutDate,
            session_duration: profile.sessionDuration,
            intensity: profile.intensity
        };
        await supabase.from('health_profiles').upsert(payload);
        await supabase.from('profiles').update({ identity: identity }).eq('id', player.userId);
    }
    addNotification(`Identity Established: ${identity}`, 'LEVEL_UP');
  };

  const completeWorkoutSession = (exercisesCompleted: number, total: number, results: Record<string, number> = {}, intensityModifier: boolean = false) => {
      const completionRate = exercisesCompleted / total;
      
      // RPG Sync Logic
      let xpGain = Math.floor(300 * completionRate);
      let strengthGain = Math.floor(2 * completionRate);
      let vitalityGain = Math.floor(1 * completionRate);
      let agilityGain = Math.floor(1 * completionRate);

      // Cardio Bonus
      if (intensityModifier) {
          xpGain = Math.floor(xpGain * 1.3);
          vitalityGain += 1;
      }

      // System Overdrive: 5+ Day Streak doubles rewards
      if (player.streak >= 5) {
          xpGain *= 2;
          strengthGain *= 2;
          vitalityGain *= 2;
          agilityGain *= 2;
          addNotification("SYSTEM OVERDRIVE: REWARDS DOUBLED", 'LEVEL_UP');
      }

      setPlayer(prev => {
          const newStats = { ...prev.stats };
          newStats.strength = Math.min(100, newStats.strength + strengthGain);
          newStats.willpower = Math.min(100, newStats.willpower + vitalityGain); 
          newStats.focus = Math.min(100, newStats.focus + agilityGain);

          const newLogs = [...prev.logs];
          newLogs.unshift(createLog(`Workout Complete. +${xpGain} XP`, 'WORKOUT'));

          // Update Personal Bests
          const newPBs = { ...prev.personalBests };
          Object.entries(results).forEach(([exercise, reps]) => {
              if (!newPBs[exercise] || reps > newPBs[exercise]) {
                  newPBs[exercise] = reps;
              }
          });

          // Zero-Mana Logic: Increase Max MP based on intensity
          const intensity = prev.healthProfile?.intensity || 'MODERATE';
          let mpExpand = intensity === 'HIGH' ? 10 : (intensity === 'MODERATE' ? 5 : 2);
          if (intensityModifier) mpExpand += 5; // Cardio expands mana pool further (stamina)
          
          const newMaxMp = prev.maxMp + mpExpand;

          return {
              ...prev,
              stats: newStats,
              logs: newLogs,
              maxMp: newMaxMp,
              mp: newMaxMp, // Refill MP on success
              personalBests: newPBs,
              healthProfile: prev.healthProfile ? {
                  ...prev.healthProfile,
                  sessionDuration: prev.healthProfile.sessionDuration || 60
              } : undefined
          };
      });
      
      gainXp(xpGain);
      addNotification(`Workout Sync Complete. MP Restored & Expanded.`, 'SUCCESS');
  };

  const gainXp = (amount: number) => {
    setPlayer(prev => {
      let nextXp = Number(prev.currentXp) + amount;
      let nextTotalXp = Number(prev.totalXp) + amount;
      let nextDailyXp = (Number(prev.dailyXp) || 0) + amount;
      let nextLevel = Number(prev.level);
      let nextRequired = Number(prev.requiredXp);
      let nextGold = Number(prev.gold) + Math.floor(amount * 0.5);
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

  const completeQuest = (questId: string, asMini: boolean = false) => {
    const quest = player.quests.find(q => q.id === questId);
    if (!quest || quest.isCompleted) return;

    // Mini Quest Logic: 10% XP Reward, Full Stats (for habit building), No Daily Bonus if Mini (Optional choice, but here we just reduce XP)
    const xpReward = asMini ? Math.floor(quest.xpReward * 0.1) : quest.xpReward;
    const statPoints = getStatReward(quest.rank); // Give full stat points for reinforcement

    setPlayer(prev => ({
      ...prev,
      quests: prev.quests.map(q => q.id === questId ? { ...q, isCompleted: true, completedAsMini: asMini } : q)
    }));

    gainXp(xpReward);
    updateStatValue(quest.category, statPoints);
    
    setPlayer(prev => {
      const newLogs = [...prev.logs];
      const logMsg = asMini 
        ? `Activation Complete: ${quest.title} (Mini-Quest). +${xpReward} XP` 
        : `Quest Complete: ${quest.title} (+${xpReward} XP, +${statPoints} ${quest.category.toUpperCase()})`;
        
      newLogs.unshift(createLog(logMsg, 'SYSTEM'));
      return { ...prev, logs: newLogs };
    });
    
    // Explicitly showing XP in the notification
    const noteMsg = asMini 
       ? `Safe Mode Completion: +${xpReward} XP. Streak Preserved.`
       : `Quest Completed: ${quest.title} (+${xpReward} XP)`;
       
    addNotification(noteMsg, asMini ? 'WARNING' : 'SUCCESS');
  };

  const failQuest = (questId: string) => {
    // 1. Remove Quest, Deduct resources (No Penalty Zone)
    const quest = player.quests.find(q => q.id === questId);
    
    setPlayer(prev => {
        const penaltyXP = 50;
        const penaltyGold = 25;

        const nextXp = Math.max(0, prev.currentXp - penaltyXP);
        const nextTotalXp = Math.max(0, prev.totalXp - penaltyXP);
        const nextGold = Math.max(0, prev.gold - penaltyGold);

        const newLogs = [...prev.logs];
        newLogs.unshift(createLog(`Quest Failed: ${quest?.title || 'Unknown'}. -${penaltyXP} XP, -${penaltyGold} Gold.`, 'PENALTY'));

        return {
            ...prev,
            quests: prev.quests.filter(q => q.id !== questId), // Remove the failed quest
            currentXp: nextXp,
            totalXp: nextTotalXp,
            gold: nextGold,
            logs: newLogs,
            isPenaltyActive: false
        };
    });
    
    addNotification("Quest Failed. XP & Gold Deducted.", 'DANGER');
  };

  const failWorkout = () => {
    setPlayer(prev => {
        const penaltyXP = 100;
        const penaltyGold = 50;

        const nextXp = Math.max(0, prev.currentXp - penaltyXP);
        const nextTotalXp = Math.max(0, prev.totalXp - penaltyXP);
        const nextGold = Math.max(0, prev.gold - penaltyGold);

        const newLogs = [...prev.logs];
        newLogs.unshift(createLog(`Workout Aborted. -${penaltyXP} XP, -${penaltyGold} Gold.`, 'PENALTY'));

        return {
            ...prev,
            currentXp: nextXp,
            totalXp: nextTotalXp,
            gold: nextGold,
            mp: 0, // Draining mana implies exhaustion
            logs: newLogs,
            isPenaltyActive: false
        };
    });

    addNotification("Workout Failed. XP & Gold Deducted.", 'DANGER');
  };

  const resetQuest = (questId: string) => {
    // Only proceed if quest is actually completed
    const quest = player.quests.find(q => q.id === questId);
    if (!quest || !quest.isCompleted) return;

    setPlayer(prev => {
      // Logic adjustment: Check if it was completed as mini to reverse correct amount
      const xpGiven = quest.completedAsMini ? Math.floor(quest.xpReward * 0.1) : quest.xpReward;
      const questGold = Math.floor(xpGiven * 0.5);
      const statPoints = getStatReward(quest.rank);
      
      let nextXp = Number(prev.currentXp) - xpGiven;
      let nextTotalXp = Math.max(0, Number(prev.totalXp) - xpGiven);
      let nextDailyXp = Math.max(0, (Number(prev.dailyXp) || 0) - xpGiven);
      let nextGold = Math.max(0, Number(prev.gold) - questGold);
      
      let nextLevel = Number(prev.level);
      let nextRequired = Number(prev.requiredXp);
      
      // Reverse Level Up Logic: Downgrade level if XP falls below zero
      while (nextXp < 0 && nextLevel > 1) {
          nextLevel--;
          // Calculate capacity of the lower level we are entering
          // Formula mirrors gainXp: requiredXp = level * 500
          const prevLevelCapacity = nextLevel * 500;
          
          nextXp += prevLevelCapacity;
          nextRequired = prevLevelCapacity;
      }
      
      if (nextXp < 0) nextXp = 0;

      // Stats Reversion
      const currentStatVal = prev.stats[quest.category];
      const nextStatVal = Math.max(0, currentStatVal - statPoints);
      
      const newStats = {
          ...prev.stats,
          [quest.category]: nextStatVal
      };

      const newLogs = [...(prev.logs || [])];
      newLogs.unshift(createLog(`Quest Reset: ${quest.title}. Rewards Reversed.`, 'SYSTEM'));
      if (newLogs.length > 20) newLogs.length = 20;

      return {
          ...prev,
          quests: prev.quests.map(q => q.id === questId ? { ...q, isCompleted: false, completedAsMini: false } : q),
          currentXp: nextXp,
          totalXp: nextTotalXp,
          dailyXp: nextDailyXp,
          level: nextLevel,
          requiredXp: nextRequired,
          gold: nextGold,
          stats: newStats,
          rank: calculateRank(nextLevel),
          logs: newLogs
      };
    });
    addNotification("Quest Reset. Rewards Revoked.", 'SYSTEM');
  };

  const deleteQuest = (questId: string) => {
    setPlayer(prev => ({ ...prev, quests: prev.quests.filter(q => q.id !== questId) }));
  };

  const purchaseItem = (item: ShopItem) => {
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
    updateExerciseDatabase,
    updateFocusVideos,
    updateAwakening,
    gainXp,
    completeDaily,
    updateStatTimestamp,
    updateStatValue,
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
    saveHealthProfile,
    completeWorkoutSession,
    logout // Exported logout function
  };
};
