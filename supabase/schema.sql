-- ==============================================================================
-- NEXUS REALTIME PLATFORM - SCHEMA COM CONVERSÃO TOTAL PARA TEXT (SEM ERROS DE UUID)
-- Execute este script no SQL Editor do Supabase para recriar as tabelas corretamente
-- ==============================================================================

-- 1. APAGAR TABELAS ANTIGAS COM TIPOS UUID INCOMPATÍVEIS
DROP TABLE IF EXISTS public.direct_messages CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.server_members CASCADE;
DROP TABLE IF EXISTS public.servers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  password TEXT,
  avatar_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  status_text TEXT DEFAULT '',
  presence_status TEXT DEFAULT 'online',
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. TABELA DE SERVIDORES
CREATE TABLE public.servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  owner_id TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. CATEGORIAS DE CANAIS
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. CANAIS DO SERVIDOR
CREATE TABLE public.channels (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  category_id TEXT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'TEXT' NOT NULL,
  topic TEXT DEFAULT '',
  position INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. MENSAGENS DOS CANAIS
CREATE TABLE public.messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  reactions JSONB DEFAULT '[]'::jsonb,
  is_edited BOOLEAN DEFAULT FALSE,
  reply_to_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. MENSAGENS DIRETAS (DMs)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  reactions JSONB DEFAULT '[]'::jsonb,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. SESSÕES DE VOZ ATIVAS
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  user_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  is_muted BOOLEAN DEFAULT FALSE,
  is_deafened BOOLEAN DEFAULT FALSE,
  is_speaking BOOLEAN DEFAULT FALSE,
  is_camera_on BOOLEAN DEFAULT FALSE,
  is_screen_sharing BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. DESATIVAR RLS PARA ACESSO IMEDIATO
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions DISABLE ROW LEVEL SECURITY;

-- 9. INSERIR O SERVIDOR PADRÃO E CANAIS INICIAIS ABERTOS
INSERT INTO public.servers (id, name, icon_url, description, owner_id, invite_code)
VALUES (
  'srv_nexus_main',
  'Nexus Oficial',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
  'Servidor oficial e público aberto para todos os usuários!',
  'usr_cArthurDev',
  'nexus-oficial'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, server_id, name, position)
VALUES (
  'cat_main_geral',
  'srv_nexus_main',
  'CANAIS PRINCIPAIS',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.channels (id, server_id, category_id, name, type, topic, position)
VALUES 
  ('chn_main_geral_text', 'srv_nexus_main', 'cat_main_geral', 'geral', 'TEXT', 'Chat público aberto para todos', 1),
  ('chn_main_geral_voice', 'srv_nexus_main', 'cat_main_geral', 'Sala de Voz', 'VOICE', 'Sala de voz pública', 2)
ON CONFLICT (id) DO NOTHING;

-- 10. HABILITAR REALTIME
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'servers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.servers;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'categories') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'channels') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'direct_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
END $$;
