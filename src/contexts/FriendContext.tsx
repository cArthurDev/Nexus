import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Friendship, DirectMessage, UserProfile, MessageAttachment } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sounds } from '../lib/sounds';

interface FriendContextType {
  friends: UserProfile[];
  directMessages: Record<string, DirectMessage[]>;
  activeDmUserId: string | null;
  activeDmUser: UserProfile | null;
  currentDmMessages: DirectMessage[];
  unreadDmCounts: Record<string, number>;
  setActiveDmUserId: (userId: string | null) => void;
  sendDirectMessage: (receiverId: string, content: string, attachments?: MessageAttachment[]) => Promise<void>;
  deleteDirectMessage: (partnerId: string, messageId: string) => Promise<void>;
}

const FriendContext = createContext<FriendContextType | undefined>(undefined);

export const FriendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allUsers } = useAuth();

  const [directMessages, setDirectMessages] = useState<Record<string, DirectMessage[]>>(() => {
    const saved = localStorage.getItem('nexus_user_direct_messages');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [unreadDmCounts, setUnreadDmCounts] = useState<Record<string, number>>({});

  // Everyone is friend with everyone
  const friends: UserProfile[] = currentUser
    ? allUsers.filter(u => u.id !== currentUser.id)
    : [];

  useEffect(() => {
    localStorage.setItem('nexus_user_direct_messages', JSON.stringify(directMessages));
  }, [directMessages]);

  // Load direct messages from Supabase if configured
  useEffect(() => {
    async function loadSupabaseDMs() {
      if (isSupabaseConfigured && supabase && currentUser) {
        try {
          const { data: dms } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

          if (dms && dms.length > 0) {
            const grouped: Record<string, DirectMessage[]> = {};
            dms.forEach(dm => {
              const partnerId = dm.sender_id === currentUser.id ? dm.receiver_id : dm.sender_id;
              const sender = allUsers.find(u => u.id === dm.sender_id) || currentUser;
              const receiver = allUsers.find(u => u.id === dm.receiver_id) || currentUser;

              const formatted: DirectMessage = {
                ...dm,
                sender,
                receiver,
              };

              if (!grouped[partnerId]) grouped[partnerId] = [];
              grouped[partnerId].push(formatted);
            });
            setDirectMessages(prev => ({ ...prev, ...grouped }));
          }
        } catch (err) {
          console.error('Error fetching Supabase DMs:', err);
        }
      }
    }

    loadSupabaseDMs();
  }, [currentUser, allUsers]);

  // Realtime BroadcastChannel for cross-tab DMs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bc = new BroadcastChannel('nexus_dm_events');

    bc.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'NEW_DM') {
        const dm: DirectMessage = data.dm;
        if (currentUser && (dm.receiver_id === currentUser.id || dm.sender_id === currentUser.id)) {
          const partnerId = dm.sender_id === currentUser.id ? dm.receiver_id : dm.sender_id;
          setDirectMessages(prev => {
            const list = prev[partnerId] || [];
            if (list.some(m => m.id === dm.id)) return prev;
            return { ...prev, [partnerId]: [...list, dm] };
          });

          if (dm.sender_id !== currentUser.id) {
            sounds.playMessage();
            if (activeDmUserId !== partnerId) {
              setUnreadDmCounts(prev => ({ ...prev, [partnerId]: (prev[partnerId] || 0) + 1 }));
            }
          }
        }
      }
    };

    return () => {
      bc.close();
    };
  }, [activeDmUserId, currentUser]);

  const activeDmUser = allUsers.find(u => u.id === activeDmUserId) || null;
  const currentDmMessages = activeDmUserId ? (directMessages[activeDmUserId] || []) : [];

  const sendDirectMessage = async (receiverId: string, content: string, attachments?: MessageAttachment[]) => {
    if (!currentUser) return;
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    let receiver = allUsers.find(u => u.id === receiverId);
    if (!receiver) {
      receiver = {
        id: receiverId,
        username: 'usuario',
        display_name: 'Usuário',
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${receiverId}`,
        presence_status: 'online',
        created_at: new Date().toISOString()
      };
    }

    const newDm: DirectMessage = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      content,
      attachments: attachments || [],
      reactions: [],
      is_edited: false,
      created_at: new Date().toISOString(),
      sender: currentUser,
      receiver,
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('direct_messages').insert({
        id: newDm.id,
        sender_id: currentUser.id,
        receiver_id: receiverId,
        content: newDm.content,
        attachments: newDm.attachments,
        reactions: newDm.reactions,
      });
    }

    setDirectMessages(prev => {
      const chat = prev[receiverId] || [];
      return { ...prev, [receiverId]: [...chat, newDm] };
    });

    sounds.playPop();
    setUnreadDmCounts(prev => ({ ...prev, [receiverId]: 0 }));

    if (typeof window !== 'undefined') {
      const bc = new BroadcastChannel('nexus_dm_events');
      bc.postMessage({ type: 'NEW_DM', dm: newDm });
      bc.close();
    }
  };

  const deleteDirectMessage = async (partnerId: string, messageId: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('direct_messages').delete().eq('id', messageId);
    }
    setDirectMessages(prev => {
      const list = prev[partnerId] || [];
      return {
        ...prev,
        [partnerId]: list.filter(m => m.id !== messageId)
      };
    });
  };

  return (
    <FriendContext.Provider
      value={{
        friends,
        directMessages,
        activeDmUserId,
        activeDmUser,
        currentDmMessages,
        unreadDmCounts,
        setActiveDmUserId,
        sendDirectMessage,
        deleteDirectMessage,
      }}
    >
      {children}
    </FriendContext.Provider>
  );
};

export const useFriend = () => {
  const context = useContext(FriendContext);
  if (!context) {
    throw new Error('useFriend must be used within a FriendProvider');
  }
  return context;
};
