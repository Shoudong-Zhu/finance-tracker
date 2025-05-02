// src/actions/dashboardActions.ts
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

type TransactionType = 'INCOME' | 'EXPENSE';

interface TransactionWithAmountNumber {
  id: string;
  type: TransactionType;
  date: Date;
  description: string | null;
  category: string;
  amount: number;
  userId: string;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  expensesByCategory: { name: string; value: number }[];
}

// Helper function to get authenticated user ID
async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  return session.user.id;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const userId = await getUserId();
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals: { [key: string]: number } = {};

    transactions.forEach((tx: { amount: Decimal; type: TransactionType; category: string }) => {
      const amount = tx.amount.toNumber();
      if (tx.type === 'INCOME') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amount;
      }
    });

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      expensesByCategory: Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value,
      })),
    };
  } catch (error) {
    console.error('Get Dashboard Summary Error:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      expensesByCategory: [],
    };
  }
}