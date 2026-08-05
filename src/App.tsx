import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { RoleRevealView } from './components/RoleRevealView';
import { DiscussionView } from './components/DiscussionView';
import { VotingView } from './components/VotingView';
import { EjectionView } from './components/EjectionView';
import { GameOverView } from './components/GameOverView';
import { RulesModal } from './components/RulesModal';
import { GameRoom, Player, RoomSettings, GamePhase, GameMode } from './types';
import { getRandomHito, HitoHistorico } from './data/hitos';
import { soundEngine } from './utils/AudioService';

export default function App() {
  // Local user profile state
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('infiltrado_player_name') || '';
  });
  const [avatarColor, setAvatarColor] = useState<string>(() => {
    return localStorage.getItem('infiltrado_avatar_color') || '#00F0FF';
  });
  const [avatarIconIndex, setAvatarIconIndex] = useState<number>(() => {
    return parseInt(localStorage.getItem('infiltrado_avatar_icon') || '0', 10);
  });
  const [myPlayerId, setMyPlayerId] = useState<string>('');

  // Active game room state
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Save profile changes to local storage
  useEffect(() => {
    if (playerName) localStorage.setItem('infiltrado_player_name', playerName);
    localStorage.setItem('infiltrado_avatar_color', avatarColor);
    localStorage.setItem('infiltrado_avatar_icon', avatarIconIndex.toString());
  }, [playerName, avatarColor, avatarIconIndex]);

  // Check URL query parameters for auto-join room code e.g., ?code=ABCD
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam && !room) {
      // Auto-join if code is present
      const code = codeParam.toUpperCase().trim();
      fetchRoomState(code);
    }
  }, []);

  // Real-time SSE / Sync connection for Online Room
  useEffect(() => {
    if (!room || room.mode === 'pass_and_play') return;

    // Connect to Server-Sent Events for real-time room updates
    const sseUrl = `/api/rooms/${room.roomCode}/stream`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const updatedRoom: GameRoom = JSON.parse(event.data);
        setRoom(updatedRoom);
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    // Polling fallback every 2 seconds
    const interval = setInterval(() => {
      fetchRoomState(room.roomCode);
    }, 2000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [room?.roomCode, room?.mode]);

  const fetchRoomState = async (code: string) => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      const data = await res.json();
      if (data.success) {
        setRoom(data.room);
      }
    } catch (err) {
      // ignore
    }
  };

  // --- ONLINE ROOM HANDLERS ---
  const handleCreateOnlineRoom = async () => {
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName || 'Host Viajero',
          avatarColor,
          avatarIconIndex
        })
      });
      const data = await res.json();
      if (data.success) {
        setMyPlayerId(data.playerId);
        setRoom(data.room);
      }
    } catch (err) {
      alert("Error al crear la sala. Intenta nuevamente.");
    }
  };

  const handleJoinOnlineRoom = async (code: string) => {
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          playerName: playerName || 'Agente Viajero',
          avatarColor,
          avatarIconIndex
        })
      });
      const data = await res.json();
      if (data.success) {
        setMyPlayerId(data.playerId);
        setRoom(data.room);
      } else {
        alert(data.message || "No se pudo unirse a la sala.");
      }
    } catch (err) {
      alert("Error al conectar con la sala.");
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<RoomSettings>) => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: myPlayerId,
          settings: newSettings
        })
      });
      const data = await res.json();
      if (data.success) setRoom(data.room);
    } catch (err) {
      // ignore
    }
  };

  const handleStartOnlineGame = async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId })
      });
      const data = await res.json();
      if (data.success) setRoom(data.room);
      else alert(data.message);
    } catch (err) {
      // ignore
    }
  };

  const handleConfirmRoleRevealOnline = async () => {
    if (!room) return;
    // When Host clicks proceed or all revealed, move to discussion
    if (room.hostId === myPlayerId) {
      try {
        const res = await fetch(`/api/rooms/${room.roomCode}/start-discussion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: myPlayerId })
        });
        const data = await res.json();
        if (data.success) setRoom(data.room);
      } catch (err) {
        // ignore
      }
    } else {
      // Non-host waits or marks revealed
    }
  };

  const handleTriggerVoteOnline = async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/trigger-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId })
      });
      const data = await res.json();
      if (data.success) setRoom(data.room);
    } catch (err) {
      // ignore
    }
  };

  const handleVoteOnline = async (targetPlayerId: string) => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: myPlayerId,
          targetPlayerId
        })
      });
      const data = await res.json();
      if (data.success) setRoom(data.room);
    } catch (err) {
      // ignore
    }
  };

  const handleInfiltratorGuessOnline = async (guessedHitoId: number) => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/infiltrator-guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guessedHitoId })
      });
      const data = await res.json();
      if (data.success) setRoom(data.room);
    } catch (err) {
      // ignore
    }
  };

  const handleNextRoundOnline = async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId })
      });
      const data = await res.json();
      if (data.success) setRoom(data.room);
    } catch (err) {
      // ignore
    }
  };

  // --- PASS AND PLAY (1 CELLULAR) HANDLERS ---
  const handleStartPassAndPlay = () => {
    const defaultPlayers: Player[] = [
      { id: 'p1', name: playerName || 'Agente 1', avatarColor: '#00F0FF', avatarIconIndex: 0, isHost: true, score: 0 },
      { id: 'p2', name: 'Agente 2', avatarColor: '#FF0055', avatarIconIndex: 1, isHost: false, score: 0 },
      { id: 'p3', name: 'Agente 3', avatarColor: '#00FF88', avatarIconIndex: 2, isHost: false, score: 0 },
      { id: 'p4', name: 'Agente 4', avatarColor: '#FFD700', avatarIconIndex: 3, isHost: false, score: 0 }
    ];

    const hito = getRandomHito("Todas las Eras");

    // Assign 1 Infiltrado
    const infiltratorIdx = Math.floor(Math.random() * defaultPlayers.length);
    defaultPlayers.forEach((p, idx) => {
      p.role = idx === infiltratorIdx ? 'INFILTRADO' : 'VIAJERO';
      p.isExiled = false;
      p.hasVoted = false;
    });

    const passRoom: GameRoom = {
      roomCode: 'PÁSALO',
      hostId: 'p1',
      mode: 'pass_and_play',
      phase: 'role_reveal',
      players: defaultPlayers,
      currentHito: hito,
      settings: {
        infiltratorCount: 1,
        timerSeconds: 120,
        categoryFilter: 'Todas las Eras',
        fakeClueForInfiltrator: false
      },
      timerRemaining: 120,
      timerActive: false,
      currentTurnPlayerId: 'p1',
      exiledPlayerId: null,
      exiledPlayerWasInfiltrator: null,
      infiltratorGuessedCorrectly: null,
      winnerTeam: null,
      activePlayerIndexForReveal: 0,
      updatedAt: Date.now()
    };

    setMyPlayerId('p1');
    setRoom(passRoom);
  };

  const handleNextPlayerPassAndPlay = () => {
    if (!room) return;
    const nextIdx = (room.activePlayerIndexForReveal || 0) + 1;
    if (nextIdx < room.players.length) {
      setRoom({
        ...room,
        activePlayerIndexForReveal: nextIdx
      });
    } else {
      // Everyone saw their roles -> start discussion
      setRoom({
        ...room,
        phase: 'discussion'
      });
    }
  };

  const handleResolveVotesPassAndPlay = (votesMap: Record<string, string>) => {
    if (!room) return;

    const voteCounts: Record<string, number> = {};
    Object.values(votesMap).forEach(targetId => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    let maxVotes = 0;
    let exiledId: string | null = null;
    let isTie = false;

    Object.entries(voteCounts).forEach(([targetId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        exiledId = targetId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    });

    const updatedPlayers = room.players.map(p => {
      if (p.id === exiledId && !isTie) {
        return { ...p, isExiled: true };
      }
      return p;
    });

    const exiledPlayer = updatedPlayers.find(p => p.id === exiledId);
    const wasInfiltrator = exiledPlayer ? exiledPlayer.role === 'INFILTRADO' : false;

    let winner: 'VIAJEROS' | 'INFILTRADOS' | null = null;
    let nextPhase: GamePhase = 'ejection';

    if (wasInfiltrator) {
      nextPhase = 'ejection';
    } else {
      const remainingInfils = updatedPlayers.filter(p => !p.isExiled && p.role === 'INFILTRADO');
      const remainingViajeros = updatedPlayers.filter(p => !p.isExiled && p.role === 'VIAJERO');

      if (remainingInfils.length === 0) {
        winner = 'VIAJEROS';
        nextPhase = 'game_over';
      } else if (remainingInfils.length >= remainingViajeros.length) {
        winner = 'INFILTRADOS';
        nextPhase = 'game_over';
      }
    }

    setRoom({
      ...room,
      players: updatedPlayers,
      exiledPlayerId: isTie ? null : exiledId,
      exiledPlayerWasInfiltrator: isTie ? null : wasInfiltrator,
      winnerTeam: winner,
      phase: nextPhase
    });
  };

  const handleNextRoundPassAndPlay = () => {
    if (!room) return;
    const hito = getRandomHito("Todas las Eras");
    const infiltratorIdx = Math.floor(Math.random() * room.players.length);

    const updatedPlayers = room.players.map((p, idx) => ({
      ...p,
      role: (idx === infiltratorIdx ? 'INFILTRADO' : 'VIAJERO') as any,
      isExiled: false,
      hasVoted: false
    }));

    setRoom({
      ...room,
      phase: 'role_reveal',
      currentHito: hito,
      players: updatedPlayers,
      exiledPlayerId: null,
      exiledPlayerWasInfiltrator: null,
      infiltratorGuessedCorrectly: null,
      winnerTeam: null,
      activePlayerIndexForReveal: 0
    });
  };

  const handleExitGame = () => {
    soundEngine.playClick();
    setRoom(null);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Dynamic Deep Space Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px]" />
      </div>

      <Navbar
        roomCode={room?.roomCode}
        mode={room?.mode}
        onOpenRules={() => setIsRulesOpen(true)}
        onExitGame={handleExitGame}
      />

      <main className="flex-1 z-10 pt-4">
        {!room ? (
          <HomeView
            playerName={playerName}
            avatarColor={avatarColor}
            avatarIconIndex={avatarIconIndex}
            onChangeName={setPlayerName}
            onChangeAvatarColor={setAvatarColor}
            onChangeAvatarIcon={setAvatarIconIndex}
            onCreateRoom={handleCreateOnlineRoom}
            onJoinRoom={handleJoinOnlineRoom}
            onStartPassAndPlay={handleStartPassAndPlay}
            onOpenRules={() => setIsRulesOpen(true)}
          />
        ) : room.phase === 'lobby' ? (
          <LobbyView
            room={room}
            currentPlayerId={myPlayerId}
            onUpdateSettings={handleUpdateSettings}
            onStartGame={handleStartOnlineGame}
            onLeaveRoom={handleExitGame}
          />
        ) : room.phase === 'role_reveal' ? (
          <RoleRevealView
            room={room}
            currentPlayerId={myPlayerId}
            onConfirmReveal={handleConfirmRoleRevealOnline}
            onNextPlayerPassAndPlay={handleNextPlayerPassAndPlay}
          />
        ) : room.phase === 'discussion' ? (
          <DiscussionView
            room={room}
            currentPlayerId={myPlayerId}
            onTriggerVote={handleTriggerVoteOnline}
          />
        ) : room.phase === 'voting' ? (
          <VotingView
            room={room}
            currentPlayerId={myPlayerId}
            onVote={handleVoteOnline}
            onResolveVotesPassAndPlay={handleResolveVotesPassAndPlay}
          />
        ) : room.phase === 'ejection' || room.phase === 'infiltrator_guess' ? (
          <EjectionView
            room={room}
            currentPlayerId={myPlayerId}
            onInfiltratorGuessSubmit={handleInfiltratorGuessOnline}
            onContinueToGameOver={() => setRoom({ ...room, phase: 'game_over' })}
          />
        ) : room.phase === 'game_over' ? (
          <GameOverView
            room={room}
            currentPlayerId={myPlayerId}
            onNextRound={room.mode === 'pass_and_play' ? handleNextRoundPassAndPlay : handleNextRoundOnline}
          />
        ) : null}
      </main>

      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
}
