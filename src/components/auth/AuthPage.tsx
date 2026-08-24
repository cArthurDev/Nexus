import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { Sparkles, Lock, User, ArrowRight, Video, MessageSquare, Compass, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

type AuthMode = 'LOGIN' | 'SIGNUP';

export const AuthPage: React.FC = () => {
  const { login, signup } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthMode>('SIGNUP');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('error', 'Atenção', 'Informe seu nome de usuário.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        await login(username.trim(), password);
        showToast('success', 'Bem-vindo de volta!', `Entrando como @${username.trim()}`);
        confetti({ particleCount: 50, spread: 60 });
      } else {
        await signup(username.trim(), undefined, password);
        showToast('success', 'Conta Criada!', `Bem-vindo ao Nexus, @${username.trim()}!`);
        confetti({ particleCount: 70, spread: 80 });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar autenticação.';
      showToast('error', 'Erro', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-nexus-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background glowing gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-nexus-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-nexus-purple/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl bg-nexus-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 z-10 backdrop-blur-2xl">
        {/* Left Side: Brand & Feature Showcase */}
        <div className="bg-gradient-to-br from-nexus-850 to-nexus-900 p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-nexus-accent to-nexus-purple text-nexus-950 flex items-center justify-center shadow-lg shadow-nexus-accent/25">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Nexus</h1>
                <span className="text-xs text-nexus-accent font-semibold tracking-wider uppercase">
                  Comunicação em Tempo Real
                </span>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Crie comunidades, converse com amigos por texto, faça chamadas de voz e vídeo com detecção de fala em tempo real e compartilhe sua tela em alta definição.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-nexus-accent/10 text-nexus-accent flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs text-slate-300 font-medium">Canais de texto com reações, emojis e anexos</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <span className="text-xs text-slate-300 font-medium">Canais de voz, câmeras e compartilhamento de tela</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-nexus-purple/10 text-nexus-purple flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-xs text-slate-300 font-medium">Servidores customizados com convites diretos</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sem burocracia: crie sua conta e entre instantaneamente</span>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          {/* Header Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/5 pb-2">
            <button
              onClick={() => setMode('SIGNUP')}
              className={`text-sm font-bold pb-2 transition-all relative ${
                mode === 'SIGNUP'
                  ? 'text-nexus-accent border-b-2 border-nexus-accent'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Criar Conta
            </button>

            <button
              onClick={() => setMode('LOGIN')}
              className={`text-sm font-bold pb-2 transition-all relative ${
                mode === 'LOGIN'
                  ? 'text-nexus-accent border-b-2 border-nexus-accent'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">
              {mode === 'SIGNUP' ? 'Crie sua conta no Nexus' : 'Boas-vindas de volta!'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'SIGNUP'
                ? 'Escolha seu nome de usuário e comece a conversar agora mesmo.'
                : 'Digite seu nome de usuário para entrar.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome de Usuário (@)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: arthur ou maria"
                  className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl py-3 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Senha (Opcional)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl py-3 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-xs font-bold bg-nexus-accent text-nexus-950 hover:bg-nexus-accentHover transition-all shadow-lg shadow-nexus-accent/25 flex items-center justify-center gap-2 mt-4"
            >
              <span>
                {mode === 'SIGNUP'
                  ? (isLoading ? 'Criando Conta...' : 'Criar Conta e Entrar 🚀')
                  : (isLoading ? 'Entrando...' : 'Entrar na Plataforma')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
