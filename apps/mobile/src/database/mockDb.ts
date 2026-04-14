/**
 * In-memory mock database for UI development (no SQLite needed)
 */
import type { Goal, DailyProgress, SyncMeta, User } from '@cybo-track/shared-core';

const store: Record<string, unknown[]> = {
  users: [],
  goals: [],
  daily_progress: [],
  sync_meta: [],
};

const SEED_USER_ID = 'dev-user';

function seedIfEmpty() {
  if ((store.goals as Goal[]).length > 0) return;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const now = today.toISOString();

  store.goals = [
    { id: 'g1', user_id: SEED_USER_ID, title: 'Workout', description: 'Daily workout sessions', start_date: start, end_date: end, target_units: 25, created_at: now, updated_at: now, deleted: false },
    { id: 'g2', user_id: SEED_USER_ID, title: 'Read 10 pages', description: 'Read every day', start_date: start, end_date: end, target_units: 22, created_at: now, updated_at: now, deleted: false },
    { id: 'g3', user_id: SEED_USER_ID, title: 'Protein Intake 100g', description: 'Hit protein goal daily', start_date: start, end_date: end, target_units: 30, created_at: now, updated_at: now, deleted: false },
    { id: 'g4', user_id: SEED_USER_ID, title: 'Study', description: 'Study session', start_date: start, end_date: end, target_units: 15, created_at: now, updated_at: now, deleted: false },
    { id: 'g5', user_id: SEED_USER_ID, title: 'Share posts', description: 'Share attractive posts', start_date: start, end_date: end, target_units: 22, created_at: now, updated_at: now, deleted: false },
  ] as Goal[];

  store.daily_progress = [
    { id: 'p1', goal_id: 'g1', date: start, value: 14, note: '', created_at: now, updated_at: now, deleted: false },
    { id: 'p2', goal_id: 'g2', date: start, value: 3,  note: '', created_at: now, updated_at: now, deleted: false },
    { id: 'p3', goal_id: 'g3', date: start, value: 9,  note: '', created_at: now, updated_at: now, deleted: false },
    { id: 'p4', goal_id: 'g4', date: start, value: 6,  note: '', created_at: now, updated_at: now, deleted: false },
    { id: 'p5', goal_id: 'g5', date: start, value: 3,  note: '', created_at: now, updated_at: now, deleted: false },
  ] as DailyProgress[];
}

class MockDatabase {
  async init(): Promise<void> { seedIfEmpty(); }

  async getUser(userId: string): Promise<User | null> {
    return (store.users as User[]).find((u) => u.id === userId) ?? null;
  }
  async createUser(user: User): Promise<void> {
    if (!(store.users as User[]).find((u) => u.id === user.id)) {
      (store.users as User[]).push(user);
    }
  }

  async getAllGoals(userId: string): Promise<Goal[]> {
    return (store.goals as Goal[]).filter((g) => g.user_id === userId && !g.deleted);
  }
  async getGoal(goalId: string): Promise<Goal | null> {
    return (store.goals as Goal[]).find((g) => g.id === goalId) ?? null;
  }
  async createGoal(goal: Goal): Promise<void> {
    (store.goals as Goal[]).push(goal);
  }
  async updateGoal(goal: Goal): Promise<void> {
    const i = (store.goals as Goal[]).findIndex((g) => g.id === goal.id);
    if (i !== -1) (store.goals as Goal[])[i] = goal;
  }
  async deleteGoal(goalId: string, timestamp: string): Promise<void> {
    const g = (store.goals as Goal[]).find((g) => g.id === goalId);
    if (g) { g.deleted = true; g.updated_at = timestamp; }
  }

  async getProgressForGoal(goalId: string): Promise<DailyProgress[]> {
    return (store.daily_progress as DailyProgress[]).filter((p) => p.goal_id === goalId && !p.deleted);
  }
  async getProgressForDate(goalId: string, date: string): Promise<DailyProgress | null> {
    return (store.daily_progress as DailyProgress[]).find((p) => p.goal_id === goalId && p.date === date) ?? null;
  }
  async createProgress(progress: DailyProgress): Promise<void> {
    (store.daily_progress as DailyProgress[]).push(progress);
  }
  async updateProgress(progress: DailyProgress): Promise<void> {
    const i = (store.daily_progress as DailyProgress[]).findIndex((p) => p.id === progress.id);
    if (i !== -1) (store.daily_progress as DailyProgress[])[i] = progress;
  }

  async queueSync(_meta: SyncMeta): Promise<void> {}
  async getPendingSyncs(): Promise<SyncMeta[]> { return []; }
  async updateSyncStatus(_id: number, _status: string, _timestamp?: string): Promise<void> {}
  async getLastSyncTime(_userId: string): Promise<string | null> { return null; }
  async setLastSyncTime(_userId: string, _timestamp: string): Promise<void> {}
  async close(): Promise<void> {}
}

export const mockDatabase = new MockDatabase();
