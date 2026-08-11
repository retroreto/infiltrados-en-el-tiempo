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
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0B0E17]/80 p-2.5 rounded-2xl border border-[#2B354C]">
      {/* Mini Avatar Badge Preview */}
      <div className="shrink-0 flex items-center justify-center">
        <div 
          className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md"
          style={{
            backgroundColor: `${selectedColor}20`,
            borderColor: selectedColor,
            borderWidth: '2px',
            boxShadow: `0 0 12px ${selectedColor}30`
          }}
        >
          <IconComp className="w-6 h-6 transition-transform" style={{ color: selectedColor }} />
          <div className="absolute -bottom-1.5 px-1.5 py-0.2 rounded-full text-[8px] font-black tracking-widest uppercase text-slate-950 bg-white shadow-sm">
            TRAJE
          </div>
        </div>
      </div>

      {/* Selectors Column */}
      <div className="flex-1 w-full space-y-2">
        {/* Color Swatches */}
        <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
          {AVATAR_COLORS.map(c => (
            <button
              key={c.hex}
              type="button"
              onClick={() => onSelectColor(c.hex)}
              className={`w-6 h-6 rounded-md transition-all flex items-center justify-center ${
                selectedColor === c.hex
                  ? 'ring-2 ring-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>

        {/* Icon Buttons */}
        <div className="flex items-center justify-center sm:justify-start gap-1 flex-wrap">
          {AVATAR_ICONS.map((Icon, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectIcon(idx)}
              className={`p-1.5 rounded-lg border transition-all ${
                selectedIconIndex === idx
                  ? 'bg-slate-800 border-cyan-400 text-cyan-400 scale-105 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvatarPicker;


