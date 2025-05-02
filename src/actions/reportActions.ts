// src/actions/reportActions.ts
'use server';

import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type TransactionType = 'INCOME' | 'EXPENSE';

type Transaction = {
  id: string;
  amount: { toNumber: () => number };
  type: 'INCOME' | 'EXPENSE';
  date: Date;
  description: string | null;
  category: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

// Helper function to get user ID (can be shared)
async function getUserId(): Promise<string> {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  return session.user.id;
}

// --- GET USER CATEGORIES ---
export async function getUserCategories(): Promise<string[]> {
  try {
    const userId = await getUserId();
    const categoriesResult = await prisma.transaction.findMany({
      where: { userId },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    });
    return categoriesResult.map((c: { category: string }) => c.category);
  } catch (error) {
    console.error('Error fetching user categories:', error);
    return [];
  }
}


// --- GET SPENDING TREND ---
export type SpendingTrendData = {
  monthYear: string; // Format 'YYYY-MM'
  totalExpenses: number;
};
export type SpendingTrendParams = {
    startDate: Date;
    endDate: Date;
    categories?: string[];
}

export async function getSpendingTrend(params: SpendingTrendParams): Promise<SpendingTrendData[]> {
   let userId: string;
   try {
     userId = await getUserId();
   } catch (error) {
      console.error('Auth Error in getSpendingTrend:', error);
      return [];
   }

   const { startDate, endDate, categories } = params;

   // Basic validation
   if (!startDate || !endDate || startDate > endDate) {
       console.error("Invalid date range for spending trend");
       return [];
   }

   try {
      // Build WHERE clause
      const whereClause = {
          userId,
          type: 'EXPENSE' as const,
          date: {
              gte: startDate,
              lte: endDate,
          },
          category: categories && categories.length > 0 ? { in: categories } : undefined
      };

      // Fetch relevant transactions
      const transactions = await prisma.transaction.findMany({
          where: whereClause,
          select: { date: true, amount: true },
          orderBy: { date: 'asc' },
      });

      // Aggregate expenses by month/year
      const monthlyTotals: { [key: string]: number } = {}; // Key: 'YYYY-MM'

      transactions.forEach((tx: { date: Date; amount: { toNumber: () => number } }) => {
          // Ensure date is valid before processing
          if (tx.date && typeof tx.date.getFullYear === 'function') {
             const year = tx.date.getFullYear();
             const month = (tx.date.getMonth() + 1).toString().padStart(2, '0'); // 0-indexed month + 1
             const monthYear = `${year}-${month}`;
             const amount = tx.amount.toNumber(); // Convert Decimal

             monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + amount;
          } else {
              console.warn("Skipping transaction with invalid date:", tx);
          }
      });

      // Convert aggregated data to the desired format and sort
      const trendData = Object.entries(monthlyTotals)
          .map(([monthYear, totalExpenses]) => ({ monthYear, totalExpenses }))
          .sort((a, b) => a.monthYear.localeCompare(b.monthYear)); // Sort chronologically

      return trendData;

   } catch (error) {
       console.error('Error fetching spending trend:', error);
       return [];
   }
}

// --- GET DETAILED TRANSACTIONS REPORT ---
export type DetailedReportParams = {
    startDate: Date;
    endDate: Date;
    categories?: string[];
}
// Define return type explicitly, converting Decimal
export type ReportTransaction = Omit<Transaction, 'amount'> & { 
    amount: number;
    createdAt: Date;
    updatedAt: Date;
};

export async function getDetailedTransactionsReport(params: DetailedReportParams): Promise<ReportTransaction[]> {
    let userId: string;
    try {
        userId = await getUserId();
    } catch (error) {
        console.error('Auth Error in getDetailedTransactionsReport:', error);
        return [];
    }

    const { startDate, endDate, categories } = params;

    if (!startDate || !endDate || startDate > endDate) {
        console.error("Invalid date range for detailed report");
        return [];
    }

    try {
        const whereClause = {
            userId,
            date: {
                gte: startDate,
                lte: endDate,
            },
            category: categories && categories.length > 0 ? { in: categories } : undefined
        };

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            select: {
                id: true,
                type: true,
                date: true,
                description: true,
                category: true,
                userId: true,
                amount: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // Convert Decimal amounts to numbers
        return transactions.map((tx: Transaction) => ({
            ...tx,
            amount: tx.amount.toNumber(),
            createdAt: tx.createdAt,
            updatedAt: tx.updatedAt
        }));

    } catch (error) {
        console.error('Error fetching detailed transactions:', error);
        return [];
    }
}