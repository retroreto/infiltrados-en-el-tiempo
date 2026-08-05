import React, { useEffect, useState } from 'react';
import { Rocket, ShieldAlert, CheckCircle2, ArrowRight, Sparkles, HelpCircle, Terminal } from 'lucide-react';
import { GameRoom, Player } from '../types';
import { soundEngine } from '../utils/AudioService';
import { HITOS_DATASET, HitoHistorico } from '../data/hitos';

interface EjectionViewProps {
  room: GameRoom;
  currentPlayerId: string;
  onInfiltratorGuessSubmit?: (guessedHitoId: number) => void;
  onContinueToGameOver: () => void;
}

export const EjectionView: React.FC<EjectionViewProps> = ({
  room,
  currentPlayerId,
  onInfiltratorGuessSubmit,
  onContinueToGameOver
}) => {
  const [step, setStep] = useState<'ejecting' | 'revealed' | 'infiltrator_guess'>('ejecting');
  const [selectedGuessId, setSelectedGuessId] = useState<number | null>(null);

  const exiledPlayer = room.players.find(p => p.id === room.exiledPlayerId);
  const exiledWasInfiltrator = room.exiledPlayerWasInfiltrator;
  const currentHito = room.currentHito;

  useEffect(() => {
    soundEngine.playEmergency();
    const timer1 = setTimeout(() => {
      setStep('revealed');
      soundEngine.playVictory();
    }, 3000);

    return () => clearTimeout(timer1);
  }, []);

  // Generate 4 multiple choice options for Infiltrator Guess if applicable
  const getGuessOptions = (): HitoHistorico[] => {
    if (!currentHito) return [];
    const sameCategory = HITOS_DATASET.filter(
      h => h.categoria === currentHito.categoria && h.id !== currentHito.id
    );
    // shuffle and pick 3 wrong options
    const shuffled = [...sameCategory].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [currentHito, ...shuffled].sort(() => 0.5 - Math.random());
    return options;
  };

  const [guessOptions] = useState<HitoHistorico[]>(getGuessOptions());

  const handleGuessSubmit = () => {
    if (selectedGuessId === null) return;
    soundEngine.playClick();
    if (onInfiltratorGuessSubmit) {
      onInfiltratorGuessSubmit(selectedGuessId);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-10 px-4 animate-fade-in text-center">
      {/* Space Void Animation Box - Windows UI */}
      <div className="relative w-full h-64 rounded-3xl bg-[#0B0E17] border border-[#2B354C] flex flex-col items-center justify-between p-5 overflow-hidden shadow-2xl">
        {/* Top bar window dots */}
        <div className="w-full flex items-center justify-between border-b border-[#2B354C] pb-2 z-20">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase tracking-widest">
            EXILIO A LÍNEA ALTERNA
          </span>
        </div>

        {/* Starfield simulation background */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:16px_16px] animate-pulse" />

        {step === 'ejecting' ? (
          <div className="relative z-10 space-y-3 my-auto animate-bounce">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#121622] border-2 border-[#E52E2E] flex items-center justify-center shadow-[0_0_30px_rgba(229,46,46,0.6)]">
              <Rocket className="w-10 h-10 text-[#E52E2E] -rotate-45" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                EXILIANDO AL VACÍO TEMPORAL...
              </div>
              <div className="text-xl font-black text-white">
                {exiledPlayer ? exiledPlayer.name : "Nadie fue exiliado (Empate)"}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 space-y-3 my-auto animate-fade-in">
            {exiledPlayer ? (
              <>
                <div
                  className={`w-20 h-20 mx-auto rounded-full border-2 flex items-center justify-center shadow-lg ${
                    exiledWasInfiltrator
                      ? 'bg-emerald-950/80 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                      : 'bg-red-950/80 border-[#E52E2E] shadow-[0_0_30px_rgba(229,46,46,0.5)]'
                  }`}
                >
                  {exiledWasInfiltrator ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-10 h-10 text-[#E52E2E]" />
                  )}
                </div>

                <div>
                  <div className="text-2xl font-black text-white">
                    {exiledPlayer.name}
                  </div>
                  <div className="text-xs text-slate-300">ha sido exiliado de la nave temporal.</div>
                </div>

                <div
                  className={`py-2 px-4 rounded-full border text-xs font-black uppercase tracking-wider inline-block ${
                    exiledWasInfiltrator
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-red-950 border-[#E52E2E] text-red-200'
                  }`}
                >
                  {exiledWasInfiltrator ? '¡ERA UN INFILTRADO!' : '¡ERA UN VIAJERO INOCENTE!'}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <HelpCircle className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
                <div className="text-xl font-black text-white">¡EMPATE DE VOTOS!</div>
                <div className="text-xs text-slate-300">Nadie fue exiliado en esta ronda.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Infiltrator Last Guess Option if Exiled Infiltrator */}
      {step === 'revealed' && exiledWasInfiltrator && (
        <div className="p-4 bg-[#121622]/90 border border-red-500/50 rounded-3xl space-y-3 text-left backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2 text-[#E52E2E] font-bold text-xs uppercase tracking-wider border-b border-[#2B354C] pb-2">
            <Sparkles className="w-4 h-4" />
            <span>ÚLTIMA OPORTUNIDAD DEL INFILTRADO</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            ¡El Infiltrado fue descubierto! Sin embargo, si adivina el hito histórico exacto entre las siguientes opciones, <strong className="text-[#E52E2E]">¡ROBARÁ LA VICTORIA!</strong>
          </p>

          <div className="space-y-2">
            {guessOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedGuessId(option.id)}
                className={`w-full p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                  selectedGuessId === option.id
                    ? 'bg-red-950 border-[#E52E2E] text-white shadow-[0_0_15px_rgba(229,46,46,0.4)]'
                    : 'bg-[#0B0E17] border-[#2B354C] text-slate-300 hover:border-[#00F0FF]/50'
                }`}
              >
                "{option.hito}"
              </button>
            ))}
          </div>

          <button
            onClick={handleGuessSubmit}
            disabled={selectedGuessId === null}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
              selectedGuessId !== null
                ? 'bg-[#E52E2E] hover:bg-red-500 text-white shadow-[0_0_20px_rgba(229,46,46,0.4)]'
                : 'bg-[#121622] text-slate-500 border border-[#2B354C] cursor-not-allowed'
            }`}
          >
            ENVIAR ADIVINANZA DEL INFILTRADO
          </button>
        </div>
      )}

      {/* Continue Button if not guessing */}
      {step === 'revealed' && !exiledWasInfiltrator && (
        <button
          onClick={onContinueToGameOver}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#00F0FF] via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black rounded-2xl shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
        >
          <span>VER RESULTADO DE LA MISIÓN</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default EjectionView;

