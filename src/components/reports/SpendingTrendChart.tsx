// src/components/reports/SpendingTrendChart.tsx
'use client';

import React from 'react';
import {
  ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line
} from 'recharts';
import { SpendingTrendData } from '@/actions/reportActions'; // Adjust path

interface SpendingTrendChartProps {
  data: SpendingTrendData[];
}

// Helper to format currency for tooltip/axis
const formatCurrencyAxis = (value: number) => `$${value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;

export default function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 h-64 flex items-center justify-center">No trend data available for selected filters.</p>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthYear" />
          <YAxis tickFormatter={formatCurrencyAxis} />
          <Tooltip formatter={(value: number) => formatCurrencyAxis(value)}/>
          <Legend />
          <Line type="monotone" dataKey="totalExpenses" name="Total Expenses" stroke="#ef4444" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}