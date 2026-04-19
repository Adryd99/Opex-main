import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppLanguage } from '../../../i18n';
import { formatCurrency } from '../../../shared/formatting';
import { Card, ToggleFilter } from '../../../shared/ui';
import { ForecastResponse, TimeAggregatedRecord } from '../../../shared/types';

const catmullRomPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i += 1) {
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

type ForecastCompactWidgetProps = {
  timeAggregatedSummary: TimeAggregatedRecord;
  forecastData?: ForecastResponse | null;
};

export const ForecastCompactWidget = ({
  timeAggregatedSummary,
  forecastData
}: ForecastCompactWidgetProps) => {
  const { t } = useTranslation('budget');
  const { language } = useAppLanguage();
  const [period, setPeriod] = useState('Month');
  const [tooltip, setTooltip] = useState<{
    label: string;
    isForecast: boolean;
    income: number;
    expenses: number;
    net: number;
    xPct: number;
    yPct: number;
  } | null>(null);

  const config = useMemo(() => {
    type ChartPoint = {
      label: string;
      income: number;
      expenses: number;
      net: number;
      isForecast: boolean;
    };

    const hasForecast = period === 'Month' && forecastData != null && (forecastData.forecast ?? []).length > 0;

    const source =
      period === 'Quarter'
        ? timeAggregatedSummary.byQuarter
        : period === 'Year'
          ? timeAggregatedSummary.byYear
          : timeAggregatedSummary.byMonth;

    const historical =
      source.length > 0
        ? (period === 'Month' ? source.slice(-6) : source)
        : [{ key: 'empty', label: t('forecast.noData'), income: 0, expenses: 0 }];

    const historicalPoints: ChartPoint[] = historical.map((point) => {
      const income = Math.max(Number(point.income ?? 0), 0);
      const expenses = Math.abs(Number(point.expenses ?? 0));
      return { label: point.label, income, expenses, net: income - expenses, isForecast: false };
    });

    const forecastPoints: ChartPoint[] = hasForecast
      ? (forecastData?.forecast ?? []).slice(0, 3).map((point) => ({
          label: point.label,
          income: Number(point.predictedIncome ?? 0),
          expenses: Math.abs(Number(point.predictedExpenses ?? 0)),
          net: Number(point.predictedNet ?? 0),
          isForecast: true
        }))
      : [];

    const splitIndex = historicalPoints.length;
    const points = [...historicalPoints, ...forecastPoints];
    const incomes = points.map((point) => point.income);
    const expenses = points.map((point) => point.expenses);
    const netValues = points.map((point) => point.net);
    const maxValue = Math.max(...incomes, ...expenses, 1);
    const minNet = Math.min(...netValues, 0);
    const padding = Math.max(maxValue * 0.14, 1);
    const yMin = minNet < 0 ? minNet - padding : 0;
    const yMax = maxValue + padding;
    const yRange = yMax - yMin || 1;

    const viewWidth = 1000;
    const viewHeight = 200;
    const getY = (value: number) => viewHeight * (1 - (value - yMin) / yRange);
    const getBarY = (value: number) => Math.min(getY(0), getY(value));
    const getBarHeight = (value: number) => Math.max(Math.abs(getY(0) - getY(value)), 1);

    const yStep = yRange / 4;
    const yLabels = Array.from({ length: 5 }).map((_, index) => {
      const value = yMax - index * yStep;
      const abs = Math.abs(value);
      if (abs >= 1_000_000) return `${value < 0 ? '-' : ''}${Math.round(abs / 1_000_000)}M`;
      if (abs >= 1000) return `${value < 0 ? '-' : ''}${Math.round(abs / 1000)}K`;
      return `${Math.round(value)}`;
    });

    const barWidth = points.length > 0 ? viewWidth / points.length : viewWidth;
    const linePoints = points.map((point, index) => ({
      x: index * barWidth + barWidth / 2,
      y: getY(point.net)
    }));

    return {
      points,
      splitIndex,
      hasForecast,
      yLabels,
      linePoints,
      barWidth,
      viewWidth,
      viewHeight,
      getY,
      getBarY,
      getBarHeight,
      trendLabel: hasForecast ? (forecastData?.trend ?? null) : null
    };
  }, [forecastData, period, t, timeAggregatedSummary]);

  const trendColor =
    config.trendLabel === 'GROWING'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : config.trendLabel === 'DECLINING'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-gray-100 text-gray-500 border-gray-200';
  const trendIcon = config.trendLabel === 'GROWING' ? '↑' : config.trendLabel === 'DECLINING' ? '↓' : '→';

  const actualLinePoints = config.linePoints.slice(0, config.splitIndex);
  const forecastLinePoints = config.splitIndex > 0 ? config.linePoints.slice(config.splitIndex - 1) : [];
  const actualPath = catmullRomPath(actualLinePoints);
  const forecastPath = catmullRomPath(forecastLinePoints);
  const separatorPct = config.splitIndex * (100 / config.points.length);

  return (
    <Card
      title={t('forecast.title')}
      noPadding
      action={
        <div className="flex items-center gap-3 scale-90 origin-right">
          {config.trendLabel && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border tracking-wider uppercase ${trendColor}`}>
              {trendIcon} {config.trendLabel}
            </span>
          )}
          <ToggleFilter
            options={[
              { value: 'Month', label: t('forecast.filters.month') },
              { value: 'Quarter', label: t('forecast.filters.quarter') },
              { value: 'Year', label: t('forecast.filters.year') }
            ]}
            active={period}
            onChange={setPeriod}
          />
          <div className="hidden sm:flex items-center gap-3 mr-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{t('forecast.income')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{t('forecast.expense')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[2px] rounded-full" style={{ background: '#2F6FED' }} />
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{t('forecast.net')}</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="p-4">
        <div className="relative h-44 w-full">
          <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[8px] font-black text-gray-300 pb-6 pointer-events-none w-8">
            {config.yLabels.map((label, index) => <span key={index}>{label}</span>)}
          </div>

          <div className="absolute left-10 right-0 inset-y-0 flex flex-col justify-between pb-6 pointer-events-none">
            {[0, 1, 2, 3].map((index) => <div key={index} className="w-full border-t border-gray-100" />)}
            <div className="w-full border-t border-gray-200" />
          </div>

          {config.hasForecast && config.splitIndex < config.points.length && (
            <div
              className="absolute top-0 bottom-6 bg-blue-50/40 border-l border-dashed border-blue-200/70 pointer-events-none"
              style={{ left: `calc(2.5rem + ${separatorPct}%)`, right: 0 }}
            />
          )}

          <div className="absolute left-10 right-0 bottom-6 top-0">
            <svg
              viewBox={`0 0 ${config.viewWidth} ${config.viewHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {config.points.map((point, index) => {
                const xPos = index * config.barWidth;
                const centerXPct = ((xPos + config.barWidth / 2) / config.viewWidth) * 100;

                return (
                  <g key={`${point.label}-${index}`}>
                    <rect
                      x={xPos + config.barWidth * 0.1}
                      y={config.getBarY(point.income)}
                      width={config.barWidth * 0.35}
                      height={config.getBarHeight(point.income)}
                      fill="#22C55E"
                      opacity={point.isForecast ? 0.35 : 0.82}
                      className="cursor-pointer"
                      onMouseEnter={() => setTooltip({
                        label: point.label,
                        isForecast: point.isForecast,
                        income: point.income,
                        expenses: point.expenses,
                        net: point.net,
                        xPct: centerXPct,
                        yPct: (config.getBarY(point.income) / config.viewHeight) * 100
                      })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    <rect
                      x={xPos + config.barWidth * 0.5}
                      y={config.getBarY(point.expenses)}
                      width={config.barWidth * 0.35}
                      height={config.getBarHeight(point.expenses)}
                      fill="#EF4444"
                      opacity={point.isForecast ? 0.35 : 0.82}
                      className="cursor-pointer"
                      onMouseEnter={() => setTooltip({
                        label: point.label,
                        isForecast: point.isForecast,
                        income: point.income,
                        expenses: point.expenses,
                        net: point.net,
                        xPct: centerXPct,
                        yPct: (config.getBarY(point.expenses) / config.viewHeight) * 100
                      })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  </g>
                );
              })}

              {config.hasForecast && config.splitIndex > 0 && config.splitIndex < config.points.length && (
                <line
                  x1={config.splitIndex * config.barWidth}
                  y1="0"
                  x2={config.splitIndex * config.barWidth}
                  y2={config.viewHeight}
                  stroke="#93C5FD"
                  strokeWidth="1"
                  strokeDasharray="4 5"
                  vectorEffect="non-scaling-stroke"
                />
              )}

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

            {config.linePoints.map((linePoint, index) => {
              const point = config.points[index];
              const leftPct = (linePoint.x / config.viewWidth) * 100;
              const topPct = (linePoint.y / config.viewHeight) * 100;

              return (
                <div
                  key={`${point.label}-${index}-dot`}
                  className="absolute w-2.5 h-2.5 rounded-full border-2 bg-white shadow-sm cursor-pointer hover:scale-125 transition-transform z-10"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                    borderColor: '#2F6FED',
                    opacity: point.isForecast ? 0.7 : 1
                  }}
                  onMouseEnter={() => setTooltip({
                    label: point.label,
                    isForecast: point.isForecast,
                    income: point.income,
                    expenses: point.expenses,
                    net: point.net,
                    xPct: leftPct,
                    yPct: topPct
                  })}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}

            {config.hasForecast && config.splitIndex > 0 && config.splitIndex < config.points.length && (
              <div
                className="absolute top-1 text-[7px] font-black text-blue-400/70 uppercase tracking-widest pointer-events-none select-none"
                style={{ left: `${separatorPct + 0.5}%` }}
              >
                {t('forecast.forecast')} →
              </div>
            )}
          </div>

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
                  <span className="text-[7px] font-black text-blue-400 bg-blue-900/40 px-1 py-0.5 rounded uppercase">{t('forecast.estimated')}</span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-[9px] text-green-400 font-bold">{t('forecast.income')}</span>
                  <span className="text-[10px] font-black text-white">{formatCurrency(tooltip.income, language)}</span>
                </div>
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-[9px] text-red-400 font-bold">{t('forecast.expense')}</span>
                  <span className="text-[10px] font-black text-white">{formatCurrency(tooltip.expenses, language)}</span>
                </div>
                <div className="border-t border-white/10 pt-1 flex justify-between gap-4 items-center">
                  <span className="text-[9px] text-blue-300 font-bold">{t('forecast.net')}</span>
                  <span className={`text-[10px] font-black ${tooltip.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tooltip.net >= 0 ? '+' : ''}{formatCurrency(tooltip.net, language)}
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 rounded-sm" />
            </div>
          )}

          <div className="absolute left-10 right-0 bottom-0 flex text-[8px] font-black text-gray-400 pointer-events-none uppercase tracking-widest overflow-hidden h-6 items-end">
            {config.points.map((point, index) => (
              <span
                key={`${point.label}-${index}-label`}
                className={`flex-1 text-center truncate pb-0.5 ${point.isForecast ? 'text-blue-400/70' : ''}`}
              >
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
