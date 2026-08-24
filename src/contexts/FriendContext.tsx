import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { DirectMessage, UserProfile, MessageAttachment } from '../types';
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
  const dmRealtimeChannelRef = useRef<any>(null);

  const friends: UserProfile[] = currentUser
    ? allUsers.filter(u => u.id !== currentUser.id)
    : [];

  useEffect(() => {
    localStorage.setItem('nexus_user_direct_messages', JSON.stringify(directMessages));
  }, [directMessages]);

  // 1. Fetch DM history for active user
  const fetchDMsFromSupabase = useCallback(async (targetId: string) => {
    if (!targetId || !currentUser || !isSupabaseConfigured || !supabase) return;

    try {
      const { data: dms, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (dms && !error) {
        const formatted: DirectMessage[] = dms.map(dm => {
          const sender = allUsers.find(u => u.id === dm.sender_id) || (dm.sender_id === currentUser.id ? currentUser : {
            id: dm.sender_id,
            username: 'usuario',
            display_name: 'Usuário',
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${dm.sender_id}`,
            presence_status: 'online',
            created_at: dm.created_at,
          });

          const receiver = allUsers.find(u => u.id === dm.receiver_id) || (dm.receiver_id === currentUser.id ? currentUser : {
            id: dm.receiver_id,
            username: 'usuario',
            display_name: 'Usuário',
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${dm.receiver_id}`,
            presence_status: 'online',
            created_at: dm.created_at,
          });

          return {
            ...dm,
            sender,
            receiver,
          };
        });

        setDirectMessages(prev => ({
          ...prev,
          [targetId]: formatted
        }));
      }
    } catch (err) {
      console.error('Error fetching Supabase DMs history:', err);
    }
  }, [currentUser, allUsers]);

  // Fetch when activeDmUserId changes
  useEffect(() => {
    if (activeDmUserId) {
      fetchDMsFromSupabase(activeDmUserId);
    }
  }, [activeDmUserId, fetchDMsFromSupabase]);

  // Polling sync every 2.5s for DMs
  useEffect(() => {
    if (!activeDmUserId) return;
    const interval = setInterval(() => {
      fetchDMsFromSupabase(activeDmUserId);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeDmUserId, fetchDMsFromSupabase]);

  // 2. Supabase Realtime Broadcast & Postgres changes for DMs
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !currentUser) return;

    const channel = supabase.channel(`public:dm_channel:${currentUser.id}`);
    dmRealtimeChannelRef.current = channel;

    channel
      .on('broadcast', { event: 'NEW_DM' }, (payload: any) => {
        const dm: DirectMessage = payload.payload?.dm;
        if (dm && (dm.receiver_id === currentUser.id || dm.sender_id === currentUser.id)) {
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
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        () => {
          if (activeDmUserId) {
            fetchDMsFromSupabase(activeDmUserId);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
      dmRealtimeChannelRef.current = null;
    };
  }, [activeDmUserId, currentUser, fetchDMsFromSupabase]);

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

    setDirectMessages(prev => {
      const chat = prev[receiverId] || [];
      return { ...prev, [receiverId]: [...chat, newDm] };
    });

    sounds.playPop();
    setUnreadDmCounts(prev => ({ ...prev, [receiverId]: 0 }));

    if (isSupabaseConfigured && supabase) {
      try {
        // Send live broadcast to receiver's channel
        const receiverChannel = supabase.channel(`public:dm_channel:${receiverId}`);
        receiverChannel.send({
          type: 'broadcast',
          event: 'NEW_DM',
          payload: { dm: newDm }
        });

        // Save in DB
        await supabase.from('direct_messages').insert({
          id: newDm.id,
          sender_id: currentUser.id,
          receiver_id: receiverId,
          content: newDm.content,
          attachments: newDm.attachments,
          reactions: newDm.reactions,
        });
      } catch (err) {
        console.error('Supabase direct message send error:', err);
      }
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
