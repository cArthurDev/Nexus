import React, { useState } from 'react';
import { Message, MessageAttachment } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Smile, Reply, Edit2, Trash2, Check, X, CornerDownRight } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { useAuth } from '../../contexts/AuthContext';

interface MessageItemProps {
  message: Message;
  isCompact?: boolean;
  onReply: (message: Message) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCompact = false,
  onReply,
  onEdit,
  onDelete,
  onReact,
}) => {
  const { currentUser } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isAuthor = currentUser?.id === message.author_id;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  // Render markdown bold, italics, code
  const renderFormattedContent = (content: string) => {
    // Simple inline formatting parser
    const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-slate-200">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-nexus-950 px-1.5 py-0.5 rounded text-nexus-accent text-xs font-mono">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!showEmojiPicker) setShowEmojiPicker(false);
      }}
      className={`group relative flex flex-col px-4 py-1.5 hover:bg-nexus-850/40 transition-colors rounded-lg my-0.5 ${
        isEditing ? 'bg-nexus-850/60' : ''
      }`}
    >
      {/* Reply Banner preview */}
      {message.reply_to && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 pl-6">
          <CornerDownRight className="w-3 h-3 text-slate-500" />
          <span className="font-semibold text-slate-300">@{message.reply_to.author_name}</span>
          <span className="truncate italic text-slate-400 max-w-md">{message.reply_to.content}</span>
        </div>
      )}

      <div className="flex items-start gap-3.5">
        {/* Author Avatar */}
        <Avatar
          src={message.author.avatar_url}
          name={message.author.display_name}
          status={message.author.presence_status}
          size="md"
        />

        {/* Message body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-xs text-white hover:underline cursor-pointer">
              {message.author.display_name}
            </span>
            <span className="text-[10px] text-slate-400">
              {formatTime(message.created_at)}
            </span>
            {message.is_edited && (
              <span className="text-[10px] text-slate-400 italic">(editado)</span>
            )}
          </div>

          {/* Content or Edit Input */}
          {isEditing ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-3 py-1.5 bg-nexus-950 border border-nexus-accent rounded-lg text-xs text-white focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                title="Salvar (Enter)"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-slate-400 hover:bg-white/10 rounded"
                title="Cancelar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap break-words selectable-text">
              {renderFormattedContent(message.content)}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.attachments.map(att => (
                <div key={att.id} className="relative rounded-xl overflow-hidden border border-white/10 max-w-sm">
                  {att.type === 'image' && (
                    <img
                      src={att.url}
                      alt={att.name}
                      className="max-h-64 object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => window.open(att.url, '_blank')}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {message.reactions.map((reaction, rIdx) => {
                const hasReacted = currentUser && reaction.users.includes(currentUser.id);
                return (
                  <button
                    key={`${reaction.emoji}-${rIdx}`}
                    onClick={() => onReact(message.id, reaction.emoji)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold border transition-all ${
                      hasReacted
                        ? 'bg-nexus-accent/15 border-nexus-accent/40 text-nexus-accent'
                        : 'bg-nexus-850 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <span>{reaction.emoji}</span>
                    <span>{reaction.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar on hover */}
      {isHovered && !isEditing && (
        <div className="absolute -top-3.5 right-4 bg-nexus-900 border border-white/10 rounded-xl shadow-xl flex items-center p-0.5 gap-0.5 z-20 animate-fade-in">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-nexus-800 rounded-lg transition-colors"
              title="Adicionar Reação"
            >
              <Smile className="w-4 h-4" />
            </button>

            {showEmojiPicker && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div className="absolute right-0 bottom-8 z-40">
                  <EmojiPicker
                    onSelectEmoji={(emoji) => {
                      onReact(message.id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => onReply(message)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-nexus-800 rounded-lg transition-colors"
            title="Responder"
          >
            <Reply className="w-4 h-4" />
          </button>

          {isAuthor && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-nexus-800 rounded-lg transition-colors"
              title="Editar Mensagem"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {isAuthor && (
            <button
              onClick={() => onDelete(message.id)}
              className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Excluir Mensagem"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
