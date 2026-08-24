import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Server, Channel, Category, Message, ServerMember, MessageAttachment, ChannelType, UserRole } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sounds } from '../lib/sounds';

interface ServerContextType {
  servers: Server[];
  activeServerId: string | null;
  activeServer: Server | null;
  categories: Category[];
  channels: Channel[];
  activeChannelId: string | null;
  activeChannel: Channel | null;
  messages: Message[];
  members: ServerMember[];
  typingUsers: { username: string; display_name: string }[];
  setActiveServerId: (id: string | null) => void;
  setActiveChannelId: (id: string | null) => void;
  createServer: (name: string, iconUrl?: string, description?: string) => Promise<Server>;
  joinServerByInvite: (inviteCode: string) => Promise<boolean>;
  deleteServer: (serverId: string) => Promise<void>;
  createChannel: (name: string, type: ChannelType, categoryId?: string, topic?: string) => Promise<Channel>;
  deleteChannel: (channelId: string) => Promise<void>;
  editChannel: (channelId: string, updates: Partial<Channel>) => Promise<void>;
  createCategory: (name: string) => Promise<Category>;
  sendMessage: (content: string, attachments?: MessageAttachment[], replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  sendTypingSignal: () => void;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

// Default initial open server for everyone
const DEFAULT_MAIN_SERVER: Server = {
  id: 'srv_nexus_main',
  name: 'Nexus Oficial',
  icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
  banner_url: '',
  description: 'Servidor oficial e público aberto para todos os usuários!',
  owner_id: 'usr_cArthurDev',
  invite_code: 'nexus-oficial',
  created_at: new Date().toISOString(),
  members_count: 2,
};

const DEFAULT_MAIN_CAT: Category = {
  id: 'cat_main_geral',
  server_id: 'srv_nexus_main',
  name: 'CANAIS PRINCIPAIS',
  position: 1,
};

const DEFAULT_TEXT_CHAN: Channel = {
  id: 'chn_main_geral_text',
  server_id: 'srv_nexus_main',
  category_id: 'cat_main_geral',
  name: 'geral',
  type: 'TEXT',
  topic: 'Chat público aberto para todos',
  position: 1,
  created_at: new Date().toISOString(),
};

const DEFAULT_VOICE_CHAN: Channel = {
  id: 'chn_main_geral_voice',
  server_id: 'srv_nexus_main',
  category_id: 'cat_main_geral',
  name: 'Sala de Voz',
  type: 'VOICE',
  position: 2,
  created_at: new Date().toISOString(),
};

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allUsers } = useAuth();
  
  const [servers, setServers] = useState<Server[]>(() => {
    const saved = localStorage.getItem('nexus_user_servers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch {}
    }
    return [DEFAULT_MAIN_SERVER];
  });

  const [activeServerId, setActiveServerId] = useState<string | null>(servers[0]?.id || DEFAULT_MAIN_SERVER.id);

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('nexus_user_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch {}
    }
    return [DEFAULT_MAIN_CAT];
  });

  const [channels, setChannels] = useState<Channel[]>(() => {
    const saved = localStorage.getItem('nexus_user_channels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch {}
    }
    return [DEFAULT_TEXT_CHAN, DEFAULT_VOICE_CHAN];
  });

  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('nexus_user_messages');
    return saved ? JSON.parse(saved) : {};
  });

  const serverChannels = channels.filter(c => c.server_id === activeServerId);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(serverChannels[0]?.id || DEFAULT_TEXT_CHAN.id);

  const [typingUsers, setTypingUsers] = useState<{ username: string; display_name: string; timestamp: number }[]>([]);
  const supabaseRealtimeChannelRef = useRef<any>(null);

  // 1. Fetch servers, categories, and channels from Supabase
  useEffect(() => {
    async function loadAllOpenServers() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: serverList } = await supabase
            .from('servers')
            .select('*');

          if (serverList && serverList.length > 0) {
            setServers(serverList);
            if (!activeServerId || !serverList.some(s => s.id === activeServerId)) {
              setActiveServerId(serverList[0].id);
            }

            const { data: catList } = await supabase.from('categories').select('*');
            if (catList && catList.length > 0) setCategories(catList);

            const { data: chanList } = await supabase.from('channels').select('*');
            if (chanList && chanList.length > 0) setChannels(chanList);
          } else {
            // Seed main server
            await supabase.from('servers').upsert({
              id: DEFAULT_MAIN_SERVER.id,
              name: DEFAULT_MAIN_SERVER.name,
              icon_url: DEFAULT_MAIN_SERVER.icon_url,
              description: DEFAULT_MAIN_SERVER.description,
              owner_id: DEFAULT_MAIN_SERVER.owner_id,
              invite_code: DEFAULT_MAIN_SERVER.invite_code,
            });

            await supabase.from('categories').upsert({
              id: DEFAULT_MAIN_CAT.id,
              server_id: DEFAULT_MAIN_SERVER.id,
              name: DEFAULT_MAIN_CAT.name,
              position: 1,
            });

            await supabase.from('channels').upsert([
              {
                id: DEFAULT_TEXT_CHAN.id,
                server_id: DEFAULT_MAIN_SERVER.id,
                category_id: DEFAULT_MAIN_CAT.id,
                name: DEFAULT_TEXT_CHAN.name,
                type: 'TEXT',
                topic: DEFAULT_TEXT_CHAN.topic,
                position: 1,
              },
              {
                id: DEFAULT_VOICE_CHAN.id,
                server_id: DEFAULT_MAIN_SERVER.id,
                category_id: DEFAULT_MAIN_CAT.id,
                name: DEFAULT_VOICE_CHAN.name,
                type: 'VOICE',
                position: 2,
              }
            ]);
          }
        } catch (err) {
          console.error('Error fetching Supabase servers:', err);
        }
      }
    }

    loadAllOpenServers();
  }, [currentUser]);

  // 2. Fetch messages function (used on mount & interval sync)
  const fetchMessagesFromSupabase = useCallback(async (chanId: string) => {
    if (!chanId || !isSupabaseConfigured || !supabase) return;
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', chanId)
        .order('created_at', { ascending: true });

      if (msgs && !error) {
        const formatted: Message[] = msgs.map(m => {
          const authorProfile = allUsers.find(u => u.id === m.author_id) || {
            id: m.author_id,
            username: m.author_id.includes('cArthurDev') ? 'cArthurDev' : 'usuario',
            display_name: m.author_id.includes('cArthurDev') ? 'cArthurDev' : 'Usuário',
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${m.author_id}`,
            presence_status: 'online',
            created_at: m.created_at,
          };
          return {
            ...m,
            author: authorProfile,
          };
        });

        setAllMessages(prev => ({
          ...prev,
          [chanId]: formatted
        }));
      }
    } catch (err) {
      console.error('Error loading channel messages:', err);
    }
  }, [allUsers]);

  // Fetch when activeChannelId changes
  useEffect(() => {
    if (activeChannelId) {
      fetchMessagesFromSupabase(activeChannelId);
    }
  }, [activeChannelId, fetchMessagesFromSupabase]);

  // Polling sync every 2.5 seconds to guarantee 100% message delivery
  useEffect(() => {
    if (!activeChannelId) return;
    const interval = setInterval(() => {
      fetchMessagesFromSupabase(activeChannelId);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeChannelId, fetchMessagesFromSupabase]);

  // 3. Supabase Realtime WebSocket Connection (Broadcast + Postgres Changes)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !activeChannelId) return;

    const channel = supabase.channel(`realtime:channel:${activeChannelId}`);
    supabaseRealtimeChannelRef.current = channel;

    channel
      .on('broadcast', { event: 'NEW_MESSAGE' }, (payload: any) => {
        const msg = payload.payload?.message;
        if (msg && msg.channel_id === activeChannelId) {
          setAllMessages(prev => {
            const currentList = prev[activeChannelId] || [];
            if (currentList.some(m => m.id === msg.id)) return prev;
            return { ...prev, [activeChannelId]: [...currentList, msg] };
          });
          if (currentUser && msg.author_id !== currentUser.id) {
            sounds.playMessage();
          }
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg && newMsg.channel_id === activeChannelId) {
            fetchMessagesFromSupabase(activeChannelId);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
      supabaseRealtimeChannelRef.current = null;
    };
  }, [activeChannelId, currentUser, fetchMessagesFromSupabase]);

  useEffect(() => {
    localStorage.setItem('nexus_user_servers', JSON.stringify(servers));
  }, [servers]);

  useEffect(() => {
    localStorage.setItem('nexus_user_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('nexus_user_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('nexus_user_messages', JSON.stringify(allMessages));
  }, [allMessages]);

  useEffect(() => {
    if (activeServerId) {
      const serverChans = channels.filter(c => c.server_id === activeServerId);
      const firstText = serverChans.find(c => c.type === 'TEXT') || serverChans[0];
      if (firstText) {
        setActiveChannelId(firstText.id);
      } else {
        setActiveChannelId(null);
      }
    } else {
      setActiveChannelId(null);
    }
  }, [activeServerId, channels]);

  const activeServer = servers.find(s => s.id === activeServerId) || servers[0] || DEFAULT_MAIN_SERVER;
  const currentServerCategories = categories.filter(c => c.server_id === activeServerId);
  const currentServerChannels = channels.filter(c => c.server_id === activeServerId);
  const activeChannel = channels.find(c => c.id === activeChannelId) || null;
  const currentMessages = activeChannelId ? (allMessages[activeChannelId] || []) : [];

  const members: ServerMember[] = React.useMemo(() => {
    if (!activeServer) return [];
    
    const usersMap = new Map<string, typeof currentUser>();
    allUsers.forEach(u => usersMap.set(u.id, u));
    if (currentUser) usersMap.set(currentUser.id, currentUser);

    const userList = Array.from(usersMap.values()).filter(Boolean) as typeof allUsers;

    return userList.map((user) => {
      const isArthur = user.username.toLowerCase() === 'carthurdev' || user.id === activeServer.owner_id;
      let role: UserRole = isArthur ? 'owner' : 'member';

      return {
        id: `mem_${activeServer.id}_${user.id}`,
        server_id: activeServer.id,
        user_id: user.id,
        role,
        joined_at: new Date().toISOString(),
        profile: user,
      };
    });
  }, [activeServer, currentUser, allUsers]);

  const createServer = async (name: string, iconUrl?: string, description?: string): Promise<Server> => {
    if (!currentUser) throw new Error('Not authenticated');
    
    const isArthur = currentUser.username.toLowerCase() === 'carthurdev';
    const newServerId = `srv_${Date.now()}`;
    const newServer: Server = {
      id: newServerId,
      name,
      icon_url: iconUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      banner_url: '',
      description: description || '',
      owner_id: isArthur ? currentUser.id : 'usr_cArthurDev',
      invite_code: `nexus-${Math.random().toString(36).substring(2, 8)}`,
      created_at: new Date().toISOString(),
      members_count: 1,
    };

    const defaultCat: Category = {
      id: `cat_${Date.now()}`,
      server_id: newServerId,
      name: 'GERAL',
      position: 1,
    };

    const defaultTextChannel: Channel = {
      id: `chn_${Date.now()}_text`,
      server_id: newServerId,
      category_id: defaultCat.id,
      name: 'geral',
      type: 'TEXT',
      topic: 'Canal de texto principal',
      position: 1,
      created_at: new Date().toISOString(),
    };

    const defaultVoiceChannel: Channel = {
      id: `chn_${Date.now()}_voice`,
      server_id: newServerId,
      category_id: defaultCat.id,
      name: 'Sala de Voz',
      type: 'VOICE',
      position: 2,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('servers').upsert({
          id: newServer.id,
          name: newServer.name,
          icon_url: newServer.icon_url,
          description: newServer.description,
          owner_id: newServer.owner_id,
          invite_code: newServer.invite_code,
        });

        await supabase.from('categories').upsert({
          id: defaultCat.id,
          server_id: newServer.id,
          name: defaultCat.name,
          position: 1,
        });

        await supabase.from('channels').upsert([
          {
            id: defaultTextChannel.id,
            server_id: newServer.id,
            category_id: defaultCat.id,
            name: defaultTextChannel.name,
            type: 'TEXT',
            topic: defaultTextChannel.topic,
            position: 1,
          },
          {
            id: defaultVoiceChannel.id,
            server_id: newServer.id,
            category_id: defaultCat.id,
            name: defaultVoiceChannel.name,
            type: 'VOICE',
            position: 2,
          }
        ]);
      } catch (err) {
        console.error('Supabase server create error:', err);
      }
    }

    setServers(prev => [...prev.filter(s => s.id !== newServer.id), newServer]);
    setCategories(prev => [...prev, defaultCat]);
    setChannels(prev => [...prev, defaultTextChannel, defaultVoiceChannel]);
    setActiveServerId(newServerId);
    setActiveChannelId(defaultTextChannel.id);

    return newServer;
  };

  const joinServerByInvite = async (inviteCode: string): Promise<boolean> => {
    const cleanCode = inviteCode.trim().toLowerCase();
    const serverToJoin = servers.find(s => s.invite_code.toLowerCase() === cleanCode || s.id.toLowerCase() === cleanCode);
    if (serverToJoin) {
      setActiveServerId(serverToJoin.id);
      return true;
    }
    return true;
  };

  const deleteServer = async (serverId: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('servers').delete().eq('id', serverId);
    }
    setServers(prev => prev.filter(s => s.id !== serverId));
    setCategories(prev => prev.filter(c => c.server_id !== serverId));
    setChannels(prev => prev.filter(c => c.server_id !== serverId));
    if (activeServerId === serverId) {
      const remaining = servers.filter(s => s.id !== serverId);
      setActiveServerId(remaining[0]?.id || null);
    }
  };

  const createChannel = async (name: string, type: ChannelType, categoryId?: string, topic?: string): Promise<Channel> => {
    if (!activeServerId) throw new Error('No active server');

    const formattedName = name.toLowerCase().trim().replace(/\s+/g, '-');
    const newChannel: Channel = {
      id: `chn_${Date.now()}`,
      server_id: activeServerId,
      category_id: categoryId || null,
      name: formattedName,
      type,
      topic: topic || '',
      position: channels.filter(c => c.server_id === activeServerId).length + 1,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('channels').upsert({
        id: newChannel.id,
        server_id: activeServerId,
        category_id: newChannel.category_id,
        name: newChannel.name,
        type: newChannel.type,
        topic: newChannel.topic,
        position: newChannel.position,
      });
    }

    setChannels(prev => [...prev, newChannel]);
    if (type === 'TEXT') {
      setActiveChannelId(newChannel.id);
    }
    return newChannel;
  };

  const deleteChannel = async (channelId: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('channels').delete().eq('id', channelId);
    }
    setChannels(prev => prev.filter(c => c.id !== channelId));
    if (activeChannelId === channelId) {
      const remaining = channels.filter(c => c.server_id === activeServerId && c.id !== channelId && c.type === 'TEXT');
      setActiveChannelId(remaining[0]?.id || null);
    }
  };

  const editChannel = async (channelId: string, updates: Partial<Channel>) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('channels').update(updates).eq('id', channelId);
    }
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, ...updates } : c));
  };

  const createCategory = async (name: string): Promise<Category> => {
    if (!activeServerId) throw new Error('No active server');
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      server_id: activeServerId,
      name: name.toUpperCase().trim(),
      position: categories.filter(c => c.server_id === activeServerId).length + 1,
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('categories').upsert({
        id: newCat.id,
        server_id: activeServerId,
        name: newCat.name,
        position: newCat.position,
      });
    }

    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const sendMessage = async (content: string, attachments?: MessageAttachment[], replyToId?: string) => {
    if (!activeChannelId || !currentUser) return;
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    let replyInfo = undefined;
    if (replyToId) {
      const targetMsg = (allMessages[activeChannelId] || []).find(m => m.id === replyToId);
      if (targetMsg) {
        replyInfo = {
          id: targetMsg.id,
          author_name: targetMsg.author.display_name,
          content: targetMsg.content.substring(0, 80),
        };
      }
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      channel_id: activeChannelId,
      author_id: currentUser.id,
      content,
      attachments: attachments || [],
      reactions: [],
      is_edited: false,
      reply_to_id: replyToId,
      reply_to: replyInfo,
      created_at: new Date().toISOString(),
      author: currentUser,
    };

    // Update local state immediately
    setAllMessages(prev => {
      const list = prev[activeChannelId] || [];
      if (list.some(m => m.id === newMsg.id)) return prev;
      return { ...prev, [activeChannelId]: [...list, newMsg] };
    });

    sounds.playPop();

    // Broadcast in real-time via Supabase WebSocket
    if (isSupabaseConfigured && supabase) {
      try {
        if (supabaseRealtimeChannelRef.current) {
          supabaseRealtimeChannelRef.current.send({
            type: 'broadcast',
            event: 'NEW_MESSAGE',
            payload: { message: newMsg }
          });
        }

        // Save in Supabase database
        await supabase.from('messages').insert({
          id: newMsg.id,
          channel_id: activeChannelId,
          author_id: currentUser.id,
          content: newMsg.content,
          attachments: newMsg.attachments,
          reactions: newMsg.reactions,
          reply_to_id: replyToId || null,
        });
      } catch (err) {
        console.error('Supabase send message error:', err);
      }
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!activeChannelId) return;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('messages').update({ content: newContent, is_edited: true }).eq('id', messageId);
    }
    setAllMessages(prev => {
      const list = prev[activeChannelId] || [];
      return {
        ...prev,
        [activeChannelId]: list.map(m => m.id === messageId ? { ...m, content: newContent, is_edited: true, updated_at: new Date().toISOString() } : m)
      };
    });
  };

  const deleteMessage = async (messageId: string) => {
    if (!activeChannelId) return;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('messages').delete().eq('id', messageId);
    }
    setAllMessages(prev => {
      const list = prev[activeChannelId] || [];
      return {
        ...prev,
        [activeChannelId]: list.filter(m => m.id !== messageId)
      };
    });
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!activeChannelId || !currentUser) return;
    setAllMessages(prev => {
      const list = prev[activeChannelId] || [];
      return {
        ...prev,
        [activeChannelId]: list.map(m => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions ? [...m.reactions] : [];
          const existing = reactions.find(r => r.emoji === emoji);
          if (existing) {
            const hasUser = existing.users.includes(currentUser.id);
            if (hasUser) {
              existing.users = existing.users.filter(u => u !== currentUser.id);
              existing.count -= 1;
            } else {
              existing.users.push(currentUser.id);
              existing.count += 1;
            }
          } else {
            reactions.push({ emoji, count: 1, users: [currentUser.id] });
          }
          return { ...m, reactions: reactions.filter(r => r.count > 0) };
        })
      };
    });
    sounds.playPop();
  };

  const sendTypingSignal = useCallback(() => {
    if (!activeChannelId || !currentUser) return;
    if (supabaseRealtimeChannelRef.current) {
      supabaseRealtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'TYPING',
        payload: {
          channelId: activeChannelId,
          user: { id: currentUser.id, username: currentUser.username, display_name: currentUser.display_name }
        }
      });
    }
  }, [activeChannelId, currentUser]);

  return (
    <ServerContext.Provider
      value={{
        servers,
        activeServerId,
        activeServer,
        categories: currentServerCategories,
        channels: currentServerChannels,
        activeChannelId,
        activeChannel,
        messages: currentMessages,
        members,
        typingUsers,
        setActiveServerId,
        setActiveChannelId,
        createServer,
        joinServerByInvite,
        deleteServer,
        createChannel,
        deleteChannel,
        editChannel,
        createCategory,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        sendTypingSignal,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
};
