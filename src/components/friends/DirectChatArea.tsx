import React, { useRef, useEffect } from 'react';
import { useFriend } from '../../contexts/FriendContext';
import { useVoice } from '../../contexts/VoiceContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { MessageInput } from '../chat/MessageInput';
import { Phone, Video, MoreVertical, MessageSquare } from 'lucide-react';
import { useToast } from '../ui/Toast';

export const DirectChatArea: React.FC = () => {
  const { activeDmUser, currentDmMessages, sendDirectMessage } = useFriend();
  const { joinVoiceChannel, toggleCamera } = useVoice();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentDmMessages, activeDmUser?.id]);

  if (!activeDmUser) {
    return (
      <div className="flex-1 bg-nexus-950 flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="w-16 h-16 rounded-2xl bg-nexus-900 flex items-center justify-center mb-3 text-slate-500">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-slate-200">Nenhuma conversa selecionada</h3>
        <p className="text-xs text-slate-500 mt-1">Selecione um amigo para começar a conversar.</p>
      </div>
    );
  }

  const handleStartAudioCall = () => {
    joinVoiceChannel(`dm_call_${activeDmUser.id}`, `Chamada de Voz com ${activeDmUser.display_name}`, 'Mensagens Diretas');
    showToast('info', 'Iniciando Chamada de Voz...', `Chamando @${activeDmUser.username}`);
  };

  const handleStartVideoCall = async () => {
    await joinVoiceChannel(`dm_call_${activeDmUser.id}`, `Vídeo Chamada com ${activeDmUser.display_name}`, 'Mensagens Diretas');
    await toggleCamera();
    showToast('info', 'Iniciando Chamada com Vídeo...', `Chamando @${activeDmUser.username}`);
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 bg-nexus-950 flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <header className="h-14 border-b border-white/[0.04] px-6 flex items-center justify-between shrink-0 bg-nexus-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={activeDmUser.avatar_url}
            name={activeDmUser.display_name}
            status={activeDmUser.presence_status}
            size="sm"
          />
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-white truncate">
              {activeDmUser.display_name}
            </h2>
            <span className="text-[11px] text-slate-400 truncate block">
              @{activeDmUser.username}
            </span>
          </div>
        </div>

        {/* Direct Call action buttons */}
        <div className="flex items-center gap-2 text-slate-300">
          <button
            onClick={handleStartAudioCall}
            className="p-2 rounded-xl bg-nexus-900 hover:bg-nexus-850 hover:text-emerald-400 transition-colors"
            title="Iniciar Chamada de Voz"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={handleStartVideoCall}
            className="p-2 rounded-xl bg-nexus-900 hover:bg-nexus-850 hover:text-nexus-accent transition-colors"
            title="Iniciar Vídeo Chamada"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
        {/* User DM Header Card */}
        <div className="p-6 mb-4 rounded-2xl bg-nexus-900/40 border border-white/5 text-left">
          <Avatar
            src={activeDmUser.avatar_url}
            name={activeDmUser.display_name}
            size="xl"
            status={activeDmUser.presence_status}
            className="mb-3"
          />
          <h2 className="text-xl font-bold text-white">{activeDmUser.display_name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">@{activeDmUser.username}</p>
          {activeDmUser.bio && (
            <p className="text-xs text-slate-300 mt-2 bg-nexus-950/60 p-3 rounded-xl border border-white/5">
              {activeDmUser.bio}
            </p>
          )}
          <p className="text-[11px] text-slate-500 mt-3">
            Este é o começo do seu histórico de mensagens diretas com <strong>{activeDmUser.display_name}</strong>.
          </p>
        </div>

        {/* Message Items */}
        {currentDmMessages.map((dm) => {
          const isMine = dm.sender_id === currentUser?.id;
          return (
            <div key={dm.id} className={`flex items-start gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
              <Avatar
                src={dm.sender.avatar_url}
                name={dm.sender.display_name}
                size="sm"
                showStatus={false}
              />
              <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[11px] font-bold text-slate-300">
                    {dm.sender.display_name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatTime(dm.created_at)}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMine
                      ? 'bg-nexus-accent text-nexus-950 font-medium rounded-tr-sm'
                      : 'bg-nexus-850 text-slate-200 rounded-tl-sm border border-white/5'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{dm.content}</p>

                  {dm.attachments && dm.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {dm.attachments.map(att => (
                        <img
                          key={att.id}
                          src={att.url}
                          alt={att.name}
                          className="rounded-xl max-h-48 object-cover cursor-pointer"
                          onClick={() => window.open(att.url, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <MessageInput
        placeholder={`Enviar mensagem para @${activeDmUser.username}...`}
        onSendMessage={(content, attachments) => {
          sendDirectMessage(activeDmUser.id, content, attachments);
        }}
      />
    </div>
  );
};
