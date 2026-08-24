import React, { useState, useRef } from 'react';
import { useServer } from '../../contexts/ServerContext';
import { useToast } from '../ui/Toast';
import { X, Sparkles, Upload, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({ isOpen, onClose }) => {
  const { createServer } = useServer();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Arquivo Inválido', 'Selecione uma imagem (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Imagem muito grande', 'Selecione uma imagem com menos de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setIconUrl(result);
        showToast('success', 'Ícone Carregado!', 'Imagem pronta para o seu servidor.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const newServer = await createServer(name.trim(), iconUrl.trim(), description.trim());
      showToast('success', 'Servidor Criado!', `Bem-vindo ao ${newServer.name}`);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      onClose();
    } catch (err) {
      showToast('error', 'Erro ao criar servidor', 'Tente novamente.');
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
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Criar um Servidor</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-5">
          Seu servidor é onde você e seus amigos se reúnem para conversar por texto, voz e vídeo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome do Servidor <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sala dos Devs, Gamer Squad"
              className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Ícone do Servidor
            </label>

            <div className="flex items-center gap-3 mb-2">
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt="Preview"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-nexus-accent shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-nexus-950 border border-white/10 flex items-center justify-center text-slate-500">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-nexus-850 hover:bg-nexus-800 text-white font-semibold text-xs border border-white/5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-nexus-accent" />
                  <span>Escolher do Computador</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Descrição (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o que é este servidor?"
              className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all resize-none"
            />
          </div>

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
              {isSubmitting ? 'Criando...' : 'Criar Servidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
