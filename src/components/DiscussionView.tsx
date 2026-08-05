import React, { useEffect, useState } from 'react';
import { Clock, Siren, Volume2, ShieldAlert, Sparkles, MessageSquare, Play, Pause, ChevronRight } from 'lucide-react';
import { GameRoom, Player } from '../types';
import { AVATAR_ICONS } from './AvatarPicker';
import { soundEngine } from '../utils/AudioService';

interface DiscussionViewProps {
  room: GameRoom;
  currentPlayerId: string;
  onTriggerVote: () => void;
  onTimerTick?: (secondsLeft: number) => void;
}

export const DiscussionView: React.FC<DiscussionViewProps> = ({
  room,
  currentPlayerId,
  onTriggerVote
}) => {
  const [seconds, setSeconds] = useState(room.timerRemaining);
  const [turnIndex, setTurnIndex] = useState(0);

  const activePlayers = room.players.filter(p => !p.isExiled);
  const currentTurnPlayer = activePlayers[turnIndex % activePlayers.length];

  useEffect(() => {
    if (room.settings.timerSeconds === 0) return; // Infinite time

    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          soundEngine.playEmergency();
          onTriggerVote();
          return 0;
        }
        if (prev <= 30 && prev % 5 === 0) {
          soundEngine.playTimerTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [room.settings.timerSeconds, onTriggerVote]);

  const handleNextTurn = () => {
    soundEngine.playClick();
    setTurnIndex(prev => prev + 1);
  };

  const handleEmergencyVote = () => {
    soundEngine.playEmergency();
    onTriggerVote();
  };

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCritical = seconds > 0 && seconds <= 30;

  return (
    <div className="w-full max-w-md mx-auto space-y-5 pb-10 px-4 animate-fade-in">
      {/* Category Banner */}
      {room.currentHito && (
        <div className="p-3.5 bg-[#121622]/90 border border-[#00F0FF]/40 rounded-2xl text-center backdrop-blur-xl flex items-center justify-between shadow-md">
          <div className="text-left">
            <div className="text-[10px] font-black text-[#00F0FF] uppercase tracking-wider">
              CATEGORÍA DE LA MISIÓN
            </div>
            <div className="text-sm font-black text-white">
              {room.currentHito.categoria}
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-[#00F0FF] animate-spin-slow" />
        </div>
      )}

      {/* Sci-Fi Timer Countdown Display */}
      {room.settings.timerSeconds > 0 ? (
        <div className={`p-6 rounded-3xl border text-center transition-all duration-300 relative overflow-hidden backdrop-blur-xl shadow-2xl ${
          isCritical
            ? 'bg-red-950/90 border-[#E52E2E] shadow-[0_0_40px_rgba(229,46,46,0.5)] animate-pulse'
            : 'bg-[#121622]/90 border-[#2B354C] shadow-[0_10px_30px_rgba(0,0,0,0.6)]'
        }`}>
          {/* Window control bar */}
          <div className="flex items-center justify-between border-b border-[#2B354C] pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              RELOJ TEMPORAL
            </span>
          </div>

          <div className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-1 flex items-center justify-center gap-1.5">
            <Clock className={`w-4 h-4 ${isCritical ? 'text-[#E52E2E] animate-spin' : 'text-[#00F0FF]'}`} />
            <span>TIEMPO RESTANTE DE DISCUSIÓN</span>
          </div>

          <div className={`text-5xl font-mono font-black tracking-widest ${
            isCritical ? 'text-red-200 drop-shadow-[0_0_15px_rgba(229,46,46,0.8)]' : 'text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]'
          }`}>
            {formatTime(seconds)}
          </div>

          <div className="text-[10px] text-slate-400 mt-2">
            El debate finalizará automáticamente al llegar a cero
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#121622]/90 border border-[#2B354C] rounded-2xl text-center shadow-lg">
          <div className="text-xs font-black text-[#00F0FF] uppercase tracking-widest">
            DISCUSIÓN SIN LÍMITE DE TIEMPO
          </div>
          <div className="text-xs text-slate-300 mt-1">
            Debatan libremente y cuando estén listos pulsen el Botón de Emergencia para votar.
          </div>
        </div>
      )}

      {/* Clue Turn Tracker */}
      {currentTurnPlayer && (
        <div className="p-4 bg-[#121622]/90 border border-[#2B354C] rounded-3xl space-y-3 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between border-b border-[#2B354C] pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00F0FF]">
              <MessageSquare className="w-4 h-4" />
              <span>RONDA DE PISTAS POR TURNO</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              Turno {turnIndex + 1}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 bg-[#0B0E17] rounded-2xl border border-[#2B354C]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${currentTurnPlayer.avatarColor}25`,
                  borderColor: currentTurnPlayer.avatarColor,
                  borderWidth: '2px'
                }}
              >
                {React.createElement(AVATAR_ICONS[currentTurnPlayer.avatarIconIndex || 0] || Sparkles, {
                  className: "w-5 h-5",
                  style: { color: currentTurnPlayer.avatarColor }
                })}
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Agente dando pista:</div>
                <div className="text-sm font-black text-white">{currentTurnPlayer.name}</div>
              </div>
            </div>

            <button
              onClick={handleNextTurn}
              className="px-3 py-2 bg-[#1B2234] hover:bg-[#252E46] border border-[#00F0FF]/40 text-[#00F0FF] font-black rounded-xl text-xs transition-all flex items-center gap-1 shrink-0"
            >
              <span>SIGUIENTE</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Active Crew Roster */}
      <div className="bg-[#121622]/90 border border-[#2B354C] rounded-2xl p-4 backdrop-blur-xl space-y-2">
        <div className="text-xs font-bold text-slate-300">
          TRIPULACIÓN ACTIVA ({activePlayers.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {activePlayers.map(p => (
            <div
              key={p.id}
              className="px-3 py-1 bg-[#0B0E17] border border-[#2B354C] rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.avatarColor }} />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Giant Emergency Button */}
      <div className="pt-2">
        <button
          onClick={handleEmergencyVote}
          className="w-full py-5 px-6 bg-gradient-to-r from-[#E52E2E] via-red-600 to-[#D92626] hover:from-red-500 hover:to-rose-500 text-white font-black rounded-3xl shadow-[0_0_35px_rgba(229,46,46,0.6)] border-2 border-red-400 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg uppercase tracking-wider animate-pulse"
        >
          <Siren className="w-7 h-7 text-white fill-current" />
          <span>CONVOCAR VOTACIÓN DE EXILIO</span>
        </button>
      </div>
    </div>
  );
};

export default DiscussionView;

