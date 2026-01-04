// Fix: Import React to support React.ReactNode type usage
import React from 'react';

export enum SystemState {
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED'
}

export type Tab = 'DASHBOARD' | 'QUESTS' | 'SHOP' | 'PROFILE';

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
  type: 'XP' | 'LEVEL_UP' | 'PENALTY' | 'SYSTEM' | 'PURCHASE';
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
  isDaily?: boolean; // New: Identify repeatable quests
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

export interface PlayerData {
  userId?: string; // Linked to Supabase Auth ID
  
  // Core System Data
  name: string;          // Player Name
  level: number;
  currentXp: number;     // XP in current level
  requiredXp: number;    // XP needed to level up
  totalXp: number;       // Lifetime XP for Ranking
  dailyXp: number;       // XP gained today (for daily graph)
  rank: Rank;
  gold: number;
  
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
  logs: ActivityLog[];
  quests: Quest[];
  shopItems: ShopItem[];
  awakening: AwakeningData;
}