// src/lib/schemas.ts
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const transactionSchema = z.object({
  amount: z.coerce // Use coerce to convert input string to number
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive({ message: 'Amount must be positive' }),
  type: z.enum(['INCOME', 'EXPENSE'] as const, { // Validate against Prisma enum
    errorMap: () => ({ message: 'Invalid transaction type' }),
  }),
  date: z.coerce.date({ // Coerce string/number to Date
    errorMap: () => ({ message: 'Invalid date' }),
  }),
  category: z.string().trim().min(1, { message: 'Category is required' }),
  description: z.string().trim().optional(),
});

// Type for form data (useful in components)
export type TransactionFormData = z.infer<typeof transactionSchema>;

export const budgetSchema = z.object({
    category: z.string().trim().min(1, { message: 'Category is required' }),
    amount: z.coerce // Use coerce to convert input string to number
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive({ message: 'Budget amount must be positive' }),
    month: z.coerce.number().int().min(1).max(12), // Validate month (1-12)
    year: z.coerce.number().int().min(2000).max(2100), // Validate year (adjust range as needed)
  });
  
  export type BudgetFormData = z.infer<typeof budgetSchema>;