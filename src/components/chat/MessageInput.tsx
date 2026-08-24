import React, { useState, useRef } from 'react';
import { Message, MessageAttachment } from '../../types';
import { PlusCircle, Smile, Send, X, Image as ImageIcon } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  placeholder?: string;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  onSendMessage: (content: string, attachments?: MessageAttachment[]) => void;
  onTyping?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  placeholder = 'Conversar no canal...',
  replyingTo,
  onCancelReply,
  onSendMessage,
  onTyping,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!content.trim() && attachments.length === 0) return;
    onSendMessage(content.trim(), attachments);
    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (onTyping) {
      onTyping();
    }
    // Auto adjust height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const isImg = file.type.startsWith('image/');
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const url = uploadEvent.target?.result as string;
        const newAttachment: MessageAttachment = {
          id: `att_${Date.now()}_${Math.random()}`,
          name: file.name,
          url,
          type: isImg ? 'image' : 'file',
          size: file.size,
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSelectEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="relative p-4 pt-1 bg-nexus-900/40">
      {/* Replying Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-nexus-850 px-3 py-1.5 rounded-t-xl border border-b-0 border-white/5 text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span>Respondendo a</span>
            <span className="font-bold text-nexus-accent">@{replyingTo.author.display_name}</span>
            <span className="italic text-slate-400 truncate max-w-xs">{replyingTo.content}</span>
          </div>
          <button
            onClick={onCancelReply}
            className="text-slate-400 hover:text-white p-0.5 rounded"
            title="Cancelar Resposta"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Box */}
      <div className={`bg-nexus-850 border border-white/[0.06] focus-within:border-nexus-accent/50 transition-all ${
        replyingTo ? 'rounded-b-2xl' : 'rounded-2xl'
      } p-2 shadow-lg flex flex-col`}>
        
        {/* Attachment preview pills */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border-b border-white/5 mb-1">
            {attachments.map(att => (
              <div key={att.id} className="relative group bg-nexus-900 border border-white/10 rounded-xl p-1 overflow-hidden">
                {att.type === 'image' ? (
                  <img src={att.url} alt={att.name} className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="flex items-center gap-1.5 p-2 text-xs text-slate-300">
                    <ImageIcon className="w-4 h-4 text-nexus-accent" />
                    <span className="truncate max-w-[100px]">{att.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 hover:scale-110 transition-transform shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 px-1">
          {/* File Upload Trigger */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-slate-400 hover:text-nexus-accent hover:bg-white/5 rounded-xl transition-colors shrink-0"
            title="Anexar imagem ou arquivo"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            className="hidden"
          />

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 resize-none focus:outline-none py-2 max-h-36 scrollbar-thin"
          />

          {/* Emoji Trigger */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-colors"
              title="Adicionar Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div className="absolute right-0 bottom-12 z-40">
                  <EmojiPicker
                    onSelectEmoji={handleSelectEmoji}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!content.trim() && attachments.length === 0}
            className={`p-2 rounded-xl transition-all shrink-0 ${
              content.trim() || attachments.length > 0
                ? 'bg-nexus-accent text-nexus-950 hover:bg-nexus-accentHover shadow-md'
                : 'text-slate-500 cursor-not-allowed opacity-50'
            }`}
            title="Enviar Mensagem (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
