import React, { useState } from 'react';
import { useServer } from '../../contexts/ServerContext';
import { useVoice } from '../../contexts/VoiceContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Hash,
  Volume2,
  ChevronDown,
  Plus,
  Settings,
  UserPlus,
  LogOut,
  FolderPlus,
  MicOff,
  Video,
  Monitor,
  PhoneOff,
  Radio
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Channel } from '../../types';

interface ChannelSidebarProps {
  onOpenCreateChannel: (categoryId?: string) => void;
  onOpenCreateCategory: () => void;
  onOpenServerSettings: () => void;
  onOpenInvite: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  onOpenCreateChannel,
  onOpenCreateCategory,
  onOpenServerSettings,
  onOpenInvite,
}) => {
  const { activeServer, categories, channels, activeChannelId, setActiveChannelId } = useServer();
  const {
    activeVoiceChannelId,
    activeVoiceChannelName,
    isInVoice,
    leaveVoiceChannel,
    joinVoiceChannel,
    getChannelParticipants,
    participants,
    isSpeaking
  } = useVoice();
  const { currentUser } = useAuth();

  const [showServerMenu, setShowServerMenu] = useState<boolean>(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  if (!activeServer) return null;

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleChannelClick = (channel: Channel) => {
    setActiveChannelId(channel.id);
    if (channel.type === 'VOICE') {
      joinVoiceChannel(channel.id, channel.name, activeServer.name);
    }
  };

  const isOwner = currentUser?.id === activeServer.owner_id;

  // Uncategorized channels
  const uncategorizedChannels = channels.filter(c => !c.category_id);

  return (
    <div className="w-60 bg-nexus-900/90 flex flex-col h-full select-none border-r border-white/[0.04] relative">
      {/* Server Header Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowServerMenu(!showServerMenu)}
          className="w-full h-14 px-4 flex items-center justify-between border-b border-white/[0.04] hover:bg-nexus-850/60 transition-colors group"
        >
          <span className="font-bold text-sm text-slate-100 truncate group-hover:text-nexus-accent transition-colors">
            {activeServer.name}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 group-hover:text-white transition-transform duration-200 ${
              showServerMenu ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Server Dropdown Popover */}
        {showServerMenu && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowServerMenu(false)}
            />
            <div className="absolute top-14 left-2 right-2 bg-nexus-900 border border-white/10 rounded-xl shadow-2xl p-1.5 z-40 animate-slide-up backdrop-blur-xl">
              <button
                onClick={() => {
                  setShowServerMenu(false);
                  onOpenInvite();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-nexus-accent hover:bg-nexus-accent/10 transition-colors"
              >
                <span>Convidar Pessoas</span>
                <UserPlus className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setShowServerMenu(false);
                  onOpenCreateChannel();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-nexus-800 transition-colors"
              >
                <span>Criar Canal</span>
                <Plus className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setShowServerMenu(false);
                  onOpenCreateCategory();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-nexus-800 transition-colors"
              >
                <span>Criar Categoria</span>
                <FolderPlus className="w-4 h-4" />
              </button>

              <div className="h-[1px] bg-white/5 my-1" />

              <button
                onClick={() => {
                  setShowServerMenu(false);
                  onOpenServerSettings();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-nexus-800 transition-colors"
              >
                <span>Configurações do Servidor</span>
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
        {/* Uncategorized Channels if any */}
        {uncategorizedChannels.length > 0 && (
          <div className="space-y-0.5">
            {uncategorizedChannels.map(channel => renderChannelItem(channel))}
          </div>
        )}

        {/* Categories and their channels */}
        {categories.map((cat) => {
          const catChannels = channels.filter(c => c.category_id === cat.id);
          const isCollapsed = collapsedCategories[cat.id];

          return (
            <div key={cat.id} className="space-y-0.5">
              {/* Category Header */}
              <div className="group flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="flex items-center gap-1 min-w-0 flex-1 text-left"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                  <span className="truncate">{cat.name}</span>
                </button>

                <button
                  onClick={() => onOpenCreateChannel(cat.id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-white p-0.5 rounded transition-opacity"
                  title="Criar Canal nesta Categoria"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Category Channels */}
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {catChannels.map(channel => renderChannelItem(channel))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Connected Voice Banner (if currently in voice channel) */}
      {isInVoice && (
        <div className="bg-nexus-950/90 border-t border-emerald-500/20 p-2.5 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Voz Conectada</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {activeVoiceChannelName} / {activeServer.name}
            </p>
          </div>

          <button
            onClick={leaveVoiceChannel}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-2"
            title="Desconectar da Chamada"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  function renderChannelItem(channel: Channel) {
    const isText = channel.type === 'TEXT';
    const isSelectedText = isText && activeChannelId === channel.id;
    const isCurrentVoice = !isText && activeVoiceChannelId === channel.id;

    // If it's a voice channel, check participants in it
    const channelParticipants = !isText ? getChannelParticipants(channel.id) : [];

    return (
      <div key={channel.id} className="space-y-1">
        <button
          onClick={() => handleChannelClick(channel)}
          className={`w-full group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isSelectedText
              ? 'bg-nexus-750 text-white font-semibold shadow-sm'
              : isCurrentVoice
              ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
              : 'text-slate-300 hover:bg-nexus-850/80 hover:text-slate-100'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isText ? (
              <Hash className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-200" />
            ) : (
              <Volume2 className="w-4 h-4 shrink-0 text-emerald-400 group-hover:text-emerald-300" />
            )}
            <span className="truncate">{channel.name}</span>
          </div>

          {!isText && isCurrentVoice && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>

        {/* Live connected users under active voice channel */}
        {!isText && channelParticipants.length > 0 && (
          <div className="pl-6 pr-2 space-y-1 py-1">
            {channelParticipants.map(participant => (
              <div
                key={participant.id}
                className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-nexus-850/40"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar
                    src={participant.profile.avatar_url}
                    name={participant.profile.display_name}
                    size="xs"
                    isSpeaking={participant.is_speaking}
                    showStatus={false}
                  />
                  <span className="truncate text-slate-300 text-[11px]">
                    {participant.profile.display_name}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400 shrink-0">
                  {participant.is_muted && <MicOff className="w-3 h-3 text-rose-400" />}
                  {participant.is_camera_on && <Video className="w-3 h-3 text-nexus-accent" />}
                  {participant.is_screen_sharing && <Monitor className="w-3 h-3 text-emerald-400" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
};
