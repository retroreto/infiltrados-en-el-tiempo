import type { HitoHistorico } from './data/hitos';

export type GameMode = 'online' | 'pass_and_play';

export type GamePhase = 
  | 'home' 
  | 'lobby' 
  | 'role_reveal' 
  | 'discussion' 
  | 'voting' 
  | 'ejection' 
  | 'infiltrator_guess' 
  | 'game_over';

export type PlayerRole = 'VIAJERO' | 'INFILTRADO';

export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  avatarIconIndex: number;
  isHost: boolean;
  role?: PlayerRole;
  isExiled?: boolean;
  score: number;
  hasVoted?: boolean;
  votedForId?: string | null;
  revealedRole?: boolean;
}

export interface RoomSettings {
  infiltratorCount: number; // 1 or 2
  timerSeconds: number; // 60, 120, 180, 300, 0 = infinite
  categoryFilter: string;
  fakeClueForInfiltrator: boolean;
}

export interface GameRoom {
  roomCode: string;
  hostId: string;
  mode: GameMode;
  phase: GamePhase;
  players: Player[];
  currentHito: HitoHistorico | null;
  settings: RoomSettings;
  timerRemaining: number;
  timerActive: boolean;
  currentTurnPlayerId: string | null;
  exiledPlayerId: string | null;
  exiledPlayerWasInfiltrator: boolean | null;
  infiltratorGuessedCorrectly: boolean | null;
  winnerTeam: 'VIAJEROS' | 'INFILTRADOS' | null;
  activePlayerIndexForReveal: number; // For Pass & Play mode
  updatedAt: number;
}
