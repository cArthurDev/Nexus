import { Server, Channel, Category, UserProfile, Message, Friendship, DirectMessage } from '../types';

export const INITIAL_USERS: UserProfile[] = [];
export const INITIAL_SERVERS: Server[] = [];
export const INITIAL_CATEGORIES: Category[] = [];
export const INITIAL_CHANNELS: Channel[] = [];
export const INITIAL_MESSAGES: Record<string, Message[]> = {};
export const INITIAL_FRIENDSHIPS: Friendship[] = [];
export const INITIAL_DIRECT_MESSAGES: Record<string, DirectMessage[]> = {};
