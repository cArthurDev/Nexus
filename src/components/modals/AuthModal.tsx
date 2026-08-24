import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        await login(email.trim(), password);
        showToast('success', 'Bem-vindo de volta!', 'Login realizado com sucesso.');
        confetti({ particleCount: 40, spread: 50 });
        onClose();
      } else if (mode === 'SIGNUP') {
        if (!username.trim() || !email.trim()) {
          showToast('error', 'Campos Obrigatórios', 'Preencha usuário e e-mail.');
          setIsLoading(false);
          return;
        }
        await signup(username.trim(), email.trim(), password);
        showToast('success', 'Conta Criada!', `Bem-vindo ao Nexus, @${username}!`);
        confetti({ particleCount: 70, spread: 70 });
        onClose();
      } else if (mode === 'FORGOT_PASSWORD') {
        showToast('info', 'Recuperação Enviada', `Um link de redefinição foi enviado para ${email}.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-nexus-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8 z-10 animate-slide-up">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-nexus-accent to-nexus-purple text-nexus-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-nexus-accent/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Nexus</h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'LOGIN' && 'Bem-vindo de volta! Faça login para continuar.'}
            {mode === 'SIGNUP' && 'Crie sua conta para começar a conversar.'}
            {mode === 'FORGOT_PASSWORD' && 'Insira seu e-mail para recuperar sua senha.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SIGNUP' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome de Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu_usuario"
                  className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl py-3 pl-10 pr-3 text-xs text-white focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              E-mail ou Usuário
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl py-3 pl-10 pr-3 text-xs text-white focus:outline-none transition-all"
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
                    Esqueceu a senha?
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
                  className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl py-3 pl-10 pr-3 text-xs text-white focus:outline-none transition-all"
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
              {mode === 'LOGIN' && (isLoading ? 'Entrando...' : 'Entrar')}
              {mode === 'SIGNUP' && (isLoading ? 'Criando Conta...' : 'Cadastrar')}
              {mode === 'FORGOT_PASSWORD' && 'Enviar Link de Recuperação'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Mode Switcher footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {mode === 'LOGIN' && (
            <p>
              Precisa de uma conta?{' '}
              <button
                onClick={() => setMode('SIGNUP')}
                className="text-nexus-accent font-bold hover:underline"
              >
                Registre-se
              </button>
            </p>
          )}

          {mode === 'SIGNUP' && (
            <p>
              Já tem uma conta?{' '}
              <button
                onClick={() => setMode('LOGIN')}
                className="text-nexus-accent font-bold hover:underline"
              >
                Fazer login
              </button>
            </p>
          )}

          {mode === 'FORGOT_PASSWORD' && (
            <p>
              Lembrou sua senha?{' '}
              <button
                onClick={() => setMode('LOGIN')}
                className="text-nexus-accent font-bold hover:underline"
              >
                Voltar ao login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
