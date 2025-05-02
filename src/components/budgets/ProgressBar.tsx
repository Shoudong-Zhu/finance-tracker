// src/components/budgets/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  progress: number; // Percentage (0-100 typically, allow higher for overspent)
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const safeProgress = Math.max(0, Math.min(progress, 100)); // Cap at 100 for width calc
  let bgColor = 'bg-blue-500'; // Default color

  if (progress > 100) {
    bgColor = 'bg-red-500'; // Over budget
  } else if (progress >= 85) {
    bgColor = 'bg-yellow-500'; // Nearing budget
  } else if (progress >= 50) {
    bgColor = 'bg-green-500'; // Well within budget
  }

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
      <div
        className={`h-2.5 rounded-full ${bgColor}`}
        style={{ width: `${safeProgress}%` }}
        title={`${progress.toFixed(0)}% Spent`} // Show actual % on hover
      ></div>
    </div>
  );
}