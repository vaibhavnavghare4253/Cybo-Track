# Tauri Desktop App Setup

## Important Note

The Tauri desktop app in this project uses a simplified database approach. Instead of implementing custom Rust commands for each database operation, the frontend directly uses the **tauri-plugin-sql** which provides SQL query capabilities from JavaScript/TypeScript.

## Database Access Pattern

In the desktop app, the `src/services/database.ts` file is currently set up to use `invoke()` calls. However, with `tauri-plugin-sql`, you should use the SQL plugin directly:

```typescript
import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function initDatabase() {
  db = await Database.load('sqlite:cybotrack.db');
}

export async function getAllGoals(userId: string) {
  if (!db) await initDatabase();
  return await db!.select(
    'SELECT * FROM goals WHERE user_id = $1 AND deleted = 0 ORDER BY created_at DESC',
    [userId]
  );
}
```

## Alternative: Custom Rust Commands

If you prefer to implement custom Rust commands (as the current code expects), you would need to:

1. Add command handlers in `src-tauri/src/main.rs`
2. Use `.invoke_handler(tauri::generate_handler![...])` in the builder
3. Implement each database function in Rust

Example Rust command:

```rust
#[tauri::command]
async fn get_all_goals(user_id: String) -> Result<Vec<Goal>, String> {
    // Database query logic here
}
```

## Running the Desktop App

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm tauri:dev

# Build for production
pnpm tauri:build
```

## Prerequisites

- Rust (latest stable)
- Node.js 18+
- pnpm

Install Rust from: https://rustup.rs/

