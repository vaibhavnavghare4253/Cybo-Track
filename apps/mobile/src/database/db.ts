import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import type { Goal, DailyProgress, SyncMeta, User } from '@cybo-track/shared-core';

/**
 * Database wrapper for SQLite operations
 */
class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await SQLite.openDatabaseAsync('cybotrack.db');
    await this.db.execAsync(CREATE_TABLES_SQL);
  }

  private ensureDb(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // User operations
  async getUser(userId: string): Promise<User | null> {
    const db = this.ensureDb();
    const result = await db.getFirstAsync<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    return result || null;
  }

  async createUser(user: User): Promise<void> {
    const db = this.ensureDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO users (id, email, created_at) VALUES (?, ?, ?)',
      [user.id, user.email, user.created_at]
    );
  }

  // Goal operations
  async getAllGoals(userId: string): Promise<Goal[]> {
    const db = this.ensureDb();
    return await db.getAllAsync<Goal>(
      'SELECT * FROM goals WHERE user_id = ? AND deleted = 0 ORDER BY created_at DESC',
      [userId]
    );
  }

  async getGoal(goalId: string): Promise<Goal | null> {
    const db = this.ensureDb();
    const result = await db.getFirstAsync<Goal>(
      'SELECT * FROM goals WHERE id = ?',
      [goalId]
    );
    return result || null;
  }

  async createGoal(goal: Goal): Promise<void> {
    const db = this.ensureDb();
    await db.runAsync(
      `INSERT INTO goals (id, user_id, title, description, start_date, end_date, 
       target_units, created_at, updated_at, deleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

  async updateGoal(goal: Goal): Promise<void> {
    const db = this.ensureDb();
    await db.runAsync(
      `UPDATE goals SET title = ?, description = ?, start_date = ?, end_date = ?,
       target_units = ?, updated_at = ?, deleted = ? WHERE id = ?`,
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

  async deleteGoal(goalId: string, timestamp: string): Promise<void> {
    const db = this.ensureDb();
    await db.runAsync(
      'UPDATE goals SET deleted = 1, updated_at = ? WHERE id = ?',
      [timestamp, goalId]
    );
  }

  // Daily progress operations
  async getProgressForGoal(goalId: string): Promise<DailyProgress[]> {
    const db = this.ensureDb();
    return await db.getAllAsync<DailyProgress>(
      'SELECT * FROM daily_progress WHERE goal_id = ? AND deleted = 0 ORDER BY date DESC',
      [goalId]
    );
  }

  async getProgressForDate(goalId: string, date: string): Promise<DailyProgress | null> {
    const db = this.ensureDb();
    const result = await db.getFirstAsync<DailyProgress>(
      'SELECT * FROM daily_progress WHERE goal_id = ? AND date = ?',
      [goalId, date]
    );
    return result || null;
  }

  async createProgress(progress: DailyProgress): Promise<void> {
    const db = this.ensureDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO daily_progress (id, goal_id, date, value, note, 
       created_at, updated_at, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

  async updateProgress(progress: DailyProgress): Promise<void> {
    const db = this.ensureDb();
    await db.runAsync(
      `UPDATE daily_progress SET value = ?, note = ?, updated_at = ?, deleted = ? 
       WHERE id = ?`,
      [progress.value, progress.note, progress.updated_at, progress.deleted ? 1 : 0, progress.id]
    );
  }

  // Sync operations
  async queueSync(meta: SyncMeta): Promise<void> {
    const db = this.ensureDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_meta (entity_type, entity_id, operation, status) 
       VALUES (?, ?, ?, ?)`,
      [meta.entity_type, meta.entity_id, meta.operation, meta.status]
    );
  }

  async getPendingSyncs(): Promise<SyncMeta[]> {
    const db = this.ensureDb();
    return await db.getAllAsync<SyncMeta>(
      "SELECT * FROM sync_meta WHERE status = 'pending' ORDER BY id"
    );
  }

  async updateSyncStatus(id: number, status: string, timestamp?: string): Promise<void> {
    const db = this.ensureDb();
    if (timestamp) {
      await db.runAsync(
        'UPDATE sync_meta SET status = ?, last_attempt_at = ? WHERE id = ?',
        [status, timestamp, id]
      );
    } else {
      await db.runAsync('UPDATE sync_meta SET status = ? WHERE id = ?', [status, id]);
    }
  }

  async getLastSyncTime(userId: string): Promise<string | null> {
    const db = this.ensureDb();
    const result = await db.getFirstAsync<{ last_sync_at: string }>(
      'SELECT last_sync_at FROM sync_settings WHERE user_id = ?',
      [userId]
    );
    return result?.last_sync_at || null;
  }

  async setLastSyncTime(userId: string, timestamp: string): Promise<void> {
    const db = this.ensureDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO sync_settings (user_id, last_sync_at) VALUES (?, ?)',
      [userId, timestamp]
    );
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const database = new Database();

