import React, { useState } from 'react';
import { useServer } from '../../contexts/ServerContext';
import { useToast } from '../ui/Toast';
import { ChannelType } from '../../types';
import { X, Hash, Volume2, Plus } from 'lucide-react';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  defaultCategoryId,
}) => {
  const { createChannel, categories } = useServer();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState<ChannelType>('TEXT');
  const [categoryId, setCategoryId] = useState<string>(defaultCategoryId || '');
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const channel = await createChannel(
        name.trim(),
        type,
        categoryId || defaultCategoryId || undefined,
        topic.trim()
      );
      showToast('success', 'Canal Criado!', `#${channel.name}`);
      onClose();
    } catch (err) {
      showToast('error', 'Erro ao criar canal', 'Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-nexus-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 z-10 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-nexus-accent/20 text-nexus-accent flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Criar Canal</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Tipo de Canal
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('TEXT')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  type === 'TEXT'
                    ? 'bg-nexus-850 border-nexus-accent shadow-md text-white'
                    : 'bg-nexus-950/60 border-white/5 text-slate-400 hover:border-white/10'
                }`}
              >
                <Hash className="w-5 h-5 text-nexus-accent shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-xs">Texto</div>
                  <div className="text-[10px] text-slate-400">Mensagens, imagens, emojis</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('VOICE')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  type === 'VOICE'
                    ? 'bg-nexus-850 border-emerald-400 shadow-md text-white'
                    : 'bg-nexus-950/60 border-white/5 text-slate-400 hover:border-white/10'
                }`}
              >
                <Volume2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-xs">Voz & Vídeo</div>
                  <div className="text-[10px] text-slate-400">Chamadas e telas</div>
                </div>
              </button>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome do Canal <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                {type === 'TEXT' ? '#' : '🔊'}
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="novo-canal"
                className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl py-3 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Category Selector */}
          {categories.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Categoria (Opcional)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl p-3 text-xs text-white focus:outline-none transition-all"
              >
                <option value="">Sem categoria</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Topic for text channel */}
          {type === 'TEXT' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Tópico do Canal (Opcional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Discussão de funcionalidades e dúvidas"
                className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-nexus-850 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-nexus-accent text-nexus-950 hover:bg-nexus-accentHover transition-colors shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Criando...' : 'Criar Canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
