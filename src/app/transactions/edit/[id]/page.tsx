// src/app/transactions/edit/[id]/page.tsx
import { getTransactionById } from '@/actions/transactionActions'; // Adjust path
import TransactionForm from '@/components/transactions/TransactionForm'; // Adjust path
import Link from 'next/link';

interface EditTransactionPageProps {
  params: { id: string };
}

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const { id } = params;
  const transaction = await getTransactionById(id);

  if (!transaction) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500">Transaction not found or you do not have permission to edit it.</p>
        <Link href="/transactions">
             <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
               Back to Transactions
            </button>
        </Link>
      </div>
    );
  }

  // Format date to 'YYYY-MM-DD' for the input type="date" default value
  const formattedDate = transaction.date.toISOString().split('T')[0];
  const transactionForForm = { ...transaction, date: formattedDate };


  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Edit Transaction</h1>
      <TransactionForm transaction={transactionForForm} />
       <div className="mt-4 text-center">
         <Link href="/transactions">
              <button className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
                Cancel
             </button>
         </Link>
       </div>
    </div>
  );
}