import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeProps {
  value: string;
  size?: number;
}

export const QrCodeSvg: React.FC<QrCodeProps> = ({ value, size = 160 }) => {
  const [svgString, setSvgString] = useState<string>('');

  useEffect(() => {
    QRCode.toString(value, {
      type: 'svg',
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
      .then(svg => setSvgString(svg))
      .catch(err => console.error("Error generating QR:", err));
  }, [value, size]);

  if (!svgString) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-white rounded-xl text-slate-900 text-xs font-bold"
      >
        Cargando QR...
      </div>
    );
  }

  return (
    <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-2 border-[#00F0FF]">
      <div
        className="qr-container flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    </div>
  );
};

export default QrCodeSvg;
