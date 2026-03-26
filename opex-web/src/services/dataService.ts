import { ChartDataPoint } from '../models/types';

export const generateDenseData = (count: number, min: number, max: number, labels: string[]): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const pointsPerLabel = Math.floor(count / labels.length);
  
  for (let i = 0; i < count; i++) {
    const labelIndex = Math.floor(i / pointsPerLabel);
    const baseLabel = labels[Math.min(labelIndex, labels.length - 1)];
    const variance = (Math.random() - 0.5) * (max - min) * 0.4;
    const progress = i / count;
    const value = Math.floor(min + (progress * (max - min)) + variance + (max - min) * 0.2);
    
    data.push({
      label: baseLabel,
      subLabel: `Point ${i + 1}`,
      value: Math.max(min, Math.min(max, value))
    });
  }
  return data;
};
