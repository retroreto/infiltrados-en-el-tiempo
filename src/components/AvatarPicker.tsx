import React from 'react';
import { User, Shield, Zap, Sparkles, Rocket, Cpu, Eye, Radio } from 'lucide-react';

export const AVATAR_PRESETS = [
  { icon: Rocket, color: "#00F0FF", name: "Cian Creador" },
  { icon: Shield, color: "#FF0055", name: "Rojo Peligro" },
  { icon: Zap, color: "#00FF88", name: "Verde Esmeralda" },
  { icon: Sparkles, color: "#FFD700", name: "Oro Solar" },
  { icon: Cpu, color: "#A855F7", name: "Morado Galáctico" },
  { icon: Radio, color: "#FF7700", name: "Naranja Plasma" },
  { icon: Eye, color: "#3B82F6", name: "Azul Cobalto" },
  { icon: User, color: "#EC4899", name: "Rosa Cuántico" }
];

export const AVATAR_COLORS = AVATAR_PRESETS.map(p => ({ hex: p.color, name: p.name }));
export const AVATAR_ICONS = AVATAR_PRESETS.map(p => p.icon);

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
  return (
    <div className="w-full bg-[#0B0E17]/90 p-2.5 rounded-2xl border border-[#2B354C]">
      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest text-center mb-2">
        SELECCIONA EL TRAJE DE TU AGENTE
      </div>

      {/* Single Horizontal Line of Equal Proportioned Tiles */}
      <div className="grid grid-cols-8 gap-1.5 sm:gap-2 w-full">
        {AVATAR_PRESETS.map((preset, idx) => {
          const IconComp = preset.icon;
          const isSelected = selectedIconIndex === idx || selectedColor === preset.color;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelectIcon(idx);
                onSelectColor(preset.color);
              }}
              className={`aspect-square w-full rounded-xl border transition-all flex items-center justify-center relative overflow-hidden ${
                isSelected
                  ? 'ring-2 ring-white scale-105 shadow-md border-white'
                  : 'border-[#2B354C] opacity-70 hover:opacity-100 hover:scale-105'
              }`}
              style={{
                backgroundColor: isSelected ? `${preset.color}35` : `${preset.color}10`,
                borderColor: isSelected ? preset.color : undefined,
                boxShadow: isSelected ? `0 0 12px ${preset.color}60` : undefined
              }}
              title={preset.name}
            >
              <IconComp
                className="w-5 h-5 sm:w-6 sm:h-6 transition-transform"
                style={{ color: preset.color }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarPicker;



