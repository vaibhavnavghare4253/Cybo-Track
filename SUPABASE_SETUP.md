# Supabase Setup Guide

This guide walks you through setting up Supabase as the backend for Cybo-Track.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in project details:
   - **Name**: Cybo Track
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
5. Wait for project to initialize (~2 minutes)

## 2. Get Your API Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon public key**: `eyJhbGc...` (long string)
3. Save these for your `.env` files

## 3. Create Database Tables

Go to **SQL Editor** → **New Query** and run this SQL:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goals table
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

-- Daily progress table
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

-- Create indexes for better query performance
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_deleted ON goals(deleted);
CREATE INDEX idx_goals_updated_at ON goals(updated_at);
CREATE INDEX idx_daily_progress_goal_id ON daily_progress(goal_id);
CREATE INDEX idx_daily_progress_date ON daily_progress(date);
CREATE INDEX idx_daily_progress_updated_at ON daily_progress(updated_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_progress_updated_at
  BEFORE UPDATE ON daily_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

Click **Run** to execute.

## 4. Set Up Row Level Security (RLS)

Run this SQL to enable RLS and create policies:

```sql
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Goals table policies
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- Daily progress table policies
CREATE POLICY "Users can view own progress"
  ON daily_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = daily_progress.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own progress"
  ON daily_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = daily_progress.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own progress"
  ON daily_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = daily_progress.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own progress"
  ON daily_progress FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = daily_progress.goal_id
      AND goals.user_id = auth.uid()
    )
  );
```

## 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Under **Auth Providers**, enable:
   - ✅ **Email** (enabled by default)
3. Optional: Configure additional providers (Google, GitHub, etc.)

### Email Settings (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Customize confirmation and password reset emails
3. Set your **Site URL** and **Redirect URLs**

## 6. Test the Connection

You can test your Supabase setup with this simple script:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

// Test sign up
async function testConnection() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'testpassword123'
  });
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success! User:', data.user);
  }
}

testConnection();
```

## 7. Environment Variables

Add your Supabase credentials to the environment files:

**Mobile** (`apps/mobile/.env`):
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Desktop** (`apps/desktop/.env`):
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## 8. Database Backups (Optional)

For production, set up automatic backups:

1. Go to **Database** → **Backups**
2. Configure backup schedule
3. Enable Point-in-Time Recovery (PITR) for Pro plan

## 9. Monitoring and Logs

Monitor your database:

1. **Dashboard**: Overview of requests, users, storage
2. **Logs**: Real-time logs of database queries
3. **API**: Monitor API usage and errors

## Common Issues

### Issue: "JWT expired" error
**Solution**: Tokens expire after 1 hour. The app should automatically refresh them. Check `autoRefreshToken: true` in Supabase client config.

### Issue: "Row Level Security policy violation"
**Solution**: Verify RLS policies are correctly set up and the user is authenticated.

### Issue: "Permission denied for table"
**Solution**: Check that RLS is enabled and policies allow the operation.

### Issue: Can't insert into tables
**Solution**: 
1. Verify you're authenticated (`supabase.auth.getUser()`)
2. Check RLS policies
3. Ensure `user_id` matches `auth.uid()`

## Production Checklist

Before deploying to production:

- [ ] Enable RLS on all tables
- [ ] Test all CRUD operations
- [ ] Set up email templates
- [ ] Configure custom domain (optional)
- [ ] Enable database backups
- [ ] Set up monitoring/alerts
- [ ] Review API rate limits
- [ ] Test authentication flow
- [ ] Verify sync functionality
- [ ] Set up error logging

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)

## Support

If you encounter issues:

1. Check [Supabase Discussions](https://github.com/supabase/supabase/discussions)
2. Review [Common Errors](https://supabase.com/docs/guides/platform/common-errors)
3. Contact Supabase support (for paid plans)

---

**Next Steps**: Return to the main [README.md](./README.md) to continue setup.

