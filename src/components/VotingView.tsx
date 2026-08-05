import React, { useState } from 'react';
import { Shield, Vote, Check, AlertTriangle, Users, Lock, Sparkles, Terminal } from 'lucide-react';
import { GameRoom, Player } from '../types';
import { AVATAR_ICONS } from './AvatarPicker';
import { soundEngine } from '../utils/AudioService';

interface VotingViewProps {
  room: GameRoom;
  currentPlayerId: string;
  onVote: (targetPlayerId: string) => void;
  onResolveVotesPassAndPlay?: (votesMap: Record<string, string>) => void;
}

export const VotingView: React.FC<VotingViewProps> = ({
  room,
  currentPlayerId,
  onVote,
  onResolveVotesPassAndPlay
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [confirmedVote, setConfirmedVote] = useState(false);

  // For Pass & Play mode, we can collect votes sequentially
  const [passAndPlayVotes, setPassAndPlayVotes] = useState<Record<string, string>>({});
  const [passAndPlayVoterIndex, setPassAndPlayVoterIndex] = useState(0);

  const isPassAndPlay = room.mode === 'pass_and_play';
  const activePlayers = room.players.filter(p => !p.isExiled);

  const me = isPassAndPlay
    ? activePlayers[passAndPlayVoterIndex]
    : room.players.find(p => p.id === currentPlayerId);

  const handleSelect = (targetId: string) => {
    if (me?.hasVoted || confirmedVote) return;
    soundEngine.playClick();
    setSelectedTargetId(targetId);
  };

  const handleConfirmVote = () => {
    if (!selectedTargetId) return;
    soundEngine.playClick();

    if (isPassAndPlay) {
      const updatedVotes = { ...passAndPlayVotes, [me!.id]: selectedTargetId };
      setPassAndPlayVotes(updatedVotes);
      setSelectedTargetId(null);

      if (passAndPlayVoterIndex + 1 < activePlayers.length) {
        setPassAndPlayVoterIndex(prev => prev + 1);
      } else if (onResolveVotesPassAndPlay) {
        onResolveVotesPassAndPlay(updatedVotes);
      }
    } else {
      setConfirmedVote(true);
      onVote(selectedTargetId);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5 pb-10 px-4 animate-fade-in">
      {/* Header - Windows OS Window Style */}
      <div className="p-5 bg-red-950/90 border border-[#E52E2E] rounded-3xl text-center space-y-2 shadow-[0_0_35px_rgba(229,46,46,0.4)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-red-500/40 pb-2 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-[10px] font-mono font-bold text-red-200 uppercase tracking-widest">
            JUICIO TEMPORAL
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 text-red-300 font-black text-xs uppercase tracking-wider">
          <Vote className="w-4 h-4 animate-bounce text-[#E52E2E]" />
          <span>VOTACIÓN DE EXILIO</span>
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">
          ¿QUIÉN ES EL INFILTRADO?
        </h2>
        <p className="text-xs text-red-100/90 leading-relaxed">
          Selecciona a la persona sospechosa para enviarla al exilio de la línea temporal.
        </p>
      </div>

      {isPassAndPlay && (
        <div className="p-3.5 bg-[#00F0FF]/15 border border-[#00F0FF]/40 rounded-2xl text-center text-xs font-black text-[#00F0FF]">
          Turno de votar para: <span className="text-white underline">{me?.name}</span>
        </div>
      )}

      {/* Grid of Players */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
          <span>SELECCIONA UN SOSPECHOSO:</span>
          {me?.hasVoted || confirmedVote ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Voto Registrado
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activePlayers.map((player) => {
            const IconComp = AVATAR_ICONS[player.avatarIconIndex || 0] || Shield;
            const isSelected = selectedTargetId === player.id;
            const isMePlayer = player.id === me?.id;

            return (
              <button
                key={player.id}
                type="button"
                disabled={me?.hasVoted || confirmedVote}
                onClick={() => handleSelect(player.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden backdrop-blur-md ${
                  isSelected
                    ? 'bg-red-950/90 border-[#E52E2E] shadow-[0_0_20px_rgba(229,46,46,0.4)] scale-[1.02]'
                    : isMePlayer
                    ? 'bg-[#121622]/60 border-[#2B354C] opacity-60'
                    : 'bg-[#121622] border-[#2B354C] hover:border-[#00F0FF]/50'
                }`}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${player.avatarColor}25`,
                    borderColor: player.avatarColor,
                    borderWidth: '2px'
                  }}
                >
                  <IconComp className="w-5 h-5" style={{ color: player.avatarColor }} />
                </div>

                {/* Name & status */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white truncate flex items-center gap-1">
                    <span>{player.name}</span>
                    {isMePlayer && <span className="text-[10px] text-[#00F0FF] font-semibold">(Tú)</span>}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isSelected ? 'Sospechoso Seleccionado' : 'Toca para elegir'}
                  </div>
                </div>

                {isSelected && (
                  <div className="p-1 bg-[#E52E2E] rounded-full text-white">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Action */}
      {!me?.hasVoted && !confirmedVote ? (
        <button
          onClick={handleConfirmVote}
          disabled={!selectedTargetId}
          className={`w-full py-4 px-6 font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-base ${
            selectedTargetId
              ? 'bg-gradient-to-r from-[#E52E2E] via-red-600 to-[#D92626] hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_25px_rgba(229,46,46,0.5)] border border-red-400/40 hover:scale-[1.02] active:scale-95'
              : 'bg-[#121622] text-slate-500 border border-[#2B354C] cursor-not-allowed'
          }`}
        >
          <Vote className="w-5 h-5" />
          <span>CONFIRMAR VOTO A EXILIO</span>
        </button>
      ) : (
        <div className="p-4 bg-[#121622]/90 border border-emerald-500/40 rounded-2xl text-center space-y-1 backdrop-blur-xl">
          <div className="text-emerald-400 font-bold text-sm flex items-center justify-center gap-1.5">
            <Check className="w-5 h-5" />
            <span>VOTO CONFIRMADO SEGURAMENTE</span>
          </div>
          <p className="text-xs text-slate-300">
            Esperando a que los demás agentes terminen de emitir su voto...
          </p>
        </div>
      )}
    </div>
  );
};

export default VotingView;

