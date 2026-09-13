import React, { useState } from 'react';
import { Activity, TrendingDown, CheckCircle2 } from 'lucide-react';
import { StructuredChartPoint } from '../../types/medical';

interface LabResultVisualizationProps {
  title?: string;
  chartData: {
    parameter: string;
    unit: string;
    points: StructuredChartPoint[];
  };
  onSelectEvent?: (eventId: string) => void;
}

export function LabResultVisualization({
  title,
  chartData,
  onSelectEvent,
}: LabResultVisualizationProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = chartData.points || [];
  if (points.length === 0) return null;

  // Chart dimensions & calculations
  const width = 640;
  const height = 180;
  const paddingX = 48;
  const paddingTop = 28;
  const paddingBottom = 36;

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values, 6.0);
  const maxVal = Math.max(...values, 8.5);
  const valRange = maxVal - minVal || 1;

  const getY = (val: number) => {
    return height - paddingBottom - ((val - minVal) / valRange) * (height - paddingTop - paddingBottom);
  };

  const getX = (index: number) => {
    if (points.length === 1) return width / 2;
    return paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
  };

  // Build SVG path
  const pathD = points.reduce((acc, point, index) => {
    const x = getX(index);
    const y = getY(point.value);
    return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Area under path
  const areaD = points.length > 0
    ? `${pathD} L ${getX(points.length - 1)} ${height - paddingBottom} L ${getX(0)} ${height - paddingBottom} Z`
    : '';

  // 7.0% target line for HbA1c
  const isA1c = chartData.parameter.toLowerCase().includes('a1c');
  const targetY = isA1c ? getY(7.0) : null;

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-800">
            {title || `${chartData.parameter} Longitudinal Trajectory`}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          {isA1c && (
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Target: &lt; 7.0%
            </span>
          )}
          <span>{points.length} Documented Tests</span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="p-4 bg-slate-50/30">
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[220px] select-none"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[minVal, (minVal + maxVal) / 2, maxVal].map((val, idx) => {
              const y = getY(val);
              return (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Target 7.0% Line if HbA1c */}
            {targetY !== null && (
              <g>
                <line
                  x1={paddingX}
                  y1={targetY}
                  x2={width - paddingX}
                  y2={targetY}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={width - paddingX + 6}
                  y={targetY + 3}
                  textAnchor="start"
                  fontSize="9"
                  fill="#059669"
                  fontWeight="600"
                >
                  7.0% (Target)
                </text>
              </g>
            )}

            {/* Filled area */}
            {areaD && <path d={areaD} fill="url(#areaGradient)" />}

            {/* Line connecting points */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Points & Interactive Nodes */}
            {points.map((p, idx) => {
              const cx = getX(idx);
              const cy = getY(p.value);
              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => p.eventId && onSelectEvent?.(p.eventId)}
                >
                  {/* Outer halo */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 7 : 4.5}
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-150"
                  />

                  {/* Value tag above node */}
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={p.value >= 8.0 ? '#dc2626' : p.value <= 7.0 ? '#059669' : '#1e293b'}
                  >
                    {p.value}
                    {chartData.unit}
                  </text>

                  {/* Date label below axis */}
                  <text
                    x={cx}
                    y={height - paddingBottom + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#64748b"
                  >
                    {p.date.slice(0, 7)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hovered Point Details Bar */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div className="mt-2 p-2 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-700 font-medium">
              Test Date: <strong className="text-slate-900">{points[hoveredIndex].date}</strong>
            </span>
            <span className="text-blue-900 font-bold">
              {points[hoveredIndex].value} {chartData.unit}
            </span>
            <span className="text-slate-600">
              Interpretation: <span className="font-medium text-slate-800">{points[hoveredIndex].interpretation || 'Documented'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Structured Trajectory Data Rows */}
      <div className="border-t border-slate-200 bg-white px-4 py-2.5">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Laboratory Records Summary
        </div>
        <div className="flex flex-wrap gap-2">
          {points.map((p, idx) => (
            <div
              key={idx}
              className={`px-2.5 py-1 rounded-md text-xs border ${
                p.value <= 7.0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : p.value >= 8.0
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span className="font-mono text-[10px] text-slate-500 mr-1.5">{p.date}</span>
              <span className="font-semibold">{p.value}{p.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
