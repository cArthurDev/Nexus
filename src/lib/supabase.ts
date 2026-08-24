import { createClient } from '@supabase/supabase-js';

// Default Supabase project credentials for universal multi-device connectivity
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  'https://vberfahfvcbcapffpdxj.supabase.co';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'sb_publishable_hGmYPGaqka-dGlM6H0DQUA_tAM4LsE6';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    })
  : null;
