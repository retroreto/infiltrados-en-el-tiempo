import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, ShieldAlert, Sparkles, Smartphone, Users, LogOut } from 'lucide-react';
import { soundEngine } from '../utils/AudioService';
import { GameMode } from '../types';
import { RetroRetoLogo } from './RetroRetoLogo';

interface NavbarProps {
  roomCode?: string;
  mode?: GameMode;
  onOpenRules: () => void;
  onExitGame?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ roomCode, mode, onOpenRules, onExitGame }) => {
  const [muted, setMuted] = useState(soundEngine.getMuted());

  const handleToggleSound = () => {
    const isMuted = soundEngine.toggleMute();
    setMuted(isMuted);
    if (!isMuted) soundEngine.playClick();
  };

  return (
    <header className="w-full bg-[#0F131D]/90 backdrop-blur-xl border-b border-[#2B354C] sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between shadow-md">
      {/* Brand logo badge */}
      <div 
        onClick={onExitGame}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <RetroRetoLogo size="sm" showSubtitle={false} />
      </div>

      {/* Room code / Mode status badge */}
      {roomCode && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#161C2B] border border-[#00F0FF]/40 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.15)]">
          {mode === 'pass_and_play' ? (
            <Smartphone className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" />
          ) : (
            <Users className="w-3.5 h-3.5 text-[#00F0FF]" />
          )}
          <span className="text-[11px] font-bold text-slate-300">
            {mode === 'pass_and_play' ? '1 CELULAR' : `MISIÓN:`}
          </span>
          <span className="font-mono text-xs font-black tracking-wider text-[#00F0FF]">
            {roomCode}
          </span>
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenRules}
          className="p-2 bg-[#1B2234] hover:bg-[#252E46] text-slate-300 hover:text-[#00F0FF] rounded-xl border border-[#2B354C] transition-colors flex items-center justify-center"
          title="Reglas del Juego"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={handleToggleSound}
          className="p-2 bg-[#1B2234] hover:bg-[#252E46] text-slate-300 hover:text-[#00F0FF] rounded-xl border border-[#2B354C] transition-colors flex items-center justify-center"
          title={muted ? "Activar Sonido" : "Silenciar"}
        >
          {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00F0FF]" />}
        </button>

        {roomCode && onExitGame && (
          <button
            onClick={onExitGame}
            className="p-2 bg-red-950/60 hover:bg-red-900/60 text-red-300 rounded-xl border border-red-500/30 transition-colors flex items-center justify-center"
            title="Salir de la Misión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;

