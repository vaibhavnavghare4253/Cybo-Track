/**
 * Database service using Tauri's SQL plugin
 */
import { invoke } from '@tauri-apps/api/core';
import type { Goal, DailyProgress, SyncMeta, User } from '@cybo-track/shared-core';

// Initialize database
export async function initDatabase(): Promise<void> {
  try {
    await invoke('init_db');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// User operations
export async function getUser(userId: string): Promise<User | null> {
  try {
    return await invoke('get_user', { userId });
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function createUser(user: User): Promise<void> {
  await invoke('create_user', { user });
}

// Goal operations
export async function getAllGoals(userId: string): Promise<Goal[]> {
  try {
    return await invoke('get_all_goals', { userId });
  } catch (error) {
    console.error('Error getting goals:', error);
    return [];
  }
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  try {
    return await invoke('get_goal', { goalId });
  } catch (error) {
    console.error('Error getting goal:', error);
    return null;
  }
}

export async function createGoal(goal: Goal): Promise<void> {
  await invoke('create_goal', { goal });
}

export async function updateGoal(goal: Goal): Promise<void> {
  await invoke('update_goal', { goal });
}

export async function deleteGoal(goalId: string, timestamp: string): Promise<void> {
  await invoke('delete_goal', { goalId, timestamp });
}

// Daily progress operations
export async function getProgressForGoal(goalId: string): Promise<DailyProgress[]> {
  try {
    return await invoke('get_progress_for_goal', { goalId });
  } catch (error) {
    console.error('Error getting progress:', error);
    return [];
  }
}

export async function getProgressForDate(
  goalId: string,
  date: string
): Promise<DailyProgress | null> {
  try {
    return await invoke('get_progress_for_date', { goalId, date });
  } catch (error) {
    console.error('Error getting progress for date:', error);
    return null;
  }
}

export async function createProgress(progress: DailyProgress): Promise<void> {
  await invoke('create_progress', { progress });
}

export async function updateProgress(progress: DailyProgress): Promise<void> {
  await invoke('update_progress', { progress });
}

// Sync operations
export async function queueSync(meta: SyncMeta): Promise<void> {
  await invoke('queue_sync', { meta });
}

export async function getPendingSyncs(): Promise<SyncMeta[]> {
  try {
    return await invoke('get_pending_syncs');
  } catch (error) {
    console.error('Error getting pending syncs:', error);
    return [];
  }
}

export async function updateSyncStatus(
  id: number,
  status: string,
  timestamp?: string
): Promise<void> {
  await invoke('update_sync_status', { id, status, timestamp });
}

export async function getLastSyncTime(userId: string): Promise<string | null> {
  try {
    return await invoke('get_last_sync_time', { userId });
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
}

export async function setLastSyncTime(userId: string, timestamp: string): Promise<void> {
  await invoke('set_last_sync_time', { userId, timestamp });
}

