/**
 * Alternative database service using tauri-plugin-sql directly
 * This is a simpler approach than custom Rust commands
 */
import Database from '@tauri-apps/plugin-sql';
import type { Goal, DailyProgress, SyncMeta, User } from '@cybo-track/shared-core';

let db: Database | null = null;

// Initialize database
export async function initDatabase(): Promise<void> {
  if (!db) {
    db = await Database.load('sqlite:cybotrack.db');
  }
}

async function getDb(): Promise<Database> {
  if (!db) {
    await initDatabase();
  }
  return db!;
}

// User operations
export async function getUser(userId: string): Promise<User | null> {
  const database = await getDb();
  const result = await database.select<User[]>(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  return result[0] || null;
}

export async function createUser(user: User): Promise<void> {
  const database = await getDb();
  await database.execute(
    'INSERT OR REPLACE INTO users (id, email, created_at) VALUES ($1, $2, $3)',
    [user.id, user.email, user.created_at]
  );
}

// Goal operations
export async function getAllGoals(userId: string): Promise<Goal[]> {
  const database = await getDb();
  return await database.select<Goal[]>(
    'SELECT * FROM goals WHERE user_id = $1 AND deleted = 0 ORDER BY created_at DESC',
    [userId]
  );
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  const database = await getDb();
  const result = await database.select<Goal[]>(
    'SELECT * FROM goals WHERE id = $1',
    [goalId]
  );
  return result[0] || null;
}

export async function createGoal(goal: Goal): Promise<void> {
  const database = await getDb();
  await database.execute(
    `INSERT INTO goals (id, user_id, title, description, start_date, end_date, 
     target_units, created_at, updated_at, deleted) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      goal.id,
      goal.user_id,
      goal.title,
      goal.description,
      goal.start_date,
      goal.end_date,
      goal.target_units ?? null,
      goal.created_at,
      goal.updated_at,
      goal.deleted ? 1 : 0,
    ]
  );
}

export async function updateGoal(goal: Goal): Promise<void> {
  const database = await getDb();
  await database.execute(
    `UPDATE goals SET title = $1, description = $2, start_date = $3, end_date = $4,
     target_units = $5, updated_at = $6, deleted = $7 WHERE id = $8`,
    [
      goal.title,
      goal.description,
      goal.start_date,
      goal.end_date,
      goal.target_units ?? null,
      goal.updated_at,
      goal.deleted ? 1 : 0,
      goal.id,
    ]
  );
}

export async function deleteGoal(goalId: string, timestamp: string): Promise<void> {
  const database = await getDb();
  await database.execute(
    'UPDATE goals SET deleted = 1, updated_at = $1 WHERE id = $2',
    [timestamp, goalId]
  );
}

// Daily progress operations
export async function getProgressForGoal(goalId: string): Promise<DailyProgress[]> {
  const database = await getDb();
  return await database.select<DailyProgress[]>(
    'SELECT * FROM daily_progress WHERE goal_id = $1 AND deleted = 0 ORDER BY date DESC',
    [goalId]
  );
}

export async function getProgressForDate(
  goalId: string,
  date: string
): Promise<DailyProgress | null> {
  const database = await getDb();
  const result = await database.select<DailyProgress[]>(
    'SELECT * FROM daily_progress WHERE goal_id = $1 AND date = $2',
    [goalId, date]
  );
  return result[0] || null;
}

export async function createProgress(progress: DailyProgress): Promise<void> {
  const database = await getDb();
  await database.execute(
    `INSERT OR REPLACE INTO daily_progress (id, goal_id, date, value, note, 
     created_at, updated_at, deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      progress.id,
      progress.goal_id,
      progress.date,
      progress.value,
      progress.note,
      progress.created_at,
      progress.updated_at,
      progress.deleted ? 1 : 0,
    ]
  );
}

export async function updateProgress(progress: DailyProgress): Promise<void> {
  const database = await getDb();
  await database.execute(
    `UPDATE daily_progress SET value = $1, note = $2, updated_at = $3, deleted = $4 
     WHERE id = $5`,
    [progress.value, progress.note, progress.updated_at, progress.deleted ? 1 : 0, progress.id]
  );
}

// Sync operations
export async function queueSync(meta: SyncMeta): Promise<void> {
  const database = await getDb();
  await database.execute(
    `INSERT OR REPLACE INTO sync_meta (entity_type, entity_id, operation, status) 
     VALUES ($1, $2, $3, $4)`,
    [meta.entity_type, meta.entity_id, meta.operation, meta.status]
  );
}

export async function getPendingSyncs(): Promise<SyncMeta[]> {
  const database = await getDb();
  return await database.select<SyncMeta[]>(
    "SELECT * FROM sync_meta WHERE status = 'pending' ORDER BY id"
  );
}

export async function updateSyncStatus(
  id: number,
  status: string,
  timestamp?: string
): Promise<void> {
  const database = await getDb();
  if (timestamp) {
    await database.execute(
      'UPDATE sync_meta SET status = $1, last_attempt_at = $2 WHERE id = $3',
      [status, timestamp, id]
    );
  } else {
    await database.execute('UPDATE sync_meta SET status = $1 WHERE id = $2', [status, id]);
  }
}

export async function getLastSyncTime(userId: string): Promise<string | null> {
  const database = await getDb();
  const result = await database.select<Array<{ last_sync_at: string }>>(
    'SELECT last_sync_at FROM sync_settings WHERE user_id = $1',
    [userId]
  );
  return result[0]?.last_sync_at || null;
}

export async function setLastSyncTime(userId: string, timestamp: string): Promise<void> {
  const database = await getDb();
  await database.execute(
    'INSERT OR REPLACE INTO sync_settings (user_id, last_sync_at) VALUES ($1, $2)',
    [userId, timestamp]
  );
}

