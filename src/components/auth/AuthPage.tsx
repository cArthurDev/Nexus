import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { Sparkles, Lock, User, Mail, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

type AuthMode = 'LOGIN' | 'SIGNUP';

export const AuthPage: React.FC = () => {
  const { login, signup } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        if (!email.trim() || !password.trim()) {
          showToast('error', 'Atenção', 'Preencha o e-mail/usuário e a senha.');
          setIsLoading(false);
          return;
        }
        await login(email.trim(), password.trim());
        showToast('success', 'Bem-vindo de volta!', 'Login efetuado com sucesso.');
        confetti({ particleCount: 50, spread: 60 });
      } else {
        if (!username.trim() || !email.trim() || !password.trim()) {
          showToast('error', 'Campos Obrigatórios', 'Preencha o nome de usuário, e-mail e senha.');
          setIsLoading(false);
          return;
        }
        await signup(username.trim(), email.trim(), password.trim());
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
      {/* Subtle background glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-nexus-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-nexus-purple/10 rounded-full blur-3xl pointer-events-none" />

      {/* Centered Clean Card */}
      <div className="w-full max-w-md bg-nexus-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8 z-10 backdrop-blur-2xl animate-slide-up">
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-nexus-accent to-nexus-purple text-nexus-950 flex items-center justify-center shadow-lg shadow-nexus-accent/20 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Nexus</h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'LOGIN' ? 'Boas-vindas de volta!' : 'Crie sua conta para começar'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-nexus-950 p-1 mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => setMode('LOGIN')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'LOGIN'
                ? 'bg-nexus-850 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode('SIGNUP')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'SIGNUP'
                ? 'bg-nexus-850 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Form */}
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
                  placeholder="Ex: arthur ou maria"
                  className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl py-3 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              {mode === 'SIGNUP' ? 'E-mail' : 'E-mail ou Nome de Usuário'}
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
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Senha
            </label>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-xs font-bold bg-nexus-accent text-nexus-950 hover:bg-nexus-accentHover transition-all shadow-lg shadow-nexus-accent/25 flex items-center justify-center gap-2 mt-4"
          >
            <span>
              {mode === 'LOGIN'
                ? (isLoading ? 'Entrando...' : 'Entrar na Plataforma')
                : (isLoading ? 'Criando Conta...' : 'Cadastrar e Entrar 🚀')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
