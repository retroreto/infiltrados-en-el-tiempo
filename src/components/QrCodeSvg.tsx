import React from 'react';

interface QrCodeProps {
  value: string;
  size?: number;
}

// Lightweight QR Code pattern generator component for room links
export const QrCodeSvg: React.FC<QrCodeProps> = ({ value, size = 160 }) => {
  // Hash value into a pseudo-random deterministic grid
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const seed = hashString(value);
  const gridSize = 15;
  const cellSize = size / gridSize;

  // Generate grid matrix with finder patterns at 3 corners
  const grid: boolean[][] = Array(gridSize)
    .fill(false)
    .map(() => Array(gridSize).fill(false));

  // Helper to draw 5x5 finder patterns
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 0 || r === 4 || c === 0 || c === 4 || (r >= 1 && r <= 3 && c >= 1 && c <= 3 && (r === 2 || c === 2))) {
          grid[startY + r][startX + c] = true;
        }
      }
    }
  };

  // Corners
  drawFinder(0, 0);
  drawFinder(gridSize - 5, 0);
  drawFinder(0, gridSize - 5);

  // Fill data cells deterministically
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Skip finder pattern zones
      const isTopLeft = r < 5 && c < 5;
      const isTopRight = r < 5 && c >= gridSize - 5;
      const isBottomLeft = r >= gridSize - 5 && c < 5;

      if (!isTopLeft && !isTopRight && !isBottomLeft) {
        const val = (seed * (r + 1) * 31 + (c + 1) * 17 + (r * c)) % 100;
        grid[r][c] = val > 45;
      }
    }
  }

  return (
    <div className="p-3 bg-slate-950 border border-cyan-500/40 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.2)] inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="#0B0F19" rx={8} />
        {grid.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize + 1}
                y={r * cellSize + 1}
                width={cellSize - 1.5}
                height={cellSize - 1.5}
                rx={2}
                fill={
                  (r < 5 && c < 5) || (r < 5 && c >= gridSize - 5) || (r >= gridSize - 5 && c < 5)
                    ? "#00F0FF"
                    : "#38BDF8"
                }
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};

export default QrCodeSvg;

