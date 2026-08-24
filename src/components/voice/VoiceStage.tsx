import React from 'react';
import { useVoice } from '../../contexts/VoiceContext';
import { ParticipantCard } from './ParticipantCard';
import { VoiceControls } from './VoiceControls';
import { Volume2, Users, Radio } from 'lucide-react';

interface VoiceStageProps {
  onOpenSettings?: () => void;
}

export const VoiceStage: React.FC<VoiceStageProps> = ({ onOpenSettings }) => {
  const {
    activeVoiceChannelName,
    activeServerName,
    participants,
    spotlightUserId,
    setSpotlightUserId,
  } = useVoice();

  const spotlightParticipant = participants.find(p => p.user_id === spotlightUserId) || null;
  const otherParticipants = spotlightParticipant
    ? participants.filter(p => p.user_id !== spotlightUserId)
    : participants;

  // Grid layout class based on participant count
  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-2xl';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3 max-w-6xl';
    return 'grid-cols-2 md:grid-cols-4 max-w-7xl';
  };

  return (
    <div className="flex-1 bg-nexus-950 flex flex-col h-full overflow-hidden select-none relative">
      {/* Top Voice Header */}
      <header className="h-14 border-b border-white/[0.04] px-6 flex items-center justify-between shrink-0 bg-nexus-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white tracking-wide">
                {activeVoiceChannelName}
              </h2>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Radio className="w-3 h-3 animate-pulse" />
                AO VIVO
              </span>
            </div>
            <span className="text-[11px] text-slate-400">{activeServerName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium bg-nexus-900 px-3 py-1.5 rounded-xl border border-white/5">
          <Users className="w-4 h-4 text-nexus-accent" />
          <span>{participants.length} {participants.length === 1 ? 'participante' : 'participantes'}</span>
        </div>
      </header>

      {/* Main Grid / Spotlight Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center scrollbar-thin">
        {spotlightParticipant ? (
          /* Spotlight Mode */
          <div className="w-full h-full flex flex-col lg:flex-row gap-4 items-center justify-center max-w-6xl">
            <div className="flex-1 w-full h-[450px]">
              <ParticipantCard
                participant={spotlightParticipant}
                isSpotlight={true}
                onToggleSpotlight={() => setSpotlightUserId(null)}
              />
            </div>
            {otherParticipants.length > 0 && (
              <div className="w-full lg:w-64 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto max-h-[450px]">
                {otherParticipants.map(participant => (
                  <div key={participant.id} className="w-48 lg:w-full shrink-0">
                    <ParticipantCard
                      participant={participant}
                      onToggleSpotlight={() => setSpotlightUserId(participant.user_id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Multi-User Grid Mode */
          <div className={`w-full grid gap-4 items-center justify-center ${getGridClass(participants.length)}`}>
            {participants.map(participant => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                onToggleSpotlight={() => setSpotlightUserId(participant.user_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Large Floating Control Bar */}
      <VoiceControls onOpenSettings={onOpenSettings} />
    </div>
  );
};
