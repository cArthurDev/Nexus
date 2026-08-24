import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { Avatar } from '../ui/Avatar';
import {
  X,
  User,
  LogOut,
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const { currentUser, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [statusText, setStatusText] = useState(currentUser?.status_text || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.custom_status || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Arquivo Inválido', 'Selecione um arquivo de imagem (PNG, JPG, GIF, WebP).');
      return;
    }

    // Limit to 5MB for base64 / storage
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Imagem muito grande', 'Selecione uma imagem com menos de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        showToast('success', 'Foto Carregada!', 'Clique em Salvar Alterações para confirmar.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim() || currentUser.display_name,
        avatar_url: avatarUrl.trim() || currentUser.avatar_url,
        status_text: statusText.trim(),
        custom_status: customStatus.trim(),
        bio: bio.trim(),
      });
      showToast('success', 'Perfil Atualizado!', 'Suas alterações foram salvas com sucesso.');
      onClose();
    } catch (err) {
      showToast('error', 'Erro ao salvar', 'Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    onOpenAuth();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-nexus-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-nexus-accent/20 text-nexus-accent flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Configurações de Usuário</h2>
              <span className="text-xs text-slate-400">Personalize seu perfil e preferências</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Avatar & Display Section with Direct Upload */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-2xl bg-nexus-950/60 border border-white/5">
            {/* Clickable Avatar with Camera Overlay */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden self-center sm:self-auto shrink-0 shadow-xl"
              title="Clique para escolher uma foto do seu computador"
            >
              <Avatar
                src={avatarUrl || currentUser.avatar_url}
                name={displayName || currentUser.display_name}
                status={currentUser.presence_status}
                size="2xl"
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Alterar</span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left">
              <h3 className="font-bold text-lg text-white truncate">
                {displayName || currentUser.display_name}
              </h3>
              <p className="text-xs text-slate-400 truncate mb-3">@{currentUser.username}</p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-nexus-accent text-nexus-950 hover:bg-nexus-accentHover font-bold text-xs shadow-md transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Fazer Upload de Foto</span>
                </button>

                {avatarUrl && avatarUrl !== currentUser.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(currentUser.avatar_url)}
                    className="px-3 py-2 rounded-xl bg-nexus-850 hover:bg-nexus-800 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Restaurar Original
                  </button>
                )}
              </div>
            </div>
          </div>

          <form id="profile-form" onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl p-3 text-xs text-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nome de Usuário (@username)
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`@${currentUser.username}`}
                  className="w-full bg-nexus-950/50 border border-white/5 rounded-xl p-3 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                URL da Foto de Perfil (Ou faça upload acima)
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Cole um link ou use o botão de Upload acima"
                  className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl py-3 pl-10 pr-3 text-xs text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Recado / Status Personalizado
              </label>
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="Ex: Codando no Nexus 🚀"
                className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl p-3 text-xs text-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Sobre Mim (Biografia)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você..."
                className="w-full bg-nexus-950 border border-white/10 focus:border-nexus-accent rounded-xl p-3 text-xs text-white focus:outline-none transition-all resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-nexus-950/60 flex items-center justify-between shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-nexus-850 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="profile-form"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-nexus-accent text-nexus-950 hover:bg-nexus-accentHover transition-colors shadow-lg disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
