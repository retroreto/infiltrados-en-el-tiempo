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
  incomingSignals?: WebRTCSignalData[];
  onClearSignals?: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const MediaRoomManager: React.FC<MediaRoomManagerProps> = ({
  room,
  currentPlayerId,
  incomingSignals = [],
  onClearSignals
}) => {
  // Local Media State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isDockExpanded, setIsDockExpanded] = useState(true);

  // Peer Streams State: peerId -> MediaStream
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  // WebRTC Peer Connections ref: peerId -> RTCPeerConnection
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidatesBuffer = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const isOnline = room.mode === 'online';

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

      // Attach local tracks to any existing peer connections
      attachTracksToAllPeers(stream);
    } catch (err: any) {
      console.warn("Camera/Mic initial access error, trying audio-only:", err);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        setLocalStream(audioOnlyStream);
        localStreamRef.current = audioOnlyStream;
        setIsCameraOff(true);
        audioOnlyStream.getAudioTracks().forEach(t => (t.enabled = !isMicMuted));
        attachTracksToAllPeers(audioOnlyStream);
      } catch (audioErr: any) {
        console.error("Audio access denied:", audioErr);
        setPermissionError("Permiso de micrófono/cámara denegado.");
      }
    }
  };

  const attachTracksToAllPeers = (stream: MediaStream) => {
    peerConnections.current.forEach(pc => {
      const senders = pc.getSenders();
      stream.getTracks().forEach(track => {
        if (!senders.some(s => s.track === track)) {
          pc.addTrack(track, stream);
        }
      });
    });
  };

  useEffect(() => {
    startLocalMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      iceCandidatesBuffer.current.clear();
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
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
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
      // silent
    }
  };

  const flushIceCandidates = async (peerId: string, pc: RTCPeerConnection) => {
    const buf = iceCandidatesBuffer.current.get(peerId) || [];
    for (const cand of buf) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (e) {
        console.warn("Error adding buffered candidate:", e);
      }
    }
    iceCandidatesBuffer.current.delete(peerId);
  };

  // --- 3. PROCESS INCOMING SIGNALS QUEUE ---
  useEffect(() => {
    if (!incomingSignals || incomingSignals.length === 0) return;

    const queue = [...incomingSignals];
    if (onClearSignals) onClearSignals();

    const processQueue = async () => {
      for (const sig of queue) {
        if (sig.targetPlayerId !== currentPlayerId) continue;
        const { fromPlayerId, signal } = sig;
        const pc = createPeerConnection(fromPlayerId);

        if (signal.type === 'offer' && signal.sdp) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            await flushIceCandidates(fromPlayerId, pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal(fromPlayerId, { type: 'answer', sdp: answer });
          } catch (e) {
            console.error("Error handling offer:", e);
          }
        } else if (signal.type === 'answer' && signal.sdp) {
          try {
            if (pc.signalingState !== 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              await flushIceCandidates(fromPlayerId, pc);
            }
          } catch (e) {
            console.error("Error handling answer:", e);
          }
        } else if (signal.type === 'candidate' && signal.candidate) {
          try {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } else {
              const buf = iceCandidatesBuffer.current.get(fromPlayerId) || [];
              buf.push(signal.candidate);
              iceCandidatesBuffer.current.set(fromPlayerId, buf);
            }
          } catch (e) {
            console.warn("Error candidate:", e);
          }
        }
      }
    };

    processQueue();
  }, [incomingSignals, currentPlayerId]);

  // --- 4. INITIATE OFFERS TO OTHER PLAYERS ---
  const initiatePeerOffers = () => {
    if (!isOnline) return;

    const otherPlayers = room.players.filter(p => p.id !== currentPlayerId);

    otherPlayers.forEach(async (peer) => {
      // Deterministic order: lower lexicographical ID initiates offer
      if (currentPlayerId < peer.id) {
        const pc = createPeerConnection(peer.id);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal(peer.id, {
            type: 'offer',
            sdp: offer
          });
        } catch (err) {
          console.error("Error initiating offer:", err);
        }
      }
    });
  };

  useEffect(() => {
    initiatePeerOffers();
  }, [room.players.length, isOnline, !!localStream]);

  // Reset and Reconnect WebRTC connections manually
  const handleReconnect = () => {
    soundEngine.playClick();
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    iceCandidatesBuffer.current.clear();
    setRemoteStreams({});
    initiatePeerOffers();
  };

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

  return (
    <div className="w-full max-w-xl mx-auto px-4 mb-4 z-20">
      {/* Cybernetic Media Box */}
      <div className="bg-[#121622]/95 border border-[#00F0FF]/30 rounded-3xl p-3 sm:p-4 backdrop-blur-xl shadow-xl transition-all">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2B354C]">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" />
            <span className="text-[11px] font-mono font-black text-[#00F0FF] tracking-wider uppercase">
              AUDIO & CÁMARAS P2P
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReconnect}
              className="px-2 py-1 rounded-lg bg-[#1B2234] hover:bg-[#252E46] text-[#00F0FF] text-[10px] font-bold flex items-center gap-1 border border-[#00F0FF]/30"
              title="Reiniciar conexiones de video"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">RECONECTAR</span>
            </button>

            <button
              onClick={() => setIsDockExpanded(prev => !prev)}
              className="p-1 rounded-lg bg-[#1B2234] hover:bg-[#252E46] text-slate-300 transition-colors flex items-center gap-1 text-[10px] font-bold"
            >
              <Users className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>{room.players.length}</span>
              {isDockExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#00F0FF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#00F0FF]" />}
            </button>
          </div>
        </div>

        {/* Media Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0B0E17] p-2 rounded-2xl border border-[#2B354C]">
          {/* Audio & Video Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                isMicMuted
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                  : 'bg-[#00F0FF]/20 border border-[#00F0FF]/60 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
              }`}
            >
              {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 animate-pulse" />}
              <span>{isMicMuted ? 'MIC MUTE' : 'MIC ON'}</span>
            </button>

            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                isCameraOff
                  ? 'bg-slate-800 border border-slate-700 text-slate-400'
                  : 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              }`}
            >
              {isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
              <span>{isCameraOff ? 'CAM OFF' : 'CAM ON'}</span>
            </button>

            {/* Deafen Toggle */}
            <button
              onClick={toggleDeafen}
              className={`py-1.5 px-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                isDeafened
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                  : 'bg-[#1B2234] border border-[#2B354C] text-slate-300'
              }`}
            >
              {isDeafened ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
            </button>
          </div>

          <div className="text-[10px] font-mono text-[#00F0FF] font-bold">
            ● RED P2P ACTIVA
          </div>
        </div>

        {/* Expanded Video Grid View */}
        {isDockExpanded && (
          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 animate-fade-in">
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
                  className={`relative aspect-video rounded-xl overflow-hidden border transition-all flex flex-col justify-between p-1.5 shadow-md ${
                    isMe
                      ? 'bg-[#182032] border-[#00F0FF]/60'
                      : 'bg-[#0E1320] border-[#2B354C]'
                  }`}
                >
                  {/* Video Element */}
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#141A29] to-[#0A0D16] p-1">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center border shadow-sm"
                        style={{
                          backgroundColor: player.avatarColor + '20',
                          borderColor: player.avatarColor
                        }}
                      >
                        <AvatarIcon className="w-4 h-4" style={{ color: player.avatarColor }} />
                      </div>
                    </div>
                  )}

                  {/* Top Bar Badges */}
                  <div className="relative z-10 flex items-center justify-between pointer-events-none">
                    <span
                      className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider text-slate-950 shadow-sm truncate max-w-[80px]"
                      style={{ backgroundColor: player.avatarColor }}
                    >
                      {player.name} {isMe ? '(TÚ)' : ''}
                    </span>

                    {player.isHost && (
                      <span className="bg-amber-400 text-slate-950 font-black text-[8px] px-1 rounded shadow-sm">
                        HOST
                      </span>
                    )}
                  </div>

                  {/* Bottom Bar Indicator */}
                  <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-slate-300 bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800">
                    {playerMuted ? (
                      <span className="flex items-center gap-1 text-red-400 font-bold">
                        <MicOff className="w-2.5 h-2.5" /> MUTE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <Mic className="w-2.5 h-2.5 animate-pulse" /> VOZ
                      </span>
                    )}
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
