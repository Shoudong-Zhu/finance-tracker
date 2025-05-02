// // src/app/dashboard/page.tsx
// import { auth } from '@/lib/auth';
// import { redirect } from 'next/navigation';

// export default async function DashboardPage() {
//     const session = await auth();

//     // Although middleware protects, good practice to double-check in sensitive pages
//     if (!session) {
//        redirect('/login'); // Should be handled by middleware, but belt-and-suspenders
//     }

//     return (
//         <div>
//             <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
//             <p>Welcome to your protected dashboard, {session.user?.name || session.user?.email}!</p>
//             {/* Dashboard content will go here */}
//         </div>
//     );
// }


// src/app/dashboard/page.tsx
import { getDashboardSummary, DashboardSummary } from '@/actions/dashboardActions'; // Adjust path
import SummaryCard from '../../components/dashboard/SummaryCard'; // We'll create this
import IncomeExpenseChart from '../../components/dashboard/IncomeExpenseChart'; // We'll create this
import CategoryPieChart from '../../components/dashboard/CategoryPieChart'; // We'll create this

// Helper to format currency (can be moved to a utils file)
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default async function DashboardPage() {
  const summary: DashboardSummary = await getDashboardSummary();

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Current Month Income" value={formatCurrency(summary.totalIncome)} isPositive />
        <SummaryCard title="Current Month Expenses" value={formatCurrency(summary.totalExpenses)} isNegative />
        <SummaryCard
            title="Current Month Net Balance"
            value={formatCurrency(summary.netBalance)}
            isPositive={summary.netBalance >= 0}
            isNegative={summary.netBalance < 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Income vs Expense Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Income vs. Expenses (Current Month)</h2>
            {(summary.totalIncome > 0 || summary.totalExpenses > 0) ? (
                 <IncomeExpenseChart income={summary.totalIncome} expense={summary.totalExpenses} />
            ) : (
                <p className="text-center text-gray-500 h-64 flex items-center justify-center">No income or expense data for this month.</p>
            )}
        </div>

        {/* Expenses by Category Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
             <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Expenses by Category (Current Month)</h2>
             {summary.expensesByCategory.length > 0 ? (
                 <CategoryPieChart data={summary.expensesByCategory} />
             ) : (
                <p className="text-center text-gray-500 h-64 flex items-center justify-center">No expense data for this month.</p>
             )}
        </div>
      </div>
    </div>
  );
}

// Ensure this page is protected by middleware (/dashboard)