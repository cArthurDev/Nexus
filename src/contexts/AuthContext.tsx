import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password?: string) => Promise<boolean>;
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
        if (parsed && parsed.id) {
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

  // 1. Fetch all user profiles from Supabase and subscribe to changes
  useEffect(() => {
    async function loadAllProfiles() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*');

          if (profiles && !error && profiles.length > 0) {
            setAllUsers(profiles);
          }
        } catch (err) {
          console.error('Error loading Supabase profiles:', err);
        }
      }
      setIsLoading(false);
    }

    loadAllProfiles();

    // Supabase Realtime subscription for all user profiles
    if (isSupabaseConfigured && supabase) {
      const profileChannel = supabase
        .channel('public:profiles_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const updatedProfile = payload.new as UserProfile;
              setAllUsers(prev => {
                const filtered = prev.filter(u => u.id !== updatedProfile.id && u.username !== updatedProfile.username);
                return [...filtered, updatedProfile];
              });
            }
          }
        )
        .subscribe();

      return () => {
        if (supabase) supabase.removeChannel(profileChannel);
      };
    }
  }, []);

  const login = async (emailOrUsername: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    const cleanInput = emailOrUsername.trim().toLowerCase();

    // 1. Query Supabase directly
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: usersByUsername } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', cleanInput);

        const { data: usersByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanInput);

        const users = (usersByUsername && usersByUsername.length > 0) 
          ? usersByUsername 
          : (usersByEmail && usersByEmail.length > 0 ? usersByEmail : []);

        if (users.length > 0) {
          const targetUser = users[0];
          if (password && targetUser.password && targetUser.password !== password) {
            setIsLoading(false);
            throw new Error('Senha incorreta.');
          }

          const updated = { ...targetUser, presence_status: 'online' as const };
          setCurrentUser(updated);
          setAllUsers(prev => {
            const filtered = prev.filter(u => u.id !== updated.id);
            return [...filtered, updated];
          });
          setIsLoading(false);
          return true;
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'Senha incorreta.') {
          setIsLoading(false);
          throw err;
        }
        console.warn('Supabase login check:', err);
      }
    }

    // 2. Local memory fallback
    const localUser = allUsers.find(
      u => u.username.toLowerCase() === cleanInput || (u as any).email?.toLowerCase() === cleanInput
    );

    if (localUser) {
      if (password && (localUser as any).password && (localUser as any).password !== password) {
        setIsLoading(false);
        throw new Error('Senha incorreta.');
      }
      const updated = { ...localUser, presence_status: 'online' as const };
      setCurrentUser(updated);
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    throw new Error('Usuário ou E-mail não encontrado. Crie sua conta na aba "Criar Conta".');
  };

  const signup = async (username: string, email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || 'usuario';
    const cleanDisplayName = username.trim() || cleanUsername;
    const cleanEmail = email.trim().toLowerCase();

    const newUserId = cleanUsername === 'carthurdev' ? 'usr_cArthurDev' : `usr_${cleanUsername}_${Date.now().toString(36)}`;

    const newProfile: UserProfile & { email?: string; password?: string } = {
      id: newUserId,
      username: cleanUsername,
      display_name: cleanDisplayName,
      email: cleanEmail,
      password: password || '',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      presence_status: 'online',
      status_text: 'Olá! Estou no Nexus 🚀',
      created_at: new Date().toISOString(),
    };

    // Save directly to Supabase profiles table without requiring any email confirmation!
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('profiles').upsert({
          id: newProfile.id,
          username: newProfile.username,
          display_name: newProfile.display_name,
          email: newProfile.email,
          password: newProfile.password,
          avatar_url: newProfile.avatar_url,
          presence_status: newProfile.presence_status,
          status_text: newProfile.status_text,
        });

        if (error) {
          console.error('Supabase profile creation error:', error);
        }
      } catch (err) {
        console.error('Supabase profile creation catch:', err);
      }
    }

    setCurrentUser(newProfile);
    setAllUsers(prev => [...prev.filter(u => u.username !== cleanUsername && u.id !== newProfile.id), newProfile]);

    setIsLoading(false);
    return true;
  };

  const logout = async () => {
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
