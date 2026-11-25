import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentPieChartProps {
  data: SentimentData;
  height?: number;
}

export const SentimentPieChart: React.FC<SentimentPieChartProps> = ({ data, height = 220 }) => {
  const chartData = [
    { name: 'Positive', value: data.positive, color: '#28A879' },
    { name: 'Neutral', value: data.neutral, color: '#1769AA' },
    { name: 'Negative', value: data.negative, color: '#D95763' },
  ];

  const total = data.positive + data.neutral + data.negative;

  if (total === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-[#718096]">No feedback data available</div>;
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
