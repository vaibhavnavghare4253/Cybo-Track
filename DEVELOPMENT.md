# Development Guide

This guide covers development workflows, best practices, and technical details for Cybo-Track.

## Development Setup

### Initial Setup

```bash
# Clone and install
git clone <repository-url>
cd cybo-track
pnpm install

# Build shared package
cd packages/shared-core
pnpm build

# Return to root
cd ../..
```

### Running in Development

**Mobile**:
```bash
pnpm mobile
# or
cd apps/mobile && pnpm start
```

**Desktop**:
```bash
pnpm desktop
# or
cd apps/desktop && pnpm tauri:dev
```

## Project Architecture

### Monorepo Structure

We use **pnpm workspaces** to manage the monorepo:

```
cybo-track/
├── packages/shared-core/    # Shared TypeScript code
├── apps/mobile/             # React Native app
└── apps/desktop/            # Tauri app
```

Benefits:
- Shared business logic
- Single source of truth for types
- Consistent versioning
- Easy dependency management

### Shared Core Package

Located in `packages/shared-core`, this contains:

**Types** (`src/types/`):
- `User`, `Goal`, `DailyProgress`
- `SyncMeta`, `GoalWithProgress`
- Database and UI types

**Utilities** (`src/utils/calculations.ts`):
- `calculateCompletionPercentage()`
- `calculateStreak()`
- `calculateDaysRemaining()`
- `enrichGoalWithProgress()`

**Sync Engine** (`src/sync/syncEngine.ts`):
- `queueChange()`
- `shouldApplyRemoteChange()`
- `preparePushBatch()`
- `processRemoteChanges()`

### Database Layer

**Mobile** (`apps/mobile/src/database/`):
- Uses `expo-sqlite`
- Direct SQL queries
- Local-first architecture

**Desktop** (`apps/desktop/src/services/`):
- Two implementations available:
  1. `database.ts` - Custom Tauri commands
  2. `databasePlugin.ts` - tauri-plugin-sql (recommended)

### Sync Architecture

```
┌─────────────┐
│   User      │
│   Action    │
└─────┬───────┘
      │
      v
┌─────────────┐
│   Local     │  1. Write to local SQLite
│   SQLite    │  2. Add to sync_meta queue
└─────┬───────┘
      │
      v
┌─────────────┐
│   Sync      │  3. Background sync process
│   Engine    │  4. Push & Pull changes
└─────┬───────┘
      │
      v
┌─────────────┐
│  Supabase   │  5. Central database
│  Postgres   │  6. Row Level Security
└─────────────┘
```

## Development Workflows

### Adding a New Feature

1. **Define types** in `packages/shared-core/src/types/`
2. **Add business logic** in `packages/shared-core/src/utils/`
3. **Update database schema** in both mobile and desktop
4. **Implement UI** in mobile and/or desktop apps
5. **Add sync support** if needed
6. **Test offline** functionality

### Modifying Database Schema

1. **Update schema** in:
   - `apps/mobile/src/database/schema.ts`
   - `apps/desktop/src-tauri/src/main.rs` (migration)
   - Supabase SQL Editor

2. **Update TypeScript types** in:
   - `packages/shared-core/src/types/`

3. **Update database functions** in:
   - `apps/mobile/src/database/db.ts`
   - `apps/desktop/src/services/database.ts` or `databasePlugin.ts`

4. **Test migrations** on fresh install and existing data

### Adding a Sync Operation

1. **Queue change** when data is modified:
```typescript
await database.createGoal(goal);
await database.queueSync({
  id: 0,
  entity_type: 'goal',
  entity_id: goal.id,
  operation: 'create',
  status: 'pending',
});
```

2. **Handle in sync service**:
```typescript
// Push phase
const pendingSyncs = await database.getPendingSyncs();
for (const sync of pendingSyncs) {
  // Upload to Supabase
  await supabase.from('goals').upsert(goalData);
  await database.updateSyncStatus(sync.id, 'synced');
}

// Pull phase
const { data } = await supabase
  .from('goals')
  .select('*')
  .gt('updated_at', lastSyncTime);
// Merge into local database
```

## Best Practices

### Code Organization

- **Keep business logic in shared-core**: Reusable across platforms
- **Platform-specific code in apps**: UI, native features
- **Database operations in services**: Centralized data access
- **Context for state**: React Context for global state

### TypeScript

- **Use strict mode**: Catch errors early
- **Define explicit types**: Avoid `any`
- **Export types**: Share between packages
- **Use interfaces for data**: Easier to extend

### Database

- **Write locally first**: Always prioritize local operations
- **Queue sync operations**: Don't block UI on network
- **Use transactions**: For related operations
- **Index frequently queried columns**: Performance

### Sync Strategy

- **Last-write-wins**: Simple conflict resolution
- **Timestamp everything**: Use ISO 8601 format
- **Soft delete**: Set `deleted = true` instead of DELETE
- **Batch operations**: Sync multiple changes together

### Error Handling

```typescript
try {
  await database.createGoal(goal);
  await database.queueSync(syncMeta);
} catch (error) {
  console.error('Failed to create goal:', error);
  // Show user-friendly error
  Alert.alert('Error', 'Failed to create goal. Please try again.');
}
```

### Testing Offline Functionality

1. **Disable network**: 
   - iOS Simulator: `Hardware > Network > Wi-Fi Off`
   - Android Emulator: `Extended Controls > Network`
   - Desktop: Disable Wi-Fi

2. **Verify operations**:
   - Create/edit/delete works
   - Data persists after restart
   - Sync queue builds up

3. **Re-enable network**:
   - Verify automatic sync
   - Check for conflicts
   - Confirm data integrity

## Debugging

### Mobile App

**React Native Debugger**:
```bash
# Chrome DevTools
Press 'j' in Metro console
```

**Database Inspection**:
```typescript
// View SQLite database
import * as FileSystem from 'expo-file-system';
console.log(FileSystem.documentDirectory);
```

### Desktop App

**Chrome DevTools**:
```bash
# Right-click in app and select "Inspect"
# Or press F12
```

**Rust Logs**:
```bash
# Run with debug output
RUST_LOG=debug pnpm tauri:dev
```

**Database Location**:
- Windows: `%APPDATA%/com.cybotrack.app/`
- macOS: `~/Library/Application Support/com.cybotrack.app/`
- Linux: `~/.local/share/com.cybotrack.app/`

## Performance Optimization

### Database Queries

- Use indexes on frequently queried columns
- Limit result sets with WHERE clauses
- Avoid N+1 queries (use JOINs when appropriate)
- Cache frequently accessed data

### UI Rendering

- Use `React.memo()` for expensive components
- Implement virtualized lists for long lists
- Debounce search inputs
- Use `useCallback` for event handlers

### Sync Optimization

- Batch multiple changes
- Only sync modified fields
- Implement exponential backoff for retries
- Use delta sync (only changed records)

## Common Development Tasks

### Add New Screen (Mobile)

```bash
cd apps/mobile/app
# Create new file
touch new-screen.tsx
```

```typescript
// new-screen.tsx
import { View, Text } from 'react-native';

export default function NewScreen() {
  return (
    <View>
      <Text>New Screen</Text>
    </View>
  );
}
```

### Add New Route (Desktop)

```typescript
// apps/desktop/src/App.tsx
<Route path="/new-page" element={<NewPage />} />
```

### Update Shared Type

```typescript
// packages/shared-core/src/types/index.ts
export interface NewType {
  id: string;
  name: string;
}

// Then rebuild shared-core
cd packages/shared-core
pnpm build
```

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation

### Commit Messages

Follow conventional commits:

```
feat: add goal categories
fix: correct streak calculation
docs: update setup guide
refactor: simplify sync logic
style: format code with prettier
test: add goal creation tests
```

### Pull Request Process

1. Create feature branch
2. Implement changes
3. Test on mobile and desktop
4. Update documentation
5. Create PR with description
6. Address review comments
7. Merge when approved

## Troubleshooting

### "Cannot find module @cybo-track/shared-core"

```bash
cd packages/shared-core
pnpm build
```

### Expo Metro bundler errors

```bash
cd apps/mobile
pnpm start -c  # Clear cache
```

### Tauri build fails

```bash
cd apps/desktop/src-tauri
cargo clean
cargo build
```

### TypeScript errors after updating types

```bash
# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

## Additional Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Tauri Docs](https://v2.tauri.app/)
- [Supabase Docs](https://supabase.com/docs)
- [pnpm Docs](https://pnpm.io/)

---

Happy coding! 🚀

