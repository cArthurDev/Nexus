import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Friendship, DirectMessage, UserProfile, MessageAttachment } from '../types';
import { useAuth } from './AuthContext';
import { sounds } from '../lib/sounds';

interface FriendContextType {
  friendships: Friendship[];
  directMessages: Record<string, DirectMessage[]>;
  activeDmUserId: string | null;
  activeDmUser: UserProfile | null;
  currentDmMessages: DirectMessage[];
  unreadDmCounts: Record<string, number>;
  setActiveDmUserId: (userId: string | null) => void;
  sendFriendRequest: (username: string) => Promise<{ success: boolean; message: string }>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  rejectFriendRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  sendDirectMessage: (receiverId: string, content: string, attachments?: MessageAttachment[]) => Promise<void>;
  deleteDirectMessage: (partnerId: string, messageId: string) => Promise<void>;
}

const FriendContext = createContext<FriendContextType | undefined>(undefined);

export const FriendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allUsers } = useAuth();

  const [friendships, setFriendships] = useState<Friendship[]>(() => {
    const saved = localStorage.getItem('nexus_user_friendships');
    return saved ? JSON.parse(saved) : [];
  });

  const [directMessages, setDirectMessages] = useState<Record<string, DirectMessage[]>>(() => {
    const saved = localStorage.getItem('nexus_user_direct_messages');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [unreadDmCounts, setUnreadDmCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    localStorage.setItem('nexus_user_friendships', JSON.stringify(friendships));
  }, [friendships]);

  useEffect(() => {
    localStorage.setItem('nexus_user_direct_messages', JSON.stringify(directMessages));
  }, [directMessages]);

  const activeDmUser = allUsers.find(u => u.id === activeDmUserId) || null;
  const currentDmMessages = activeDmUserId ? (directMessages[activeDmUserId] || []) : [];

  const sendFriendRequest = async (username: string): Promise<{ success: boolean; message: string }> => {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!currentUser) return { success: false, message: 'Usuário não autenticado.' };
    if (cleanUsername === currentUser.username.toLowerCase()) {
      return { success: false, message: 'Você não pode adicionar a si mesmo como amigo.' };
    }

    let targetUser = allUsers.find(u => u.username.toLowerCase() === cleanUsername);
    if (!targetUser) {
      // Create user entry dynamically if not existing
      targetUser = {
        id: `usr_${cleanUsername}`,
        username: cleanUsername,
        display_name: cleanUsername,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
        presence_status: 'online',
        created_at: new Date().toISOString()
      };
    }

    const alreadyFriend = friendships.find(f => f.friend.id === targetUser.id);
    if (alreadyFriend) {
      if (alreadyFriend.status === 'ACCEPTED') {
        return { success: false, message: `Você já é amigo de @${targetUser.username}.` };
      }
      return { success: false, message: `Já existe uma solicitação pendente com @${targetUser.username}.` };
    }

    const newFriendship: Friendship = {
      id: `fr_${Date.now()}`,
      user_id_1: currentUser.id,
      user_id_2: targetUser.id,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      friend: targetUser,
    };

    setFriendships(prev => [...prev, newFriendship]);
    sounds.playPop();
    return { success: true, message: `Solicitação de amizade enviada para @${targetUser.username}!` };
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    setFriendships(prev => prev.map(f => f.id === friendshipId ? { ...f, status: 'ACCEPTED' as const } : f));
    sounds.playPop();
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    setFriendships(prev => prev.filter(f => f.id !== friendshipId));
  };

  const removeFriend = async (friendshipId: string) => {
    setFriendships(prev => prev.filter(f => f.id !== friendshipId));
  };

  const sendDirectMessage = async (receiverId: string, content: string, attachments?: MessageAttachment[]) => {
    if (!currentUser) return;
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    let receiver = allUsers.find(u => u.id === receiverId);
    if (!receiver) {
      const friendObj = friendships.find(f => f.friend.id === receiverId)?.friend;
      receiver = friendObj;
    }
    if (!receiver) return;

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
  };

  const deleteDirectMessage = async (partnerId: string, messageId: string) => {
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
        friendships,
        directMessages,
        activeDmUserId,
        activeDmUser,
        currentDmMessages,
        unreadDmCounts,
        setActiveDmUserId,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
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
