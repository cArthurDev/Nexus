import React, { useRef, useEffect } from 'react';
import { VoiceParticipant } from '../../types';
import { Avatar } from '../ui/Avatar';
import { MicOff, Video, Monitor, Maximize2 } from 'lucide-react';

interface ParticipantCardProps {
  participant: VoiceParticipant;
  isSpotlight?: boolean;
  onToggleSpotlight?: () => void;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  isSpotlight = false,
  onToggleSpotlight,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  const activeScreenMedia = participant.screen_stream || (participant.is_screen_sharing ? participant.stream : null);
  const activeCameraMedia = participant.stream || null;

  // Attach webcam stream to video element
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && activeCameraMedia && participant.is_camera_on && !participant.is_screen_sharing) {
      videoEl.muted = true;
      videoEl.srcObject = activeCameraMedia;
      videoEl.play().catch(e => console.warn('Camera play notice:', e));
    }
  }, [activeCameraMedia, participant.is_camera_on, participant.is_screen_sharing]);

  // Attach screen share stream to screen video element
  useEffect(() => {
    const screenEl = screenRef.current;
    if (screenEl && activeScreenMedia && participant.is_screen_sharing) {
      screenEl.muted = true;
      screenEl.srcObject = activeScreenMedia;
      screenEl.play().catch(e => console.warn('Screen play notice:', e));
    }
  }, [activeScreenMedia, participant.is_screen_sharing]);

  return (
    <div
      onClick={onToggleSpotlight}
      className={`group relative rounded-2xl overflow-hidden bg-nexus-900 border transition-all duration-300 flex items-center justify-center cursor-pointer ${
        participant.is_speaking
          ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/50'
          : 'border-white/[0.06] hover:border-white/20'
      } ${
        isSpotlight ? 'w-full h-full min-h-[380px]' : 'aspect-video w-full min-h-[160px]'
      }`}
    >
      {/* Screen share video feed */}
      {participant.is_screen_sharing && activeScreenMedia ? (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <video
            ref={screenRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
            className="w-full h-full object-contain"
          />
          <div className="absolute top-3 left-3 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md z-10">
            <Monitor className="w-3.5 h-3.5 animate-pulse" />
            <span>Transmissão de Tela</span>
          </div>
        </div>
      ) : participant.is_camera_on && activeCameraMedia ? (
        /* Camera video feed */
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
            className="w-full h-full object-cover -scale-x-100"
          />
          <div className="absolute top-3 left-3 bg-nexus-950/80 border border-white/10 text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md z-10">
            <Video className="w-3.5 h-3.5 text-nexus-accent" />
            <span>Câmera</span>
          </div>
        </div>
      ) : (
        /* Default Audio / Avatar visualizer view */
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative">
            <Avatar
              src={participant.profile.avatar_url}
              name={participant.profile.display_name}
              size={isSpotlight ? '2xl' : 'xl'}
              isSpeaking={participant.is_speaking}
              showStatus={false}
            />

            {/* Speaking wave effect */}
            {participant.is_speaking && (
              <span className="absolute -inset-2 rounded-full border-2 border-emerald-400/60 animate-ping pointer-events-none" />
            )}
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs font-bold text-slate-200 tracking-wide">
              {participant.profile.display_name}
            </span>
          </div>
        </div>
      )}

      {/* Participant bottom status tag */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <div className="bg-nexus-950/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-xl flex items-center gap-2 max-w-[80%]">
          <span className="text-[11px] font-bold text-white truncate">
            {participant.profile.display_name}
          </span>
          {participant.is_muted && (
            <MicOff className="w-3 h-3 text-rose-400 shrink-0" />
          )}
        </div>

        {onToggleSpotlight && (
          <button
            className="opacity-0 group-hover:opacity-100 bg-nexus-950/80 hover:bg-nexus-800 p-1.5 rounded-xl border border-white/10 text-slate-300 hover:text-white transition-opacity pointer-events-auto"
            title={isSpotlight ? 'Sair do Destaque' : 'Destacar Participante'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
