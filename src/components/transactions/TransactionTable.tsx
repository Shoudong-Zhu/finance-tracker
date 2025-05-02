// src/components/transactions/TransactionTable.tsx
'use client'; // Needed for form submission handling (delete button)

import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { deleteTransaction } from '@/actions/transactionActions';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';

// Define props, extending Transaction to include the converted 'amount' number
interface TransactionWithAmountNumber {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  date: Date;
  description: string | null;
  category: string;
  amount: number;
  userId: string;
}

interface TransactionTableProps {
  transactions: TransactionWithAmountNumber[];
}

// Separate component for the Delete Button to manage its form state
function DeleteButton({ transactionId }: { transactionId: string }) {
    const [state, formAction] = useFormState(deleteTransaction, undefined);
    const { pending } = useFormStatus();

    useEffect(() => {
        if (state?.message && state.message.startsWith("Error:")) {
            alert(state.message); // Simple error alert, improve as needed
        }
        // You might want to show a success toast here too
    }, [state]);

    return (
        <form action={formAction}>
            <input type="hidden" name="transactionId" value={transactionId} />
            <button
                type="submit"
                aria-disabled={pending}
                className={`px-2 py-1 rounded text-sm font-medium ${
                    pending
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-700 text-white'
                }`}
                disabled={pending}
                // Optional: Add confirmation dialog
                onClick={(e) => {
                    if (!confirm('Are you sure you want to delete this transaction?')) {
                         e.preventDefault();
                    }
                }}
            >
                {pending ? 'Deleting...' : 'Delete'}
            </button>
             {/* Display form-specific errors if needed */}
            {/* {state?.message && state.message.startsWith("Error:") && <p className="text-red-500 text-xs mt-1">{state.message}</p>} */}
        </form>
    );
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  if (!transactions || transactions.length === 0) {
    return <p className="text-center text-gray-500">No transactions found.</p>;
  }

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Helper to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  return (
    <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="py-3 px-6">Date</th>
            <th scope="col" className="py-3 px-6">Type</th>
            <th scope="col" className="py-3 px-6">Category</th>
            <th scope="col" className="py-3 px-6">Description</th>
            <th scope="col" className="py-3 px-6 text-right">Amount</th>
            <th scope="col" className="py-3 px-6 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <td className="py-4 px-6">{formatDate(tx.date)}</td>
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
              <td className="py-4 px-6 flex justify-center space-x-2">
                <Link href={`/transactions/edit/${tx.id}`}>
                  <button className="px-2 py-1 rounded text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-medium">
                    Edit
                  </button>
                </Link>
                <DeleteButton transactionId={tx.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}