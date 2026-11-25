import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface CategoryData {
  category: string;
  count: number;
}

interface CategoryBarChartProps {
  data: CategoryData[];
  height?: number;
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ data, height = 220 }) => {
  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-[#718096]">No category data available</div>;
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E1E8F0" />
          <XAxis type="number" stroke="#718096" fontSize={10} />
          <YAxis type="category" dataKey="category" stroke="#203247" fontSize={10} width={110} />
          <Tooltip />
          <Bar dataKey="count" fill="#1769AA" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
