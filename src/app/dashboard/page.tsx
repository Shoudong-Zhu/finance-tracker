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
import { getBudgetStatusForMonth, BudgetStatus } from '@/actions/budgetActions'; // Adjust path
import Link from 'next/link';
import ProgressBar from '@/components/budgets/ProgressBar';

// Helper to format currency (can be moved to a utils file)
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default async function DashboardPage() {
    const summary: DashboardSummary = await getDashboardSummary(); // Existing summary data
  
    // Fetch budget status for CURRENT month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const budgetStatus: BudgetStatus[] = await getBudgetStatusForMonth(currentMonth, currentYear);
  
    // Calculate overall budget summary for dashboard card
    const totalBudgeted = budgetStatus.reduce((sum, item) => sum + item.budgeted, 0);
    const totalSpent = budgetStatus.reduce((sum, item) => item.budgeted > 0 ? sum + item.spent : sum, 0); // Only sum spending against budgeted categories for this simple view
    const overallRemaining = totalBudgeted - totalSpent;
  
    // Get top 3 budget categories by amount budgeted for quick view
    const topBudgets = budgetStatus
      .filter(b => b.budgeted > 0) // Only show budgeted categories
      .sort((a, b) => b.budgeted - a.budgeted) // Sort by budgeted amount desc
      .slice(0, 3); // Take top 3
  
    return (
      <div className="container mx-auto p-4 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
  
        {/* Summary Cards - Added Budget Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4"> {/* Adjusted grid columns */}
          <SummaryCard title="Month Income" value={formatCurrency(summary.totalIncome)} isPositive />
          <SummaryCard title="Month Expenses" value={formatCurrency(summary.totalExpenses)} isNegative />
          <SummaryCard
              title="Month Net Balance"
              value={formatCurrency(summary.netBalance)}
              isPositive={summary.netBalance >= 0}
              isNegative={summary.netBalance < 0}
          />
           {/* New Budget Summary Card */}
           <SummaryCard
              title="Budget Remaining"
              value={totalBudgeted > 0 ? formatCurrency(overallRemaining) : 'No Budget Set'}
              isPositive={overallRemaining >= 0 && totalBudgeted > 0}
              isNegative={overallRemaining < 0 && totalBudgeted > 0}
          />
        </div>
  
         {/* Charts & Budget Quick View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> {/* Adjusted grid columns */}
           {/* Income vs Expense Chart */}
          <div className="bg-white p-4 rounded-lg shadow lg:col-span-1"> {/* Span 1 */}
              {/* ... IncomeExpenseChart rendering same as before ... */}
               <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Income vs. Expenses</h2>
               {(summary.totalIncome > 0 || summary.totalExpenses > 0) ? (
                   <IncomeExpenseChart income={summary.totalIncome} expense={summary.totalExpenses} />
              ) : (
                  <p className="text-center text-gray-500 h-64 flex items-center justify-center">No income or expense data.</p>
              )}
          </div>
  
          {/* Expenses by Category Chart */}
          <div className="bg-white p-4 rounded-lg shadow lg:col-span-1"> {/* Span 1 */}
              {/* ... CategoryPieChart rendering same as before ... */}
                <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Expenses by Category</h2>
               {summary.expensesByCategory.length > 0 ? (
                   <CategoryPieChart data={summary.expensesByCategory} />
               ) : (
                  <p className="text-center text-gray-500 h-64 flex items-center justify-center">No expense data.</p>
               )}
          </div>
  
           {/* Budget Quick View */}
           <div className="bg-white p-4 rounded-lg shadow lg:col-span-1"> {/* Span 1 */}
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">Budget Snapshot</h2>
                   <Link href="/budgets">
                        <button className="text-sm text-indigo-600 hover:underline">View All Budgets</button>
                   </Link>
               </div>
                {topBudgets.length > 0 ? (
                   <div className="space-y-4">
                       {topBudgets.map(item => (
                           <div key={item.category}>
                              <div className="flex justify-between text-sm mb-1">
                                   <span className="font-medium text-gray-800">{item.category}</span>
                                   <span className={`${item.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatCurrency(item.remaining)} {item.remaining >= 0 ? 'left' : 'over'}
                                   </span>
                              </div>
                               <ProgressBar progress={item.progress} />
                           </div>
                       ))}
                   </div>
               ) : (
                   <p className="text-center text-gray-500 h-64 flex items-center justify-center">No budgets set for this month.</p>
               )}
           </div>
        </div>
      </div>
    );
  }

// Ensure this page is protected by middleware (/dashboard)