import React, { useState } from 'react';
import { useServer } from '../../contexts/ServerContext';
import { useToast } from '../ui/Toast';
import { X, Compass } from 'lucide-react';

interface JoinServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinServerModal: React.FC<JoinServerModalProps> = ({ isOpen, onClose }) => {
  const { joinServerByInvite, servers } = useServer();
  const { showToast } = useToast();
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    const success = await joinServerByInvite(inviteCode.trim());
    setIsSubmitting(false);

    if (success) {
      showToast('success', 'Entrou no Servidor!', 'Redirecionando...');
      onClose();
    } else {
      showToast('error', 'Código Inválido', 'Verifique o código de convite e tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-nexus-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 z-10 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-nexus-purple/20 text-nexus-purple flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Entrar em um Servidor</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-6">
          Insira um código de convite abaixo para se juntar a uma comunidade existente.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Código de Convite <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Ex: nexus-hub-2026, dev-lab-ai"
              className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-purple rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              autoFocus
            />
          </div>

          <div className="p-3 bg-nexus-950/60 rounded-xl border border-white/5 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Códigos de exemplo disponíveis:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {servers.map(s => (
                <span
                  key={s.id}
                  onClick={() => setInviteCode(s.invite_code)}
                  className="bg-nexus-900 px-2 py-1 rounded cursor-pointer hover:text-nexus-accent border border-white/5 transition-colors font-mono"
                >
                  {s.invite_code}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-nexus-850 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!inviteCode.trim() || isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-nexus-purple text-white hover:bg-nexus-purpleHover transition-colors shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar no Servidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
