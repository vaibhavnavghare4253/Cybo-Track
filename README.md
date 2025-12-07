# Cybo-Track

**Offline-first goal tracking app for mobile (iOS/Android) and desktop (Windows/macOS/Linux)**

Cybo-Track is a modern, offline-first application that helps you set and track your goals with daily progress updates. All data is stored locally for instant access, and syncs automatically when you're online.

## 🚀 Features

- ✅ **Offline-First**: Full functionality without internet connection
- 🔄 **Auto-Sync**: Automatic synchronization when online
- 📱 **Mobile App**: React Native + Expo (iOS & Android)
- 💻 **Desktop App**: Tauri + React (Windows, macOS, Linux)
- 📊 **Progress Tracking**: Daily progress entries with notes
- 🔥 **Streak Tracking**: Monitor consistency with streak counters
- 📈 **Statistics**: Visual insights into your progress
- 🎯 **Goal Management**: Create, edit, and track multiple goals
- 🔐 **Secure**: Row-level security with Supabase Auth

## 🏗️ Architecture

### Tech Stack

- **Frontend (Mobile)**: React Native, Expo, TypeScript
- **Frontend (Desktop)**: React, TypeScript, Tauri
- **Shared Logic**: TypeScript package with business logic
- **Local Database**: SQLite (both mobile and desktop)
- **Backend**: Supabase (PostgreSQL, Auth, REST API)
- **Sync Strategy**: Last-write-wins with timestamps

### Project Structure

```
cybo-track/
├── packages/
│   └── shared-core/          # Shared TypeScript logic
│       ├── src/
│       │   ├── types/         # TypeScript types
│       │   ├── utils/         # Calculations & utilities
│       │   └── sync/          # Sync engine
│       └── package.json
├── apps/
│   ├── mobile/               # React Native + Expo app
│   │   ├── app/              # Expo Router screens
│   │   ├── src/
│   │   │   ├── database/     # SQLite setup
│   │   │   ├── services/     # Sync & Supabase
│   │   │   └── context/      # React Context
│   │   └── package.json
│   └── desktop/              # Tauri + React app
│       ├── src/              # React frontend
│       ├── src-tauri/        # Rust backend
│       └── package.json
└── package.json              # Root workspace config
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (Install: `npm install -g pnpm`)
- **Rust** (for desktop app) ([Install](https://rustup.rs/))
- **Expo CLI** (for mobile app) (`npm install -g expo-cli`)

### Mobile Development

- **iOS**: macOS with Xcode
- **Android**: Android Studio with Android SDK

### Desktop Development

- **Windows**: Visual Studio Build Tools
- **macOS**: Xcode Command Line Tools
- **Linux**: See [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## 🛠️ Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd cybo-track

# Install dependencies (all packages)
pnpm install
```

### 2. Set Up Supabase

Follow the [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) guide to:

1. Create a Supabase project
2. Set up database tables
3. Configure Row Level Security (RLS)
4. Get your API credentials

### 3. Configure Environment Variables

**Mobile App** (`apps/mobile/.env`):
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Desktop App** (`apps/desktop/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Build Shared Core

```bash
cd packages/shared-core
pnpm build
```

## 🚀 Running the Apps

### Mobile App

```bash
# Start Expo development server
pnpm mobile

# Run on specific platform
cd apps/mobile
pnpm android    # Android
pnpm ios        # iOS
pnpm web        # Web browser
```

### Desktop App

```bash
# Development mode
pnpm desktop

# Or directly in the desktop folder
cd apps/desktop
pnpm tauri:dev
```

## 📦 Building for Production

### Mobile App

```bash
cd apps/mobile

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

### Desktop App

```bash
cd apps/desktop

# Build for your current platform
pnpm tauri:build

# Output will be in src-tauri/target/release/
```

## 🗄️ Database Schema

### Local SQLite Tables

- **users**: User account information
- **goals**: Goal definitions
- **daily_progress**: Daily progress entries
- **sync_meta**: Tracks pending sync operations
- **sync_settings**: Stores last sync timestamp

### Remote Supabase Tables

Same schema as local (except `sync_meta` and `sync_settings` which are local-only).

## 🔄 Sync Mechanism

The app uses a simple but effective offline-first sync strategy:

1. **All changes go to local SQLite first**
2. **Changes are queued in sync_meta table**
3. **Background sync process:**
   - Pushes pending local changes to Supabase
   - Pulls new changes from Supabase
   - Uses last-write-wins conflict resolution
4. **Sync triggers:**
   - Manual "Sync Now" button
   - App startup
   - When network connection is restored

## 📱 Features by Screen

### Home
- Dashboard with today's goals
- Active goals count
- Completion statistics
- Current streaks

### Goals
- List all goals
- Filter by status
- Create new goals
- View goal details

### Goal Detail
- Progress tracking
- Daily check-ins
- History of entries
- Streak counter
- Completion percentage

### Statistics
- Total progress across goals
- Completion rates
- Longest streaks
- Activity insights

### Settings
- Account information
- Sync status
- Sign out

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Troubleshooting

### Mobile App Issues

**Issue**: "Unable to resolve module..."
```bash
cd apps/mobile
rm -rf node_modules
pnpm install
```

**Issue**: Metro bundler cache issues
```bash
expo start -c
```

### Desktop App Issues

**Issue**: Tauri build fails
```bash
cd apps/desktop/src-tauri
cargo clean
cargo build
```

**Issue**: Database not found
- The database is created automatically on first run
- Check that the app has write permissions

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Tauri Documentation](https://v2.tauri.app/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [React Router](https://reactrouter.com/)

## 💡 Development Tips

1. **Shared Logic**: Keep business logic in `packages/shared-core` to reuse across platforms
2. **Database**: Use the same schema on mobile and desktop for consistency
3. **Offline Testing**: Disable network to test offline functionality
4. **Sync Testing**: Use multiple devices to test sync behavior
5. **Performance**: Keep sync payloads small by only syncing changed data

## 🎯 Roadmap

- [ ] Push notifications for goal reminders
- [ ] Goal templates and presets
- [ ] Charts and visualizations
- [ ] Export data to CSV/JSON
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Goal categories and tags
- [ ] Backup and restore functionality
- [ ] Social sharing features

## 📞 Support

For issues, questions, or suggestions:

1. Check [existing issues](https://github.com/yourusername/cybo-track/issues)
2. Create a new issue if needed
3. Contact: your-email@example.com

---

**Built with ❤️ using React Native, Tauri, and Supabase**

