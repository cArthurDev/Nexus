import React, { useState } from 'react';
import { useServer } from '../../contexts/ServerContext';
import { useToast } from '../ui/Toast';
import { X, Settings, Trash2, Hash, Volume2, ShieldAlert } from 'lucide-react';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({ isOpen, onClose }) => {
  const { activeServer, channels, deleteChannel, deleteServer } = useServer();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CHANNELS' | 'DELETE'>('OVERVIEW');

  if (!isOpen || !activeServer) return null;

  const handleDeleteServer = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o servidor "${activeServer.name}"? Esta ação não pode ser desfeita.`)) {
      await deleteServer(activeServer.id);
      showToast('info', 'Servidor Excluído', `O servidor ${activeServer.name} foi removido.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-nexus-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-nexus-accent/20 text-nexus-accent flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Configurações de {activeServer.name}</h2>
              <span className="text-xs text-slate-400">Gerencie canais e preferências do servidor</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 px-6 pt-4 border-b border-white/5 shrink-0">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`pb-3 text-xs font-bold transition-colors relative ${
              activeTab === 'OVERVIEW'
                ? 'text-nexus-accent border-b-2 border-nexus-accent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Visão Geral
          </button>

          <button
            onClick={() => setActiveTab('CHANNELS')}
            className={`pb-3 text-xs font-bold transition-colors relative ${
              activeTab === 'CHANNELS'
                ? 'text-nexus-accent border-b-2 border-nexus-accent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Canais ({channels.length})
          </button>

          <button
            onClick={() => setActiveTab('DELETE')}
            className={`pb-3 text-xs font-bold transition-colors relative ${
              activeTab === 'DELETE'
                ? 'text-rose-400 border-b-2 border-rose-400'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Excluir Servidor
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-nexus-950/60 border border-white/5">
                <img
                  src={activeServer.icon_url}
                  alt={activeServer.name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="text-base font-bold text-white">{activeServer.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{activeServer.description || 'Sem descrição'}</p>
                  <span className="text-[11px] font-mono text-nexus-accent mt-2 inline-block bg-nexus-900 px-2 py-0.5 rounded">
                    Código: {activeServer.invite_code}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CHANNELS' && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Lista de Canais Existentes
              </div>
              {channels.map(channel => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-nexus-950/60 border border-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    {channel.type === 'TEXT' ? (
                      <Hash className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-xs font-semibold text-white">{channel.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">({channel.type})</span>
                  </div>

                  <button
                    onClick={() => {
                      if (channels.length <= 1) {
                        showToast('error', 'Ação Proibida', 'O servidor deve ter pelo menos um canal.');
                        return;
                      }
                      deleteChannel(channel.id);
                      showToast('info', 'Canal Removido', `#${channel.name}`);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Excluir Canal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'DELETE' && (
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center space-y-4">
              <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
              <div>
                <h4 className="text-base font-bold text-rose-200">Zona de Perigo</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                  Excluir o servidor <strong>{activeServer.name}</strong> apagará permanentemente todos os canais e mensagens associadas a ele.
                </p>
              </div>
              <button
                onClick={handleDeleteServer}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all"
              >
                Sim, Excluir Servidor Definitivamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
