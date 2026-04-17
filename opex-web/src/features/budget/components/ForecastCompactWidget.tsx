import { useMemo, useState } from 'react';
import { ForecastResponse, TimeAggregatedRecord } from '../../../shared/types';
import { Card, ToggleFilter } from '../../../shared/ui';

const catmullRomPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export const ForecastCompactWidget = ({
  timeAggregatedSummary,
  forecastData
}: {
  timeAggregatedSummary: TimeAggregatedRecord;
  forecastData?: ForecastResponse | null;
}) => {
  const [period, setPeriod] = useState('Month');
  const [tooltip, setTooltip] = useState<{
    label: string;
    isForecast: boolean;
    income: number;
    expenses: number;
    net: number;
    xPct: number; // 0-100, relative to chart area
    yPct: number; // 0-100, relative to chart area
  } | null>(null);

  const config = useMemo(() => {
    type ChartPoint = {
      label: string;
      income: number;
      expenses: number;
      net: number;
      isForecast: boolean;
    };

    // Historical bars always come from client-computed timeAggregatedSummary
    // so they stay in sync with the transactions state after every mutation.
    const hasForecast = period === 'Month' && forecastData != null
      && (forecastData.forecast ?? []).length > 0;

    const srcHist =
      period === 'Quarter'
        ? timeAggregatedSummary.byQuarter
        : period === 'Year'
          ? timeAggregatedSummary.byYear
          : timeAggregatedSummary.byMonth;

    const histRaw = srcHist.length > 0
      ? (period === 'Month' ? srcHist.slice(-6) : srcHist)
      : [{ key: 'empty', label: 'No data', income: 0, expenses: 0 }];

    const histPoints: ChartPoint[] = histRaw.map(p => {
      const inc = Math.max(Number(p.income ?? 0), 0);
      const exp = Math.abs(Number(p.expenses ?? 0));
      return { label: p.label, income: inc, expenses: exp, net: inc - exp, isForecast: false };
    });

    const fcPoints: ChartPoint[] = hasForecast
      ? (forecastData!.forecast ?? []).slice(0, 3).map(f => ({
          label: f.label,
          income: Number(f.predictedIncome ?? 0),
          expenses: Math.abs(Number(f.predictedExpenses ?? 0)),
          net: Number(f.predictedNet ?? 0),
          isForecast: true
        }))
      : [];

    const splitIndex = histPoints.length;
    const points: ChartPoint[] = [...histPoints, ...fcPoints];

    const inEuros = points.map(p => p.income);
    const outEuros = points.map(p => p.expenses);
    const netEuros = points.map(p => p.net);
    const maxE = Math.max(...inEuros, ...outEuros, 1);
    const minNet = Math.min(...netEuros, 0);
    const padding = Math.max(maxE * 0.14, 1);
    const yMin = minNet < 0 ? minNet - padding : 0;
    const yMax = maxE + padding;
    const yRange = yMax - yMin || 1;

    // viewBox is 1000 × 200 — aspect ratio similar to container, reduces distortion
    const VW = 1000;
    const VH = 200;
    const getY = (v: number) => VH * (1 - (v - yMin) / yRange);
    const getBarY = (v: number) => Math.min(getY(0), getY(v));
    const getBarH = (v: number) => Math.max(Math.abs(getY(0) - getY(v)), 1);

    const yStep = yRange / 4;
    const yLabels = Array.from({ length: 5 }).map((_, i) => {
      const val = yMax - i * yStep;
      const abs = Math.abs(val);
      if (abs >= 1_000_000) return `${val < 0 ? '-' : ''}${Math.round(abs / 1_000_000)}M`;
      if (abs >= 1000) return `${val < 0 ? '-' : ''}${Math.round(abs / 1000)}K`;
      return `${Math.round(val)}`;
    });

    const n = points.length;
    const bw = n > 0 ? VW / n : VW;
    const linePoints = points.map((p, i) => ({
      x: i * bw + bw / 2,
      y: getY(p.net)
    }));

    const trendLabel = hasForecast ? (forecastData!.trend ?? null) : null;

    return {
      points, splitIndex, hasForecast,
      inEuros, outEuros, netEuros,
      yLabels, linePoints, bw,
      VW, VH,
      getY, getBarY, getBarH,
      trendLabel,
    };
  }, [period, timeAggregatedSummary, forecastData]);

  const trendColor =
    config.trendLabel === 'GROWING'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : config.trendLabel === 'DECLINING'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-gray-100 text-gray-500 border-gray-200';
  const trendIcon = config.trendLabel === 'GROWING' ? '↑' : config.trendLabel === 'DECLINING' ? '↓' : '→';

  const actualLinePoints = config.linePoints.slice(0, config.splitIndex);
  // overlap by 1 so the dashed segment starts right where the solid one ends
  const forecastLinePoints = config.splitIndex > 0
    ? config.linePoints.slice(config.splitIndex - 1)
    : [];

  const actualPath = catmullRomPath(actualLinePoints);
  const forecastPath = catmullRomPath(forecastLinePoints);
  // separator as percentage of chart width
  const separatorPct = config.splitIndex * (100 / config.points.length);

  return (
    <Card
      title="Forecast"
      noPadding
      action={
        <div className="flex items-center gap-3 scale-90 origin-right">
          {config.trendLabel && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border tracking-wider uppercase ${trendColor}`}>
              {trendIcon} {config.trendLabel}
            </span>
          )}
          <ToggleFilter
            options={['Month', 'Quarter', 'Year']}
            active={period}
            onChange={setPeriod}
          />
          <div className="hidden sm:flex items-center gap-3 mr-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Expense</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[2px] rounded-full" style={{ background: '#2F6FED' }} />
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Net</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="p-4">
        <div className="relative h-44 w-full">
          {/* Y-axis labels */}
          <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[8px] font-black text-gray-300 pb-6 pointer-events-none w-8">
            {config.yLabels.map((l, i) => <span key={i}>{l}</span>)}
          </div>

          {/* Grid lines */}
          <div className="absolute left-10 right-0 inset-y-0 flex flex-col justify-between pb-6 pointer-events-none">
            {[0, 1, 2, 3].map(i => <div key={i} className="w-full border-t border-gray-100" />)}
            <div className="w-full border-t border-gray-200" />
          </div>

          {/* Forecast background zone */}
          {config.hasForecast && config.splitIndex < config.points.length && (
            <div
              className="absolute top-0 bottom-6 bg-blue-50/40 border-l border-dashed border-blue-200/70 pointer-events-none"
              style={{ left: `calc(2.5rem + ${separatorPct}%)`, right: 0 }}
            />
          )}

          {/* Chart area */}
          <div className="absolute left-10 right-0 bottom-6 top-0">
            <svg
              viewBox={`0 0 ${config.VW} ${config.VH}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {config.points.map((pt, i) => {
                const xPos = i * config.bw;
                const isFC = pt.isForecast;
                // xPct / yPct are used for the tooltip position (percent of chart area)
                const centerXPct = (xPos + config.bw / 2) / config.VW * 100;
                return (
                  <g key={i}>
                    {/* Income bar */}
                    <rect
                      x={xPos + config.bw * 0.1}
                      y={config.getBarY(pt.income)}
                      width={config.bw * 0.35}
                      height={config.getBarH(pt.income)}
                      fill="#22C55E"
                      opacity={isFC ? 0.35 : 0.82}
                      className="cursor-pointer"
                      onMouseEnter={() => setTooltip({
                        label: pt.label, isForecast: isFC,
                        income: pt.income, expenses: pt.expenses, net: pt.net,
                        xPct: centerXPct,
                        yPct: config.getBarY(pt.income) / config.VH * 100
                      })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {/* Expense bar */}
                    <rect
                      x={xPos + config.bw * 0.5}
                      y={config.getBarY(pt.expenses)}
                      width={config.bw * 0.35}
                      height={config.getBarH(pt.expenses)}
                      fill="#EF4444"
                      opacity={isFC ? 0.35 : 0.82}
                      className="cursor-pointer"
                      onMouseEnter={() => setTooltip({
                        label: pt.label, isForecast: isFC,
                        income: pt.income, expenses: pt.expenses, net: pt.net,
                        xPct: centerXPct,
                        yPct: config.getBarY(pt.expenses) / config.VH * 100
                      })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  </g>
                );
              })}

              {/* Forecast separator */}
              {config.hasForecast && config.splitIndex > 0 && config.splitIndex < config.points.length && (
                <line
                  x1={config.splitIndex * config.bw} y1="0"
                  x2={config.splitIndex * config.bw} y2={config.VH}
                  stroke="#93C5FD"
                  strokeWidth="1"
                  strokeDasharray="4 5"
                  vectorEffect="non-scaling-stroke"
                />
              )}

              {/* Actual net line */}
              {actualPath && (
                <path
                  d={actualPath}
                  fill="none"
                  stroke="#2F6FED"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.9}
                />
              )}

              {/* Forecast net line (dashed) */}
              {forecastPath && (
                <path
                  d={forecastPath}
                  fill="none"
                  stroke="#2F6FED"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 6"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.65}
                />
              )}
            </svg>

            {/* Dot markers – rendered as HTML divs to stay perfectly circular */}
            {config.linePoints.map((lp, i) => {
              const pt = config.points[i];
              const leftPct = lp.x / config.VW * 100;
              const topPct = lp.y / config.VH * 100;
              return (
                <div
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-full border-2 bg-white shadow-sm cursor-pointer hover:scale-125 transition-transform z-10"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                    borderColor: '#2F6FED',
                    opacity: pt.isForecast ? 0.7 : 1
                  }}
                  onMouseEnter={() => setTooltip({
                    label: pt.label, isForecast: pt.isForecast,
                    income: pt.income, expenses: pt.expenses, net: pt.net,
                    xPct: leftPct, yPct: topPct
                  })}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}

            {/* "FORECAST →" label */}
            {config.hasForecast && config.splitIndex > 0 && config.splitIndex < config.points.length && (
              <div
                className="absolute top-1 text-[7px] font-black text-blue-400/70 uppercase tracking-widest pointer-events-none select-none"
                style={{ left: `${separatorPct + 0.5}%` }}
              >
                Forecast →
              </div>
            )}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute bg-gray-900 text-white px-3 py-2.5 rounded-2xl shadow-2xl pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150 min-w-[130px]"
              style={{
                left: `calc(2.5rem + ${tooltip.xPct}%)`,
                top: `${tooltip.yPct}%`,
                transform: 'translate(-50%, calc(-100% - 14px))'
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">{tooltip.label}</p>
                {tooltip.isForecast && (
                  <span className="text-[7px] font-black text-blue-400 bg-blue-900/40 px-1 py-0.5 rounded uppercase">est.</span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-[9px] text-green-400 font-bold">Income</span>
                  <span className="text-[10px] font-black text-white">{fmtCurrency(tooltip.income)}</span>
                </div>
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-[9px] text-red-400 font-bold">Expense</span>
                  <span className="text-[10px] font-black text-white">{fmtCurrency(tooltip.expenses)}</span>
                </div>
                <div className="border-t border-white/10 pt-1 flex justify-between gap-4 items-center">
                  <span className="text-[9px] text-blue-300 font-bold">Net</span>
                  <span className={`text-[10px] font-black ${tooltip.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tooltip.net >= 0 ? '+' : ''}{fmtCurrency(tooltip.net)}
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 rounded-sm" />
            </div>
          )}

          {/* X-axis labels */}
          <div className="absolute left-10 right-0 bottom-0 flex text-[8px] font-black text-gray-400 pointer-events-none uppercase tracking-widest overflow-hidden h-6 items-end">
            {config.points.map((pt, i) => (
              <span
                key={i}
                className={`flex-1 text-center truncate pb-0.5 ${pt.isForecast ? 'text-blue-400/70' : ''}`}
              >
                {pt.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};




