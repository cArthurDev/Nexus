export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline';

export type UserRole = 'owner' | 'admin' | 'moderator' | 'member';

export type ChannelType = 'TEXT' | 'VOICE';

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  banner_url?: string;
  status_text?: string;
  presence_status: PresenceStatus;
  custom_status?: string;
  bio?: string;
  created_at: string;
}

export interface Server {
  id: string;
  name: string;
  icon_url: string;
  banner_url?: string;
  description?: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
  members_count?: number;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role: UserRole;
  nickname?: string;
  joined_at: string;
  profile: UserProfile;
}

export interface Category {
  id: string;
  server_id: string;
  name: string;
  position: number;
}

export interface Channel {
  id: string;
  server_id: string;
  category_id?: string | null;
  name: string;
  type: ChannelType;
  topic?: string;
  position: number;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video' | 'file';
  size?: number;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[]; // user_ids
}

export interface Message {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  is_edited: boolean;
  reply_to_id?: string;
  reply_to?: {
    id: string;
    author_name: string;
    content: string;
  };
  created_at: string;
  updated_at?: string;
  author: UserProfile;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  is_edited: boolean;
  created_at: string;
  sender: UserProfile;
  receiver: UserProfile;
}

export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: FriendshipStatus;
  created_at: string;
  friend: UserProfile;
}

export interface VoiceParticipant {
  id: string;
  user_id: string;
  channel_id: string;
  profile: UserProfile;
  is_muted: boolean;
  is_deafened: boolean;
  is_camera_on: boolean;
  is_screen_sharing: boolean;
  is_speaking: boolean;
  audio_level: number; // 0 to 100
  stream?: MediaStream;
  screen_stream?: MediaStream;
  joined_at: string;
}

export interface TypingIndicator {
  user_id: string;
  username: string;
  display_name: string;
  channel_id: string;
  timestamp: number;
}
