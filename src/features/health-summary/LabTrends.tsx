import React, { useState, useEffect, useMemo } from 'react';
import { Activity, ShieldCheck, ArrowUpRight, TrendingUp, Info } from 'lucide-react';
import { HealthSummaryLabTrend } from '../../types/medical';
import { getLabTrendSeries, LabTrendPoint } from '../../services/healthSummaryService';

interface LabTrendsProps {
  patientId: string;
  labTrends: HealthSummaryLabTrend[];
  onSelectSources: (sourceEventIds: string[], contextTitle: string, claimText: string) => void;
}

type ParameterType = 'HbA1c' | 'Glucose' | 'Creatinine' | 'Lipid';

export function LabTrends({ patientId, labTrends, onSelectSources }: LabTrendsProps) {
  const [selectedParam, setSelectedParam] = useState<ParameterType>('HbA1c');
  const [trendPoints, setTrendPoints] = useState<LabTrendPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<LabTrendPoint | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Load points for the selected parameter from actual database records
  useEffect(() => {
    let isMounted = true;
    setIsLoadingChart(true);

    const query =
      selectedParam === 'HbA1c'
        ? 'HbA1c'
        : selectedParam === 'Glucose'
        ? 'Glucose'
        : selectedParam === 'Creatinine'
        ? 'Creatinine'
        : 'Cholesterol';

    getLabTrendSeries(patientId, query)
      .then((data) => {
        if (isMounted) {
          setTrendPoints(data);
          setIsLoadingChart(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load lab trend data:', err);
        if (isMounted) {
          setIsLoadingChart(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [patientId, selectedParam]);

  // Calculate SVG bounds & coordinates
  const chartData = useMemo(() => {
    if (trendPoints.length === 0) return null;

    const values = trendPoints.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.2 || 1;
    const yMin = Math.max(0, Number((minVal - padding).toFixed(1)));
    const yMax = Number((maxVal + padding).toFixed(1));

    const width = 640;
    const height = 220;
    const padX = 50;
    const padY = 35;

    const plotWidth = width - padX * 2;
    const plotHeight = height - padY * 2;

    const stepX = trendPoints.length > 1 ? plotWidth / (trendPoints.length - 1) : plotWidth / 2;

    const points = trendPoints.map((p, idx) => {
      const x = padX + (trendPoints.length > 1 ? idx * stepX : plotWidth / 2);
      const ratio = yMax === yMin ? 0.5 : (p.value - yMin) / (yMax - yMin);
      const y = height - padY - ratio * plotHeight;
      return { ...p, x, y };
    });

    const pathD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    return { width, height, padX, padY, points, pathD, yMin, yMax };
  }, [trendPoints]);

  return (
    <div id="lab-trends-section" className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Laboratory Trends</h3>
            <p className="text-xs text-slate-500">
              Longitudinal tracking derived directly from confirmed database laboratory results
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start sm:self-auto border border-slate-200/70">
          <button
            type="button"
            onClick={() => setSelectedParam('HbA1c')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              selectedParam === 'HbA1c'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            HbA1c (%)
          </button>
          <button
            type="button"
            onClick={() => setSelectedParam('Glucose')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              selectedParam === 'Glucose'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fasting Glucose
          </button>
          <button
            type="button"
            onClick={() => setSelectedParam('Creatinine')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              selectedParam === 'Creatinine'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Creatinine
          </button>
          <button
            type="button"
            onClick={() => setSelectedParam('Lipid')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              selectedParam === 'Lipid'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lipid Profile
          </button>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {selectedParam === 'HbA1c'
                ? 'Longitudinal Glycated Hemoglobin (HbA1c) Trajectory'
                : selectedParam === 'Glucose'
                ? 'Fasting Plasma Glucose Trajectory'
                : selectedParam === 'Creatinine'
                ? 'Renal Function (Serum Creatinine)'
                : 'Lipid Profile Surveillance'}
            </h4>
            <p className="text-xs text-slate-500">
              {trendPoints.length} verified laboratory records across 2018–2026
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>Database values</span>
          </div>
        </div>

        {/* SVG Chart */}
        {isLoadingChart ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400">
            Loading laboratory points...
          </div>
        ) : chartData && chartData.points.length > 0 ? (
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full h-48 sm:h-56 select-none"
            >
              {/* Horizontal grid lines */}
              <line
                x1={chartData.padX}
                y1={chartData.padY}
                x2={chartData.width - chartData.padX}
                y2={chartData.padY}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={chartData.padX}
                y1={chartData.height / 2}
                x2={chartData.width - chartData.padX}
                y2={chartData.height / 2}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={chartData.padX}
                y1={chartData.height - chartData.padY}
                x2={chartData.width - chartData.padX}
                y2={chartData.height - chartData.padY}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />

              {/* Y-axis labels */}
              <text
                x={chartData.padX - 8}
                y={chartData.padY + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {chartData.yMax}
              </text>
              <text
                x={chartData.padX - 8}
                y={chartData.height - chartData.padY + 3}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {chartData.yMin}
              </text>

              {/* Trend Line */}
              <path
                d={chartData.pathD}
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points & Value badges */}
              {chartData.points.map((pt, idx) => {
                const isHovered = hoveredPoint?.date === pt.date;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    {/* Outer glow ring on hover */}
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="9"
                        fill="#0d9488"
                        opacity="0.2"
                      />
                    )}
                    {/* Circle marker */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5.5 : 4}
                      fill="#ffffff"
                      stroke="#0f766e"
                      strokeWidth="2.5"
                      className="transition-all duration-150"
                    />

                    {/* Value label directly above point */}
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-slate-800 font-mono"
                    >
                      {pt.value}
                      {pt.unit === '%' ? '%' : ''}
                    </text>

                    {/* X-axis date / year */}
                    <text
                      x={pt.x}
                      y={chartData.height - chartData.padY + 16}
                      textAnchor="middle"
                      className="text-[10px] font-medium fill-slate-500"
                    >
                      {new Date(pt.date).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Card */}
            {hoveredPoint && (
              <div className="absolute top-2 right-4 bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1 pointer-events-none z-10">
                <div className="font-semibold text-teal-300">
                  {hoveredPoint.testName}: {hoveredPoint.value} {hoveredPoint.unit}
                </div>
                <div className="text-[11px] text-slate-300">
                  Date:{' '}
                  {new Date(hoveredPoint.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                {hoveredPoint.referenceRange && (
                  <div className="text-[10px] text-slate-400">
                    Ref Range: {hoveredPoint.referenceRange}
                  </div>
                )}
                {hoveredPoint.eventId && (
                  <div className="text-[10px] text-teal-400 font-mono">
                    Source: {hoveredPoint.eventId}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-xs text-slate-400 italic">
            No longitudinal laboratory measurements documented for this parameter.
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Values reflect factual laboratory report entries. Clinical targets and thresholds are established by treating clinicians.
          </span>
        </div>
      </div>

      {/* AI Structured Lab Trend Summaries */}
      <div className="space-y-3">
        {labTrends.map((trend, idx) => {
          const sourceCount = trend.sourceEventIds?.length || 0;

          return (
            <div
              key={idx}
              className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-teal-200 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                <h4 className="text-sm font-bold text-slate-900">{trend.parameter}</h4>

                {sourceCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectSources(trend.sourceEventIds, trend.parameter, trend.summary)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-medium transition-colors cursor-pointer border border-teal-200/60 self-start sm:self-auto"
                  >
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    <span>{sourceCount} source{sourceCount === 1 ? '' : 's'}</span>
                    <ArrowUpRight className="w-3 h-3 text-teal-500" />
                  </button>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {trend.summary}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
