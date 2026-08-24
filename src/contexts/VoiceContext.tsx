import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { VoiceParticipant, UserProfile } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  const realtimeChannelRef = useRef<any>(null);

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

  // Supabase Presence Channel for Universal Voice Room across all computers
  useEffect(() => {
    if (!activeVoiceChannelId || !currentUser) return;

    if (isSupabaseConfigured && supabase) {
      const channel = supabase.channel(`voice_room:${activeVoiceChannelId}`, {
        config: {
          presence: {
            key: currentUser.id,
          },
        },
      });

      realtimeChannelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const remotes: VoiceParticipant[] = [];

          Object.keys(state).forEach((key) => {
            if (key !== currentUser.id) {
              const presenceList = state[key] as any[];
              if (presenceList && presenceList.length > 0) {
                const latest = presenceList[presenceList.length - 1];
                remotes.push(latest.participant);
              }
            }
          });

          setRemoteParticipants(remotes);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (key !== currentUser.id && newPresences.length > 0) {
            const p = (newPresences[0] as any).participant;
            setRemoteParticipants(prev => {
              if (prev.some(item => item.user_id === p.user_id)) return prev;
              return [...prev, p];
            });
            sounds.playJoinVoice();
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          if (key !== currentUser.id) {
            setRemoteParticipants(prev => prev.filter(p => p.user_id !== key));
            sounds.playLeaveVoice();
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              participant: {
                id: `vp_${currentUser.id}`,
                user_id: currentUser.id,
                channel_id: activeVoiceChannelId,
                is_muted: isMuted,
                is_deafened: isDeafened,
                is_speaking: isSpeaking,
                is_camera_on: isCameraOn,
                is_screen_sharing: isScreenSharing,
                audio_level: isSpeaking ? 80 : 0,
                joined_at: new Date().toISOString(),
                profile: currentUser,
              },
            });
          }
        });

      return () => {
        channel.untrack().then(() => {
          if (supabase) {
            supabase.removeChannel(channel);
          }
        });
        realtimeChannelRef.current = null;
      };
    }
  }, [activeVoiceChannelId, currentUser]);

  // Update presence state when local mic/cam/screen changes
  useEffect(() => {
    if (realtimeChannelRef.current && currentUser && activeVoiceChannelId) {
      realtimeChannelRef.current.track({
        participant: {
          id: `vp_${currentUser.id}`,
          user_id: currentUser.id,
          channel_id: activeVoiceChannelId,
          is_muted: isMuted,
          is_deafened: isDeafened,
          is_speaking: isSpeaking,
          is_camera_on: isCameraOn,
          is_screen_sharing: isScreenSharing,
          audio_level: isSpeaking ? 80 : 0,
          joined_at: new Date().toISOString(),
          profile: currentUser,
        },
      });
    }
  }, [isMuted, isDeafened, isSpeaking, isCameraOn, isScreenSharing, currentUser, activeVoiceChannelId]);

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

    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.untrack();
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
          },
          audio: false
        });

        const videoTrack = videoStream.getVideoTracks()[0];
        if (localStream && videoTrack) {
          localStream.addTrack(videoTrack);
        } else if (videoTrack) {
          setLocalStream(videoStream);
        }

        setIsCameraOn(true);
      } catch (err) {
        console.error('Error enabling webcam', err);
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
        const captureStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        captureStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };

        setScreenStream(captureStream);
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error sharing screen', err);
      }
    }
  };

  const allParticipants: VoiceParticipant[] = React.useMemo(() => {
    if (!activeVoiceChannelId || !currentUser) return [];

    const myParticipant: VoiceParticipant = {
      id: `vp_${currentUser.id}`,
      user_id: currentUser.id,
      channel_id: activeVoiceChannelId,
      is_muted: isMuted,
      is_deafened: isDeafened,
      is_speaking: isSpeaking,
      is_camera_on: isCameraOn,
      is_screen_sharing: isScreenSharing,
      audio_level: isSpeaking ? 80 : 0,
      joined_at: new Date().toISOString(),
      profile: currentUser,
    };

    return [myParticipant, ...remoteParticipants];
  }, [
    activeVoiceChannelId,
    currentUser,
    isMuted,
    isDeafened,
    isSpeaking,
    isCameraOn,
    isScreenSharing,
    remoteParticipants
  ]);

  return (
    <VoiceContext.Provider
      value={{
        activeVoiceChannelId,
        activeVoiceChannelName,
        activeServerName,
        isInVoice: !!activeVoiceChannelId,
        isMuted,
        isDeafened,
        isCameraOn,
        isScreenSharing,
        isSpeaking,
        participants: allParticipants,
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
