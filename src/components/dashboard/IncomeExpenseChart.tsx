// src/components/dashboard/IncomeExpenseChart.tsx
'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from 'recharts';

interface IncomeExpenseChartProps {
  income: number;
  expense: number;
}

// Helper to format currency for tooltip/axis
const formatCurrencyAxis = (value: number) => `$${value.toLocaleString()}`;

export default function IncomeExpenseChart({ income, expense }: IncomeExpenseChartProps) {
  const data = [
    {
      name: 'Current Month',
      Income: income,
      Expenses: expense,
    },
  ];

  return (
    // Ensure parent div has a defined height or use aspect ratio
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
        <BarChart
            data={data}
            margin={{
            top: 5, right: 30, left: 20, bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatCurrencyAxis} />
            <Tooltip formatter={(value: number) => formatCurrencyAxis(value)} />
            <Legend />
            <Bar dataKey="Income" fill="#22c55e" /> {/* Green */}
            <Bar dataKey="Expenses" fill="#ef4444" /> {/* Red */}
        </BarChart>
        </ResponsiveContainer>
    </div>
  );
}