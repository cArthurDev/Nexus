# Nexus ⚡

Plataforma moderna de comunicação em tempo real com servidores, canais de texto, canais de voz com WebRTC (áudio, vídeo e compartilhamento de tela com detecção de fala em tempo real), mensagens diretas e sistema de amigos.

---

## 🚀 Tecnologias

- **Frontend**: React 19 + TypeScript + Vite
- **Estilização**: Tailwind CSS (Dark Mode, Glassmorphism, Micro-interações)
- **Banco de Dados & Auth**: Supabase + PostgreSQL
- **Tempo Real**: Supabase Realtime (WebSockets)
- **Áudio, Vídeo & Tela**: WebRTC + Web Audio API (VAD - Voice Activity Detection)
- **Ícones**: Lucide React

---

## 🛠️ Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   Crie um arquivo `.env` na raiz:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-publicavel
   ```

3. **Executar o script SQL no Supabase**:
   Execute o conteúdo de `supabase/schema.sql` no SQL Editor do Supabase.

4. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

5. **Build para Produção / Deploy (Vercel)**:
   ```bash
   npm run build
   ```
