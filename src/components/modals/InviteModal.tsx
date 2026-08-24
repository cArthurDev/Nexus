import React, { useState } from 'react';
import { useServer } from '../../contexts/ServerContext';
import { useToast } from '../ui/Toast';
import { X, Copy, Check, UserPlus, Link } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
  const { activeServer } = useServer();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !activeServer) return null;

  const inviteLink = `${window.location.origin}/join/${activeServer.invite_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeServer.invite_code);
    setCopied(true);
    showToast('success', 'Código Copiado!', 'Compartilhe com seus amigos para eles entrarem.');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-nexus-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 z-10 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-nexus-accent/20 text-nexus-accent flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Convidar para {activeServer.name}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-5">
          Envie o código de convite abaixo para que outras pessoas possam entrar neste servidor instantaneamente.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Código de Convite
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeServer.invite_code}
                className="flex-1 bg-nexus-950 border border-white/10 rounded-xl p-3 text-xs text-nexus-accent font-mono font-bold focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-nexus-accent text-nexus-950 hover:bg-nexus-accentHover'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
