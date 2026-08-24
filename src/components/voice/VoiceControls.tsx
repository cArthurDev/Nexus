import React from 'react';
import { useVoice } from '../../contexts/VoiceContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Settings,
  PhoneOff
} from 'lucide-react';

interface VoiceControlsProps {
  onOpenSettings?: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({ onOpenSettings }) => {
  const {
    isMuted,
    isCameraOn,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    leaveVoiceChannel
  } = useVoice();

  return (
    <div className="flex items-center justify-center gap-3 p-4 select-none z-20">
      <div className="bg-nexus-900/90 border border-white/10 backdrop-blur-2xl px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
        {/* Microphone Toggle */}
        <button
          onClick={toggleMute}
          className={`p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center ${
            isMuted
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600'
              : 'bg-nexus-800 text-slate-200 hover:bg-nexus-750 hover:text-white'
          }`}
          title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          className={`p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center ${
            isCameraOn
              ? 'bg-nexus-accent text-nexus-950 shadow-lg shadow-nexus-accent/30 hover:bg-nexus-accentHover'
              : 'bg-nexus-800 text-slate-200 hover:bg-nexus-750 hover:text-white'
          }`}
          title={isCameraOn ? 'Desligar Câmera' : 'Ligar Câmera'}
        >
          {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center ${
            isScreenSharing
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 animate-pulse'
              : 'bg-nexus-800 text-slate-200 hover:bg-nexus-750 hover:text-white'
          }`}
          title={isScreenSharing ? 'Parar Compartilhamento de Tela' : 'Compartilhar Tela'}
        >
          {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
        </button>

        {/* Settings */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-3.5 rounded-2xl bg-nexus-800 text-slate-200 hover:bg-nexus-750 hover:text-white transition-all duration-200"
            title="Configurações de Áudio & Vídeo"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        {/* Disconnect / Leave Call */}
        <button
          onClick={leaveVoiceChannel}
          className="p-3.5 rounded-2xl bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all duration-200 flex items-center justify-center"
          title="Sair da Chamada"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
