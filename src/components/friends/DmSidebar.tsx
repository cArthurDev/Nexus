import React from 'react';
import { useFriend } from '../../contexts/FriendContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Users, Plus, X, MessageSquare } from 'lucide-react';

interface DmSidebarProps {
  onSelectFriendsTab: () => void;
  isFriendsTabActive: boolean;
}

export const DmSidebar: React.FC<DmSidebarProps> = ({
  onSelectFriendsTab,
  isFriendsTabActive,
}) => {
  const { friendships, activeDmUserId, setActiveDmUserId, unreadDmCounts } = useFriend();
  const { allUsers } = useAuth();

  const acceptedFriends = friendships.filter(f => f.status === 'ACCEPTED');

  return (
    <div className="w-60 bg-nexus-900/90 flex flex-col h-full select-none border-r border-white/[0.04]">
      {/* Header button: Friends */}
      <div className="p-3 border-b border-white/[0.04]">
        <button
          onClick={onSelectFriendsTab}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            isFriendsTabActive
              ? 'bg-nexus-750 text-white shadow-md'
              : 'text-slate-300 hover:bg-nexus-850 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-nexus-accent" />
          <span>Amigos</span>
        </button>
      </div>

      {/* Direct Messages Section */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin">
        <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          <span>Mensagens Diretas</span>
          <button
            onClick={onSelectFriendsTab}
            className="hover:text-white p-0.5 rounded"
            title="Nova Mensagem Direta"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {acceptedFriends.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-500">
            Adicione amigos para iniciar conversas privadas.
          </div>
        ) : (
          acceptedFriends.map(f => {
            const isSelected = !isFriendsTabActive && activeDmUserId === f.friend.id;
            const unread = unreadDmCounts[f.friend.id] || 0;

            return (
              <button
                key={f.friend.id}
                onClick={() => setActiveDmUserId(f.friend.id)}
                className={`w-full group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                  isSelected
                    ? 'bg-nexus-750 text-white font-semibold'
                    : 'text-slate-300 hover:bg-nexus-850 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={f.friend.avatar_url}
                    name={f.friend.display_name}
                    status={f.friend.presence_status}
                    size="sm"
                  />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="font-semibold text-xs truncate">
                      {f.friend.display_name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      @{f.friend.username}
                    </span>
                  </div>
                </div>

                {unread > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {unread}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
