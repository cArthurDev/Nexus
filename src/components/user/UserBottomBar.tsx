import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVoice } from '../../contexts/VoiceContext';
import { Avatar } from '../ui/Avatar';
import { Mic, MicOff, Headphones, Settings, ChevronDown, Check } from 'lucide-react';
import { PresenceStatus } from '../../types';

interface UserBottomBarProps {
  onOpenSettings: () => void;
}

export const UserBottomBar: React.FC<UserBottomBarProps> = ({ onOpenSettings }) => {
  const { currentUser, updateProfile } = useAuth();
  const { isMuted, isDeafened, toggleMute, toggleDeafen, isSpeaking } = useVoice();
  const [showStatusMenu, setShowStatusMenu] = useState<boolean>(false);

  if (!currentUser) return null;

  const statuses: { label: string; value: PresenceStatus; color: string }[] = [
    { label: 'Disponível', value: 'online', color: 'bg-emerald-500' },
    { label: 'Ausente', value: 'idle', color: 'bg-amber-500' },
    { label: 'Não Perturbe', value: 'dnd', color: 'bg-rose-500' },
    { label: 'Invisível', value: 'offline', color: 'bg-slate-500' },
  ];

  const handleSelectStatus = (st: PresenceStatus) => {
    updateProfile({ presence_status: st });
    setShowStatusMenu(false);
  };

  return (
    <div className="relative bg-nexus-950/80 border-t border-white/[0.04] p-2 flex items-center justify-between z-20">
      {/* Profile summary & Status trigger */}
      <div className="relative flex items-center gap-2.5 min-w-0 p-1 rounded-lg hover:bg-nexus-850/60 transition-colors group cursor-pointer flex-1 mr-1">
        <div onClick={() => setShowStatusMenu(!showStatusMenu)} className="relative shrink-0">
          <Avatar
            src={currentUser.avatar_url}
            name={currentUser.display_name}
            status={currentUser.presence_status}
            isSpeaking={isSpeaking}
            size="sm"
          />
        </div>

        <div onClick={onOpenSettings} className="min-w-0 flex-1 flex flex-col">
          <span className="text-xs font-bold text-slate-100 truncate group-hover:text-nexus-accent transition-colors leading-tight">
            {currentUser.display_name}
          </span>
          <span className="text-[11px] text-slate-400 truncate leading-tight">
            @{currentUser.username}
          </span>
        </div>

        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="text-slate-400 hover:text-white p-1"
          title="Alterar Status"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Status Menu Popover */}
      {showStatusMenu && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowStatusMenu(false)}
          />
          <div className="absolute bottom-16 left-2 w-52 bg-nexus-900 border border-white/10 rounded-xl shadow-2xl p-1.5 z-40 animate-slide-up backdrop-blur-lg">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 mb-1">
              Definir Status
            </div>
            {statuses.map(st => (
              <button
                key={st.value}
                onClick={() => handleSelectStatus(st.value)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-nexus-800 text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                  <span>{st.label}</span>
                </div>
                {currentUser.presence_status === st.value && (
                  <Check className="w-3.5 h-3.5 text-nexus-accent" />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Action buttons: Mic, Audio, Settings */}
      <div className="flex items-center gap-0.5 text-slate-400 shrink-0">
        <button
          onClick={toggleMute}
          className={`p-1.5 rounded-md transition-all ${
            isMuted
              ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
              : 'hover:text-white hover:bg-nexus-800'
          }`}
          title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleDeafen}
          className={`p-1.5 rounded-md transition-all ${
            isDeafened
              ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
              : 'hover:text-white hover:bg-nexus-800'
          }`}
          title={isDeafened ? 'Ativar Áudio' : 'Desativar Áudio (Ensurdecer)'}
        >
          <Headphones className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md hover:text-white hover:bg-nexus-800 transition-all"
          title="Configurações do Usuário"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
