import React, { useState } from 'react';
import { useServer } from '../../contexts/ServerContext';
import { useFriend } from '../../contexts/FriendContext';
import { MessageSquare, Plus, Compass, Sparkles } from 'lucide-react';

interface ServerSidebarProps {
  onOpenCreateServer: () => void;
  onOpenJoinServer: () => void;
}

export const ServerSidebar: React.FC<ServerSidebarProps> = ({
  onOpenCreateServer,
  onOpenJoinServer,
}) => {
  const { servers, activeServerId, setActiveServerId } = useServer();
  const { unreadDmCounts } = useFriend();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalUnreadDms = Object.values(unreadDmCounts).reduce((a, b) => a + b, 0);

  return (
    <aside className="w-[72px] shrink-0 bg-nexus-950/95 flex flex-col items-center py-3 select-none z-30 border-r border-white/[0.04]">
      {/* Home / DMs Button */}
      <div className="relative group flex items-center justify-center w-full my-1">
        {/* Active Pill Indicator */}
        <div
          className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
            activeServerId === null
              ? 'h-10'
              : hoveredId === 'home'
              ? 'h-5'
              : 'h-0'
          }`}
        />

        <button
          onClick={() => setActiveServerId(null)}
          onMouseEnter={() => setHoveredId('home')}
          onMouseLeave={() => setHoveredId(null)}
          className={`relative w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-300 ${
            activeServerId === null
              ? 'bg-nexus-accent text-nexus-950 rounded-[16px] shadow-[0_0_20px_rgba(56,189,248,0.4)]'
              : 'bg-nexus-850 text-slate-300 hover:bg-nexus-accent hover:text-nexus-950'
          }`}
          title="Mensagens Diretas e Amigos"
        >
          <Sparkles className="w-6 h-6" />
          
          {totalUnreadDms > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-nexus-950 animate-bounce">
              {totalUnreadDms}
            </span>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="w-8 h-[2px] bg-nexus-800 my-2 rounded-full" />

      {/* Server List */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-2 py-1 scrollbar-none">
        {servers.map((server) => {
          const isActive = activeServerId === server.id;
          const isHovered = hoveredId === server.id;

          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full">
              {/* Active Pill Indicator */}
              <div
                className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
                  isActive ? 'h-10' : isHovered ? 'h-5' : 'h-0'
                }`}
              />

              <button
                onClick={() => setActiveServerId(server.id)}
                onMouseEnter={() => setHoveredId(server.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative w-12 h-12 overflow-hidden flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'rounded-[16px] ring-2 ring-nexus-accent shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                    : 'rounded-[24px] hover:rounded-[16px] bg-nexus-850 hover:bg-nexus-750 text-slate-200'
                }`}
                title={server.name}
              >
                {server.icon_url ? (
                  <img
                    src={server.icon_url}
                    alt={server.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-sm tracking-wider">
                    {server.name
                      .split(' ')
                      .map(w => w[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* Add Server Button */}
        <div className="relative group flex items-center justify-center w-full mt-1">
          <button
            onClick={onOpenCreateServer}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-nexus-850 hover:bg-emerald-500 text-emerald-400 hover:text-white flex items-center justify-center transition-all duration-300 group shadow-lg"
            title="Criar um Servidor"
          >
            <Plus className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* Join Server by Invite Button */}
        <div className="relative group flex items-center justify-center w-full mt-1">
          <button
            onClick={onOpenJoinServer}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-nexus-850 hover:bg-nexus-purple text-nexus-purple hover:text-white flex items-center justify-center transition-all duration-300 group shadow-lg"
            title="Entrar com Código de Convite"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
