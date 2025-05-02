// src/app/reports/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  getUserCategories,
  getSpendingTrend, SpendingTrendData,
  getDetailedTransactionsReport, ReportTransaction
} from '@/actions/reportActions'; // Adjust path
import SpendingTrendChart from '../../components/reports/SpendingTrendChart'; // Create this
import DetailedReportTable from '../../components/reports/DetailedReportTable'; // Create this
import { unparse } from 'papaparse'; // For CSV Export

// Helper Function to format Date to YYYY-MM-DD for input defaults
const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export default function ReportsPage() {
  // == State Variables ==
  const today = new Date(); // May 1st, 2025
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1); // Jan 1st, 2025

  const [startDate, setStartDate] = useState<string>(formatDateForInput(firstDayOfYear));
  const [endDate, setEndDate] = useState<string>(formatDateForInput(today));
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [trendData, setTrendData] = useState<SpendingTrendData[]>([]);
  const [detailedData, setDetailedData] = useState<ReportTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // == Fetch initial categories ==
  useEffect(() => {
    async function fetchCategories() {
        setIsLoading(true); // Show loading for categories too
        try {
             const categories = await getUserCategories();
             setAvailableCategories(categories);
             // Initially select all categories
             setSelectedCategories(new Set(categories));
        } catch (err) {
            setError("Failed to load categories.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }
    fetchCategories();
  }, []); // Run only once on mount

  // == Handlers ==
  const handleCategoryChange = (category: string, isChecked: boolean) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(category);
      } else {
        newSet.delete(category);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedCategories(new Set(availableCategories));
  };

  const handleSelectNone = () => {
    setSelectedCategories(new Set());
  };

  const handleGenerateReport = () => {
    setError(null); // Clear previous errors
    setIsLoading(true);
    setTrendData([]); // Clear previous data
    setDetailedData([]); // Clear previous data

    const sDate = new Date(startDate);
    // Add 1 day to endDate to include the whole day in the query
    const eDate = new Date(endDate);
    eDate.setDate(eDate.getDate() + 1);


    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime()) || sDate >= eDate) {
        setError("Invalid date range selected.");
        setIsLoading(false);
        return;
    }

    const categoriesArray = Array.from(selectedCategories);

    startTransition(async () => {
      try {
        // Fetch both reports concurrently
        const [trendResult, detailedResult] = await Promise.all([
          getSpendingTrend({ startDate: sDate, endDate: eDate, categories: categoriesArray }),
          getDetailedTransactionsReport({ startDate: sDate, endDate: eDate, categories: categoriesArray })
        ]);
        setTrendData(trendResult);
        setDetailedData(detailedResult);
      } catch (err) {
        console.error("Failed to generate report:", err);
        setError("An error occurred while generating the report.");
      } finally {
        setIsLoading(false);
      }
    });
  };

   // CSV Export Handler (Stretch Goal)
   const handleExportCsv = () => {
       if (detailedData.length === 0) {
           alert("No data to export.");
           return;
       }
        // Define columns for CSV (optional, controls order/inclusion)
        const columns = [
            "date", "type", "category", "description", "amount", "id", "createdAt", "updatedAt", "userId"
        ];

       // Format date before exporting if needed
       const dataToExport = detailedData.map(tx => ({
            ...tx,
            date: new Date(tx.date).toLocaleDateString('en-CA'), // YYYY-MM-DD format
            createdAt: tx.createdAt.toLocaleString(),
            updatedAt: tx.updatedAt.toLocaleString(),
       }));

       const csv = unparse(dataToExport, { columns });
       const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
       const link = document.createElement('a');
       const url = URL.createObjectURL(blob);
       link.setAttribute('href', url);
       link.setAttribute('download', `finance_report_${startDate}_to_${endDate}.csv`);
       link.style.visibility = 'hidden';
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
   };

  // == Render ==
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Reports</h1>

      {/* Filters Section */}
      <div className="p-4 bg-white rounded-lg shadow space-y-4 md:flex md:space-y-0 md:space-x-4 md:items-end">
        {/* Date Range */}
        <div className="flex-1">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex-grow-[2]"> {/* Allow more space */}
          <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
          {availableCategories.length === 0 && !isLoading ? (
              <p className="text-sm text-gray-500">No categories found.</p>
          ) : (
            <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableCategories.map(category => (
                <div key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`cat-${category}`}
                    checked={selectedCategories.has(category)}
                    onChange={(e) => handleCategoryChange(category, e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor={`cat-${category}`} className="ml-2 block text-sm text-gray-900 truncate" title={category}>
                    {category}
                  </label>
                </div>
              ))}
            </div>
          )}
           <div className="flex space-x-2 mt-1">
                <button onClick={handleSelectAll} className="text-xs text-indigo-600 hover:underline">Select All</button>
                <button onClick={handleSelectNone} className="text-xs text-indigo-600 hover:underline">Select None</button>
           </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateReport}
          disabled={isLoading || isPending}
          className={`px-6 py-2 rounded text-white font-medium ${
            (isLoading || isPending) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isLoading || isPending ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

       {/* Error Display */}
       {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded">{error}</p>}

      {/* Results Section */}
      {(isLoading || isPending) && <p className="text-center text-gray-500 py-8">Loading report data...</p>}

      {!isLoading && !isPending && (trendData.length > 0 || detailedData.length > 0) && (
          <div className="space-y-8">
              {/* Spending Trend Chart */}
              <div className="bg-white p-4 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Spending Trend</h2>
                  <SpendingTrendChart data={trendData} />
              </div>

               {/* Detailed Transactions Table */}
              <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-700">Detailed Transactions</h2>
                       {/* CSV Export Button (Stretch Goal) */}
                       <button
                            onClick={handleExportCsv}
                            disabled={detailedData.length === 0}
                            className={`px-4 py-1 rounded text-sm text-white font-medium ${
                                detailedData.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'
                            }`}
                       >
                           Export CSV
                       </button>
                  </div>
                  <DetailedReportTable data={detailedData} />
              </div>
          </div>
      )}
       {!isLoading && !isPending && trendData.length === 0 && detailedData.length === 0 && !error && (
           <p className="text-center text-gray-500 py-8">No data found for the selected filters. Try adjusting the date range or categories.</p>
       )}

    </div>
  );
}

// Ensure this page is protected by middleware if not already covered