import { Goal, DailyProgress, SyncMeta } from '../types';

/**
 * Sync engine for offline-first synchronization
 */

export interface SyncChange {
  entity_type: 'goal' | 'daily_progress';
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  data?: Goal | DailyProgress;
}

export interface RemoteChange {
  entity_type: 'goal' | 'daily_progress';
  data: Goal | DailyProgress;
}

/**
 * Queue a change for sync
 */
export function queueChange(
  entityType: 'goal' | 'daily_progress',
  entityId: string,
  operation: 'create' | 'update' | 'delete'
): SyncMeta {
  return {
    id: 0, // Will be auto-assigned by DB
    entity_type: entityType,
    entity_id: entityId,
    operation,
    last_attempt_at: undefined,
    status: 'pending',
  };
}

/**
 * Determine if a remote change should be applied (conflict resolution)
 * Uses last-write-wins strategy based on updated_at timestamp
 */
export function shouldApplyRemoteChange(
  localUpdatedAt: string | undefined,
  remoteUpdatedAt: string
): boolean {
  if (!localUpdatedAt) return true; // No local version, apply remote

  const localTime = new Date(localUpdatedAt).getTime();
  const remoteTime = new Date(remoteUpdatedAt).getTime();

  return remoteTime > localTime; // Remote is newer
}

/**
 * Prepare a batch of changes for push to server
 */
export function preparePushBatch(
  pendingMeta: SyncMeta[],
  getEntityById: (type: 'goal' | 'daily_progress', id: string) => Goal | DailyProgress | null
): SyncChange[] {
  return pendingMeta.map(meta => {
    const change: SyncChange = {
      entity_type: meta.entity_type,
      entity_id: meta.entity_id,
      operation: meta.operation,
    };

    // For create and update, include the entity data
    if (meta.operation !== 'delete') {
      const data = getEntityById(meta.entity_type, meta.entity_id);
      if (data) {
        change.data = data;
      }
    }

    return change;
  });
}

/**
 * Process remote changes and prepare them for local application
 */
export function processRemoteChanges(
  remoteChanges: RemoteChange[],
  getLocalEntity: (type: 'goal' | 'daily_progress', id: string) => Goal | DailyProgress | null
): RemoteChange[] {
  return remoteChanges.filter(change => {
    const localEntity = getLocalEntity(change.entity_type, change.data.id);
    
    if (!localEntity) {
      return true; // New entity, apply it
    }

    // Check if remote is newer
    return shouldApplyRemoteChange(localEntity.updated_at, change.data.updated_at);
  });
}

/**
 * Generate a timestamp for the current moment
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate a conflict-free identifier (simple version)
 * In production, use uuid.v4()
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

