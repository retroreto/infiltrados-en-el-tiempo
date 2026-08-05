import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import type { GameRoom, Player, RoomSettings, GamePhase, PlayerRole } from "./src/types";
import { getRandomHito, HITOS_DATASET, type HitoHistorico } from "./src/data/hitos";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory rooms database
const rooms: Map<string, GameRoom> = new Map();
// SSE clients per room code
const roomSseClients: Map<string, Set<Response>> = new Map();

function broadcastRoomUpdate(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const clients = roomSseClients.get(roomCode);
  if (clients) {
    const data = `data: ${JSON.stringify(room)}\n\n`;
    clients.forEach(res => {
      try {
        res.write(data);
      } catch (err) {
        // client disconnected
      }
    });
  }
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

// API Routes
app.post("/api/rooms/create", (req: Request, res: Response) => {
  const { playerName, avatarColor, avatarIconIndex, settings } = req.body;
  const roomCode = generateRoomCode();
  const hostId = "p_" + Math.random().toString(36).substring(2, 9);

  const hostPlayer: Player = {
    id: hostId,
    name: playerName || "Host Viajero",
    avatarColor: avatarColor || "#00F0FF",
    avatarIconIndex: avatarIconIndex || 0,
    isHost: true,
    score: 0
  };

  const defaultSettings: RoomSettings = {
    infiltratorCount: settings?.infiltratorCount || 1,
    timerSeconds: settings?.timerSeconds || 120,
    categoryFilter: settings?.categoryFilter || "Todas las Eras",
    fakeClueForInfiltrator: settings?.fakeClueForInfiltrator || false
  };

  const room: GameRoom = {
    roomCode,
    hostId,
    mode: "online",
    phase: "lobby",
    players: [hostPlayer],
    currentHito: null,
    settings: defaultSettings,
    timerRemaining: defaultSettings.timerSeconds,
    timerActive: false,
    currentTurnPlayerId: null,
    exiledPlayerId: null,
    exiledPlayerWasInfiltrator: null,
    infiltratorGuessedCorrectly: null,
    winnerTeam: null,
    activePlayerIndexForReveal: 0,
    updatedAt: Date.now()
  };

  rooms.set(roomCode, room);
  res.json({ success: true, room, playerId: hostId });
});

app.post("/api/rooms/join", (req: Request, res: Response) => {
  const { roomCode, playerName, avatarColor, avatarIconIndex } = req.body;
  const code = (roomCode || "").toUpperCase().trim();
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ success: false, message: "Código de Misión no encontrado" });
  }

  if (room.phase !== "lobby" && room.phase !== "home") {
    return res.status(400).json({ success: false, message: "La Misión ya ha comenzado" });
  }

  const playerId = "p_" + Math.random().toString(36).substring(2, 9);
  const newPlayer: Player = {
    id: playerId,
    name: playerName || `Agente ${room.players.length + 1}`,
    avatarColor: avatarColor || "#00F0FF",
    avatarIconIndex: avatarIconIndex || 0,
    isHost: false,
    score: 0
  };

  room.players.push(newPlayer);
  room.updatedAt = Date.now();
  
  broadcastRoomUpdate(code);
  res.json({ success: true, room, playerId });
});

app.get("/api/rooms/:code", (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ success: false, message: "Misión no encontrada" });
  }
  res.json({ success: true, room });
});

app.get("/api/rooms/:code/stream", (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ message: "Misión no encontrada" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (!roomSseClients.has(code)) {
    roomSseClients.set(code, new Set());
  }
  roomSseClients.get(code)!.add(res);

  // Send initial state
  res.write(`data: ${JSON.stringify(room)}\n\n`);

  req.on("close", () => {
    const clients = roomSseClients.get(code);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        roomSseClients.delete(code);
      }
    }
  });
});

app.post("/api/rooms/:code/settings", (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const { playerId, settings } = req.body;
  const room = rooms.get(code);

  if (!room || room.hostId !== playerId) {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  room.settings = { ...room.settings, ...settings };
  room.timerRemaining = room.settings.timerSeconds;
  room.updatedAt = Date.now();

  broadcastRoomUpdate(code);
  res.json({ success: true, room });
});

app.post("/api/rooms/:code/start", (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const { playerId } = req.body;
  const room = rooms.get(code);

  if (!room || room.hostId !== playerId) {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  if (room.players.length < 3) {
    return res.status(400).json({ success: false, message: "Se requieren al menos 3 tripulantes para iniciar" });
  }

  // Choose secret Hito
  const hito = getRandomHito(room.settings.categoryFilter);
  room.currentHito = hito;

  // Determine number of infiltrators
  let infiltratorCount = Math.min(room.settings.infiltratorCount, Math.floor(room.players.length / 2));
  if (infiltratorCount < 1) infiltratorCount = 1;

  // Assign roles randomly
  const playerIndexes = room.players.map((_, idx) => idx);
  // Shuffle indexes
  for (let i = playerIndexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playerIndexes[i], playerIndexes[j]] = [playerIndexes[j], playerIndexes[i]];
  }

  const infiltratorIndexes = new Set(playerIndexes.slice(0, infiltratorCount));

  room.players.forEach((p, idx) => {
    p.role = infiltratorIndexes.has(idx) ? "INFILTRADO" : "VIAJERO";
    p.isExiled = false;
    p.hasVoted = false;
    p.votedForId = null;
    p.revealedRole = false;
  });

  room.phase = "role_reveal";
  room.timerRemaining = room.settings.timerSeconds;
  room.timerActive = false;
  room.exiledPlayerId = null;
  room.exiledPlayerWasInfiltrator = null;
  room.infiltratorGuessedCorrectly = null;
  room.winnerTeam = null;
  room.activePlayerIndexForReveal = 0;
  room.updatedAt = Date.now();

  broadcastRoomUpdate(code);
  res.json({ success: true, room });
});

app.post("/api/rooms/:code/start-discussion", (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const { playerId } = req.body;
  const room = rooms.get(code);

  if (!room) return res.status(404).json({ success: false });

  room.phase = "discussion";
  room.timerRemaining = room.settings.timerSeconds;
  room.timerActive = room.settings.timerSeconds > 0;
  // Choose random starting player for clues
  const activePlayers = room.players.filter(p => !p.isExiled);
  const firstPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
  room.currentTurnPlayerId = firstPlayer ? firstPlayer.id : null;
  room.updatedAt = Date.now();

  broadcastRoomUpdate(code);
  res.json({ success: true, room });
});

app.post("/api/rooms/:code/trigger-vote", (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);

  if (!room) return res.status(404).json({ success: false });

  room.phase = "voting";
  room.timerActive = false;
  room.players.forEach(p => {
    p.hasVoted = false;
    p.votedForId = null;
  });
  room.updatedAt = Date.now();

  broadcastRoomUpdate(code);
  res.json({ success: true, room });
});

app.post("/api/rooms/:code/vote", (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const { playerId, targetPlayerId } = req.body;
  const room = rooms.get(code);

  if (!room || room.phase !== "voting") return res.status(400).json({ success: false });

  const voter = room.players.find(p => p.id === playerId);
  if (voter) {
    voter.hasVoted = true;
    voter.votedForId = targetPlayerId;
  }

  // Check if all active players voted
  const activePlayers = room.players.filter(p => !p.isExiled);
  const allVoted = activePlayers.every(p => p.hasVoted);

  if (allVoted) {
    // Resolve vote
    resolveVotingProcess(room);
  }

  room.updatedAt = Date.now();
  broadcastRoomUpdate(code);
  res.json({ success: true, room });
});

function resolveVotingProcess(room: GameRoom) {
  const voteCounts: Record<string, number> = {};
  room.players.filter(p => !p.isExiled).forEach(p => {
    if (p.votedForId) {
      voteCounts[p.votedForId] = (voteCounts[p.votedForId] || 0) + 1;
    }
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

  if (isTie || !exiledId) {
    // Tie - no one exiled
    room.exiledPlayerId = null;
    room.exiledPlayerWasInfiltrator = null;
  } else {
    room.exiledPlayerId = exiledId;
    const exiledPlayer = room.players.find(p => p.id === exiledId);
    if (exiledPlayer) {
      exiledPlayer.isExiled = true;
      room.exiledPlayerWasInfiltrator = exiledPlayer.role === "INFILTRADO";
    }
  }

  // Check victory conditions or moving to infiltrator guess
  if (room.exiledPlayerWasInfiltrator) {
    // Infiltrator was voted out -> give them one chance to guess secret Hito!
    room.phase = "infiltrator_guess";
  } else {
    // Check remaining infiltrators
    const remainingInfiltrators = room.players.filter(p => !p.isExiled && p.role === "INFILTRADO");
    const remainingViajeros = room.players.filter(p => !p.isExiled && p.role === "VIAJERO");

    if (remainingInfiltrators.length === 0) {
      // Viajeros win
      room.winnerTeam = "VIAJEROS";
      room.phase = "game_over";
    } else if (remainingInfiltrators.length >= remainingViajeros.length) {
      // Infiltrados win by parity or majority!
      room.winnerTeam = "INFILTRADOS";
      room.phase = "game_over";
    } else {
      // Continue game / reveal ejection result
      room.phase = "ejection";
    }
  }
}

app.post("/api/rooms/:code/infiltrator-guess", (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const { guessedHitoId } = req.body;
  const room = rooms.get(code);

  if (!room || !room.currentHito) return res.status(400).json({ success: false });

  const correct = guessedHitoId === room.currentHito.id;
  room.infiltratorGuessedCorrectly = correct;

  if (correct) {
    // Infiltrator guessed right -> stolen victory!
    room.winnerTeam = "INFILTRADOS";
    // Award score
    room.players.filter(p => p.role === "INFILTRADO").forEach(p => p.score += 3);
  } else {
    // Viajeros win
    room.winnerTeam = "VIAJEROS";
    room.players.filter(p => p.role === "VIAJERO").forEach(p => p.score += 2);
  }

  room.phase = "game_over";
  room.updatedAt = Date.now();
  broadcastRoomUpdate(code);
  res.json({ success: true, room });
});

app.post("/api/rooms/:code/next-round", (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const { playerId } = req.body;
  const room = rooms.get(code);

  if (!room || room.hostId !== playerId) {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  room.phase = "lobby";
  room.currentHito = null;
  room.exiledPlayerId = null;
  room.exiledPlayerWasInfiltrator = null;
  room.infiltratorGuessedCorrectly = null;
  room.winnerTeam = null;
  room.players.forEach(p => {
    p.role = undefined;
    p.isExiled = false;
    p.hasVoted = false;
    p.votedForId = null;
    p.revealedRole = false;
  });
  room.updatedAt = Date.now();

  broadcastRoomUpdate(code);
  res.json({ success: true, room });
});

// Vite middleware / Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const assetsPath = path.join(distPath, "assets");

    app.use("/assets", express.static(assetsPath));
    app.use("/infiltrado/assets", express.static(assetsPath));
    app.use("/infiltrado", express.static(distPath));
    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[INFILTRADO v2] Server running on http://localhost:${PORT}`);
  });
}

startServer();
