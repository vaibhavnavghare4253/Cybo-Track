import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import * as db from '../services/database';
import type { User } from '@cybo-track/shared-core';

interface AppContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Initialize database
    db.initDatabase().then(() => {
      // Check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          loadUser(session.user.id, session.user.email!);
        }
        setLoading(false);
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUser(session.user.id, session.user.email!);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadUser = async (id: string, email: string) => {
    let existingUser = await db.getUser(id);
    
    if (!existingUser) {
      existingUser = {
        id,
        email,
        created_at: new Date().toISOString(),
      };
      await db.createUser(existingUser);
    }

    setUser(existingUser);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUser(data.user.id, data.user.email!);
        return { success: true };
      }

      return { success: false, error: 'Failed to sign in' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUser(data.user.id, data.user.email!);
        return { success: true };
      }

      return { success: false, error: 'Failed to sign up' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isOnline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

