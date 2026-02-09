import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { OutputItem } from '../types';

interface Props {
  data: OutputItem[];
}

export const Visualization: React.FC<Props> = ({ data }) => {
  // Calculate approximate duration per cut based on cut order for visualization
  // Since real duration needs parsing, we just visualize the cut distribution per generic index
  const chartData = data.map((item, index) => ({
    name: `Cut ${index + 1}`,
    length: item.prompt.length, // Visualize Prompt Complexity/Length
    summaryLength: item.summary.length
  }));

  if (chartData.length === 0) return null;

  return (
    <div className="h-48 w-full bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Prompt Density Analysis
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6b7280', fontSize: 10 }} 
            interval={Math.floor(chartData.length / 5)}
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' }}
            itemStyle={{ color: '#9ca3af', fontSize: '12px' }}
          />
          <Bar dataKey="length" fill="#3b82f6" radius={[4, 4, 0, 0]}>
             {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#2563eb'} />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};