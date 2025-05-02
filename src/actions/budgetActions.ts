// src/actions/budgetActions.ts
'use server';

import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { budgetSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

type TransactionType = 'INCOME' | 'EXPENSE';

// Shared types and helper
export type BudgetFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

async function getUserId(): Promise<string> {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  return session.user.id;
}

// --- UPSERT (Create or Update) BUDGET ---
export async function upsertBudget(
  prevState: BudgetFormState | undefined,
  formData: FormData
): Promise<BudgetFormState> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch (error) {
    return { success: false, message: 'Authentication Error: Please log in.' };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const validationResult = budgetSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    console.error('Validation Errors:', validationResult.error.flatten().fieldErrors);
    return {
      success: false,
      message: 'Validation failed.',
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { category, amount, month, year } = validationResult.data;
  const budgetAmount = new Decimal(amount);

  try {
    await prisma.budget.upsert({
      where: {
        // Use the unique constraint defined in the schema
        userId_category_month_year: { userId, category, month, year }
      },
      update: { // Data to update if record exists
        amount: budgetAmount,
      },
      create: { // Data to create if record doesn't exist
        userId,
        category,
        amount: budgetAmount,
        month,
        year,
      },
    });

    revalidatePath('/budgets'); // Revalidate the budgets page
    revalidatePath('/dashboard'); // Revalidate dashboard if it uses budget data

    return { success: true, message: `Budget for ${category} (${month}/${year}) saved.` };

  } catch (error) {
    console.error('Upsert Budget Error:', error);
    return { success: false, message: 'Database Error: Failed to save budget.' };
  }
}


// --- GET BUDGET STATUS (Combined Budgeted vs Spent) ---
export type BudgetStatus = {
  category: string;
  budgeted: number;
  spent: number;
  progress: number; // Percentage spent (0-100+)
  remaining: number; // Can be negative if overspent
};

export async function getBudgetStatusForMonth(month: number, year: number): Promise<BudgetStatus[]> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch (error) {
    console.error('Auth Error in getBudgetStatusForMonth:', error);
    return [];
  }

  // Validate month/year inputs
  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      console.error('Invalid month/year requested:', month, year);
      return [];
  }

  const startDate = new Date(year, month - 1, 1); // Month is 0-indexed for Date constructor
  const endDate = new Date(year, month, 0); // Day 0 of next month

  try {
    // 1. Get Budgets for the month
    const budgets = await prisma.budget.findMany({
      where: { userId, month, year },
    });

    // 2. Get Expense Transactions for the month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
      },
    });

    // 3. Calculate actual spending per category
    const spendingByCategory: { [key: string]: number } = {};
    transactions.forEach((tx: { amount: Decimal; category: string }) => {
      const spent = tx.amount.toNumber();
      spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + spent;
    });

    // 4. Combine budgets and spending
    const budgetStatusMap: { [key: string]: BudgetStatus } = {};

    // Initialize with budget data
    budgets.forEach((b: { amount: Decimal; category: string }) => {
      const budgeted = b.amount.toNumber();
      budgetStatusMap[b.category] = {
        category: b.category,
        budgeted: budgeted,
        spent: 0, // Initialize spent
        progress: 0,
        remaining: budgeted,
      };
    });

    // Add/Update with spending data
    Object.entries(spendingByCategory).forEach(([category, spent]) => {
      if (budgetStatusMap[category]) {
        // Category has a budget
        budgetStatusMap[category].spent = spent;
        const budgeted = budgetStatusMap[category].budgeted;
        budgetStatusMap[category].progress = budgeted > 0 ? Math.min(Math.round((spent / budgeted) * 100), 150) : (spent > 0 ? 150 : 0); // Cap progress for visual reasons
        budgetStatusMap[category].remaining = budgeted - spent;
      } else {
        // Category has spending but no budget set
        budgetStatusMap[category] = {
          category: category,
          budgeted: 0,
          spent: spent,
          progress: 150, // Indicate overspent / unbudgeted visually
          remaining: -spent,
        };
      }
    });

    // Convert map back to array and sort (e.g., alphabetically)
    return Object.values(budgetStatusMap).sort((a, b) => a.category.localeCompare(b.category));

  } catch (error) {
    console.error(`Error fetching budget status (${month}/${year}):`, error);
    return [];
  }
}