import React, { useState } from 'react';
import { Rocket, Users, Smartphone, Sparkles, Play, ShieldAlert, ArrowRight, Radio, Shield, Terminal } from 'lucide-react';
import { AvatarPicker } from './AvatarPicker';
import { soundEngine } from '../utils/AudioService';

interface HomeViewProps {
  playerName: string;
  avatarColor: string;
  avatarIconIndex: number;
  onChangeName: (name: string) => void;
  onChangeAvatarColor: (color: string) => void;
  onChangeAvatarIcon: (index: number) => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomCode: string) => void;
  onStartPassAndPlay: () => void;
  onOpenRules: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  playerName,
  avatarColor,
  avatarIconIndex,
  onChangeName,
  onChangeAvatarColor,
  onChangeAvatarIcon,
  onCreateRoom,
  onJoinRoom,
  onStartPassAndPlay,
  onOpenRules
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setErrorMsg('Ingresa un código de sala válido');
      return;
    }
    if (!playerName.trim()) {
      setErrorMsg('Ingresa tu nombre de agente');
      return;
    }
    soundEngine.playClick();
    onJoinRoom(inputCode.trim().toUpperCase());
  };

  const handleCreate = () => {
    if (!playerName.trim()) {
      setErrorMsg('Ingresa tu nombre de agente');
      return;
    }
    soundEngine.playClick();
    onCreateRoom();
  };

  const handlePassAndPlay = () => {
    soundEngine.playClick();
    onStartPassAndPlay();
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 pb-12 px-4 animate-fade-in">
      {/* Official Header Banner with RetroReto Logo */}
      <div className="text-center space-y-4 pt-2">
        <div className="relative inline-block w-full">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 via-[#00F0FF]/20 to-red-600/30 rounded-3xl blur-2xl opacity-50 animate-pulse pointer-events-none" />

          {/* Windows OS Window Card Header */}
          <div className="relative z-10 bg-[#121622]/90 border border-[#2B354C] rounded-3xl p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            {/* Windows Window Controls Header Bar */}
            <div className="flex items-center justify-between border-b border-[#2B354C] pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#00F0FF] uppercase tracking-widest bg-[#0B0E17] px-2.5 py-1 rounded-full border border-[#00F0FF]/30">
                <Terminal className="w-3 h-3" />
                <span>RETRORETO PRESENTA</span>
              </div>
            </div>

            {/* Logo grande */}
            <div className="py-2 flex justify-center">
              <img
                src={`${import.meta.env.BASE_URL}logo-infiltrados-white.png`}
                alt="RetroReto: Infiltrados en el tiempo"
                className="w-full max-w-xs sm:max-w-sm h-auto object-contain drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                referrerPolicy="no-referrer"
              />
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto mt-2 leading-relaxed font-medium">
              Un viaje temporal y un infiltrado oculto. ¡Descúbrelo!
            </p>
          </div>
        </div>
      </div>

      {/* Player Identity Setup Window Card */}
      <div className="bg-[#121622]/90 border border-[#2B354C] rounded-3xl p-5 backdrop-blur-xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2B354C] pb-2.5">
          <div className="flex items-center gap-2 text-[#00F0FF] font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>CONFIGURACIÓN DEL AGENTE</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">PASAPORTE A1</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">
            Nombre de Agente Temporal:
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              setErrorMsg('');
              onChangeName(e.target.value);
            }}
            placeholder="Ej: Agente Neo, Capitán..."
            maxLength={18}
            className="w-full bg-[#0B0E17] border border-[#2B354C] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] text-white font-semibold rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-600"
          />
        </div>

        {/* Custom Avatar Picker */}
        <AvatarPicker
          selectedColor={avatarColor}
          selectedIconIndex={avatarIconIndex}
          onSelectColor={onChangeAvatarColor}
          onSelectIcon={onChangeAvatarIcon}
        />
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/90 border border-red-500/60 rounded-xl text-red-200 text-xs font-bold text-center animate-shake flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Action Windows: Host Mission vs Join Code */}
      <div className="space-y-3">
        {/* Create Mission (Host) Button */}
        <button
          type="button"
          onClick={handleCreate}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#E52E2E] via-red-600 to-[#D92626] hover:from-red-500 hover:to-rose-500 text-white font-black rounded-2xl shadow-[0_0_25px_rgba(229,46,46,0.4)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-base uppercase tracking-wider border border-red-400/40"
        >
          <Rocket className="w-5 h-5 text-white fill-current" />
          <span>CREAR MISIÓN (HOST)</span>
        </button>

        {/* Join Code Window */}
        <form onSubmit={handleJoin} className="bg-[#121622]/90 border border-[#2B354C] rounded-2xl p-4 backdrop-blur-xl space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00F0FF]" />
            <span>UNIRSE A MISIÓN EXISTENTE CON CÓDIGO</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => {
                setErrorMsg('');
                setInputCode(e.target.value.toUpperCase());
              }}
              placeholder="CÓDIGO DE SALA"
              maxLength={6}
              className="flex-1 bg-[#0B0E17] border border-[#2B354C] focus:border-[#00F0FF] text-[#00F0FF] font-mono font-black text-center text-lg rounded-xl px-3 py-2.5 uppercase tracking-widest outline-none placeholder:text-slate-600 placeholder:font-sans placeholder:text-xs placeholder:font-normal"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1B2234] hover:bg-[#252E46] border border-[#00F0FF]/40 text-[#00F0FF] font-extrabold rounded-xl text-sm transition-all hover:text-white flex items-center gap-1.5 shrink-0"
            >
              <span>UNIRSE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Pass & Play (1 Smartphone) Mode Window */}
        <div className="bg-[#0B0E17]/80 border border-[#00F0FF]/25 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-xl">
              <Smartphone className="w-5 h-5 text-[#00F0FF]" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">MODO 1 SOLO CELULAR (PÁSALO)</div>
              <div className="text-[10px] text-slate-400">Jueguen todos juntos en el mismo dispositivo</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePassAndPlay}
            className="px-3.5 py-2 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>PÁSALO</span>
          </button>
        </div>
      </div>

      {/* Rules button */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onOpenRules}
          className="text-xs font-bold text-slate-400 hover:text-[#00F0FF] underline underline-offset-4 transition-colors"
        >
          ¿Cómo se juega a RetroReto Infiltrados en el Tiempo? Ver Reglas
        </button>
      </div>
    </div>
  );
};

export default HomeView;
