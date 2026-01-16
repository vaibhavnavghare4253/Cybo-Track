import { database } from '../database/db';
import { supabase } from './supabase';
import { generateTimestamp } from '@cybo-track/shared-core';
import type { Goal, DailyProgress } from '@cybo-track/shared-core';

/**
 * Sync service for pushing and pulling data to/from Supabase
 */
export class SyncService {
  private isSyncing = false;

  async sync(userId: string): Promise<{ success: boolean; error?: string }> {
    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.isSyncing = true;

    try {
      // Push local changes first
      await this.pushChanges(userId);

      // Pull remote changes
      await this.pullChanges(userId);

      // Update last sync time
      const now = generateTimestamp();
      await database.setLastSyncTime(userId, now);

      return { success: true };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.isSyncing = false;
    }
  }

  private async pushChanges(userId: string): Promise<void> {
    const pendingSyncs = await database.getPendingSyncs();

    for (const sync of pendingSyncs) {
      try {
        const now = generateTimestamp();

        if (sync.entity_type === 'goal') {
          const goal = await database.getGoal(sync.entity_id);
          if (!goal) continue;

          if (sync.operation === 'create' || sync.operation === 'update') {
            const { error } = await supabase
              .from('goals')
              .upsert({
                id: goal.id,
                user_id: goal.user_id,
                title: goal.title,
                description: goal.description,
                start_date: goal.start_date,
                end_date: goal.end_date,
                target_units: goal.target_units,
                created_at: goal.created_at,
                updated_at: goal.updated_at,
                deleted: goal.deleted,
              });

            if (error) throw error;
          } else if (sync.operation === 'delete') {
            const { error } = await supabase
              .from('goals')
              .update({ deleted: true, updated_at: now })
              .eq('id', sync.entity_id);

            if (error) throw error;
          }
        } else if (sync.entity_type === 'daily_progress') {
          const progress = await database.getProgressForGoal(sync.entity_id);
          const item = progress.find(p => p.id === sync.entity_id);
          if (!item) continue;

          if (sync.operation === 'create' || sync.operation === 'update') {
            const { error } = await supabase
              .from('daily_progress')
              .upsert({
                id: item.id,
                goal_id: item.goal_id,
                date: item.date,
                value: item.value,
                note: item.note,
                created_at: item.created_at,
                updated_at: item.updated_at,
                deleted: item.deleted,
              });

            if (error) throw error;
          } else if (sync.operation === 'delete') {
            const { error } = await supabase
              .from('daily_progress')
              .update({ deleted: true, updated_at: now })
              .eq('id', sync.entity_id);

            if (error) throw error;
          }
        }

        // Mark as synced
        await database.updateSyncStatus(sync.id, 'synced', now);
      } catch (error) {
        console.error(`Failed to sync ${sync.entity_type} ${sync.entity_id}:`, error);
        await database.updateSyncStatus(sync.id, 'failed', generateTimestamp());
      }
    }
  }

  private async pullChanges(userId: string): Promise<void> {
    const lastSync = await database.getLastSyncTime(userId);
    const timestamp = lastSync || new Date(0).toISOString();

    // Pull goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', timestamp);

    if (goalsError) throw goalsError;

    if (goals) {
      for (const goal of goals as Goal[]) {
        const existing = await database.getGoal(goal.id);
        if (existing) {
          await database.updateGoal(goal);
        } else {
          await database.createGoal(goal);
        }
      }
    }

    // Pull daily progress
    const { data: progress, error: progressError } = await supabase
      .from('daily_progress')
      .select('*')
      .gt('updated_at', timestamp);

    if (progressError) throw progressError;

    if (progress) {
      for (const item of progress as DailyProgress[]) {
        const existing = await database.getProgressForDate(item.goal_id, item.date);
        if (existing) {
          await database.updateProgress(item);
        } else {
          await database.createProgress(item);
        }
      }
    }
  }
}

export const syncService = new SyncService();

