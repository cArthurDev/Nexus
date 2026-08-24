import React, { useState } from 'react';
import { useFriend } from '../../contexts/FriendContext';
import { useVoice } from '../../contexts/VoiceContext';
import { Avatar } from '../ui/Avatar';
import { useToast } from '../ui/Toast';
import {
  Users,
  MessageSquare,
  Phone,
  Search,
  Sparkles,
  Radio
} from 'lucide-react';

type Tab = 'ONLINE' | 'ALL';

interface FriendsViewProps {
  onOpenDm: (userId: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onOpenDm }) => {
  const { friends } = useFriend();
  const { joinVoiceChannel } = useVoice();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  const onlineFriends = friends.filter(f => f.presence_status !== 'offline');
  const displayedList = (activeTab === 'ONLINE' ? onlineFriends : friends).filter(f =>
    searchFilter.trim()
      ? f.display_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        f.username.toLowerCase().includes(searchFilter.toLowerCase())
      : true
  );

  const handleStartCall = (friend: typeof friends[0]) => {
    joinVoiceChannel(`call_${friend.id}`, `Chamada com ${friend.display_name}`, 'Nexus Privado');
    showToast('info', 'Iniciando Chamada...', `Conectando com ${friend.display_name}`);
  };

  return (
    <div className="flex-1 bg-nexus-950 flex flex-col h-full overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-white/[0.04] px-6 flex items-center justify-between shrink-0 bg-nexus-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Users className="w-5 h-5 text-nexus-accent" />
            <span>Amigos & Usuários</span>
          </div>

          <div className="w-[1px] h-4 bg-white/10" />

          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-nexus-850 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-nexus-900'
              }`}
            >
              Todos ({friends.length})
            </button>

            <button
              onClick={() => setActiveTab('ONLINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ONLINE'
                  ? 'bg-nexus-850 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-nexus-900'
              }`}
            >
              Disponíveis ({onlineFriends.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin max-w-4xl">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar por nome ou @usuario..."
            className="w-full pl-10 pr-4 py-2.5 bg-nexus-900 border border-white/5 focus:border-nexus-accent rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
          />
        </div>

        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          {activeTab === 'ONLINE' ? `Disponíveis — ${displayedList.length}` : `Todos os Contatos — ${displayedList.length}`}
        </div>

        {displayedList.length === 0 ? (
          <div className="text-center py-16 bg-nexus-900/30 rounded-3xl border border-white/5 p-8">
            <div className="w-16 h-16 rounded-2xl bg-nexus-850 flex items-center justify-center mx-auto mb-3 text-slate-500 shadow-inner">
              <Users className="w-8 h-8 text-nexus-accent" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Aguardando novos usuários</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Assim que sua namorada ou amigos criarem uma conta no link, eles aparecerão aqui automaticamente para você conversar por texto ou voz!
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {displayedList.map((user) => (
              <div
                key={user.id}
                className="group flex items-center justify-between p-3 rounded-2xl bg-nexus-900/40 hover:bg-nexus-900 border border-white/[0.03] hover:border-white/10 transition-all"
              >
                <div
                  onClick={() => onOpenDm(user.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <Avatar
                    src={user.avatar_url}
                    name={user.display_name}
                    status={user.presence_status}
                    size="md"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xs text-white group-hover:text-nexus-accent transition-colors truncate">
                        {user.display_name}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        @{user.username}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user.custom_status || user.status_text || 'Disponível no Nexus'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenDm(user.id)}
                    className="p-2.5 rounded-xl bg-nexus-850 text-slate-300 hover:text-nexus-accent hover:bg-nexus-800 transition-colors shadow"
                    title="Conversar no Chat Privado"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleStartCall(user)}
                    className="p-2.5 rounded-xl bg-nexus-850 text-slate-300 hover:text-emerald-400 hover:bg-nexus-800 transition-colors shadow"
                    title="Iniciar Chamada de Voz"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
