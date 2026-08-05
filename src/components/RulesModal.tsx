import React from 'react';
import { X, Shield, EyeOff, Radio, Clock, Award, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/AudioService';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    soundEngine.playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.2)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              REGLAS DE MISIÓN: <span className="text-cyan-400">INFILTRADO V2</span>
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-300">
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-start gap-3">
            <Shield className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-cyan-300 mb-1">OBJETIVO PRINCIPAL</h3>
              <p className="text-xs text-cyan-100/90 leading-relaxed">
                Un impostor se ha colado en el portal temporal. La Tripulación de Viajeros debe identificar al Infiltrado, mientras que el Infiltrado debe disimular y deducir la ubicación/hito secreto sin ser descubierto.
              </p>
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-3">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-1">
              ROLES SECRETOS
            </h3>
            
            {/* Viajero */}
            <div className="p-3 bg-slate-950/60 border border-cyan-500/20 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-cyan-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>VIAJERO DEL TIEMPO (Tripulante)</span>
              </div>
              <p className="text-xs text-slate-300">
                Conoce el <strong className="text-white">Hito Histórico secreto</strong>. En cada turno da una pista sutil. No seas demasiado explícito o el Infiltrado adivinará la palabra.
              </p>
            </div>

            {/* Infiltrado */}
            <div className="p-3 bg-slate-950/60 border border-red-500/30 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-red-400">
                <EyeOff className="w-4 h-4" />
                <span>INFILTRADO EN EL TIEMPO (Impostor)</span>
              </div>
              <p className="text-xs text-slate-300">
                <strong className="text-red-300">NO conoce el hito</strong>. Escucha con atención a los demás, da pistas genéricas o ambiguas para parecer un viajero más, ¡y evita ser votado!
              </p>
            </div>
          </div>

          {/* Fases del juego */}
          <div className="space-y-2">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-1">
              DESARROLLO DE LA PARTIDA
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
              <li><strong className="text-white">Ver Rol Secreto:</strong> Cada jugador consulta su pantalla (o se pasan el celular en modo Pásalo).</li>
              <li><strong className="text-white">Ronda de Pistas:</strong> Por turnos, cada jugador dice UNA sola palabra o frase corta relacionada al Hito.</li>
              <li><strong className="text-white">Discusión y Emergencia:</strong> Debatan quién actuó sospechoso. Cualquier jugador puede presionar el Botón de Emergencia para votar.</li>
              <li><strong className="text-white">Exilio y Adivinanza:</strong> Si exilian al Infiltrado, ¡este tendrá 1 última oportunidad de adivinar el Hito entre 4 opciones para robar la victoria!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
          <button
            onClick={handleClose}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all uppercase tracking-wider text-xs"
          >
            ¡ENTENDIDO, A JUGAR!
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;

