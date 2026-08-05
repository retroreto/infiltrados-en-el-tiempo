import React from 'react';
import { User, Shield, Zap, Sparkles, Rocket, Cpu, Eye, Radio } from 'lucide-react';

export const AVATAR_COLORS = [
  { hex: "#00F0FF", name: "Cian Creador" },
  { hex: "#FF0055", name: "Rojo Peligro" },
  { hex: "#00FF88", name: "Verde Esmeralda" },
  { hex: "#FFD700", name: "Oro Solar" },
  { hex: "#A855F7", name: "Morado Galáctico" },
  { hex: "#FF7700", name: "Naranja Plasma" },
  { hex: "#3B82F6", name: "Azul Cobalto" },
  { hex: "#EC4899", name: "Rosa Cuántico" }
];

export const AVATAR_ICONS = [
  Rocket,
  Shield,
  Zap,
  Sparkles,
  Cpu,
  Radio,
  Eye,
  User
];

interface AvatarPickerProps {
  selectedColor: string;
  selectedIconIndex: number;
  onSelectColor: (hex: string) => void;
  onSelectIcon: (index: number) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedColor,
  selectedIconIndex,
  onSelectColor,
  onSelectIcon
}) => {
  const IconComp = AVATAR_ICONS[selectedIconIndex] || Rocket;

  return (
    <div className="space-y-3">
      {/* Avatar Preview */}
      <div className="flex items-center justify-center">
        <div 
          className="relative w-20 h-20 rounded-2xl flex items-center justify-center p-1 transition-all shadow-lg"
          style={{
            backgroundColor: `${selectedColor}20`,
            borderColor: selectedColor,
            borderWidth: '2px',
            boxShadow: `0 0 20px ${selectedColor}40`
          }}
        >
          <IconComp className="w-10 h-10 transition-transform duration-300 hover:scale-110" style={{ color: selectedColor }} />
          <div className="absolute -bottom-2 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase text-slate-950 bg-white">
            TRAJE
          </div>
        </div>
      </div>

      {/* Color Swatches */}
      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
          Color del Traje Espacial
        </label>
        <div className="grid grid-cols-8 gap-1.5">
          {AVATAR_COLORS.map(c => (
            <button
              key={c.hex}
              type="button"
              onClick={() => onSelectColor(c.hex)}
              className={`w-7 h-7 rounded-lg transition-all flex items-center justify-center ${
                selectedColor === c.hex
                  ? 'ring-2 ring-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Icon Selector */}
      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
          Insignia del Casco
        </label>
        <div className="flex justify-center gap-2">
          {AVATAR_ICONS.map((Icon, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectIcon(idx)}
              className={`p-2 rounded-xl border transition-all ${
                selectedIconIndex === idx
                  ? 'bg-slate-800 border-cyan-400 text-cyan-400 scale-105 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvatarPicker;

