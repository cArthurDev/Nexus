import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (username: string, email: string, password?: string) => Promise<boolean>;
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

  // Sync users list to localStorage
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

  // Supabase Auth and Profiles Realtime Sync
  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setCurrentUser(profile);
            }
          }

          // Fetch all user profiles from Supabase so all users see each other
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*');

          if (profiles && profiles.length > 0) {
            setAllUsers(profiles);
          }
        } catch (err) {
          console.error('Supabase auth initialization error', err);
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  // BroadcastChannel for local cross-tab users sync
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

  const login = async (emailOrUsername: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    const cleanInput = emailOrUsername.trim().toLowerCase();

    if (isSupabaseConfigured && supabase && password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanInput,
        password
      });
      if (error || !data.user) {
        setIsLoading(false);
        throw error;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profile) {
        setCurrentUser(profile);
      }
      setIsLoading(false);
      return true;
    } else {
      // Local auth
      const user = allUsers.find(
        u => u.username.toLowerCase() === cleanInput || u.id === cleanInput
      );

      if (user) {
        const updated = { ...user, presence_status: 'online' as const };
        setCurrentUser(updated);
        setAllUsers(prev => prev.map(u => u.id === user.id ? updated : u));
        setIsLoading(false);
        return true;
      } else {
        const newUser: UserProfile = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          username: cleanInput.replace(/[^a-z0-9_]/g, '') || 'usuario',
          display_name: emailOrUsername.trim(),
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanInput}`,
          presence_status: 'online',
          status_text: 'Olá! Sou novo no Nexus ✨',
          created_at: new Date().toISOString(),
        };
        setCurrentUser(newUser);
        setAllUsers(prev => [...prev, newUser]);

        if (typeof window !== 'undefined') {
          const bc = new BroadcastChannel('nexus_users_channel');
          bc.postMessage({ type: 'USER_JOINED', user: newUser });
          bc.close();
        }

        setIsLoading(false);
        return true;
      }
    }
  };

  const signup = async (username: string, email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (isSupabaseConfigured && supabase && password) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: username.trim(),
          }
        }
      });
      if (error) {
        setIsLoading(false);
        throw error;
      }
      if (data.user) {
        const newProfile: UserProfile = {
          id: data.user.id,
          username: cleanUsername,
          display_name: username.trim(),
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
          presence_status: 'online',
          status_text: 'Novo no Nexus!',
          created_at: new Date().toISOString(),
        };
        setCurrentUser(newProfile);
        setAllUsers(prev => [...prev.filter(u => u.id !== newProfile.id), newProfile]);
      }
      setIsLoading(false);
      return true;
    } else {
      const newUser: UserProfile = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        username: cleanUsername,
        display_name: username.trim(),
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
        presence_status: 'online',
        status_text: 'Acabei de criar minha conta no Nexus 🚀',
        created_at: new Date().toISOString(),
      };
      setCurrentUser(newUser);
      setAllUsers(prev => [...prev.filter(u => u.username !== cleanUsername), newUser]);

      if (typeof window !== 'undefined') {
        const bc = new BroadcastChannel('nexus_users_channel');
        bc.postMessage({ type: 'USER_JOINED', user: newUser });
        bc.close();
      }

      setIsLoading(false);
      return true;
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
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
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);
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
