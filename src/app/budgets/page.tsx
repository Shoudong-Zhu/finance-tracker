// src/app/budgets/page.tsx
'use client'; // Required for state (month/year selection) and useEffect

import { useState, useEffect, useTransition } from 'react';
import { getBudgetStatusForMonth, BudgetStatus } from '@/actions/budgetActions';
import BudgetForm from '@/components/budgets/BudgetForm';
import ProgressBar from '@/components/budgets/ProgressBar';

// Helper to format currency (move to utils if used elsewhere)
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function BudgetsPage() {
  const now = new Date(); // Use client's date for initial default
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition(); // For Server Action calls

  // Fetch data when month/year changes
  useEffect(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const data = await getBudgetStatusForMonth(selectedMonth, selectedYear);
        setBudgetStatus(data);
      } catch (error) {
          console.error("Failed to fetch budget status", error);
          // Maybe set an error state here
      } finally {
          setIsLoading(false);
      }
    });
  }, [selectedMonth, selectedYear]);

  // Generate options for year dropdown (e.g., last 5 years + next year)
  const yearOptions = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 5 + i);
  const monthOptions = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value, 10));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value, 10));
  };

  // Calculate totals
  const totalBudgeted = budgetStatus.reduce((sum, item) => sum + item.budgeted, 0);
  const totalSpent = budgetStatus.reduce((sum, item) => sum + item.spent, 0);
  const overallRemaining = totalBudgeted - totalSpent;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Budgets</h1>

      {/* Month/Year Selector */}
      <div className="flex space-x-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <label htmlFor="month-select" className="text-sm font-medium text-gray-700">Month:</label>
        <select
          id="month-select"
          value={selectedMonth}
          onChange={handleMonthChange}
          className="px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <label htmlFor="year-select" className="text-sm font-medium text-gray-700">Year:</label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={handleYearChange}
          className="px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Add/Edit Budget Form */}
      <BudgetForm month={selectedMonth} year={selectedYear} />

      {/* Budget Status Display */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Budget Status for {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}</h2>

        {/* Overall Summary */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded">
             <div>
                 <p className="text-sm text-gray-500">Total Budgeted</p>
                 <p className="text-xl font-semibold text-gray-800">{formatCurrency(totalBudgeted)}</p>
             </div>
              <div>
                 <p className="text-sm text-gray-500">Total Spent</p>
                 <p className="text-xl font-semibold text-red-600">{formatCurrency(totalSpent)}</p>
             </div>
              <div>
                 <p className="text-sm text-gray-500">Overall Remaining</p>
                 <p className={`text-xl font-semibold ${overallRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(overallRemaining)}
                 </p>
             </div>
         </div>

        {/* Loading State */}
        {(isLoading || isPending) && <p className="text-center text-gray-500 py-4">Loading budget data...</p>}

        {/* Budget Table/List */}
        {!isLoading && !isPending && (
          budgetStatus.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No budgets set or expenses found for this period.</p>
          ) : (
            <div className="space-y-4">
              {budgetStatus.map((item) => (
                <div key={item.category} className="p-3 border rounded-md grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                  <div className="font-medium text-gray-800">{item.category}</div>
                  <div className="text-sm text-gray-600">
                     Budget: {item.budgeted > 0 ? formatCurrency(item.budgeted) : <span className="italic">None</span>}
                  </div>
                   <div className={`text-sm ${item.spent > item.budgeted && item.budgeted > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                     Spent: {formatCurrency(item.spent)}
                  </div>
                  <div className="w-full">
                    {item.budgeted > 0 ? (
                      <ProgressBar progress={item.progress} />
                    ) : (
                        <p className="text-xs text-gray-500 italic text-right">Unbudgeted</p>
                    )}
                    <p className={`text-xs text-right mt-1 ${item.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.remaining)} {item.remaining >= 0 ? 'left' : 'over'}
                     </p>
                  </div>
                  {/* Consider adding Edit/Delete buttons here later */}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}