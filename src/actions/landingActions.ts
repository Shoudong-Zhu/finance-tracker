// src/actions/landingActions.ts (or add to dashboardActions.ts)
'use server';

import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import prisma from '@/lib/prisma';

type TransactionType = 'INCOME' | 'EXPENSE';

interface Transaction {
  id: string;
  amount: { toNumber: () => number };
  type: TransactionType;
  date: Date;
  description: string | null;
  category: string;
  userId: string;
}

// Helper - Can be shared or copied
async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authConfig);
  return session?.user?.id ?? null;
}

// --- GET QUICK SUMMARY ---
// Fetches just the net balance for the current month
export async function getQuickSummary(): Promise<{ netBalance: number }> {
  const userId = await getUserId();
  if (!userId) return { netBalance: 0 };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0);

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      select: { amount: true, type: true },
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach((tx: { amount: { toNumber: () => number }; type: TransactionType }) => {
      const amount = tx.amount.toNumber();
      if (tx.type === 'INCOME') totalIncome += amount;
      else totalExpenses += amount;
    });

    return { netBalance: totalIncome - totalExpenses };
  } catch (error) {
    console.error("Error fetching quick summary:", error);
    return { netBalance: 0 };
  }
}

// --- GET RECENT TRANSACTIONS ---
// Type including amount as number
export type RecentTransaction = Omit<Transaction, 'amount'> & { amount: number };

export async function getRecentTransactions(limit: number = 5): Promise<RecentTransaction[]> {
  const userId = await getUserId();
  if (!userId) return [];

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return transactions.map((tx: Transaction) => ({
      ...tx,
      amount: tx.amount.toNumber(),
    }));
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return [];
  }
}