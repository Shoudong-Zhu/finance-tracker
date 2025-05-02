// src/components/dashboard/SummaryCard.tsx
import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  isPositive?: boolean;
  isNegative?: boolean;
}

export default function SummaryCard({ title, value, isPositive = false, isNegative = false }: SummaryCardProps) {
  let valueColor = 'text-gray-900';
  if (isPositive) valueColor = 'text-green-600';
  if (isNegative) valueColor = 'text-red-600';

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
      <p className={`mt-1 text-3xl font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}