import React, { useState } from 'react';
import { useServer } from '../../contexts/ServerContext';
import { useFriend } from '../../contexts/FriendContext';
import { useToast } from '../ui/Toast';
import { Avatar } from '../ui/Avatar';
import { X, Copy, Check, UserPlus, Send, Sparkles } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
  const { activeServer } = useServer();
  const { friends, sendDirectMessage } = useFriend();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<Record<string, boolean>>({});

  if (!isOpen || !activeServer) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeServer.invite_code);
    setCopied(true);
    showToast('success', 'Código Copiado!', 'Compartilhe com seus amigos para eles entrarem.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendInviteToUser = async (userId: string, userName: string) => {
    const inviteMessage = `🎉 Você foi convidado para o servidor **${activeServer.name}**!\n\nCódigo do Convite: **${activeServer.invite_code}**`;
    await sendDirectMessage(userId, inviteMessage);

    setInvitedUsers(prev => ({ ...prev, [userId]: true }));
    showToast('success', 'Convite Enviado!', `O convite foi enviado para a mensagem privada de ${userName}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-nexus-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 z-10 animate-slide-up flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
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

        <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin">
          {/* Direct User Invites List */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Convidar Usuários Diretamente
            </label>

            {friends.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                Nenhum outro usuário disponível no momento.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {friends.map(user => {
                  const isInvited = invitedUsers[user.id];

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-nexus-950/60 border border-white/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={user.avatar_url}
                          name={user.display_name}
                          status={user.presence_status}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-white truncate block">
                            {user.display_name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            @{user.username}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendInviteToUser(user.id, user.display_name)}
                        disabled={isInvited}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isInvited
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-nexus-accent text-nexus-950 hover:bg-nexus-accentHover shadow'
                        }`}
                      >
                        {isInvited ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Enviado</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Convidar</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Copy Invite Code Box */}
          <div className="pt-3 border-t border-white/5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Ou Copie o Código de Convite
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
                className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0 ${
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
