import React, { useState } from 'react';
import logoImg from '../assets/logo-infiltrados-white-small.webp';

interface RetroRetoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const RetroRetoLogo: React.FC<RetroRetoLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const [imgError, setImgError] = useState(false);

  // Proportional height classes per size prop
  const imgSizeClasses = {
    sm: 'h-6 sm:h-7 w-auto',
    md: 'h-8 sm:h-10 w-auto',
    lg: 'h-10 sm:h-12 w-auto',
    xl: 'h-14 sm:h-20 w-auto'
  };

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-4xl sm:text-5xl'
  };

  const helmetSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8 sm:w-10 sm:h-10',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
    xl: 'w-12 h-12 sm:w-16 sm:h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Vite WebP Image Logo */}
      {!imgError ? (
        <img
          src={logoImg}
          alt="Infiltrados RetroReto Logo"
          onError={() => setImgError(true)}
          className={`object-contain shrink-0 max-w-full drop-shadow-[0_0_12px_rgba(0,240,255,0.4)] ${imgSizeClasses[size]}`}
        />
      ) : (
        /* Fallback Graphic Row */
        <div className={`flex items-center justify-center gap-1.5 sm:gap-2 font-black tracking-tight uppercase leading-none ${sizeClasses[size]}`}>
          {/* RETRO */}
          <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
            RETRO
          </span>

          {/* Cyber Helmet Emblem */}
          <div className={`relative inline-flex items-center justify-center shrink-0 ${helmetSizes[size]}`}>
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Helmet Shell */}
              <circle cx="50" cy="50" r="44" fill="#181D2A" stroke="#2B354C" strokeWidth="3" />
              <path
                d="M 15 50 C 15 25, 30 12, 50 12 C 70 12, 85 25, 85 50 C 85 68, 75 85, 50 88 C 25 85, 15 68, 15 50 Z"
                fill="#222838"
              />
              {/* Red Ear Pads & Helmet Stripes */}
              <path d="M 8 42 L 18 38 L 18 62 L 8 58 Z" fill="#E52E2E" />
              <path d="M 92 42 L 82 38 L 82 62 L 92 58 Z" fill="#E52E2E" />
              <path d="M 42 12 H 58 V 26 H 42 Z" fill="#E52E2E" rx="3" />
              <path d="M 32 18 H 68 V 22 H 32 Z" fill="#E52E2E" />

              {/* Cyan Glowing Glass Visor */}
              <path
                d="M 22 42 C 22 36, 32 32, 50 32 C 68 32, 78 36, 78 42 C 78 60, 68 70, 50 70 C 32 70, 22 60, 22 42 Z"
                fill="url(#visorGradient)"
                stroke="#00F0FF"
                strokeWidth="2"
              />
              
              {/* Visor Reflection Highlight */}
              <path
                d="M 28 40 C 35 36, 45 35, 52 35 C 45 42, 32 45, 28 40 Z"
                fill="#FFFFFF"
                opacity="0.4"
              />

              <defs>
                <linearGradient id="visorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F0FF" />
                  <stop offset="100%" stopColor="#0088FF" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* RETO */}
          <span className="text-[#E52E2E] drop-shadow-[0_0_15px_rgba(229,46,46,0.6)]">
            RETO
          </span>
        </div>
      )}

      {/* Subtitle / Tagline */}
      {showSubtitle && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="h-[1px] w-6 sm:w-10 bg-gradient-to-r from-transparent to-[#00F0FF]/60" />
          <span className="text-[10px] sm:text-xs font-black tracking-[0.28em] text-[#00F0FF] uppercase drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
            INFILTRADOS EN EL TIEMPO
          </span>
          <div className="h-[1px] w-6 sm:w-10 bg-gradient-to-l from-transparent to-[#00F0FF]/60" />
        </div>
      )}
    </div>
  );
};

export default RetroRetoLogo;


