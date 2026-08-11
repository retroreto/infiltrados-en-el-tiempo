import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Tv,
  AlertCircle,
  RefreshCw,
  Users
} from 'lucide-react';
import { GameRoom, Player } from '../types';
import { AVATAR_ICONS } from './AvatarPicker';
import { soundEngine } from '../utils/AudioService';

export interface WebRTCSignalData {
  type: 'webrtc_signal';
  fromPlayerId: string;
  targetPlayerId: string;
  signal: {
    type: 'offer' | 'answer' | 'candidate';
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  };
}

interface MediaRoomManagerProps {
  room: GameRoom;
  currentPlayerId: string;
  incomingSignal?: WebRTCSignalData | null;
  onClearSignal?: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const MediaRoomManager: React.FC<MediaRoomManagerProps> = ({
  room,
  currentPlayerId,
  incomingSignal,
  onClearSignal
}) => {
  // Local Media State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isDockExpanded, setIsDockExpanded] = useState(true);
  const [isFloating, setIsFloating] = useState(false);

  // Peer Streams State: peerId -> MediaStream
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  // WebRTC Peer Connections ref: peerId -> RTCPeerConnection
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const isOnline = room.mode === 'online';
  const me = room.players.find(p => p.id === currentPlayerId);

  // --- 1. INITIALIZE LOCAL MEDIA STREAM ---
  const startLocalMedia = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 20 }
        }
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      // Update tracks enabled according to current state
      stream.getAudioTracks().forEach(t => (t.enabled = !isMicMuted));
      stream.getVideoTracks().forEach(t => (t.enabled = !isCameraOff));
    } catch (err: any) {
      console.warn("Camera/Mic initial access error, falling back to audio-only if possible:", err);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        setLocalStream(audioOnlyStream);
        localStreamRef.current = audioOnlyStream;
        setIsCameraOff(true);
        audioOnlyStream.getAudioTracks().forEach(t => (t.enabled = !isMicMuted));
      } catch (audioErr: any) {
        console.error("Audio access also denied:", audioErr);
        setPermissionError("Permiso de micrófono/cámara no concedido.");
      }
    }
  };

  useEffect(() => {
    startLocalMedia();

    return () => {
      // Cleanup tracks on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      // Close all peer connections
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
    };
  }, []);

  // --- 2. WEBRTC PEER CONNECTION HELPERS ---
  const createPeerConnection = (peerId: string): RTCPeerConnection => {
    if (peerConnections.current.has(peerId)) {
      return peerConnections.current.get(peerId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to PC
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(peerId, {
          type: 'candidate',
          candidate: event.candidate.toJSON()
        });
      }
    };

    // Remote Track received
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        setRemoteStreams(prev => ({
          ...prev,
          [peerId]: remoteStream
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      }
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  };

  const sendSignal = async (targetPlayerId: string, signal: any) => {
    try {
      await fetch(`/api/rooms/${room.roomCode}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPlayerId: currentPlayerId,
          targetPlayerId,
          signal
        })
      });
    } catch (err) {
      console.error("Error sending signal:", err);
    }
  };

  // Sync player media status (Muted/CameraOff) to server
  const syncMediaStatus = async (muted: boolean, cameraOff: boolean) => {
    if (!isOnline) return;
    try {
      await fetch(`/api/rooms/${room.roomCode}/media-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayerId,
          isMuted: muted,
          isCameraOff: cameraOff
        })
      });
    } catch (err) {
      // silent catch
    }
  };

  // --- 3. HANDLE INCOMING WEBRTC SIGNALS ---
  useEffect(() => {
    if (!incomingSignal) return;

    const { fromPlayerId, targetPlayerId, signal } = incomingSignal;
    if (targetPlayerId !== currentPlayerId) return;

    const handleSignal = async () => {
      const pc = createPeerConnection(fromPlayerId);

      if (signal.type === 'offer' && signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(fromPlayerId, {
          type: 'answer',
          sdp: answer
        });
      } else if (signal.type === 'answer' && signal.sdp) {
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } else if (signal.type === 'candidate' && signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (err) {
          console.warn("Error adding ICE candidate:", err);
        }
      }
    };

    handleSignal();
    if (onClearSignal) onClearSignal();
  }, [incomingSignal, currentPlayerId]);

  // --- 4. INITIATE OFFERS TO PEERS ---
  useEffect(() => {
    if (!isOnline || !localStream) return;

    const otherPlayers = room.players.filter(p => p.id !== currentPlayerId);

    otherPlayers.forEach(async (peer) => {
      // Deterministic initiator logic (Lexicographical ID comparison to prevent duplicate offers)
      if (currentPlayerId < peer.id) {
        const pc = createPeerConnection(peer.id);
        if (pc.signalingState === 'stable' && pc.iceConnectionState === 'new') {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal(peer.id, {
              type: 'offer',
              sdp: offer
            });
          } catch (err) {
            console.error("Error creating offer:", err);
          }
        }
      }
    });
  }, [room.players.length, isOnline, !!localStream]);

  // --- 5. CONTROL TOGGLES ---
  const toggleMic = () => {
    soundEngine.playClick();
    const nextState = !isMicMuted;
    setIsMicMuted(nextState);

    if (localStream) {
      localStream.getAudioTracks().forEach(t => (t.enabled = !nextState));
    }
    syncMediaStatus(nextState, isCameraOff);
  };

  const toggleCamera = () => {
    soundEngine.playClick();
    const nextState = !isCameraOff;
    setIsCameraOff(nextState);

    if (localStream) {
      localStream.getVideoTracks().forEach(t => (t.enabled = !nextState));
    }
    syncMediaStatus(isMicMuted, nextState);
  };

  const toggleDeafen = () => {
    soundEngine.playClick();
    setIsDeafened(prev => !prev);
  };

  // If local stream is empty or permission denied, show retry button
  const handleRetryPermissions = () => {
    soundEngine.playClick();
    startLocalMedia();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-4 z-20">
      {/* Retro Cybernetic Media Control Box */}
      <div className="bg-[#121622]/95 border border-[#00F0FF]/30 rounded-3xl p-3 sm:p-4 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.7)] transition-all">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2B354C]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#00F0FF] animate-pulse" />
            <span className="text-xs font-mono font-black text-[#00F0FF] tracking-wider uppercase">
              FRECUENCIA DE AUDIO & CÁMARA {isOnline ? 'EN VIVO' : '(SIMULADOR)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDockExpanded(prev => !prev)}
              className="p-1.5 rounded-lg bg-[#1B2234] hover:bg-[#252E46] text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-bold"
              title={isDockExpanded ? "Plegar cámaras" : "Desplegar cámaras"}
            >
              <Users className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="hidden sm:inline">{room.players.length} TRIPULANTES</span>
              {isDockExpanded ? <ChevronUp className="w-4 h-4 text-[#00F0FF]" /> : <ChevronDown className="w-4 h-4 text-[#00F0FF]" />}
            </button>
          </div>
        </div>

        {/* Media Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0B0E17] p-2.5 rounded-2xl border border-[#2B354C]">
          {/* Audio & Video Buttons */}
          <div className="flex items-center gap-2">
            {/* Mic Toggle Button */}
            <button
              onClick={toggleMic}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                isMicMuted
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
                  : 'bg-[#00F0FF]/20 border border-[#00F0FF]/60 text-[#00F0FF] hover:bg-[#00F0FF]/30 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              }`}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-pulse" />}
              <span>{isMicMuted ? 'MIC MUTE' : 'MIC ACTIVO'}</span>
            </button>

            {/* Camera Toggle Button */}
            <button
              onClick={toggleCamera}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                isCameraOff
                  ? 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
                  : 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              <span>{isCameraOff ? 'CÁMARA OFF' : 'CÁMARA ON'}</span>
            </button>

            {/* Deafen Toggle */}
            <button
              onClick={toggleDeafen}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                isDeafened
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                  : 'bg-[#1B2234] border border-[#2B354C] text-slate-300 hover:bg-[#252E46]'
              }`}
              title={isDeafened ? "Activar audio de otros" : "Silenciar audio general"}
            >
              {isDeafened ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
              <span className="hidden md:inline">{isDeafened ? 'AUDÍFONOS MUTE' : 'AUDIO OK'}</span>
            </button>
          </div>

          {/* Status & Retry */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            {permissionError && (
              <div className="flex items-center gap-1.5 text-amber-400 font-sans">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-none">{permissionError}</span>
                <button
                  onClick={handleRetryPermissions}
                  className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 underline"
                  title="Reintentar acceso"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {!permissionError && (
              <span className="text-[#00F0FF] font-bold">
                ● WEBRTC RED {isOnline ? 'ONLINE' : 'LOCAL'}
              </span>
            )}
          </div>
        </div>

        {/* Expanded Video Grid View */}
        {isDockExpanded && (
          <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 animate-fade-in">
            {room.players.map(player => {
              const isMe = player.id === currentPlayerId;
              const remoteStream = remoteStreams[player.id];
              const playerIconIdx = player.avatarIconIndex || 0;
              const AvatarIcon = AVATAR_ICONS[playerIconIdx] || AVATAR_ICONS[0];

              const playerMuted = isMe ? isMicMuted : (player.isMuted ?? false);
              const playerCameraOff = isMe ? isCameraOff : (player.isCameraOff ?? false);

              return (
                <div
                  key={player.id}
                  className={`relative aspect-video rounded-2xl overflow-hidden border transition-all flex flex-col justify-between p-2 shadow-lg ${
                    isMe
                      ? 'bg-[#182032] border-[#00F0FF]/60 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-[#0E1320] border-[#2B354C]'
                  }`}
                >
                  {/* Video Element for Me or Remote */}
                  {isMe ? (
                    !isCameraOff && localStream ? (
                      <LocalVideoView stream={localStream} />
                    ) : null
                  ) : (
                    !playerCameraOff && remoteStream ? (
                      <RemoteVideoView stream={remoteStream} isDeafened={isDeafened} />
                    ) : null
                  )}

                  {/* Fallback View when Camera is OFF */}
                  {((isMe && (isCameraOff || !localStream)) || (!isMe && (playerCameraOff || !remoteStream))) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#141A29] to-[#0A0D16] p-2">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center border shadow-md transition-transform duration-300 hover:scale-105"
                        style={{
                          backgroundColor: player.avatarColor + '20',
                          borderColor: player.avatarColor
                        }}
                      >
                        <AvatarIcon className="w-5 h-5" style={{ color: player.avatarColor }} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 mt-1">CÁMARA OFF</span>
                    </div>
                  )}

                  {/* Top Bar Badges */}
                  <div className="relative z-10 flex items-center justify-between pointer-events-none">
                    <span
                      className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-slate-950 shadow-md"
                      style={{ backgroundColor: player.avatarColor }}
                    >
                      {player.name} {isMe ? '(TÚ)' : ''}
                    </span>

                    {player.isHost && (
                      <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-sm">
                        HOST
                      </span>
                    )}
                  </div>

                  {/* Bottom Bar Icons (Mic / Cam indicators) */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-950/70 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-1">
                      {playerMuted ? (
                        <span className="flex items-center gap-1 text-red-400 font-bold">
                          <MicOff className="w-3 h-3 text-red-400" /> SILENCIADO
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <Mic className="w-3 h-3 text-emerald-400 animate-pulse" /> VOZ ACTIVA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for local video rendering
const LocalVideoView: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted // Always mute local video element to avoid echo!
      className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
    />
  );
};

// Helper component for remote video rendering
const RemoteVideoView: React.FC<{ stream: MediaStream; isDeafened: boolean }> = ({ stream, isDeafened }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isDeafened}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
};
