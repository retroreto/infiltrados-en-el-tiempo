import React, { useState } from 'react';
import { Eye, EyeOff, ShieldAlert, Sparkles, CheckCircle2, HelpCircle, ArrowRight, Smartphone, Compass, Shield, Lock } from 'lucide-react';
import { GameRoom, Player } from '../types';
import { soundEngine } from '../utils/AudioService';

interface RoleRevealViewProps {
  room: GameRoom;
  currentPlayerId: string;
  onConfirmReveal: () => void;
  onNextPlayerPassAndPlay?: () => void;
}

export const RoleRevealView: React.FC<RoleRevealViewProps> = ({
  room,
  currentPlayerId,
  onConfirmReveal,
  onNextPlayerPassAndPlay
}) => {
  const [isHolding, setIsHolding] = useState(false);

  // In pass and play mode, active player is based on index
  const isPassAndPlay = room.mode === 'pass_and_play';
  const activePlayer: Player = isPassAndPlay
    ? room.players[room.activePlayerIndexForReveal || 0]
    : room.players.find(p => p.id === currentPlayerId) || room.players[0];

  const isViajero = activePlayer?.role === 'VIAJERO';
  const isInfiltrado = activePlayer?.role === 'INFILTRADO';
  const currentHito = room.currentHito;

  const handleHoldStart = () => {
    setIsHolding(true);
    soundEngine.playReveal();
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
  };

  const handleConfirm = () => {
    soundEngine.playClick();
    if (isPassAndPlay && onNextPlayerPassAndPlay) {
      onNextPlayerPassAndPlay();
      setIsHolding(false);
    } else {
      onConfirmReveal();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5 pb-10 px-4 animate-fade-in">
      {/* Pass & Play Header if applicable */}
      {isPassAndPlay && (
        <div className="p-3.5 bg-[#00F0FF]/10 border border-[#00F0FF]/40 rounded-2xl text-center space-y-1 backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 text-[#00F0FF] font-black text-xs uppercase tracking-wider">
            <Smartphone className="w-4 h-4 animate-bounce" />
            <span>MODO PÁSALO - REVELACIÓN DE ROL</span>
          </div>
          <div className="text-base font-black text-white">
            Pasa el celular a: <span className="text-[#00F0FF] underline">{activePlayer?.name}</span>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="text-center space-y-1.5">
        <h2 className="text-lg font-black text-white uppercase tracking-wider">
          CONSULTA TU ROL EN LA MISIÓN
        </h2>
        <p className="text-xs text-slate-300">
          Asegúrate de que nadie más esté mirando tu pantalla antes de revelar.
        </p>
      </div>

      {/* Interactive Hold-to-Reveal Card */}
      <div
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        className={`w-full min-h-[380px] rounded-3xl border p-6 flex flex-col items-center justify-between transition-all duration-300 select-none relative overflow-hidden cursor-pointer shadow-2xl backdrop-blur-xl ${
          !isHolding
            ? 'bg-[#121622]/95 border-[#2B354C] shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
            : isViajero
            ? 'bg-[#0B0E17] border-[#00F0FF] shadow-[0_0_50px_rgba(0,240,255,0.4)]'
            : 'bg-[#0B0E17] border-[#E52E2E] shadow-[0_0_50px_rgba(229,46,46,0.5)]'
        }`}
      >
        {/* Top bar window dots */}
        <div className="w-full flex items-center justify-between border-b border-[#2B354C] pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            {isHolding ? (isViajero ? 'VIAJERO DEL TIEMPO' : '¡ALERTA INFILTRADO!') : 'EXPEDIENTE ENCRIPTADO'}
          </span>
        </div>

        {!isHolding ? (
          /* Cover State */
          <div className="my-auto flex flex-col items-center space-y-5 text-center p-2">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-[#0B0E17] border border-[#2B354C] flex items-center justify-center shadow-inner">
                <Lock className="w-12 h-12 text-[#00F0FF] animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 bg-[#E52E2E] rounded-full text-white shadow-lg">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-base font-black text-white uppercase tracking-wider">
                MANTÉN PRESIONADO PARA VER ROL
              </div>
              <div className="text-xs text-[#00F0FF] font-bold">
                Pulsa y sostén con tu dedo para desbloquear la tarjeta
              </div>
            </div>

            <div className="py-2 px-4 bg-[#1B2234] border border-[#2B354C] rounded-full text-[11px] text-slate-300 font-semibold">
              Mantén tu dedo presionado sobre la tarjeta
            </div>
          </div>
        ) : (
          /* Revealed Secret Content */
          <div className="w-full h-full flex flex-col items-center justify-between animate-fade-in text-center space-y-4">
            {isViajero ? (
              /* VIAJERO REVEAL MODE */
              <div className="space-y-3 w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00F0FF]/15 border border-[#00F0FF] rounded-full text-[#00F0FF] font-black text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-[#00F0FF]" />
                  <span>ERES VIAJERO DEL TIEMPO</span>
                </div>

                {currentHito && (
                  <div className="p-4 bg-[#121622] border border-[#00F0FF]/40 rounded-2xl space-y-3 shadow-inner">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#00F0FF]">
                      CATEGORÍA: {currentHito.categoria}
                    </div>

                    <div className="text-xl font-black text-white leading-snug">
                      "{currentHito.hito}"
                    </div>

                    {currentHito.imagen && (
                      <div className="w-full h-28 rounded-xl overflow-hidden border border-[#2B354C]">
                        <img
                          src={currentHito.imagen}
                          alt={currentHito.hito}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="p-2.5 bg-[#0B0E17] rounded-xl border border-[#2B354C] text-xs text-slate-200 text-left">
                      <strong className="text-[#00F0FF]">Pista Privada:</strong> {currentHito.pista}
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-slate-300 bg-[#00F0FF]/10 border border-[#00F0FF]/30 p-2.5 rounded-xl font-medium">
                  Da pistas sutiles sobre este hito histórico sin ser demasiado explícito.
                </div>
              </div>
            ) : (
              /* INFILTRADO REVEAL MODE */
              <div className="space-y-4 w-full my-auto">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg.red-950/80 border border-[#E52E2E] rounded-full text-red-200 font-black text-xs uppercase tracking-wider animate-bounce">
                  <ShieldAlert className="w-4 h-4 text-[#E52E2E]" />
                  <span>¡ALERTA ROJA!</span>
                </div>

                <div className="p-5 bg-red-950/50 border-2 border-[#E52E2E] rounded-2xl space-y-3 shadow-[0_0_30px_rgba(229,46,46,0.4)]">
                  <div className="text-2xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_10px_rgba(229,46,46,0.8)]">
                    ¡ERES EL INFILTRADO!
                  </div>

                  <p className="text-xs text-red-100 font-medium leading-relaxed">
                    Pasa desapercibido. No conoces el hito exacto. Escucha atentamente las pistas de los viajeros y disimula.
                  </p>

                  {currentHito && (
                    <div className="pt-2 border-t border-red-500/40 text-left text-xs">
                      <span className="text-red-300 font-bold">Categoría Detectada:</span>{" "}
                      <span className="text-white font-black">{currentHito.categoria}</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-300 bg-[#0B0E17] border border-[#2B354C] p-2.5 rounded-xl font-medium">
                  Consejo: Apóyate en respuestas ambiguas o adáptate a lo que dicen los demás.
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Suelta la pantalla para ocultar tu rol
            </div>
          </div>
        )}
      </div>

      {/* Confirmation button */}
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full py-4 px-5 bg-gradient-to-r from-[#E52E2E] via-red-600 to-[#D92626] hover:from-red-500 hover:to-rose-500 text-white font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,46,46,0.4)] border border-red-400/30"
      >
        <span>
          {isPassAndPlay ? 'Rol Visto - Siguiente Jugador' : 'Entendido - Continuar a Discusión'}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default RoleRevealView;

