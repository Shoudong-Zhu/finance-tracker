// src/actions/transactionActions.ts
'use server';

import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Decimal } from '@prisma/client/runtime/library';
import { auth } from '@/lib/auth';

interface TransactionWithAmountNumber {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  date: Date;
  description: string | null;
  category: string;
  amount: number;
  userId: string;
}

// Helper function to get authenticated user ID
async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  return session.user.id;
}

// Type for Server Action return state (useful with useFormState)
export type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

// --- CREATE ---
export async function createTransaction(
  prevState: FormState | undefined, // Previous state for useFormState
  formData: FormData
): Promise<FormState> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch (error) {
    return { success: false, message: 'Authentication Error: Please log in.' };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const validationResult = transactionSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    console.error('Validation Errors:', validationResult.error.flatten().fieldErrors);
    return {
      success: false,
      message: 'Validation failed. Please check the form.',
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { amount, type, date, category, description } = validationResult.data;

  try {
    await prisma.transaction.create({
      data: {
        userId,
        amount: new Decimal(amount), // Use Decimal for precision
        type,
        date,
        category,
        description,
      },
    });

    revalidatePath('/transactions'); // Refresh the transactions page
    // Consider redirecting after successful creation if desired,
    // but revalidatePath handles data refresh if staying on same page structure.
    // redirect('/transactions'); // Uncomment if redirecting needed from action

    return { success: true, message: 'Transaction created successfully!' };

  } catch (error) {
    console.error('Create Transaction Error:', error);
    return { success: false, message: 'Database Error: Failed to create transaction.' };
  }
}

// --- READ (List) ---
export async function getTransactions(): Promise<TransactionWithAmountNumber[]> {
  try {
    const userId = await getUserId();
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    // Return full transaction objects with amount converted to number
    return transactions.map((tx: { amount: Decimal } & Omit<TransactionWithAmountNumber, 'amount'>) => ({
      ...tx,
      amount: tx.amount.toNumber(),
    }));
  } catch (error) {
    console.error('Get Transactions Error:', error);
    return [];
  }
}

// --- READ (Single for Edit) ---
export async function getTransactionById(id: string) {
  try {
    const userId = await getUserId();
    const transaction = await prisma.transaction.findUnique({
      where: { id, userId }, // Ensure user owns the transaction
    });

    if (!transaction) {
        return null; // Or throw new Error('Transaction not found or access denied');
    }
     // Convert Decimal to number for form pre-fill
    return { ...transaction, amount: transaction.amount.toNumber() };
  } catch (error) {
    console.error(`Get Transaction (${id}) Error:`, error);
    return null; // Or throw
  }
}


// --- UPDATE ---
export async function updateTransaction(
  id: string, // Transaction ID passed separately
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
   let userId: string;
  try {
    userId = await getUserId();
  } catch (error) {
    return { success: false, message: 'Authentication Error: Please log in.' };
  }

  // Verify transaction exists and belongs to user before updating
  const existingTransaction = await prisma.transaction.findUnique({
      where: { id, userId },
  });
  if (!existingTransaction) {
      return { success: false, message: 'Error: Transaction not found or access denied.' };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const validationResult = transactionSchema.safeParse(rawFormData);

  if (!validationResult.success) {
     console.error('Validation Errors:', validationResult.error.flatten().fieldErrors);
     return {
       success: false,
       message: 'Validation failed. Please check the form.',
       errors: validationResult.error.flatten().fieldErrors,
     };
  }
  const { amount, type, date, category, description } = validationResult.data;

  try {
     await prisma.transaction.update({
       where: { id, userId }, // Ensure user ownership again in where clause
       data: {
         amount: new Decimal(amount),
         type,
         date,
         category,
         description,
       },
     });

     revalidatePath('/transactions'); // Revalidate list page
     revalidatePath(`/transactions/edit/${id}`); // Revalidate edit page if needed

     // Don't redirect from here if using useFormState, handle redirect in component based on success state
     return { success: true, message: 'Transaction updated successfully!' };

  } catch (error) {
     console.error(`Update Transaction (${id}) Error:`, error);
     return { success: false, message: 'Database Error: Failed to update transaction.' };
  }
}


// --- DELETE ---
// Note: Deleting via form action is safer (prevents CSRF)
export async function deleteTransaction(
    prevState: { message: string } | undefined,
    formData: FormData
): Promise<{ message: string }> {
   let userId: string;
   try {
     userId = await getUserId();
   } catch (error) {
     return { message: 'Authentication Error: Please log in.' };
   }

   const id = formData.get('transactionId') as string;

   if (!id) {
       return { message: 'Error: Missing transaction ID.' };
   }

   // Verify ownership before deleting
   const transaction = await prisma.transaction.findUnique({
       where: { id, userId },
   });

   if (!transaction) {
       return { message: 'Error: Transaction not found or access denied.' };
   }

   try {
     await prisma.transaction.delete({
       where: { id, userId }, // Ensure user ownership
     });

     revalidatePath('/transactions'); // Refresh the list page
     return { message: 'Transaction deleted successfully.' };

   } catch (error) {
     console.error(`Delete Transaction (${id}) Error:`, error);
     return { message: 'Database Error: Failed to delete transaction.' };
   }
}