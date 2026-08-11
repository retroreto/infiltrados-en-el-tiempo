import React, { useState } from 'react';
import { Copy, Check, Share2, Users, Settings, Play, Shield, Crown, Smartphone, Radio, Sparkles, Terminal } from 'lucide-react';
import { GameRoom, Player, RoomSettings } from '../types';
import { QrCodeSvg } from './QrCodeSvg';
import { getCategories } from '../data/hitos';
import { soundEngine } from '../utils/AudioService';

interface LobbyViewProps {
  room: GameRoom;
  currentPlayerId: string;
  onUpdateSettings: (newSettings: Partial<RoomSettings>) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  currentPlayerId,
  onUpdateSettings,
  onStartGame,
  onLeaveRoom
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const isHost = room.hostId === currentPlayerId;
  const categories = getCategories();

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?sala=${room.roomCode}`
    : `https://infiltrado.retroreto.com/?sala=${room.roomCode}`;

  const handleCopy = async () => {
    soundEngine.playClick();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // fallback
    }
  };

  const handleShareWhatsApp = () => {
    soundEngine.playClick();
    const text = `🚀 ¡Únete a nuestra Misión en RetroReto Infiltrados en el Tiempo!\nCódigo de Sala: ${room.roomCode}\nEntra directo aquí: ${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleStart = () => {
    soundEngine.playClick();
    onStartGame();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pb-10 px-4 animate-fade-in">
      {/* Room Header Card */}
      <div className="bg-[#121622]/90 border border-[#2B354C] rounded-3xl p-4 sm:p-5 text-center relative overflow-hidden backdrop-blur-xl shadow-xl space-y-3">
        {/* Window controls bar */}
        <div className="flex items-center justify-between border-b border-[#2B354C] pb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00F0FF]">
            <Radio className="w-3 h-3 text-[#00F0FF] animate-pulse" />
            <span>SALA DE MISIÓN</span>
          </div>

          <button
            onClick={onLeaveRoom}
            className="text-[#E52E2E] hover:text-red-400 text-[11px] font-bold underline transition-colors"
          >
            Salir
          </button>
        </div>

        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            CÓDIGO DE MISIÓN
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-black text-[#00F0FF] tracking-widest drop-shadow-[0_0_12px_rgba(0,240,255,0.6)] bg-[#0B0E17] py-1.5 px-4 rounded-xl border border-[#00F0FF]/30 inline-block">
            {room.roomCode}
          </div>
        </div>

        {/* Compact Share Bar - Single Horizontal Row */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-3 bg-[#1B2234] hover:bg-[#252E46] border border-[#00F0FF]/30 text-[#00F0FF] rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡COPIADO!' : 'COPIAR ENLACE'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-2.5 px-3 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>WHATSAPP</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setShowQr(!showQr);
            }}
            className={`p-2.5 rounded-xl border transition-all text-[11px] font-bold ${
              showQr ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]' : 'bg-[#0B0E17] border-[#2B354C] text-slate-400 hover:text-white'
            }`}
            title="Código QR"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {showQr && (
          <div className="pt-2 animate-fade-in flex flex-col items-center border-t border-[#2B354C]">
            <QrCodeSvg value={shareUrl} size={120} />
            <p className="text-[9px] text-slate-400 mt-1">Escaneo directo con cámara móvil</p>
          </div>
        )}
      </div>

      {/* Host Mission Settings */}
      {isHost ? (
        <div className="bg-[#121622]/90 border border-[#2B354C] rounded-3xl p-4 sm:p-5 backdrop-blur-xl space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-[#00F0FF] border-b border-[#2B354C] pb-2">
            <Settings className="w-4 h-4" />
            <span>PARÁMETROS DE LA MISIÓN (HOST)</span>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs">
            {/* Number of Infiltrators */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Número de Infiltrados:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdateSettings({ infiltratorCount: num });
                    }}
                    className={`py-2 px-3 rounded-xl border font-black transition-all ${
                      room.settings.infiltratorCount === num
                        ? 'bg-red-950/80 border-[#E52E2E] text-red-200 shadow-[0_0_10px_rgba(229,46,46,0.3)]'
                        : 'bg-[#0B0E17] border-[#2B354C] text-slate-400 hover:text-white'
                    }`}
                  >
                    {num} INFILTRADO{num > 1 ? 'S' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Duration */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Tiempo de Discusión:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '1 MIN', val: 60 },
                  { label: '2 MIN', val: 120 },
                  { label: '3 MIN', val: 180 },
                  { label: 'LIBRE', val: 0 }
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdateSettings({ timerSeconds: t.val });
                    }}
                    className={`py-2 px-1 rounded-xl border font-extrabold text-center transition-all text-[11px] ${
                      room.settings.timerSeconds === t.val
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                        : 'bg-[#0B0E17] border-[#2B354C] text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Categoría de Hitos (200 Hitos):
              </label>
              <select
                value={room.settings.categoryFilter}
                onChange={(e) => {
                  soundEngine.playClick();
                  onUpdateSettings({ categoryFilter: e.target.value });
                }}
                className="w-full bg-[#0B0E17] border border-[#2B354C] text-white font-semibold rounded-xl p-2.5 outline-none focus:border-[#00F0FF] text-xs"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#0B0E17]/80 border border-[#2B354C] rounded-2xl text-center text-xs text-slate-300 font-medium">
          Esperando a que el Host configure e inicie la Misión...
        </div>
      )}

      {/* Start Button */}
      {isHost && (
        <div className="space-y-1">
          <button
            onClick={handleStart}
            disabled={room.players.length < 3}
            className={`w-full py-4 px-5 font-black rounded-2xl transition-all flex items-center justify-center gap-2.5 uppercase tracking-wider text-sm ${
              room.players.length >= 3
                ? 'bg-gradient-to-r from-[#E52E2E] via-red-600 to-[#D92626] hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(229,46,46,0.4)] hover:scale-[1.01] active:scale-95 border border-red-400/40'
                : 'bg-[#121622] text-slate-500 border border-[#2B354C] cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>COMENZAR MISIÓN ({room.players.length} JUGADORES)</span>
          </button>
          {room.players.length < 3 && (
            <p className="text-[10px] text-center font-bold text-red-400 animate-pulse">
              Se requieren al menos 3 jugadores en la videollamada para comenzar.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LobbyView;


