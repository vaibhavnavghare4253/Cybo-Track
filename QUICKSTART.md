# Quick Start Guide

Get Cybo-Track running in under 10 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] Supabase account (free tier is fine)

## 5-Step Setup

### Step 1: Clone and Install (2 min)

```bash
# Clone the repository
git clone <repository-url>
cd cybo-track

# Install all dependencies
pnpm install

# Build shared package
cd packages/shared-core
pnpm build
cd ../..
```

### Step 2: Set Up Supabase (3 min)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In **SQL Editor**, run this:

```sql
-- Quick setup: Create tables
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_units INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value NUMERIC NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(goal_id, date)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users see own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users see own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own progress" ON daily_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = daily_progress.goal_id AND goals.user_id = auth.uid())
);
```

3. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon public key

### Step 3: Configure Environment (1 min)

**Mobile App:**

Create `apps/mobile/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Desktop App:**

Create `apps/desktop/.env`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run Mobile or Desktop (2 min)

**Option A: Mobile App**
```bash
# Start Expo
pnpm mobile

# Then press:
# - 'a' for Android emulator
# - 'i' for iOS simulator
# - Scan QR code for physical device
```

**Option B: Desktop App**
```bash
# Make sure Rust is installed first:
# https://rustup.rs/

# Run desktop app
pnpm desktop
```

### Step 5: Create Your First Goal! (1 min)

1. Sign up with email/password
2. Click "New Goal"
3. Fill in the details
4. Start tracking progress!

## Troubleshooting

### "Cannot find module @cybo-track/shared-core"
```bash
cd packages/shared-core && pnpm build
```

### Mobile app won't start
```bash
cd apps/mobile
rm -rf node_modules .expo
pnpm install
pnpm start -c
```

### Desktop app build fails
Make sure Rust is installed:
```bash
rustc --version
# If not installed, get it from https://rustup.rs/
```

### Supabase connection error
1. Check your `.env` files have correct values
2. Verify Supabase project is not paused
3. Test connection in Supabase dashboard

## What's Next?

- 📖 Read the full [README.md](./README.md) for detailed information
- 🔧 Check [DEVELOPMENT.md](./DEVELOPMENT.md) for development workflow
- 🗄️ See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for advanced Supabase config
- 🐛 Having issues? Create a GitHub issue

## Quick Architecture Overview

```
┌─────────────────────────────────────┐
│         Your Device (Mobile/Desktop) │
│                                      │
│  ┌────────────┐     ┌─────────────┐│
│  │   React    │────▶│   SQLite    ││  Offline-First
│  │     UI     │◀────│  (Local DB) ││  All changes go
│  └────────────┘     └─────┬───────┘│  to local DB first
│                            │        │
└────────────────────────────┼────────┘
                             │
                    ┌────────▼────────┐
                    │  Sync When      │  Automatic sync
                    │  Online         │  when connected
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Supabase      │  Cloud database
                    │  (PostgreSQL)   │  + Authentication
                    └─────────────────┘
```

## Features at a Glance

✅ **Works Offline** - All data stored locally  
✅ **Auto-Sync** - Syncs when you're online  
✅ **Cross-Platform** - Mobile (iOS/Android) + Desktop (Win/Mac/Linux)  
✅ **Progress Tracking** - Daily check-ins with notes  
✅ **Streaks** - Track consistency  
✅ **Statistics** - Visual insights  
✅ **Secure** - Row-level security with Supabase  

## Development Commands

```bash
# Mobile
pnpm mobile              # Start Expo dev server
pnpm --filter mobile android    # Run on Android
pnpm --filter mobile ios        # Run on iOS

# Desktop
pnpm desktop             # Start Tauri dev mode
pnpm build:desktop       # Build for production

# Shared
cd packages/shared-core
pnpm build              # Build shared logic

# Clean everything
pnpm clean              # Remove all node_modules
```

## Project Structure (Simplified)

```
cybo-track/
├── packages/shared-core/    # Business logic (TypeScript)
│   ├── types/              # Data types
│   ├── utils/              # Calculations, helpers
│   └── sync/               # Sync engine
├── apps/mobile/            # React Native + Expo
│   ├── app/               # Screens (Expo Router)
│   ├── src/database/      # SQLite
│   └── src/services/      # Sync, Supabase
└── apps/desktop/           # Tauri + React
    ├── src/               # React UI
    └── src-tauri/         # Rust backend
```

## Support

- 📧 Email: your-email@example.com
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

**Ready to track your goals? Let's go! 🚀**

