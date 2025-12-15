/**
 * Core data types for Cybo-Track
 */

export interface User {
  id: string; // UUID
  email: string;
  created_at: string; // ISO timestamp
}

export interface Goal {
  id: string; // UUID
  user_id: string; // UUID
  title: string;
  description: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  target_units?: number; // Optional target (e.g., 100 study hours)
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  deleted: boolean; // Soft delete flag
}

export interface DailyProgress {
  id: string; // UUID
  goal_id: string; // UUID
  date: string; // ISO date string
  value: number; // Progress value (int or float)
  note: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  deleted: boolean; // Soft delete flag
}

export interface SyncMeta {
  id: number; // Auto-increment local ID
  entity_type: 'goal' | 'daily_progress';
  entity_id: string; // UUID of the entity
  operation: 'create' | 'update' | 'delete';
  last_attempt_at?: string; // ISO timestamp
  status: 'pending' | 'synced' | 'failed';
}

export interface SyncSettings {
  user_id: string;
  last_sync_at: string; // ISO timestamp
}

// UI-specific types
export interface GoalWithProgress extends Goal {
  total_progress: number;
  completion_percentage: number;
  current_streak: number;
  days_remaining: number;
}

export interface DashboardStats {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  today_progress_count: number;
  longest_streak: number;
}

