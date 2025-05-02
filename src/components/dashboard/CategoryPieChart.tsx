// src/components/dashboard/CategoryPieChart.tsx
'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

// Define colors - add more if you expect many categories
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// Helper to format currency for tooltip
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 h-64 flex items-center justify-center">No expense data available.</p>;
  }

  return (
     // Ensure parent div has a defined height or use aspect ratio
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
        <PieChart>
            <Pie
            data={data}
            cx="50%" // Center horizontally
            cy="50%" // Center vertically
            labelLine={false}
            // label={renderCustomizedLabel} // Can add labels if desired
            outerRadius={80} // Adjust size as needed
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            >
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [`${formatCurrency(value)}`, name]}/>
            <Legend />
        </PieChart>
        </ResponsiveContainer>
    </div>
  );
}