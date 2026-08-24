import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { VoiceParticipant, UserProfile } from '../types';
import { useAuth } from './AuthContext';
import { sounds } from '../lib/sounds';

interface VoiceContextType {
  activeVoiceChannelId: string | null;
  activeVoiceChannelName: string | null;
  activeServerName: string | null;
  isInVoice: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  participants: VoiceParticipant[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  spotlightUserId: string | null;
  joinVoiceChannel: (channelId: string, channelName: string, serverName?: string) => Promise<void>;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  setSpotlightUserId: (userId: string | null) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);
  const [activeVoiceChannelName, setActiveVoiceChannelName] = useState<string | null>(null);
  const [activeServerName, setActiveServerName] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [spotlightUserId, setSpotlightUserId] = useState<string | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const [remoteParticipants, setRemoteParticipants] = useState<VoiceParticipant[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  const setupAudioDetection = useCallback((stream: MediaStream) => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }

      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      if (!audioContextRef.current) return;

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);
      micSourceRef.current = source;

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);

        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const average = sum / buffer.length;
        const speakingNow = average > 12;

        setIsSpeaking(speakingNow);

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Could not initialize Voice Activity Detector', err);
    }
  }, []);

  const stopAudioDetection = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micSourceRef.current) {
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bc = new BroadcastChannel('nexus_voice_mesh');
    broadcastRef.current = bc;

    bc.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'PEER_STATUS' && data.channelId === activeVoiceChannelId) {
        if (data.participant.user_id !== currentUser?.id) {
          setRemoteParticipants(prev => {
            const index = prev.findIndex(p => p.user_id === data.participant.user_id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...data.participant };
              return updated;
            }
            return [...prev, data.participant];
          });
        }
      } else if (data.type === 'PEER_LEAVE') {
        setRemoteParticipants(prev => prev.filter(p => p.user_id !== data.userId));
      }
    };

    return () => {
      bc.close();
    };
  }, [activeVoiceChannelId, currentUser]);

  const joinVoiceChannel = async (channelId: string, channelName: string, serverName?: string) => {
    if (activeVoiceChannelId === channelId) return;

    leaveVoiceChannel();

    setActiveVoiceChannelId(channelId);
    setActiveVoiceChannelName(channelName);
    setActiveServerName(serverName || 'Servidor');

    sounds.playJoinVoice();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      setLocalStream(stream);
      setupAudioDetection(stream);
    } catch (err) {
      console.warn('Microphone access not available or denied', err);
    }

    setRemoteParticipants([]);
  };

  const leaveVoiceChannel = () => {
    if (!activeVoiceChannelId) return;

    sounds.playLeaveVoice();
    stopAudioDetection();

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }

    if (broadcastRef.current && currentUser) {
      broadcastRef.current.postMessage({
        type: 'PEER_LEAVE',
        channelId: activeVoiceChannelId,
        userId: currentUser.id
      });
    }

    setActiveVoiceChannelId(null);
    setActiveVoiceChannelName(null);
    setActiveServerName(null);
    setIsCameraOn(false);
    setIsScreenSharing(false);
    setIsMuted(false);
    setIsDeafened(false);
    setRemoteParticipants([]);
    setSpotlightUserId(null);
  };

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (nextState) {
      sounds.playMute();
      setIsSpeaking(false);
    } else {
      sounds.playUnmute();
    }

    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !nextState;
      });
    }
  };

  const toggleDeafen = () => {
    const nextState = !isDeafened;
    setIsDeafened(nextState);
    if (nextState) {
      setIsMuted(true);
      sounds.playMute();
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
    } else {
      sounds.playUnmute();
    }
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.stop();
          localStream.removeTrack(track);
        });
      }
      setIsCameraOn(false);
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });

        const videoTrack = videoStream.getVideoTracks()[0];
        if (localStream) {
          localStream.addTrack(videoTrack);
        } else {
          setLocalStream(videoStream);
        }
        setIsCameraOn(true);
      } catch (err) {
        console.error('Failed to enable camera', err);
        alert('Não foi possível acessar a câmera.');
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          } as MediaTrackConstraints,
          audio: false,
        });

        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };

        setScreenStream(displayStream);
        setIsScreenSharing(true);
        sounds.playPop();
      } catch (err) {
        console.error('Failed to get display media', err);
      }
    }
  };

  const localParticipant: VoiceParticipant | null = currentUser && activeVoiceChannelId ? {
    id: `vp_me_${activeVoiceChannelId}`,
    user_id: currentUser.id,
    channel_id: activeVoiceChannelId,
    profile: currentUser,
    is_muted: isMuted,
    is_deafened: isDeafened,
    is_camera_on: isCameraOn,
    is_screen_sharing: isScreenSharing,
    is_speaking: !isMuted && isSpeaking,
    audio_level: isSpeaking ? 80 : 0,
    stream: localStream || undefined,
    screen_stream: screenStream || undefined,
    joined_at: new Date().toISOString(),
  } : null;

  const participants: VoiceParticipant[] = localParticipant 
    ? [localParticipant, ...remoteParticipants]
    : remoteParticipants;

  return (
    <VoiceContext.Provider
      value={{
        activeVoiceChannelId,
        activeVoiceChannelName,
        activeServerName,
        isInVoice: Boolean(activeVoiceChannelId),
        isMuted,
        isDeafened,
        isCameraOn,
        isScreenSharing,
        isSpeaking: !isMuted && isSpeaking,
        participants,
        localStream,
        screenStream,
        spotlightUserId,
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMute,
        toggleDeafen,
        toggleCamera,
        toggleScreenShare,
        setSpotlightUserId,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
