// src/components/reports/DetailedReportTable.tsx
'use client';

import React from 'react';
import { ReportTransaction } from '@/actions/reportActions'; // Use the specific type

interface DetailedReportTableProps {
  data: ReportTransaction[];
}

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Helper to format date
const formatDate = (date: Date) => {
    // Ensure date is a Date object before formatting
    return date instanceof Date && !isNaN(date.valueOf())
      ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : 'Invalid Date';
};

export default function DetailedReportTable({ data }: DetailedReportTableProps) {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-4">No detailed transactions found for selected filters.</p>;
  }

  return (
    <div className="overflow-x-auto relative shadow-md sm:rounded-lg max-h-96"> {/* Added max height and scroll */}
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0"> {/* Sticky header */}
          <tr>
            <th scope="col" className="py-3 px-6">Date</th>
            <th scope="col" className="py-3 px-6">Type</th>
            <th scope="col" className="py-3 px-6">Category</th>
            <th scope="col" className="py-3 px-6">Description</th>
            <th scope="col" className="py-3 px-6 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((tx) => (
            <tr key={tx.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <td className="py-4 px-6">{formatDate(new Date(tx.date))}</td> {/* Ensure date is converted back */}
              <td className="py-4 px-6">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    tx.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {tx.type}
                </span>
              </td>
              <td className="py-4 px-6">{tx.category}</td>
              <td className="py-4 px-6 max-w-xs truncate" title={tx.description || ''}>{tx.description || '-'}</td>
              <td className={`py-4 px-6 text-right font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                 {tx.type === 'EXPENSE' ? '-' : ''}{formatCurrency(tx.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}