import React, { useState } from 'react';

export interface MonthlyDataPoint {
  key: string;
  label: string;
  short: string;
  sales: number;
  expense: number;
  net: number;
}

interface SalesExpensesLineGraphProps {
  data: MonthlyDataPoint[];
  isDark?: boolean;
}

export const SalesExpensesLineGraph: React.FC<SalesExpensesLineGraphProps> = ({
  data,
  isDark = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-stone-400 italic">
        No transaction comparison data available for this range.
      </div>
    );
  }

  // Dimensions for SVG line graph
  const svgWidth = 760;
  const svgHeight = 280;
  const paddingLeft = 75;
  const paddingRight = 45;
  const paddingTop = 35;
  const paddingBottom = 45;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Maximum value for scaling (rounded up to clean ceiling)
  const rawMax = Math.max(...data.map((d) => Math.max(d.sales, d.expense)), 10000);
  const maxVal = Math.ceil(rawMax / 10000) * 10000 || 100000;

  // Compute X and Y positions
  const points = data.map((d, index) => {
    const x =
      data.length > 1
        ? paddingLeft + (index / (data.length - 1)) * plotWidth
        : paddingLeft + plotWidth / 2;
    const ySales = paddingTop + plotHeight - (d.sales / maxVal) * plotHeight;
    const yExpense = paddingTop + plotHeight - (d.expense / maxVal) * plotHeight;
    return { ...d, x, ySales, yExpense, index };
  });

  // Build SVG Paths for Smooth Curves
  const generateSmoothPath = (
    pts: { x: number; y: number }[]
  ): string => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;

    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const cpX1 = current.x + (next.x - current.x) * 0.45;
      const cpY1 = current.y;
      const cpX2 = next.x - (next.x - current.x) * 0.45;
      const cpY2 = next.y;
      path += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${next.x},${next.y}`;
    }
    return path;
  };

  const salesPoints = points.map((p) => ({ x: p.x, y: p.ySales }));
  const expensePoints = points.map((p) => ({ x: p.x, y: p.yExpense }));

  const salesCurve = generateSmoothPath(salesPoints);
  const expenseCurve = generateSmoothPath(expensePoints);

  // Area paths (down to baseline)
  const baselineY = paddingTop + plotHeight;
  const firstX = points[0]?.x ?? paddingLeft;
  const lastX = points[points.length - 1]?.x ?? paddingLeft + plotWidth;

  const salesArea = `${salesCurve} L ${lastX},${baselineY} L ${firstX},${baselineY} Z`;
  const expenseArea = `${expenseCurve} L ${lastX},${baselineY} L ${firstX},${baselineY} Z`;

  // Grid tick ratios
  const gridRatios = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="space-y-4">
      {/* Chart Top Header & Legend: Only Sales Inflow and Expense Inflow */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-5 font-semibold px-3.5 py-1.5 rounded-xl bg-stone-800/40 border border-stone-700/40">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
            <span className="text-stone-300">Sales Inflow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-rose-500 inline-block shadow-sm"></span>
            <span className="text-stone-300">Expense Inflow</span>
          </div>
        </div>
      </div>

      {/* ================= PURE LINE GRAPH ONLY ================= */}
      <div className="relative rounded-2xl bg-stone-950/50 border border-stone-800/70 p-4 overflow-hidden">
        {/* SVG Canvas */}
        <div className="w-full overflow-x-auto custom-scrollbar">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[640px] h-auto select-none"
            style={{ overflow: 'visible' }}
          >
            <defs>
              {/* Sales gradient fill */}
              <linearGradient id="salesLineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              {/* Expense gradient fill */}
              <linearGradient id="expenseLineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>

              {/* Glow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Grid lines and Y-axis text */}
            {gridRatios.map((ratio, i) => {
              const y = paddingTop + plotHeight * (1 - ratio);
              const amount = Math.round(maxVal * ratio);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke={isDark ? '#292524' : '#e7e5e4'}
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    fill="#78716c"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    ₱{amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount}
                  </text>
                </g>
              );
            })}

            {/* Expense Area Gradient Fill */}
            <path d={expenseArea} fill="url(#expenseLineGrad)" />

            {/* Sales Area Gradient Fill */}
            <path d={salesArea} fill="url(#salesLineGrad)" />

            {/* Expense Line */}
            <path
              d={expenseCurve}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />

            {/* Sales Line */}
            <path
              d={salesCurve}
              fill="none"
              stroke="#10b981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />

            {/* Vertical Guide when Hovered */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <line
                x1={points[hoveredIndex].x}
                y1={paddingTop}
                x2={points[hoveredIndex].x}
                y2={baselineY}
                stroke="#ea580c"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Data Points and Labels */}
            {points.map((p, i) => {
              const isHovered = hoveredIndex === i;
              const isCurrent = p.key === '2026-09';

              return (
                <g key={p.key} className="cursor-pointer">
                  {/* Invisible hover trigger column */}
                  <rect
                    x={p.x - 28}
                    y={paddingTop}
                    width={56}
                    height={plotHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* Sales Point Circle */}
                  <circle
                    cx={p.x}
                    cy={p.ySales}
                    r={isHovered ? 6.5 : 4.5}
                    fill="#10b981"
                    stroke="#0c0a09"
                    strokeWidth="2.5"
                    className="transition-all duration-200"
                  />

                  {/* Expense Point Circle */}
                  <circle
                    cx={p.x}
                    cy={p.yExpense}
                    r={isHovered ? 6.5 : 4.5}
                    fill="#f43f5e"
                    stroke="#0c0a09"
                    strokeWidth="2.5"
                    className="transition-all duration-200"
                  />

                  {/* Permanently visible amount tags above and below nodes */}
                  <text
                    x={p.x}
                    y={p.ySales - 9}
                    fill="#34d399"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    ₱{(p.sales / 1000).toFixed(0)}k
                  </text>

                  <text
                    x={p.x}
                    y={p.yExpense + 15}
                    fill="#fb7185"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    ₱{(p.expense / 1000).toFixed(0)}k
                  </text>

                  {/* X-Axis Month Label */}
                  <text
                    x={p.x}
                    y={baselineY + 20}
                    fill={isHovered ? '#ea580c' : isCurrent ? '#f97316' : '#a8a29e'}
                    fontSize="11"
                    fontWeight={isCurrent || isHovered ? 'bold' : '600'}
                    textAnchor="middle"
                  >
                    {p.short}
                  </text>

                  {isCurrent && (
                    <text
                      x={p.x}
                      y={baselineY + 34}
                      fill="#ea580c"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      (Now)
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Interactive Tooltip Card: Sales Inflow & Expense Inflow only */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div className="mt-3 p-3 rounded-xl bg-stone-900 border border-orange-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4 text-xs animate-fadeIn">
            <div>
              <span className="font-black text-stone-100 text-sm">
                {points[hoveredIndex].label}
              </span>
              <span className="text-[11px] text-stone-400 block">Performance Comparison</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-stone-400">Sales Inflow:</span>
                <span className="font-black text-emerald-400 font-mono">
                  ₱{points[hoveredIndex].sales.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-stone-400">Expense Inflow:</span>
                <span className="font-black text-rose-400 font-mono">
                  ₱{points[hoveredIndex].expense.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
