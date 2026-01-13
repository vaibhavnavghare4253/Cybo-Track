// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

fn main() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS goals (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT NOT NULL,
                    target_units INTEGER,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    deleted INTEGER DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );

                CREATE TABLE IF NOT EXISTS daily_progress (
                    id TEXT PRIMARY KEY,
                    goal_id TEXT NOT NULL,
                    date TEXT NOT NULL,
                    value REAL NOT NULL,
                    note TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    deleted INTEGER DEFAULT 0,
                    FOREIGN KEY (goal_id) REFERENCES goals(id),
                    UNIQUE(goal_id, date)
                );

                CREATE TABLE IF NOT EXISTS sync_meta (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    operation TEXT NOT NULL,
                    last_attempt_at TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    UNIQUE(entity_type, entity_id, operation)
                );

                CREATE TABLE IF NOT EXISTS sync_settings (
                    user_id TEXT PRIMARY KEY,
                    last_sync_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
                CREATE INDEX IF NOT EXISTS idx_goals_deleted ON goals(deleted);
                CREATE INDEX IF NOT EXISTS idx_daily_progress_goal_id ON daily_progress(goal_id);
                CREATE INDEX IF NOT EXISTS idx_daily_progress_date ON daily_progress(date);
                CREATE INDEX IF NOT EXISTS idx_sync_meta_status ON sync_meta(status);
            ",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            SqlBuilder::default()
                .add_migrations("sqlite:cybotrack.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

