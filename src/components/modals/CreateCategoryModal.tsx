import React, { useState } from 'react';
import { useServer } from '../../contexts/ServerContext';
import { useToast } from '../ui/Toast';
import { X, FolderPlus } from 'lucide-react';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({ isOpen, onClose }) => {
  const { createCategory } = useServer();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const cat = await createCategory(name.trim());
      showToast('success', 'Categoria Criada!', cat.name);
      onClose();
    } catch (err) {
      showToast('error', 'Erro ao criar categoria', 'Tente novamente.');
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
              <FolderPlus className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Criar Categoria</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome da Categoria <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: PROJETOS, JOGOS, COMUNIDADE"
              className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all uppercase"
              autoFocus
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
              {isSubmitting ? 'Criando...' : 'Criar Categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
