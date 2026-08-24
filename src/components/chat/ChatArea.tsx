import React, { useState, useRef, useEffect } from 'react';
import { useServer } from '../../contexts/ServerContext';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { Message } from '../../types';
import { Hash, Users, Search, Bell, Sparkles, MessageSquare } from 'lucide-react';

interface ChatAreaProps {
  onToggleMembers: () => void;
  showMembers: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onToggleMembers, showMembers }) => {
  const {
    activeServer,
    activeChannel,
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    typingUsers,
    sendTypingSignal
  } = useServer();

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChannel?.id]);

  if (!activeChannel) {
    return (
      <div className="flex-1 bg-nexus-950 flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="w-16 h-16 rounded-2xl bg-nexus-900 border border-white/5 flex items-center justify-center mb-4 text-slate-500">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">Nenhum Canal Selecionado</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Escolha um canal de texto na barra lateral para começar a conversar ou crie um novo.
        </p>
      </div>
    );
  }

  const filteredMessages = messages.filter(m => 
    searchTerm ? m.content.toLowerCase().includes(searchTerm.toLowerCase()) || m.author.display_name.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  return (
    <div className="flex-1 bg-nexus-950 flex flex-col h-full overflow-hidden relative">
      {/* Channel Header */}
      <header className="h-14 border-b border-white/[0.04] px-4 flex items-center justify-between shrink-0 bg-nexus-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <Hash className="w-5 h-5 text-slate-400 shrink-0" />
          <span className="font-bold text-sm text-white tracking-wide truncate">
            {activeChannel.name}
          </span>
          {activeChannel.topic && (
            <>
              <div className="w-[1px] h-4 bg-white/10 mx-1 hidden sm:block shrink-0" />
              <span className="text-xs text-slate-400 truncate hidden sm:block font-normal">
                {activeChannel.topic}
              </span>
            </>
          )}
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2 text-slate-400">
          {/* Search Box */}
          {showSearch ? (
            <div className="relative flex items-center animate-fade-in">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar mensagens..."
                className="w-44 px-2.5 py-1 bg-nexus-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-nexus-accent"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm('');
                }}
                className="ml-1 text-xs text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-lg hover:bg-nexus-850 hover:text-white transition-colors"
              title="Buscar Mensagens"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleMembers}
            className={`p-2 rounded-lg transition-colors ${
              showMembers ? 'bg-nexus-850 text-white' : 'hover:bg-nexus-850 hover:text-white'
            }`}
            title="Alternar Lista de Membros"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-thin">
        {/* Welcome banner at the top of the channel */}
        <div className="p-6 mb-6 rounded-2xl bg-gradient-to-b from-nexus-900/60 to-transparent border border-white/[0.04] text-left">
          <div className="w-12 h-12 rounded-2xl bg-nexus-850 flex items-center justify-center text-nexus-accent mb-3 shadow-inner">
            <Hash className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Bem-vindo a #{activeChannel.name}!
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Este é o início do canal #{activeChannel.name}. Envie uma mensagem ou convide amigos para começar a conversar.
          </p>
        </div>

        {/* Message Items */}
        {filteredMessages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onReply={(m) => setReplyingTo(m)}
            onEdit={editMessage}
            onDelete={deleteMessage}
            onReact={addReaction}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-1 text-[11px] text-slate-400 flex items-center gap-1.5 animate-pulse">
          <span className="font-semibold text-slate-300">
            {typingUsers.map(u => u.display_name).join(', ')}
          </span>
          <span>{typingUsers.length === 1 ? 'está digitando...' : 'estão digitando...'}</span>
        </div>
      )}

      {/* Message Input Box */}
      <MessageInput
        placeholder={`Conversar em #${activeChannel.name}...`}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSendMessage={(content, attachments) => {
          sendMessage(content, attachments, replyingTo?.id);
          setReplyingTo(null);
        }}
        onTyping={sendTypingSignal}
      />
    </div>
  );
};
