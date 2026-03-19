/**
 * Database service — uses Tauri invoke when available, falls back to localStorage mock
 */
import type { Goal, DailyProgress, SyncMeta, User } from '@cybo-track/shared-core';

// Detect if we're running inside Tauri
const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Lazy-load the right implementation
async function getImpl() {
  if (isTauri()) {
    return import('./tauriDatabase');
  }
  return import('./mockDatabase');
}

export async function initDatabase(): Promise<void> {
  return (await getImpl()).initDatabase();
}

export async function getUser(userId: string): Promise<User | null> {
  return (await getImpl()).getUser(userId);
}

export async function createUser(user: User): Promise<void> {
  return (await getImpl()).createUser(user);
}

export async function getAllGoals(userId: string): Promise<Goal[]> {
  return (await getImpl()).getAllGoals(userId);
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  return (await getImpl()).getGoal(goalId);
}

export async function createGoal(goal: Goal): Promise<void> {
  return (await getImpl()).createGoal(goal);
}

export async function updateGoal(goal: Goal): Promise<void> {
  return (await getImpl()).updateGoal(goal);
}

export async function deleteGoal(goalId: string, timestamp: string): Promise<void> {
  return (await getImpl()).deleteGoal(goalId, timestamp);
}

export async function getProgressForGoal(goalId: string): Promise<DailyProgress[]> {
  return (await getImpl()).getProgressForGoal(goalId);
}

export async function getProgressForDate(goalId: string, date: string): Promise<DailyProgress | null> {
  return (await getImpl()).getProgressForDate(goalId, date);
}

export async function createProgress(progress: DailyProgress): Promise<void> {
  return (await getImpl()).createProgress(progress);
}

export async function updateProgress(progress: DailyProgress): Promise<void> {
  return (await getImpl()).updateProgress(progress);
}

export async function queueSync(meta: SyncMeta): Promise<void> {
  return (await getImpl()).queueSync(meta);
}

export async function getPendingSyncs(): Promise<SyncMeta[]> {
  return (await getImpl()).getPendingSyncs();
}

export async function updateSyncStatus(id: number, status: string, timestamp?: string): Promise<void> {
  return (await getImpl()).updateSyncStatus(id, status, timestamp);
}

export async function getLastSyncTime(userId: string): Promise<string | null> {
  return (await getImpl()).getLastSyncTime(userId);
}

export async function setLastSyncTime(userId: string, timestamp: string): Promise<void> {
  return (await getImpl()).setLastSyncTime(userId, timestamp);
}
