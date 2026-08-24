import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password?: string) => Promise<boolean>;
  signup: (username: string, email?: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  allUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'nexus_auth_user';
const USERS_STORAGE_KEY = 'nexus_registered_users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && !parsed.id.startsWith('usr_me_01')) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [currentUser]);

  // Load from Supabase on mount
  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          // Fetch all profiles so everyone sees each other immediately
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*');

          if (profiles && profiles.length > 0) {
            setAllUsers(profiles);
          }
        } catch (err) {
          console.error('Supabase fetch profiles error', err);
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  // BroadcastChannel for cross-tab sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bc = new BroadcastChannel('nexus_users_channel');

    bc.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'USER_JOINED' || data.type === 'USER_UPDATED') {
        const user: UserProfile = data.user;
        setAllUsers(prev => {
          const filtered = prev.filter(u => u.id !== user.id && u.username !== user.username);
          return [...filtered, user];
        });
      }
    };

    return () => {
      bc.close();
    };
  }, []);

  const login = async (usernameOrEmail: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    const cleanInput = usernameOrEmail.trim().toLowerCase().replace(/^@/, '');

    // Check if user exists in database/memory
    let user = allUsers.find(
      u => u.username.toLowerCase() === cleanInput || u.id === cleanInput
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', cleanInput)
          .single();

        if (profile) {
          user = profile;
        }
      } catch {
        // Fallback to local
      }
    }

    if (user) {
      const updated = { ...user, presence_status: 'online' as const };
      setCurrentUser(updated);
      setAllUsers(prev => prev.map(u => u.id === user.id ? updated : u));
      setIsLoading(false);
      return true;
    } else {
      // If user doesn't exist yet, auto-create account instantly!
      return signup(cleanInput, undefined, password);
    }
  };

  const signup = async (username: string, email?: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || 'usuario';
    const cleanDisplayName = username.trim() || cleanUsername;
    const resolvedEmail = email?.trim() || `${cleanUsername}@nexus.app`;

    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      display_name: cleanDisplayName,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      presence_status: 'online',
      status_text: 'Olá! Sou novo no Nexus ✨',
      created_at: new Date().toISOString(),
    };

    // Save to Supabase if configured (without requiring email verification!)
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').upsert({
          id: newUser.id,
          username: newUser.username,
          display_name: newUser.display_name,
          avatar_url: newUser.avatar_url,
          presence_status: newUser.presence_status,
          status_text: newUser.status_text,
        });
      } catch (err) {
        console.error('Supabase profile save error:', err);
      }
    }

    setCurrentUser(newUser);
    setAllUsers(prev => [...prev.filter(u => u.username !== cleanUsername && u.id !== newUser.id), newUser]);

    if (typeof window !== 'undefined') {
      const bc = new BroadcastChannel('nexus_users_channel');
      bc.postMessage({ type: 'USER_JOINED', user: newUser });
      bc.close();
    }

    setIsLoading(false);
    return true;
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', currentUser.id);
      } catch (err) {
        console.error('Supabase profile update error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const bc = new BroadcastChannel('nexus_users_channel');
      bc.postMessage({ type: 'USER_UPDATED', user: updated });
      bc.close();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
