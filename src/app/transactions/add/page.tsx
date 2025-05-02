// src/app/transactions/add/page.tsx
import TransactionForm from '../../../components/transactions/TransactionForm';

export default function AddTransactionPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Add New Transaction</h1>
      <TransactionForm />
    </div>
  );
}