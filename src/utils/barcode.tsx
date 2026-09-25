import React from 'react';

/**
 * Simple deterministic pattern generator based on char codes
 */
export const generateBars = (str: string) => {
  const bars: { x: number; w: number }[] = [];
  let curX = 10;
  
  // Start guard bars
  bars.push({ x: curX, w: 2 }); curX += 4;
  bars.push({ x: curX, w: 1 }); curX += 3;
  bars.push({ x: curX, w: 3 }); curX += 5;

  // Content bars based on characters
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    const space1 = ((charCode >> 1) % 3) + 2;
    const w2 = ((charCode >> 2) % 3) + 1;
    const space2 = ((charCode >> 3) % 2) + 2;

    bars.push({ x: curX, w: w1 });
    curX += w1 + space1;
    bars.push({ x: curX, w: w2 });
    curX += w2 + space2;
  }

  // Stop guard bars
  bars.push({ x: curX, w: 3 }); curX += 5;
  bars.push({ x: curX, w: 1 }); curX += 3;
  bars.push({ x: curX, w: 2 }); curX += 4;

  return { bars, totalWidth: curX + 10 };
};

/**
 * Generate a realistic Code128-like barcode SVG
 * Renders crisp, clean vector lines for scanning and printing
 */
export const BarcodeSVG: React.FC<{ code: string; width?: number; height?: number; className?: string }> = ({
  code,
  width = 220,
  height = 55,
  className = '',
}) => {
  const { bars, totalWidth } = generateBars(code || 'EXINS-0000');

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height}`}
      width={width}
      height={height}
      className={`select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100%" height="100%" fill="white" />
      {bars.map((bar, index) => (
        <rect
          key={index}
          x={bar.x}
          y={0}
          width={bar.w}
          height={height}
          fill="black"
        />
      ))}
    </svg>
  );
};

export interface BarcodeLabelProps {
  productName?: string;
  barcode: string;
  price: number;
  size?: string;
}

/**
 * EXINS Standard Barcode Label Template:
 * Header: EXINS Jksur+
 * Product Name (and Size)
 * Barcode image + Code: EXINS-XXXX
 * Price amount in PHP
 */
export const BarcodeLabelCard: React.FC<BarcodeLabelProps> = ({
  productName,
  barcode,
  price,
  size,
}) => {
  return (
    <div className="w-56 p-3 bg-white text-black border-2 border-stone-900 rounded-lg shadow-sm flex flex-col items-center justify-between text-center select-none font-mono">
      <div className="text-xs font-black tracking-wider uppercase text-stone-900 border-b border-stone-300 w-full pb-1">
        EXINS Jksur+
      </div>

      {/* Product Name (prominently displayed) */}
      {productName && (
        <div className="w-full pt-1.5 pb-0.5 px-0.5">
          <p className="text-xs font-black text-stone-950 line-clamp-1 leading-tight font-sans tracking-tight">
            {productName}
          </p>
          {size && (
            <span className="text-[10px] font-bold text-stone-600 block mt-0.5 font-sans">
              Size: {size}
            </span>
          )}
        </div>
      )}

      {/* Barcode vector and alphanumeric code */}
      <div className="my-1.5 flex flex-col items-center w-full">
        <BarcodeSVG code={barcode} width={180} height={44} />
        <span className="text-[11px] font-bold tracking-widest text-stone-800 mt-1 font-mono">
          {barcode}
        </span>
      </div>

      {/* Price */}
      <div className="text-sm font-black text-stone-950 pt-1 border-t border-stone-300 w-full font-mono">
        ₱{Number(price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
};
