import React, { useState } from 'react';
import { useFriend } from '../../contexts/FriendContext';
import { useVoice } from '../../contexts/VoiceContext';
import { Avatar } from '../ui/Avatar';
import { useToast } from '../ui/Toast';
import {
  Users,
  UserPlus,
  MessageSquare,
  Phone,
  Check,
  X,
  Search,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

type Tab = 'ONLINE' | 'ALL' | 'PENDING' | 'ADD_FRIEND';

interface FriendsViewProps {
  onOpenDm: (userId: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onOpenDm }) => {
  const {
    friendships,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
  } = useFriend();

  const { joinVoiceChannel } = useVoice();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('ONLINE');
  const [friendUsernameInput, setFriendUsernameInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter friendships
  const acceptedFriends = friendships.filter(f => f.status === 'ACCEPTED');
  const pendingRequests = friendships.filter(f => f.status === 'PENDING');
  const onlineFriends = acceptedFriends.filter(f => f.friend.presence_status !== 'offline');

  const getDisplayedList = () => {
    let list = acceptedFriends;
    if (activeTab === 'ONLINE') list = onlineFriends;
    if (activeTab === 'PENDING') list = pendingRequests;

    if (searchFilter.trim()) {
      list = list.filter(f =>
        f.friend.display_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        f.friend.username.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    return list;
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendUsernameInput.trim()) return;

    setIsSubmitting(true);
    const res = await sendFriendRequest(friendUsernameInput);
    setIsSubmitting(false);

    if (res.success) {
      showToast('success', 'Solicitação Enviada!', res.message);
      setFriendUsernameInput('');
      setActiveTab('PENDING');
    } else {
      showToast('error', 'Não foi possível enviar', res.message);
    }
  };

  const handleStartCall = (friend: typeof acceptedFriends[0]['friend']) => {
    joinVoiceChannel(`call_${friend.id}`, `Chamada Direta com ${friend.display_name}`, 'Nexus Privado');
    showToast('info', 'Iniciando Chamada...', `Conectando com ${friend.display_name}`);
  };

  return (
    <div className="flex-1 bg-nexus-950 flex flex-col h-full overflow-hidden select-none">
      {/* Friends Top Navigation Bar */}
      <header className="h-14 border-b border-white/[0.04] px-6 flex items-center justify-between shrink-0 bg-nexus-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Users className="w-5 h-5 text-nexus-accent" />
            <span>Amigos</span>
          </div>

          <div className="w-[1px] h-4 bg-white/10" />

          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('ONLINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ONLINE'
                  ? 'bg-nexus-850 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-nexus-900'
              }`}
            >
              Disponível ({onlineFriends.length})
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-nexus-850 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-nexus-900'
              }`}
            >
              Todos ({acceptedFriends.length})
            </button>

            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'PENDING'
                  ? 'bg-nexus-850 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-nexus-900'
              }`}
            >
              Pendentes
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 bg-nexus-accent text-nexus-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ADD_FRIEND')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ADD_FRIEND'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              Adicionar Amigo
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {activeTab === 'ADD_FRIEND' ? (
          /* Add Friend Form */
          <div className="max-w-2xl">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-1">
              Adicionar Amigo no Nexus
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Você pode adicionar amigos usando o nome de usuário único deles (ex: <code className="text-nexus-accent bg-nexus-900 px-1 py-0.5 rounded">elena_code</code>).
            </p>

            <form onSubmit={handleSendRequest} className="relative flex items-center">
              <input
                type="text"
                value={friendUsernameInput}
                onChange={(e) => setFriendUsernameInput(e.target.value)}
                placeholder="Insira o nome de usuário de um amigo..."
                className="w-full bg-nexus-900 border border-white/10 focus:border-nexus-accent rounded-2xl py-3 pl-4 pr-36 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!friendUsernameInput.trim() || isSubmitting}
                className={`absolute right-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  friendUsernameInput.trim()
                    ? 'bg-nexus-accent text-nexus-950 hover:bg-nexus-accentHover shadow-md'
                    : 'bg-nexus-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Pedido'}
              </button>
            </form>

            <div className="mt-10 p-6 rounded-2xl bg-nexus-900/40 border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-nexus-850 flex items-center justify-center text-nexus-purple shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Dica de Amigos</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Experimente adicionar os perfis de demonstração: <strong className="text-slate-200">elena_code</strong>, <strong className="text-slate-200">lucas_dev</strong>, ou <strong className="text-slate-200">cyber_fox</strong>.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Friends List View */
          <div className="max-w-4xl space-y-4">
            {/* Search filter input */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar amigos..."
                className="w-full pl-10 pr-4 py-2 bg-nexus-900 border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/20 transition-all"
              />
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {activeTab === 'ONLINE' && `Disponíveis — ${getDisplayedList().length}`}
              {activeTab === 'ALL' && `Todos os Amigos — ${getDisplayedList().length}`}
              {activeTab === 'PENDING' && `Solicitações Pendentes — ${getDisplayedList().length}`}
            </div>

            {getDisplayedList().length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-nexus-900 flex items-center justify-center mx-auto mb-3 text-slate-500">
                  <Users className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300">Nenhum amigo encontrado</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Ninguém está nesta lista no momento. Que tal convidar amigos?
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {getDisplayedList().map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-nexus-900 border border-transparent hover:border-white/5 transition-all"
                  >
                    <div
                      onClick={() => onOpenDm(item.friend.id)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <Avatar
                        src={item.friend.avatar_url}
                        name={item.friend.display_name}
                        status={item.friend.presence_status}
                        size="md"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-xs text-white truncate">
                            {item.friend.display_name}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate">
                            @{item.friend.username}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.friend.custom_status || item.friend.status_text || 'Sem recado'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {activeTab === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => acceptFriendRequest(item.id)}
                            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                            title="Aceitar Pedido"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => rejectFriendRequest(item.id)}
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                            title="Recusar Pedido"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onOpenDm(item.friend.id)}
                            className="p-2 rounded-xl bg-nexus-850 text-slate-300 hover:text-nexus-accent hover:bg-nexus-800 transition-colors"
                            title="Enviar Mensagem Direta"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleStartCall(item.friend)}
                            className="p-2 rounded-xl bg-nexus-850 text-slate-300 hover:text-emerald-400 hover:bg-nexus-800 transition-colors"
                            title="Iniciar Chamada de Voz"
                          >
                            <Phone className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => removeFriend(item.id)}
                            className="p-2 rounded-xl bg-nexus-850 text-slate-400 hover:text-rose-400 hover:bg-nexus-800 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remover Amigo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
