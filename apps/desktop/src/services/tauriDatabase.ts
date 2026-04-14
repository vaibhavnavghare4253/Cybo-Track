/**
 * Tauri database service using invoke (only used inside Tauri app)
 */
import { invoke } from '@tauri-apps/api/core';
import type { Goal, DailyProgress, SyncMeta, User } from '@cybo-track/shared-core';

export async function initDatabase(): Promise<void> {
  await invoke('init_db');
}

export async function getUser(userId: string): Promise<User | null> {
  return invoke('get_user', { userId });
}

export async function createUser(user: User): Promise<void> {
  await invoke('create_user', { user });
}

export async function getAllGoals(userId: string): Promise<Goal[]> {
  return invoke('get_all_goals', { userId });
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  return invoke('get_goal', { goalId });
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

export async function getProgressForGoal(goalId: string): Promise<DailyProgress[]> {
  return invoke('get_progress_for_goal', { goalId });
}

export async function getProgressForDate(goalId: string, date: string): Promise<DailyProgress | null> {
  return invoke('get_progress_for_date', { goalId, date });
}

export async function createProgress(progress: DailyProgress): Promise<void> {
  await invoke('create_progress', { progress });
}

export async function updateProgress(progress: DailyProgress): Promise<void> {
  await invoke('update_progress', { progress });
}

export async function queueSync(meta: SyncMeta): Promise<void> {
  await invoke('queue_sync', { meta });
}

export async function getPendingSyncs(): Promise<SyncMeta[]> {
  return invoke('get_pending_syncs');
}

export async function updateSyncStatus(id: number, status: string, timestamp?: string): Promise<void> {
  await invoke('update_sync_status', { id, status, timestamp });
}

export async function getLastSyncTime(userId: string): Promise<string | null> {
  return invoke('get_last_sync_time', { userId });
}

export async function setLastSyncTime(userId: string, timestamp: string): Promise<void> {
  await invoke('set_last_sync_time', { userId, timestamp });
}
