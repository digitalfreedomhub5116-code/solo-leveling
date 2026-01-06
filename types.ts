
// Fix: Import React to support React.ReactNode type usage
import React from 'react';

export enum SystemState {
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED'
}

export type Tab = 'DASHBOARD' | 'QUESTS' | 'SHOP' | 'PROFILE' | 'HEALTH';

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  id: Tab;
}

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface CoreStats {
  strength: number;
  intelligence: number;
  focus: number;
  social: number;
  willpower: number;
}

export interface StatTimestamps {
  strength: number;
  intelligence: number;
  focus: number;
  social: number;
  willpower: number;
}

export interface ActivityLog {
  id: string;
  message: string;
  timestamp: number;
  type: 'XP' | 'LEVEL_UP' | 'PENALTY' | 'SYSTEM' | 'PURCHASE' | 'STREAK' | 'WORKOUT';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rank: Rank;
  category: keyof CoreStats;
  xpReward: number;
  isCompleted: boolean;
  createdAt: number;
  isDaily: boolean; // Identify repeatable quests
  trigger?: string; // The "When" condition/anchor for the habit
  miniQuest?: string; // The "Activation Energy" version (e.g., Just do 5 reps)
  completedAsMini?: boolean; // Track if completed in safe mode
}

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string; // Identifier for icon mapping
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
  date: string; // YYYY-MM-DD
  stats: CoreStats;
  totalXp: number;
  dailyXp: number;
}

// --- ADMIN / DATABASE TYPES ---
export interface AdminExercise {
  id: string;
  name: string;
  muscleGroup: string; // 'Chest', 'Back', 'Legs', 'Shoulders', 'Triceps', 'Biceps', 'Abs', 'Cardio', 'Arms', 'Core'
  subTarget?: string; // 'Upper', 'Lower', 'Middle', 'Lats', 'Thickness', 'Front', 'Side', 'Rear'
  difficulty: string; // 'Beginner', 'Intermediate', 'Advanced'
  equipmentNeeded?: string; // 'Bodyweight', 'Dumbbell', 'Barbell', 'Machine', 'Cable'
  environment?: string; // 'Home', 'Dumbbells', 'Gym'
  imageUrl: string;
  videoUrl: string;
  caloriesBurn: number;
}

// Health & Biometrics Types
export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  duration: number; // Estimated minutes to complete
  completed: boolean;
  type: 'COMPOUND' | 'ACCESSORY' | 'CARDIO' | 'STRETCH';
  notes?: string; // For techniques like Drop-sets
  videoUrl?: string;
  imageUrl?: string;
}

export interface WorkoutDay {
  day: string;
  focus: string; // Push, Pull, Legs, Cardio, Rest
  exercises: Exercise[];
  isRecovery?: boolean;
  totalDuration: number;
}

export interface HealthProfile {
  gender: 'MALE' | 'FEMALE';
  age: number;
  height: number; // cm
  weight: number; // kg
  startingWeight?: number; // Track initial weight for progress
  targetWeight?: number; // Goal
  neck?: number;
  waist?: number;
  hip?: number;
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE';
  goal: 'LOSE_WEIGHT' | 'BUILD_MUSCLE' | 'ENDURANCE';
  equipment: 'GYM' | 'HOME_DUMBBELLS' | 'BODYWEIGHT';
  sessionDuration: number; // 30, 45, 60, 90, 120
  intensity: 'LIGHT' | 'MODERATE' | 'HIGH';
  injuries: string[];
  
  // Calculated
  bmi: number;
  bmr: number;
  bodyFat?: number;
  category: string;
  
  workoutPlan: WorkoutDay[];
  macros: { protein: number; carbs: number; fats: number; calories: number };
  lastWorkoutDate?: string;
}

export interface PenaltyTask {
  title: string;
  description: string;
  type: 'TIME' | 'PHYSICAL';
  duration?: number;
}

export interface PlayerData {
  userId?: string; 
  isConfigured: boolean; // Tracks if user has entered their name
  
  // Core System Data
  name: string;          // Player Display Name
  username?: string;     // Unique Handle for Auth
  identity?: string;     // The "Affirmed Identity" (e.g. "Disciplined Hunter")
  pin?: string;          // Access Key for Auth verification
  level: number;
  currentXp: number;     // XP in current level
  requiredXp: number;    // XP needed to level up
  totalXp: number;       // Lifetime XP for Ranking
  dailyXp: number;       // XP gained today (for daily graph)
  rank: Rank;
  gold: number;
  streak: number;        // Consecutive days logged in
  
  // Attributes
  stats: CoreStats;
  lastStatUpdate: StatTimestamps;
  history: HistoryEntry[]; // Historical data for graphs
  
  // Status
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  fatigue: number;
  job: string;
  title: string;

  // Logic & Persistence
  lastLoginDate: string; // YYYY-MM-DD
  dailyQuestComplete: boolean;
  isPenaltyActive: boolean;
  penaltyEndTime?: number; // Timestamp when penalty expires
  penaltyTask?: PenaltyTask; // Specific penalty assignment
  logs: ActivityLog[];
  quests: Quest[];
  shopItems: ShopItem[];
  awakening: AwakeningData;
  personalBests: Record<string, number>; // Map Exercise Name -> Max Reps/Weight (Simplified to number for now)
  
  // New Health Integration
  healthProfile?: HealthProfile;
  
  // Global Database (Mock Backend)
  exerciseDatabase: AdminExercise[];
  focusVideos: Record<string, string>; // Configuration for region videos
}
