import React from 'react';
import { Trophy, ShieldCheck, ShieldAlert, RotateCcw, Award, Check, Sparkles, MapPin, Terminal } from 'lucide-react';
import { GameRoom } from '../types';
import { soundEngine } from '../utils/AudioService';
import { AVATAR_ICONS } from './AvatarPicker';

interface GameOverViewProps {
  room: GameRoom;
  currentPlayerId: string;
  onNextRound: () => void;
}

export const GameOverView: React.FC<GameOverViewProps> = ({
  room,
  currentPlayerId,
  onNextRound
}) => {
  const isHost = room.hostId === currentPlayerId;
  const isViajerosWin = room.winnerTeam === 'VIAJEROS';
  const currentHito = room.currentHito;

  const handleNextRound = () => {
    soundEngine.playClick();
    onNextRound();
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5 pb-10 px-4 animate-fade-in">
      {/* Victory Banner - Windows OS Window Style */}
      <div
        className={`p-6 rounded-3xl border text-center relative overflow-hidden backdrop-blur-xl shadow-2xl ${
          isViajerosWin
            ? 'bg-[#121622]/95 border-[#00F0FF] shadow-[0_0_40px_rgba(0,240,255,0.3)]'
            : 'bg-red-950/95 border-[#E52E2E] shadow-[0_0_40px_rgba(229,46,46,0.4)]'
        }`}
      >
        {/* Top bar window control */}
        <div className="flex items-center justify-between border-b border-[#2B354C] pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
            INFORME FINAL DE LA MISIÓN
          </span>
        </div>

        <div className="relative z-10 space-y-3">
          <div
            className={`w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center shadow-lg ${
              isViajerosWin
                ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                : 'bg-red-950 border-[#E52E2E] text-red-300'
            }`}
          >
            {isViajerosWin ? (
              <ShieldCheck className="w-9 h-9" />
            ) : (
              <ShieldAlert className="w-9 h-9 text-[#E52E2E]" />
            )}
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-300">
              VICTORIA DE LA MISIÓN
            </div>
            <div className={`text-3xl font-black uppercase tracking-tight ${
              isViajerosWin ? 'text-[#00F0FF]' : 'text-red-400'
            }`}>
              {isViajerosWin ? '¡GANAN LOS VIAJEROS!' : '¡GANAN LOS INFILTRADOS!'}
            </div>
          </div>

          {room.infiltratorGuessedCorrectly && (
            <div className="py-1.5 px-3 bg.red-950/90 border border-[#E52E2E] rounded-full text-[11px] text-red-200 font-bold inline-block">
              ¡El Infiltrado adivinó el hito y robó la victoria!
            </div>
          )}
        </div>
      </div>

      {/* Secret Hito Reveal Card */}
      {currentHito && (
        <div className="p-5 bg-[#121622]/90 border border-[#2B354C] rounded-3xl space-y-3 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-2 text-[#00F0FF] font-bold text-xs uppercase tracking-wider border-b border-[#2B354C] pb-2">
            <MapPin className="w-4 h-4" />
            <span>EL HITO HISTÓRICO SECRETO ERA:</span>
          </div>

          <div className="text-center space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {currentHito.categoria}
            </div>

            <div className="text-xl font-black text-white">
              "{currentHito.hito}"
            </div>

            {currentHito.imagen && (
              <div className="w-full h-36 rounded-2xl overflow-hidden border border-[#2B354C] my-2">
                <img
                  src={currentHito.imagen}
                  alt={currentHito.hito}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <p className="text-xs text-slate-300 italic bg-[#0B0E17] p-3 rounded-xl border border-[#2B354C]">
              "{currentHito.pista}"
            </p>
          </div>
        </div>
      )}

      {/* Roster & Roles Breakdown Table */}
      <div className="bg-[#121622]/90 border border-[#2B354C] rounded-3xl p-5 backdrop-blur-xl space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-[#2B354C] pb-2">
          <Award className="w-4 h-4 text-[#00F0FF]" />
          <span>DESGLOSE DE ROLES Y PUNTAJES</span>
        </div>

        <div className="space-y-2">
          {room.players.map((p) => {
            const IconComp = AVATAR_ICONS[p.avatarIconIndex || 0] || Sparkles;
            const isInfil = p.role === 'INFILTRADO';

            return (
              <div
                key={p.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                  isInfil
                    ? 'bg-red-950/40 border-[#E52E2E]/50'
                    : 'bg-[#0B0E17] border-[#2B354C]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${p.avatarColor}25`,
                      borderColor: p.avatarColor,
                      borderWidth: '2px'
                    }}
                  >
                    <IconComp className="w-4 h-4" style={{ color: p.avatarColor }} />
                  </div>

                  <div className="truncate">
                    <div className="font-bold text-sm text-white truncate">{p.name}</div>
                    <div className={`text-[10px] font-black ${isInfil ? 'text-[#E52E2E]' : 'text-[#00F0FF]'}`}>
                      {isInfil ? 'INFILTRADO' : 'VIAJERO'}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-white">{p.score} pts</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Restart Button */}
      {isHost ? (
        <button
          onClick={handleNextRound}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#E52E2E] via-red-600 to-[#D92626] hover:from-red-500 hover:to-rose-500 text-white font-black rounded-2xl shadow-[0_0_25px_rgba(229,46,46,0.4)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-base border border-red-400/40 hover:scale-[1.02] active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          <span>NUEVA MISIÓN (SIGUIENTE RONDA)</span>
        </button>
      ) : (
        <div className="p-3.5 bg-[#0B0E17]/80 border border-[#2B354C] rounded-2xl text-center text-xs text-slate-300 font-medium">
          Esperando a que el Host comience la siguiente ronda...
        </div>
      )}
    </div>
  );
};

export default GameOverView;

