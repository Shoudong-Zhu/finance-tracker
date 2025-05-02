// src/app/page.tsx
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getQuickSummary, getRecentTransactions, RecentTransaction } from '@/actions/landingActions'; // Adjust path
import { ArrowRightIcon, BanknotesIcon, ChartPieIcon, DocumentChartBarIcon, ScaleIcon, PlusCircleIcon } from '@heroicons/react/24/outline'; // Example icons (install @heroicons/react)

// Helper to format currency (can be moved to utils)
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Helper to format date (can be moved to utils)
const formatDate = (date: Date) => {
    return date instanceof Date && !isNaN(date.valueOf())
      ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : 'Invalid Date';
};


// Quick Action Card Component (Optional, but good practice)
interface QuickActionCardProps {
    title: string;
    href: string;
    icon: React.ElementType; // Pass icon component
    description: string;
}
function QuickActionCard({ title, href, icon: Icon, description }: QuickActionCardProps) {
    return (
        <Link href={href} className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-gray-300 group">
            <div className="flex items-center space-x-3">
                <Icon className="h-8 w-8 text-indigo-600 group-hover:text-indigo-800" />
                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-800">{title}</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">{description}</p>
             <div className="mt-3 text-sm font-medium text-indigo-600 group-hover:text-indigo-800 flex items-center">
                Go <ArrowRightIcon className="h-4 w-4 ml-1"/>
            </div>
        </Link>
    );
}


// Main Page Component
export default async function Home() {
  const session = await getServerSession(authConfig);

  // Redirect to login if not authenticated
  if (!session || !session.user) {
    redirect('/login');
  }

  // Fetch data for the landing page
  const summary = await getQuickSummary();
  const recentTransactions = await getRecentTransactions(5); // Get last 5

  const userName = session.user.name || session.user.email || 'User';

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md text-white">
         <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
         <p className="mt-2 text-indigo-100">Here's a quick look at your finances.</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

         {/* Left Column: Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-700">Quick Actions</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuickActionCard
                    title="Add Transaction"
                    href="/transactions/add"
                    icon={PlusCircleIcon}
                    description="Quickly record a new income or expense."
                />
                <QuickActionCard
                    title="View Dashboard"
                    href="/dashboard"
                    icon={ChartPieIcon}
                    description="See your monthly summary and charts."
                />
                 <QuickActionCard
                    title="Manage Budgets"
                    href="/budgets"
                    icon={ScaleIcon}
                    description="Set and track your spending goals."
                />
                 <QuickActionCard
                    title="Generate Reports"
                    href="/reports"
                    icon={DocumentChartBarIcon}
                    description="Analyze trends with detailed reports."
                />
             </div>
        </div>

         {/* Right Column: Summary & Recent Activity */}
        <div className="lg:col-span-1 space-y-6">
             {/* Quick Summary Card */}
             <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <BanknotesIcon className="h-6 w-6 mr-2 text-green-600"/>
                    Quick Summary
                </h3>
                <div className="border-t pt-3">
                     <p className="text-sm text-gray-500">Current Month Net Balance</p>
                     <p className={`mt-1 text-2xl font-semibold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(summary.netBalance)}
                     </p>
                </div>
            </div>

             {/* Recent Transactions */}
             <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
                    <Link href="/transactions" className="text-sm text-indigo-600 hover:underline">View All</Link>
                 </div>
                 {recentTransactions.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No recent transactions.</p>
                 ) : (
                    <ul className="divide-y divide-gray-200">
                        {recentTransactions.map(tx => (
                            <li key={tx.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 truncate w-40" title={tx.category}>{tx.category}</p>
                                    <p className="text-xs text-gray-500">{formatDate(new Date(tx.date))}</p>
                                </div>
                                <span className={`text-sm font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(tx.amount)}
                                </span>
                            </li>
                        ))}
                    </ul>
                 )}
            </div>
        </div>

      </div>
    </div>
  );
}