// src/components/budgets/BudgetForm.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { upsertBudget, BudgetFormState } from '@/actions/budgetActions';

interface BudgetFormProps {
  month: number;
  year: number;
  // Optional: prefill for editing, though this form focuses on Add/Upsert
  // initialCategory?: string;
  // initialAmount?: number;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-disabled={pending}
      className={`px-4 py-2 rounded text-white font-medium ${
        pending ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
      disabled={pending}
    >
      {pending ? 'Saving...' : 'Set Budget'}
    </button>
  );
}

export default function BudgetForm({ month, year }: BudgetFormProps) {
  const [state, formAction] = useFormState(upsertBudget, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      // Optionally show a success message (e.g., toast notification)
      // alert(state.message);
      formRef.current?.reset(); // Clear form on success
    }
    if (state?.success === false && !state.errors) {
        alert(`Error: ${state.message}`); // Show non-validation errors
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="p-4 border rounded-lg bg-gray-50 space-y-3">
      <h3 className="text-lg font-medium text-gray-800">Set Budget for {month}/{year}</h3>
      {/* Hidden fields for month and year */}
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="year" value={year} />

      {/* General form error message */}
      {state?.success === false && !state.errors && (
           <p className="text-sm text-red-600">{state.message}</p>
       )}

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <input
          type="text"
          id="category"
          name="category"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., Groceries, Rent"
        />
         {state?.errors?.category && <p className="text-xs text-red-500 mt-1">{state.errors.category.join(', ')}</p>}
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Budgeted Amount ($)</label>
        <input
          type="number"
          id="amount"
          name="amount"
          required
          step="0.01"
          min="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., 500.00"
        />
         {state?.errors?.amount && <p className="text-xs text-red-500 mt-1">{state.errors.amount.join(', ')}</p>}
      </div>

      <SubmitButton />
    </form>
  );
}