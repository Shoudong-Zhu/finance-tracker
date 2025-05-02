// src/app/transactions/page.tsx
import Link from 'next/link';
import { getTransactions } from '@/actions/transactionActions';
import TransactionTable from '../../components/transactions/TransactionTable';

export default async function TransactionsPage() {
  // Fetch transactions directly in this Server Component
  const transactions = await getTransactions();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Link href="/transactions/add">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Add Transaction
          </button>
        </Link>
      </div>

      {/* Pass transactions to the client component table */}
      <TransactionTable transactions={transactions} />

    </div>
  );
}

// Ensure this page is protected by middleware (already configured in Stage 1)
// The middleware config should include "/transactions/:path*"