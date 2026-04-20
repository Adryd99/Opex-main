import { type MouseEvent as ReactMouseEvent, useMemo, useRef, useState } from 'react';

type ChartDatum = {
  label: string;
  value: number;
};

export const EnhancedLineChart = ({
  color = '#22C55E',
  period = 'Month',
  heightPixels = 280
}: {
  color?: string;
  period?: string;
  heightPixels?: number;
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null);
  const containerRef = useRef<SVGSVGElement>(null);

  const data = useMemo<ChartDatum[]>(() => [], [period]);

  const width = 400;
  const height = 100;
  const padding = { top: 15, bottom: 10, left: 10, right: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((datum) => datum.value), 1);
  const yAxisTicks = [maxVal, maxVal * 0.66, maxVal * 0.33, 0];

  const points = data.map((datum, index) => {
    const x = data.length > 1 ? padding.left + (index * (chartWidth / (data.length - 1))) : padding.left + chartWidth / 2;
    const y = padding.top + (chartHeight - (datum.value / maxVal) * chartHeight);
    return { x, y, ...datum };
  });

  const bezierPathD = useMemo(() => {
    if (points.length < 2) {
      return '';
    }

    let path = `M ${points[0].x},${points[0].y}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const xMid = (points[index].x + points[index + 1].x) / 2;
      const yMid = (points[index].y + points[index + 1].y) / 2;
      path += ` Q ${points[index].x},${points[index].y} ${xMid},${yMid}`;
    }
    path += ` T ${points[points.length - 1].x},${points[points.length - 1].y}`;
    return path;
  }, [points]);

  const handleMouseMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || points.length === 0) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * width;

    let closestIndex = 0;
    let minDistance = Number.POSITIVE_INFINITY;
    points.forEach((point, index) => {
      const distance = Math.abs(point.x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    setHoveredPoint({
      index: closestIndex,
      x: points[closestIndex].x,
      y: points[closestIndex].y
    });
  };

  const uniqueLabels = useMemo(() => {
    const labels: Array<{ label: string; x: number; index: number }> = [];
    let lastLabel = '';
    points.forEach((point, index) => {
      if (point.label !== lastLabel) {
        labels.push({ label: point.label, x: point.x, index });
        lastLabel = point.label;
      }
    });
    return labels;
  }, [points]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div style={{ height: `${heightPixels}px` }} className="flex w-full">
        <div className="flex w-12 flex-col justify-between border-r border-app-border py-4 pr-3 text-right text-[10px] font-bold text-app-tertiary">
          {yAxisTicks.map((tick, index) => (
            <span key={index}>EUR {(tick / 1000).toFixed(1)}k</span>
          ))}
        </div>

        <div className="relative ml-2 flex-1 group">
          <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between px-0 py-4 opacity-30 pointer-events-none">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="w-full border-t border-app-border"></div>
            ))}
          </div>

          <svg
            ref={containerRef}
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            {points.length > 0 && (
              <path
                d={`${bezierPathD} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`}
                fill={`url(#gradient-${color.replace('#', '')})`}
                opacity="0.1"
                className="transition-all duration-700 ease-in-out"
              />
            )}

            {bezierPathD && (
              <path
                d={bezierPathD}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                className="transition-all duration-700 ease-in-out"
              />
            )}

            {hoveredPoint && (
              <line
                x1={hoveredPoint.x}
                y1="0"
                x2={hoveredPoint.x}
                y2={height}
                stroke={color}
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />
            )}

            {points.length > 0 && (
              <circle
                cx={hoveredPoint ? hoveredPoint.x : points[points.length - 1].x}
                cy={hoveredPoint ? hoveredPoint.y : points[points.length - 1].y}
                r="4"
                fill={color}
                className="transition-all duration-300 ease-out shadow-lg"
              />
            )}
          </svg>

          {hoveredPoint && points[hoveredPoint.index] && (
            <div
              className="absolute z-30 rounded-2xl border border-app-border bg-app-surface px-3 py-2.5 shadow-2xl transition-all duration-150 ease-out pointer-events-none"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100}%`,
                transform: 'translate(-50%, -130%)'
              }}
            >
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest leading-none text-app-tertiary">
                {points[hoveredPoint.index].label}
              </p>
              <p className="text-base font-black leading-none text-app-primary">
                EUR {points[hoveredPoint.index].value.toLocaleString()}
              </p>
              <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-app-border bg-app-surface"></div>
            </div>
          )}
        </div>
      </div>

      <div className="relative ml-14 mr-2 h-6">
        {uniqueLabels.map((item, index) => (
          <span
            key={index}
            className={`absolute -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest transition-colors ${(hoveredPoint && points[hoveredPoint.index]?.label === item.label) ? 'text-opex-teal' : 'text-app-tertiary'}`}
            style={{ left: `${(item.x / width) * 100}%` }}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};
