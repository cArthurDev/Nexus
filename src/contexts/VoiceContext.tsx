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

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const currentUserRef = useRef<UserProfile | null>(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

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

  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const realtimeChannelRef = useRef<any>(null);
  
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

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
        const speakingNow = average > 8;

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

  // WebRTC Peer Connection Helper (100% stable, uses refs)
  const createPeerConnection = useCallback((remoteUserId: string, channel: any) => {
    if (peerConnectionsRef.current.has(remoteUserId)) {
      return peerConnectionsRef.current.get(remoteUserId)!;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionsRef.current.set(remoteUserId, pc);

    // Add local tracks from stream ref
    const currentStream = localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        pc.addTrack(track, currentStream);
      });
    }

    // ICE Candidate Exchange
    pc.onicecandidate = (event) => {
      const user = currentUserRef.current;
      if (event.candidate && channel && user) {
        channel.send({
          type: 'broadcast',
          event: 'WEBRTC_ICE',
          payload: {
            from: user.id,
            to: remoteUserId,
            candidate: event.candidate,
          },
        });
      }
    };

    // Receive Remote Audio & Video Stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        const hasAudio = remoteStream.getAudioTracks().length > 0;
        if (hasAudio) {
          let audioEl = remoteAudioElementsRef.current.get(remoteUserId);
          if (!audioEl) {
            audioEl = new Audio();
            audioEl.autoplay = true;
            remoteAudioElementsRef.current.set(remoteUserId, audioEl);
          }
          audioEl.srcObject = remoteStream;
          audioEl.play().catch(e => console.warn('AutoPlay Audio error:', e));
        }

        setRemoteParticipants(prev => {
          return prev.map(p => {
            if (p.user_id === remoteUserId) {
              return { ...p, stream: remoteStream, screen_stream: remoteStream };
            }
            return p;
          });
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peerConnectionsRef.current.delete(remoteUserId);
        const audioEl = remoteAudioElementsRef.current.get(remoteUserId);
        if (audioEl) {
          audioEl.srcObject = null;
          remoteAudioElementsRef.current.delete(remoteUserId);
        }
      }
    };

    return pc;
  }, []);

  // Supabase Presence & WebRTC Signaling Channel (runs ONLY when activeVoiceChannelId changes!)
  useEffect(() => {
    const user = currentUserRef.current;
    if (!activeVoiceChannelId || !user || !isSupabaseConfigured || !supabase) return;

    const currentUserId = user.id;
    const channelName = `voice_room_${activeVoiceChannelId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    realtimeChannelRef.current = channel;

    // 1. Attach ALL callbacks BEFORE calling subscribe()
    channel
      .on('broadcast', { event: 'WEBRTC_OFFER' }, async (payload: any) => {
        const { from, to, offer } = payload.payload;
        if (to === currentUserId && from) {
          const pc = createPeerConnection(from, channel);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          channel.send({
            type: 'broadcast',
            event: 'WEBRTC_ANSWER',
            payload: {
              from: currentUserId,
              to: from,
              answer,
            },
          });
        }
      })
      .on('broadcast', { event: 'WEBRTC_ANSWER' }, async (payload: any) => {
        const { from, to, answer } = payload.payload;
        if (to === currentUserId && from) {
          const pc = peerConnectionsRef.current.get(from);
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        }
      })
      .on('broadcast', { event: 'WEBRTC_ICE' }, async (payload: any) => {
        const { from, to, candidate } = payload.payload;
        if (to === currentUserId && from && candidate) {
          const pc = peerConnectionsRef.current.get(from);
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn('Error adding ICE Candidate', e);
            }
          }
        }
      })
      .on('broadcast', { event: 'PEER_STATE' }, (payload: any) => {
        const p = payload.payload?.participant as VoiceParticipant;
        if (p && p.user_id !== currentUserId) {
          setRemoteParticipants(prev => {
            const index = prev.findIndex(item => item.user_id === p.user_id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...p };
              return updated;
            }
            return [...prev, p];
          });
        }
      })
      .on('presence', { event: 'sync' }, async () => {
        const state = channel.presenceState();
        const remotes: VoiceParticipant[] = [];

        Object.keys(state).forEach((key) => {
          if (key !== currentUserId) {
            const presenceList = state[key] as any[];
            if (presenceList && presenceList.length > 0) {
              const latest = presenceList[presenceList.length - 1];
              const p = (latest.participant || latest) as VoiceParticipant;
              if (p && p.user_id) {
                remotes.push(p);
              }
            }
          }
        });

        setRemoteParticipants(remotes);

        // Initiate WebRTC Offer if our ID is smaller
        for (const remote of remotes) {
          if (currentUserId < remote.user_id && !peerConnectionsRef.current.has(remote.user_id)) {
            const pc = createPeerConnection(remote.user_id, channel);
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            await pc.setLocalDescription(offer);

            channel.send({
              type: 'broadcast',
              event: 'WEBRTC_OFFER',
              payload: {
                from: currentUserId,
                to: remote.user_id,
                offer,
              },
            });
          }
        }
      })
      .on('presence', { event: 'join' }, async ({ key, newPresences }) => {
        if (key !== currentUserId && newPresences.length > 0) {
          const latest = newPresences[0] as any;
          const p = (latest.participant || latest) as VoiceParticipant;
          if (p && p.user_id) {
            setRemoteParticipants(prev => {
              if (prev.some(item => item.user_id === p.user_id)) return prev;
              return [...prev, p];
            });
            sounds.playJoinVoice();

            if (currentUserId < p.user_id && !peerConnectionsRef.current.has(p.user_id)) {
              const pc = createPeerConnection(p.user_id, channel);
              const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
              await pc.setLocalDescription(offer);

              channel.send({
                type: 'broadcast',
                event: 'WEBRTC_OFFER',
                payload: {
                  from: currentUserId,
                  to: p.user_id,
                  offer,
                },
              });
            }
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== currentUserId) {
          setRemoteParticipants(prev => prev.filter(p => p.user_id !== key));
          sounds.playLeaveVoice();

          const pc = peerConnectionsRef.current.get(key);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(key);
          }
          const audioEl = remoteAudioElementsRef.current.get(key);
          if (audioEl) {
            audioEl.srcObject = null;
            remoteAudioElementsRef.current.delete(key);
          }
        }
      });

    // 2. Subscribe once
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const myData = {
          id: `vp_${currentUserId}`,
          user_id: currentUserId,
          channel_id: activeVoiceChannelId,
          is_muted: isMuted,
          is_deafened: isDeafened,
          is_speaking: isSpeaking,
          is_camera_on: isCameraOn,
          is_screen_sharing: isScreenSharing,
          audio_level: isSpeaking ? 80 : 0,
          joined_at: new Date().toISOString(),
          profile: user,
        };

        await channel.track(myData);

        channel.send({
          type: 'broadcast',
          event: 'PEER_STATE',
          payload: { participant: myData }
        });
      }
    });

    return () => {
      channel.untrack().catch(() => {});
      if (supabase) {
        supabase.removeChannel(channel);
      }
      realtimeChannelRef.current = null;
    };
  }, [activeVoiceChannelId, createPeerConnection]);

  // Update presence state & broadcast when local mic/cam/screen changes without restarting channel
  useEffect(() => {
    const user = currentUserRef.current;
    if (realtimeChannelRef.current && user && activeVoiceChannelId) {
      const myData = {
        id: `vp_${user.id}`,
        user_id: user.id,
        channel_id: activeVoiceChannelId,
        is_muted: isMuted,
        is_deafened: isDeafened,
        is_speaking: isSpeaking,
        is_camera_on: isCameraOn,
        is_screen_sharing: isScreenSharing,
        audio_level: isSpeaking ? 80 : 0,
        joined_at: new Date().toISOString(),
        profile: user,
      };

      realtimeChannelRef.current.track(myData).catch(() => {});

      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'PEER_STATE',
        payload: { participant: myData }
      });
    }
  }, [isMuted, isDeafened, isSpeaking, isCameraOn, isScreenSharing, activeVoiceChannelId]);

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

      // Add audio tracks to existing peer connections
      peerConnectionsRef.current.forEach(pc => {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      });
    } catch (err) {
      console.warn('Microphone access not available or denied', err);
    }

    setRemoteParticipants([]);
  };

  const leaveVoiceChannel = () => {
    if (!activeVoiceChannelId) return;

    sounds.playLeaveVoice();
    stopAudioDetection();

    // Close all WebRTC Peer Connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Stop and clear all remote audio players
    remoteAudioElementsRef.current.forEach((audio) => {
      audio.srcObject = null;
    });
    remoteAudioElementsRef.current.clear();

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }

    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.untrack().catch(() => {});
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

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
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
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
      remoteAudioElementsRef.current.forEach(audio => {
        audio.muted = true;
      });
    } else {
      sounds.playUnmute();
      remoteAudioElementsRef.current.forEach(audio => {
        audio.muted = false;
      });
    }
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.stop();
          localStream.removeTrack(track);
          peerConnectionsRef.current.forEach(pc => {
            const senders = pc.getSenders();
            const sender = senders.find(s => s.track === track);
            if (sender) pc.removeTrack(sender);
          });
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
          for (const [remoteId, pc] of peerConnectionsRef.current.entries()) {
            pc.addTrack(videoTrack, localStream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const user = currentUserRef.current;
            if (realtimeChannelRef.current && user) {
              realtimeChannelRef.current.send({
                type: 'broadcast',
                event: 'WEBRTC_OFFER',
                payload: { from: user.id, to: remoteId, offer }
              });
            }
          }
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
        screenStream.getTracks().forEach(track => {
          track.stop();
          peerConnectionsRef.current.forEach(pc => {
            const senders = pc.getSenders();
            const sender = senders.find(s => s.track === track);
            if (sender) pc.removeTrack(sender);
          });
        });
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const captureStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        const screenTrack = captureStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          peerConnectionsRef.current.forEach(pc => {
            const senders = pc.getSenders();
            const sender = senders.find(s => s.track === screenTrack);
            if (sender) pc.removeTrack(sender);
          });
        };

        // Add track to all connected peers and renegotiate offer
        for (const [remoteId, pc] of peerConnectionsRef.current.entries()) {
          pc.addTrack(screenTrack, captureStream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          const user = currentUserRef.current;
          if (realtimeChannelRef.current && user) {
            realtimeChannelRef.current.send({
              type: 'broadcast',
              event: 'WEBRTC_OFFER',
              payload: { from: user.id, to: remoteId, offer }
            });
          }
        }

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
      stream: localStream || undefined,
      screen_stream: screenStream || undefined,
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
    remoteParticipants,
    localStream,
    screenStream
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
