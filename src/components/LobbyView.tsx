import React, { useState } from 'react';
import { Copy, Check, Share2, Users, Settings, Play, Shield, Crown, Smartphone, Radio, Sparkles, Terminal } from 'lucide-react';
import { GameRoom, Player, RoomSettings } from '../types';
import { QrCodeSvg } from './QrCodeSvg';
import { AVATAR_ICONS } from './AvatarPicker';
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
    ? `${window.location.origin}?code=${room.roomCode}`
    : `https://infiltrado.app?code=${room.roomCode}`;

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
    const text = `🚀 ¡Únete a nuestra Misión en RetroReto Infiltrados en el Tiempo!\nCódigo de Sala: ${room.roomCode}\nEntra directamente aquí: ${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleStart = () => {
    soundEngine.playClick();
    onStartGame();
  };

  return (
    <div className="w-full max-w-[#28rem] sm:max-w-md mx-auto space-y-5 pb-10 px-4 animate-fade-in">
      {/* Room Header Card - Windows UI Style */}
      <div className="bg-[#121622]/90 border border-[#2B354C] rounded-3xl p-5 text-center relative overflow-hidden backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] space-y-3">
        {/* Window controls bar */}
        <div className="flex items-center justify-between border-b border-[#2B354C] pb-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00F0FF]">
            <Radio className="w-3 h-3 text-[#00F0FF] animate-pulse" />
            <span>SALA DE ESPERA</span>
          </div>

          <button
            onClick={onLeaveRoom}
            className="text-[#E52E2E] hover:text-red-400 text-[11px] font-bold underline transition-colors"
          >
            Salir
          </button>
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            CÓDIGO DE MISIÓN
          </div>
          <div className="text-4xl sm:text-5xl font-mono font-black text-[#00F0FF] tracking-widest drop-shadow-[0_0_15px_rgba(0,240,255,0.6)] bg-[#0B0E17] py-2 px-4 rounded-2xl border border-[#00F0FF]/30 inline-block">
            {room.roomCode}
          </div>
        </div>

        {/* Share & WhatsApp Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopy}
            className="py-2.5 px-3 bg-[#1B2234] hover:bg-[#252E46] border border-[#00F0FF]/30 text-[#00F0FF] rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡COPIADO!' : 'COPIAR ENLACE'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>WHATSAPP</span>
          </button>
        </div>

        {/* Toggle QR code */}
        <div>
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowQr(!showQr);
            }}
            className="text-xs text-slate-400 hover:text-[#00F0FF] underline underline-offset-2 transition-colors font-semibold"
          >
            {showQr ? 'Ocultar Cronomapa QR' : '📱 Mostrar Código QR para escaneo presencial'}
          </button>
        </div>

        {showQr && (
          <div className="pt-2 animate-fade-in flex flex-col items-center">
            <QrCodeSvg value={shareUrl} size={150} />
            <p className="text-[10px] text-slate-400 mt-2">
              Escanea con la cámara de tu celular para unirte directamente
            </p>
          </div>
        )}
      </div>

      {/* Connected Players List Card */}
      <div className="bg-[#121622]/90 border border-[#2B354C] rounded-3xl p-4 backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-[#2B354C] pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00F0FF]" />
            <span>AGENTES CONECTADOS ({room.players.length})</span>
          </div>
          {room.players.length < 3 && (
            <span className="text-[#E52E2E] font-bold text-[10px] animate-pulse">Mínimo 3 jugadores</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {room.players.map((player) => {
            const IconComp = AVATAR_ICONS[player.avatarIconIndex || 0] || Shield;
            const isMe = player.id === currentPlayerId;

            return (
              <div
                key={player.id}
                className={`p-2.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  isMe
                    ? 'bg-[#1B2234] border-[#00F0FF]/60 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                    : 'bg-[#0B0E17] border-[#2B354C]'
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

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white truncate">
                      {player.name}
                    </span>
                    {player.isHost && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Host de la Misión" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    {isMe ? <span className="text-[#00F0FF] font-bold">(TÚ)</span> : null}
                    <span>Puntaje: {player.score} pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Mission Settings */}
      {isHost ? (
        <div className="bg-[#121622]/90 border border-[#2B354C] rounded-3xl p-4 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#00F0FF] border-b border-[#2B354C] pb-2">
            <Settings className="w-4 h-4" />
            <span>PARÁMETROS DE LA MISIÓN (SOLO HOST)</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 text-xs">
            {/* Number of Infiltrators */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
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
                    className={`py-2.5 px-3 rounded-xl border font-black transition-all ${
                      room.settings.infiltratorCount === num
                        ? 'bg-red-950/80 border-[#E52E2E] text-red-200 shadow-[0_0_12px_rgba(229,46,46,0.3)]'
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
              <label className="block text-slate-300 font-bold mb-1.5">
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
                    className={`py-2 px-1.5 rounded-xl border font-extrabold text-center transition-all ${
                      room.settings.timerSeconds === t.val
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
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
              <label className="block text-slate-300 font-bold mb-1.5">
                Categoría de Hitos (200 Hitos Históricos):
              </label>
              <select
                value={room.settings.categoryFilter}
                onChange={(e) => {
                  soundEngine.playClick();
                  onUpdateSettings({ categoryFilter: e.target.value });
                }}
                className="w-full bg-[#0B0E17] border border-[#2B354C] text-white font-semibold rounded-xl p-2.5 outline-none focus:border-[#00F0FF]"
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
        <div className="p-3.5 bg-[#0B0E17]/80 border border-[#2B354C] rounded-2xl text-center text-xs text-slate-300 font-medium">
          Esperando a que el Host inicie la Misión...
        </div>
      )}

      {/* Start Button */}
      {isHost && (
        <button
          onClick={handleStart}
          disabled={room.players.length < 3}
          className={`w-full py-4 px-6 font-black rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-wider text-base ${
            room.players.length >= 3
              ? 'bg-gradient-to-r from-[#E52E2E] via-red-600 to-[#D92626] hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_25px_rgba(229,46,46,0.5)] hover:scale-[1.02] active:scale-95 border border-red-400/40'
              : 'bg-[#121622] text-slate-500 border border-[#2B354C] cursor-not-allowed'
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>COMENZAR MISIÓN</span>
        </button>
      )}
    </div>
  );
};

export default LobbyView;

