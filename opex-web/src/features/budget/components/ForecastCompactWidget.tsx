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
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200'
      : config.trendLabel === 'DECLINING'
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200'
        : 'border-app-border bg-app-muted text-app-secondary';
  const trendIcon = config.trendLabel === 'GROWING' ? 'UP' : config.trendLabel === 'DECLINING' ? 'DOWN' : 'NEXT';

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
        <div className="origin-right scale-90 items-center gap-3 flex">
          {config.trendLabel && (
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${trendColor}`}>
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
          <div className="mr-2 hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[8px] font-black uppercase tracking-tighter text-app-tertiary">{t('forecast.income')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span className="text-[8px] font-black uppercase tracking-tighter text-app-tertiary">{t('forecast.expense')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-[2px] w-3 rounded-full" style={{ background: '#2F6FED' }} />
              <span className="text-[8px] font-black uppercase tracking-tighter text-app-tertiary">{t('forecast.net')}</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="p-4">
        <div className="relative h-44 w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex w-8 flex-col justify-between pb-6 text-[8px] font-black text-app-tertiary">
            {config.yLabels.map((label, index) => <span key={index}>{label}</span>)}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-10 right-0 flex flex-col justify-between pb-6">
            {[0, 1, 2, 3].map((index) => <div key={index} className="w-full border-t border-app-border" />)}
            <div className="w-full border-t border-app-tertiary/30" />
          </div>

          {config.hasForecast && config.splitIndex < config.points.length && (
            <div
              className="pointer-events-none absolute bottom-6 top-0 border-l border-dashed border-blue-200/70 bg-blue-50/40 dark:border-blue-400/30 dark:bg-blue-500/10"
              style={{ left: `calc(2.5rem + ${separatorPct}%)`, right: 0 }}
            />
          )}

          <div className="absolute bottom-6 left-10 right-0 top-0">
            <svg
              viewBox={`0 0 ${config.viewWidth} ${config.viewHeight}`}
              className="h-full w-full overflow-visible"
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
                  className="absolute z-10 h-2.5 w-2.5 cursor-pointer rounded-full border-2 bg-app-surface shadow-sm transition-transform hover:scale-125"
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
                className="pointer-events-none absolute top-1 select-none text-[7px] font-black uppercase tracking-widest text-blue-400/70"
                style={{ left: `${separatorPct + 0.5}%` }}
              >
                {t('forecast.forecast')} -&gt;
              </div>
            )}
          </div>

          {tooltip && (
            <div
              className="pointer-events-none absolute z-50 min-w-[130px] animate-in fade-in zoom-in-95 rounded-2xl border border-app-border bg-app-surface px-3 py-2.5 shadow-2xl duration-150"
              style={{
                left: `calc(2.5rem + ${tooltip.xPct}%)`,
                top: `${tooltip.yPct}%`,
                transform: 'translate(-50%, calc(-100% - 14px))'
              }}
            >
              <div className="mb-2 flex items-center gap-1.5">
                <p className="text-[8px] font-black uppercase tracking-widest leading-none text-app-tertiary">{tooltip.label}</p>
                {tooltip.isForecast && (
                  <span className="rounded bg-blue-900/40 px-1 py-0.5 text-[7px] font-black uppercase text-blue-400">
                    {t('forecast.estimated')}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[9px] font-bold text-green-400">{t('forecast.income')}</span>
                  <span className="text-[10px] font-black text-app-primary">{formatCurrency(tooltip.income, language)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[9px] font-bold text-red-400">{t('forecast.expense')}</span>
                  <span className="text-[10px] font-black text-app-primary">{formatCurrency(tooltip.expenses, language)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-app-border pt-1">
                  <span className="text-[9px] font-bold text-blue-300">{t('forecast.net')}</span>
                  <span className={`text-[10px] font-black ${tooltip.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tooltip.net >= 0 ? '+' : ''}
                    {formatCurrency(tooltip.net, language)}
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm border-b border-r border-app-border bg-app-surface" />
            </div>
          )}

          <div className="pointer-events-none absolute bottom-0 left-10 right-0 flex h-6 items-end overflow-hidden text-[8px] font-black uppercase tracking-widest text-app-tertiary">
            {config.points.map((point, index) => (
              <span
                key={`${point.label}-${index}-label`}
                className={`flex-1 truncate pb-0.5 text-center ${point.isForecast ? 'text-blue-400/70' : ''}`}
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
