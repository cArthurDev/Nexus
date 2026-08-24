import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck, Video, MessageSquare, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD';

export const AuthPage: React.FC = () => {
  const { login, signup } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        if (!email.trim()) {
          showToast('error', 'Atenção', 'Informe seu e-mail ou nome de usuário.');
          setIsLoading(false);
          return;
        }
        await login(email.trim(), password);
        showToast('success', 'Bem-vindo ao Nexus!', 'Login efetuado com sucesso.');
        confetti({ particleCount: 50, spread: 60 });
      } else if (mode === 'SIGNUP') {
        if (!username.trim() || !email.trim()) {
          showToast('error', 'Campos Obrigatórios', 'Preencha o nome de usuário e e-mail.');
          setIsLoading(false);
          return;
        }
        await signup(username.trim(), email.trim(), password);
        showToast('success', 'Conta Criada!', `Bem-vindo, @${username}!`);
        confetti({ particleCount: 70, spread: 80 });
      } else if (mode === 'FORGOT_PASSWORD') {
        showToast('info', 'Recuperação Enviada', `Um link foi enviado para ${email}.`);
        setMode('LOGIN');
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
                <span className="text-xs text-slate-300 font-medium">Servidores customizados com cargos e convites</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pronto para integração com PostgreSQL & Supabase</span>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          {/* Header Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/5 pb-2">
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
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">
              {mode === 'LOGIN' && 'Boas-vindas de volta!'}
              {mode === 'SIGNUP' && 'Crie sua conta'}
              {mode === 'FORGOT_PASSWORD' && 'Recuperar Senha'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'LOGIN' && 'Insira seus dados para entrar na plataforma.'}
              {mode === 'SIGNUP' && 'Comece do zero criando seu perfil no Nexus.'}
              {mode === 'FORGOT_PASSWORD' && 'Digite seu e-mail para receber as instruções.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'SIGNUP' && (
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
                    placeholder="seu_usuario"
                    className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl py-3 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {mode === 'SIGNUP' ? 'E-mail' : 'E-mail ou Usuário'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={mode === 'SIGNUP' ? 'email' : 'text'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'SIGNUP' ? 'seu.email@exemplo.com' : 'seu_usuario ou email'}
                  className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl py-3 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {mode !== 'FORGOT_PASSWORD' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Senha
                  </label>
                  {mode === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => setMode('FORGOT_PASSWORD')}
                      className="text-[11px] text-nexus-accent hover:underline"
                    >
                      Esqueceu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl py-3 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-xs font-bold bg-nexus-accent text-nexus-950 hover:bg-nexus-accentHover transition-all shadow-lg shadow-nexus-accent/25 flex items-center justify-center gap-2 mt-2"
            >
              <span>
                {mode === 'LOGIN' && (isLoading ? 'Entrando...' : 'Entrar na Plataforma')}
                {mode === 'SIGNUP' && (isLoading ? 'Criando Conta...' : 'Cadastrar e Começar')}
                {mode === 'FORGOT_PASSWORD' && 'Enviar Link de Recuperação'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {mode === 'FORGOT_PASSWORD' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="text-xs text-nexus-accent hover:underline"
              >
                Voltar para o Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
