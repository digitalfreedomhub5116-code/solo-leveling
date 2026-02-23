
import React from 'react';

export enum SystemState {
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED'
}

export type Tab = 'DASHBOARD' | 'QUESTS' | 'ARMORY' | 'ALLIANCE' | 'HEALTH' | 'RANKING' | 'CASTLE';

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  id: Tab;
}

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type TierLevel = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// --- GAMEPLAY DATA ---
export interface CombatStats {
  attack: number;
  loot: number;
  ultimate: number;
  extraction: number;
}

export interface TierConfig {
  id: TierLevel;
  statCap: number;
  color: string;
}

export interface Shadow {
  id: string;
  name: string;
  rank: 'Minion' | 'Elite' | 'Monarch';
  image: string;
  buffs: {
    stat: keyof CombatStats;
    value: number;
  }[];
}

export interface Outfit {
  id: string;
  name: string;
  tier: TierLevel;
  description: string;
  image: string;
  baseStats: CombatStats;
  cost: number;
}

// --- DAILY REWARDS ---
export type DailyRewardType = 'WELCOME_KEYS' | 'GOLD' | 'XP' | 'KEYS' | 'DUNGEON_PASS';

export interface DailyReward {
  type: DailyRewardType;
  amount: number;
  message: string;
}

export interface CoreStats {
  strength: number;
  intelligence: number;
  focus: number;
  social: number;
  willpower: number;
  discipline: number; 
}

export interface StatTimestamps {
  strength: number;
  intelligence: number;
  focus: number;
  social: number;
  willpower: number;
  discipline: number;
}

export interface ActivityLog {
  id: string;
  message: string;
  timestamp: number;
  type: 'XP' | 'LEVEL_UP' | 'LEVEL_DOWN' | 'PENALTY' | 'SYSTEM' | 'PURCHASE' | 'STREAK' | 'WORKOUT' | 'TOURNAMENT' | 'LOOT' | 'WARNING' | 'EQUIP';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rank: Rank;
  priority: Priority;
  category: keyof CoreStats;
  xpReward: number;
  isCompleted: boolean;
  failed?: boolean;
  createdAt: number;
  expiresAt?: number;
  isDaily: boolean; 
  scheduledTime?: string; 
  estimatedDuration?: number; 
  lastCompletedAt?: number; 
  aiReasoning?: string; 
  verificationRequired?: boolean; 
  minDurationMinutes?: number; 
  miniQuest?: string; 
  completedAsMini?: boolean;
}

// --- ARMORY TYPES (LEGACY DUSK LOOKS INTEGRATED INTO OUTFITS NOW) ---
export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface DuskLook {
  id: string;
  name: string;
  description: string;
  cost: number;
  rarity: Rarity;
  videoUrl: string;
  previewImage: string;
  color: string;
  cssFilter?: string;
}

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string; 
}

export interface AwakeningData {
  vision: string[];
  antiVision: string[];
}

export type NotificationType = 'SUCCESS' | 'WARNING' | 'DANGER' | 'LEVEL_UP' | 'SYSTEM' | 'PURCHASE';

export interface SystemNotification {
  id: string;
  message: string;
  type: NotificationType;
}

export interface HistoryEntry {
  date: string; 
  stats: CoreStats;
  totalXp: number;
  dailyXp: number;
  questCompletion: number;
}

export interface AdminExercise {
  id: string;
  name: string;
  muscleGroup: string; 
  subTarget?: string; 
  difficulty: string; 
  equipmentNeeded?: string; 
  environment?: string; 
  imageUrl: string;
  videoUrl: string;
  caloriesBurn: number;
}

export interface Exercise {
  id?: string; 
  name: string;
  sets: number;
  reps: string;
  rest?: number; 
  duration: number; 
  completed: boolean;
  type: 'COMPOUND' | 'ACCESSORY' | 'CARDIO' | 'STRETCH';
  notes?: string; 
  videoUrl?: string;
  imageUrl?: string;
}

export interface WorkoutDay {
  day: string;
  focus: string; 
  exercises: Exercise[];
  isRecovery?: boolean;
  totalDuration: number;
}

export interface ProgressPhoto {
  id: string;
  date: number; 
  imageUrl: string; 
  weight?: number;
  note?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number; 
  protein: number; 
  carbs: number; 
  fats: number; 
  servingSize: string; 
  region?: string; 
}

export interface LoggedFoodItem extends FoodItem {
  quantity: number;
}

export interface MealLog {
  id: string;
  label: string;
  items: LoggedFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  timestamp: number;
  imageUrl?: string; 
}

export interface BaselineStats {
  pushups: number; 
  focusDuration: number; 
  readingTime: number; 
  sleepAvg: number; 
}

export interface HealthProfile {
  gender: 'MALE' | 'FEMALE';
  age: number;
  height: number; 
  weight: number; 
  startingWeight?: number; 
  targetWeight?: number; 
  neck?: number;
  waist?: number;
  hip?: number;
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE';
  goal: 'LOSE_WEIGHT' | 'BUILD_MUSCLE' | 'ENDURANCE' | 'RECOMP';
  equipment: 'GYM' | 'HOME_DUMBBELLS' | 'BODYWEIGHT';
  workoutSplit?: 'PPL' | 'CLASSIC'; 
  sessionDuration: number; 
  intensity: 'LIGHT' | 'MODERATE' | 'HIGH';
  injuries: string[];
  bmi: number;
  bmr: number;
  bodyFat?: number;
  category: string;
  workoutPlan: WorkoutDay[];
  macros: { protein: number; carbs: number; fats: number; calories: number };
  lastWorkoutDate?: string;
  progressPhotos?: ProgressPhoto[];
  baselines?: BaselineStats; 
}

export interface PenaltyTask {
  title: string;
  description: string;
  type: 'TIME' | 'PHYSICAL';
  duration?: number;
}

export interface TournamentReward {
  rank: number;
  gold: number;
  date: string;
}

export interface AllianceMember {
  id: string;
  name: string;
  role: 'LEADER' | 'OFFICER' | 'MEMBER';
  totalXpContribution: number;
  status: 'ONLINE' | 'OFFLINE';
  lastActive: number;
  avatarUrl?: string;
}

export interface Alliance {
  id: string;
  name: string;
  badge: string; 
  description: string;
  type: 'OPEN' | 'CLOSED';
  members: AllianceMember[];
  memberCount: number; 
  totalPower: number;
  rules: string;
}

export interface AllianceChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem: boolean; 
}

export interface GuildLog {
  id: string;
  type: 'SYSTEM' | 'ACHIEVEMENT';
  content: string;
  timestamp: number;
  user?: string;
}

export interface PlayerData {
  userId?: string; 
  isConfigured: boolean; 
  tutorialStep: number;
  tutorialComplete: boolean;
  name: string;          
  username?: string;     
  country?: string;      
  timezone?: string;     
  identity?: string;     
  pin?: string;          
  level: number;
  currentXp: number;     
  requiredXp: number;    
  totalXp: number;       
  dailyXp: number;       
  rank: Rank;
  trustScore: number;    
  gold: number;
  keys: number;          
  streak: number;        
  startDate: number;     
  duskUnreadCount: number; 
  avatarUrl?: string; 
  originalSelfieUrl?: string; 
  cheatStrikes: number; 
  isBanned: boolean; 
  stats: CoreStats; 
  dailyStats: CoreStats; 
  weeklyStats: CoreStats; 
  monthlyStats: CoreStats; 
  lastStatUpdate: StatTimestamps;
  lastDailyReset: number;
  lastWeeklyReset: number;
  lastMonthlyReset: number;
  history: HistoryEntry[]; 
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  fatigue: number;
  job: string;
  title: string;
  lastLoginDate: string; 
  dailyQuestComplete: boolean;
  isPenaltyActive: boolean;
  penaltyEndTime?: number; 
  penaltyTask?: PenaltyTask; 
  lastDungeonEntry?: number; 
  logs: ActivityLog[];
  quests: Quest[];
  questHistory: Record<string, number>; 
  shopItems: ShopItem[]; 
  
  // ARMORY DATA
  unlockedLooks: string[]; 
  activeLookId: string;
  
  // NEW ARMORY SYSTEM
  equippedOutfitId: string;
  unlockedOutfits: string[];
  equippedShadows: (Shadow | null)[]; // Max 3 slots
  combatStats: CombatStats; // The derived stats (Attack, Loot, etc)

  awakening: AwakeningData;
  personalBests: Record<string, number>; 
  healthProfile?: HealthProfile;
  nutritionLogs: MealLog[];
  exerciseDatabase: AdminExercise[];
  focusVideos: Record<string, string>; 
  customProtocols?: Record<string, WorkoutDay[]>;
  tournament: {
      pendingReward: TournamentReward | null;
  };
  allianceId?: string; 
}
