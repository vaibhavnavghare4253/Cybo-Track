/**
 * Mock database using localStorage — used when running outside Tauri (plain Vite)
 */
import type { Goal, DailyProgress, SyncMeta, User } from '@cybo-track/shared-core';

const get = <T>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

const set = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value));

const SEED_USER_ID = 'dev-user';

export async function initDatabase(): Promise<void> {
  // Seed demo goals if none exist
  const existing = get<unknown[]>('goals', []);
  if (existing.length > 0) return;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const now = today.toISOString();

  const seedGoals = [
    { id: 'g1', user_id: SEED_USER_ID, title: 'Workout', description: 'Daily workout sessions', start_date: start, end_date: end, target_units: 25, created_at: now, updated_at: now, deleted: false },
    { id: 'g2', user_id: SEED_USER_ID, title: 'Read 10 pages', description: 'Read every day', start_date: start, end_date: end, target_units: 22, created_at: now, updated_at: now, deleted: false },
    { id: 'g3', user_id: SEED_USER_ID, title: 'Protein Intake 100g', description: 'Hit protein goal daily', start_date: start, end_date: end, target_units: 30, created_at: now, updated_at: now, deleted: false },
    { id: 'g4', user_id: SEED_USER_ID, title: 'Study', description: 'Study session', start_date: start, end_date: end, target_units: 15, created_at: now, updated_at: now, deleted: false },
    { id: 'g5', user_id: SEED_USER_ID, title: 'Share posts', description: 'Share attractive posts', start_date: start, end_date: end, target_units: 22, created_at: now, updated_at: now, deleted: false },
  ];

  const seedProgress = [
    { id: 'p1', goal_id: 'g1', date: start, value: 14, note: '', created_at: now, updated_at: now, deleted: false },
    { id: 'p2', goal_id: 'g2', date: start, value: 3,  note: '', created_at: now, updated_at: now, deleted: false },
    { id: 'p3', goal_id: 'g3', date: start, value: 9,  note: '', created_at: now, updated_at: now, deleted: false },
    { id: 'p4', goal_id: 'g4', date: start, value: 6,  note: '', created_at: now, updated_at: now, deleted: false },
    { id: 'p5', goal_id: 'g5', date: start, value: 3,  note: '', created_at: now, updated_at: now, deleted: false },
  ];

  set('goals', seedGoals);
  set('daily_progress', seedProgress);
}

// Users
export async function getUser(userId: string): Promise<User | null> {
  const users = get<User[]>('users', []);
  return users.find((u) => u.id === userId) ?? null;
}

export async function createUser(user: User): Promise<void> {
  const users = get<User[]>('users', []);
  if (!users.find((u) => u.id === user.id)) {
    set('users', [...users, user]);
  }
}

// Goals
export async function getAllGoals(userId: string): Promise<Goal[]> {
  const goals = get<Goal[]>('goals', []);
  return goals.filter((g) => g.user_id === userId && !g.deleted);
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  const goals = get<Goal[]>('goals', []);
  return goals.find((g) => g.id === goalId) ?? null;
}

export async function createGoal(goal: Goal): Promise<void> {
  const goals = get<Goal[]>('goals', []);
  set('goals', [...goals, goal]);
}

export async function updateGoal(goal: Goal): Promise<void> {
  const goals = get<Goal[]>('goals', []);
  set('goals', goals.map((g) => (g.id === goal.id ? goal : g)));
}

export async function deleteGoal(goalId: string, timestamp: string): Promise<void> {
  const goals = get<Goal[]>('goals', []);
  set(
    'goals',
    goals.map((g) =>
      g.id === goalId ? { ...g, deleted: true, updated_at: timestamp } : g
    )
  );
}

// Daily progress
export async function getProgressForGoal(goalId: string): Promise<DailyProgress[]> {
  const progress = get<DailyProgress[]>('daily_progress', []);
  return progress.filter((p) => p.goal_id === goalId && !p.deleted);
}

export async function getProgressForDate(
  goalId: string,
  date: string
): Promise<DailyProgress | null> {
  const progress = get<DailyProgress[]>('daily_progress', []);
  return progress.find((p) => p.goal_id === goalId && p.date === date) ?? null;
}

export async function createProgress(progress: DailyProgress): Promise<void> {
  const all = get<DailyProgress[]>('daily_progress', []);
  set('daily_progress', [...all, progress]);
}

export async function updateProgress(progress: DailyProgress): Promise<void> {
  const all = get<DailyProgress[]>('daily_progress', []);
  set('daily_progress', all.map((p) => (p.id === progress.id ? progress : p)));
}

// Sync (no-op stubs for browser)
export async function queueSync(_meta: SyncMeta): Promise<void> {}
export async function getPendingSyncs(): Promise<SyncMeta[]> { return []; }
export async function updateSyncStatus(_id: number, _status: string, _timestamp?: string): Promise<void> {}
export async function getLastSyncTime(_userId: string): Promise<string | null> { return null; }
export async function setLastSyncTime(_userId: string, _timestamp: string): Promise<void> {}
