import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

const GLOBAL_SERVERS_REGISTRY = 'nexus_global_servers_registry';
const GLOBAL_CHANNELS_REGISTRY = 'nexus_global_channels_registry';
const GLOBAL_CATEGORIES_REGISTRY = 'nexus_global_categories_registry';

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allUsers } = useAuth();
  
  const [servers, setServers] = useState<Server[]>(() => {
    const saved = localStorage.getItem('nexus_user_servers');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeServerId, setActiveServerId] = useState<string | null>(servers[0]?.id || null);

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('nexus_user_categories');
    return saved ? JSON.parse(saved) : [];
  });

  const [channels, setChannels] = useState<Channel[]>(() => {
    const saved = localStorage.getItem('nexus_user_channels');
    return saved ? JSON.parse(saved) : [];
  });

  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('nexus_user_messages');
    return saved ? JSON.parse(saved) : {};
  });

  const serverChannels = channels.filter(c => c.server_id === activeServerId);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(serverChannels[0]?.id || null);

  const [typingUsers, setTypingUsers] = useState<{ username: string; display_name: string; timestamp: number }[]>([]);

  // Load from Supabase on mount if configured
  useEffect(() => {
    async function loadSupabaseServers() {
      if (isSupabaseConfigured && supabase && currentUser) {
        try {
          // Fetch servers where user is member or owner
          const { data: memberRows } = await supabase
            .from('server_members')
            .select('server_id')
            .eq('user_id', currentUser.id);

          const serverIds = memberRows?.map(r => r.server_id) || [];

          if (serverIds.length > 0) {
            const { data: serverList } = await supabase
              .from('servers')
              .select('*')
              .in('id', serverIds);

            if (serverList && serverList.length > 0) {
              setServers(serverList);
              if (!activeServerId) {
                setActiveServerId(serverList[0].id);
              }

              // Fetch channels & categories for these servers
              const { data: catList } = await supabase
                .from('categories')
                .select('*')
                .in('server_id', serverIds);
              if (catList) setCategories(catList);

              const { data: chanList } = await supabase
                .from('channels')
                .select('*')
                .in('server_id', serverIds);
              if (chanList) setChannels(chanList);
            }
          }
        } catch (err) {
          console.error('Error fetching Supabase servers:', err);
        }
      }
    }

    loadSupabaseServers();
  }, [currentUser]);

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

  // Realtime BroadcastChannel for multi-tab sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bc = new BroadcastChannel('nexus_server_events');

    bc.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'NEW_MESSAGE') {
        const { channelId, message } = data;
        setAllMessages(prev => {
          const currentList = prev[channelId] || [];
          if (currentList.some(m => m.id === message.id)) return prev;
          return { ...prev, [channelId]: [...currentList, message] };
        });
        if (currentUser && message.author_id !== currentUser.id) {
          sounds.playMessage();
        }
      } else if (data.type === 'SERVER_CREATED') {
        // Shared registry sync
        const { server, categories: cats, channels: chans } = data;
        const globalServers: Server[] = JSON.parse(localStorage.getItem(GLOBAL_SERVERS_REGISTRY) || '[]');
        if (!globalServers.some(s => s.id === server.id)) {
          localStorage.setItem(GLOBAL_SERVERS_REGISTRY, JSON.stringify([...globalServers, server]));
        }
      } else if (data.type === 'TYPING') {
        if (data.channelId === activeChannelId && data.user.id !== currentUser?.id) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.username !== data.user.username);
            return [...filtered, { username: data.user.username, display_name: data.user.display_name, timestamp: Date.now() }];
          });
        }
      }
    };

    return () => {
      bc.close();
    };
  }, [activeChannelId, currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => prev.filter(u => now - u.timestamp < 3500));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeServer = servers.find(s => s.id === activeServerId) || null;
  const currentServerCategories = categories.filter(c => c.server_id === activeServerId);
  const currentServerChannels = channels.filter(c => c.server_id === activeServerId);
  const activeChannel = channels.find(c => c.id === activeChannelId) || null;
  const currentMessages = activeChannelId ? (allMessages[activeChannelId] || []) : [];

  // Generate dynamic members list for active server
  const members: ServerMember[] = React.useMemo(() => {
    if (!activeServer) return [];
    const serverUsers = allUsers.filter(u => u.id === activeServer.owner_id || u.id === currentUser?.id);
    if (serverUsers.length === 0 && currentUser) {
      serverUsers.push(currentUser);
    }

    return serverUsers.map((user) => {
      let role: UserRole = 'member';
      if (user.id === activeServer.owner_id) role = 'owner';

      return {
        id: `mem_${activeServer.id}_${user.id}`,
        server_id: activeServer.id,
        user_id: user.id,
        role,
        joined_at: new Date().toISOString(),
        profile: user.id === currentUser?.id ? currentUser : user,
      };
    });
  }, [activeServer, currentUser, allUsers]);

  const createServer = async (name: string, iconUrl?: string, description?: string): Promise<Server> => {
    if (!currentUser) throw new Error('Not authenticated');
    
    const newServerId = `srv_${Date.now()}`;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const invite_code = `nexus-${code}`.toLowerCase();

    const newServer: Server = {
      id: newServerId,
      name,
      icon_url: iconUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      banner_url: '',
      description: description || '',
      owner_id: currentUser.id,
      invite_code,
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

    // Save to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('servers').insert({
          id: newServer.id,
          name: newServer.name,
          icon_url: newServer.icon_url,
          description: newServer.description,
          owner_id: currentUser.id,
          invite_code: newServer.invite_code,
        });

        await supabase.from('server_members').insert({
          server_id: newServer.id,
          user_id: currentUser.id,
          role: 'owner',
        });

        await supabase.from('categories').insert({
          id: defaultCat.id,
          server_id: newServer.id,
          name: defaultCat.name,
          position: 1,
        });

        await supabase.from('channels').insert([
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

    // Save to global registry for cross-tab local sharing
    const globalServers: Server[] = JSON.parse(localStorage.getItem(GLOBAL_SERVERS_REGISTRY) || '[]');
    localStorage.setItem(GLOBAL_SERVERS_REGISTRY, JSON.stringify([...globalServers.filter(s => s.id !== newServer.id), newServer]));

    const globalCats: Category[] = JSON.parse(localStorage.getItem(GLOBAL_CATEGORIES_REGISTRY) || '[]');
    localStorage.setItem(GLOBAL_CATEGORIES_REGISTRY, JSON.stringify([...globalCats, defaultCat]));

    const globalChans: Channel[] = JSON.parse(localStorage.getItem(GLOBAL_CHANNELS_REGISTRY) || '[]');
    localStorage.setItem(GLOBAL_CHANNELS_REGISTRY, JSON.stringify([...globalChans, defaultTextChannel, defaultVoiceChannel]));

    setServers(prev => [...prev.filter(s => s.id !== newServer.id), newServer]);
    setCategories(prev => [...prev, defaultCat]);
    setChannels(prev => [...prev, defaultTextChannel, defaultVoiceChannel]);
    setActiveServerId(newServerId);
    setActiveChannelId(defaultTextChannel.id);

    // Broadcast creation
    if (typeof window !== 'undefined') {
      const bc = new BroadcastChannel('nexus_server_events');
      bc.postMessage({
        type: 'SERVER_CREATED',
        server: newServer,
        categories: [defaultCat],
        channels: [defaultTextChannel, defaultVoiceChannel]
      });
      bc.close();
    }

    return newServer;
  };

  const joinServerByInvite = async (inviteCode: string): Promise<boolean> => {
    if (!currentUser) return false;
    const cleanCode = inviteCode.trim().toLowerCase().replace(/^https?:\/\/.*\/join\//, '');

    // 1. Try Supabase lookup
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: server, error } = await supabase
          .from('servers')
          .select('*')
          .eq('invite_code', cleanCode)
          .single();

        if (server && !error) {
          // Add to server_members in Supabase
          await supabase.from('server_members').upsert({
            server_id: server.id,
            user_id: currentUser.id,
            role: 'member',
          });

          // Fetch categories & channels for this server
          const { data: serverCats } = await supabase
            .from('categories')
            .select('*')
            .eq('server_id', server.id);

          const { data: serverChans } = await supabase
            .from('channels')
            .select('*')
            .eq('server_id', server.id);

          setServers(prev => {
            if (prev.some(s => s.id === server.id)) return prev;
            return [...prev, server];
          });

          if (serverCats && serverCats.length > 0) {
            setCategories(prev => [...prev.filter(c => c.server_id !== server.id), ...serverCats]);
          }

          if (serverChans && serverChans.length > 0) {
            setChannels(prev => [...prev.filter(c => c.server_id !== server.id), ...serverChans]);
          }

          setActiveServerId(server.id);
          sounds.playPop();
          return true;
        }
      } catch (err) {
        console.error('Error joining server via Supabase:', err);
      }
    }

    // 2. Lookup in global registry / local storage
    const globalServers: Server[] = JSON.parse(localStorage.getItem(GLOBAL_SERVERS_REGISTRY) || '[]');
    const allKnown = [...servers, ...globalServers];
    const serverToJoin = allKnown.find(s => 
      s.invite_code.toLowerCase() === cleanCode || 
      s.id.toLowerCase() === cleanCode ||
      s.name.toLowerCase() === cleanCode
    );
    
    if (serverToJoin) {
      const globalCats: Category[] = JSON.parse(localStorage.getItem(GLOBAL_CATEGORIES_REGISTRY) || '[]');
      const globalChans: Channel[] = JSON.parse(localStorage.getItem(GLOBAL_CHANNELS_REGISTRY) || '[]');

      const relevantCats = globalCats.filter(c => c.server_id === serverToJoin.id);
      const relevantChans = globalChans.filter(c => c.server_id === serverToJoin.id);

      setServers(prev => {
        if (prev.some(s => s.id === serverToJoin.id)) return prev;
        return [...prev, serverToJoin];
      });

      if (relevantCats.length > 0) {
        setCategories(prev => [...prev.filter(c => c.server_id !== serverToJoin.id), ...relevantCats]);
      }
      if (relevantChans.length > 0) {
        setChannels(prev => [...prev.filter(c => c.server_id !== serverToJoin.id), ...relevantChans]);
      }

      setActiveServerId(serverToJoin.id);
      sounds.playPop();
      return true;
    }

    return false;
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
      await supabase.from('channels').insert({
        id: newChannel.id,
        server_id: activeServerId,
        category_id: newChannel.category_id,
        name: newChannel.name,
        type: newChannel.type,
        topic: newChannel.topic,
        position: newChannel.position,
      });
    }

    const globalChans: Channel[] = JSON.parse(localStorage.getItem(GLOBAL_CHANNELS_REGISTRY) || '[]');
    localStorage.setItem(GLOBAL_CHANNELS_REGISTRY, JSON.stringify([...globalChans, newChannel]));

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
      await supabase.from('categories').insert({
        id: newCat.id,
        server_id: activeServerId,
        name: newCat.name,
        position: newCat.position,
      });
    }

    const globalCats: Category[] = JSON.parse(localStorage.getItem(GLOBAL_CATEGORIES_REGISTRY) || '[]');
    localStorage.setItem(GLOBAL_CATEGORIES_REGISTRY, JSON.stringify([...globalCats, newCat]));

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

    if (isSupabaseConfigured && supabase) {
      await supabase.from('messages').insert({
        id: newMsg.id,
        channel_id: activeChannelId,
        author_id: currentUser.id,
        content: newMsg.content,
        attachments: newMsg.attachments,
        reactions: newMsg.reactions,
        reply_to_id: replyToId || null,
      });
    }

    setAllMessages(prev => {
      const list = prev[activeChannelId] || [];
      return { ...prev, [activeChannelId]: [...list, newMsg] };
    });

    sounds.playPop();

    if (typeof window !== 'undefined') {
      const bc = new BroadcastChannel('nexus_server_events');
      bc.postMessage({ type: 'NEW_MESSAGE', channelId: activeChannelId, message: newMsg });
      bc.close();
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
    if (!activeChannelId || !currentUser || typeof window === 'undefined') return;
    const bc = new BroadcastChannel('nexus_server_events');
    bc.postMessage({
      type: 'TYPING',
      channelId: activeChannelId,
      user: { id: currentUser.id, username: currentUser.username, display_name: currentUser.display_name }
    });
    bc.close();
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
