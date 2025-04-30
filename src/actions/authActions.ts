// src/actions/authActions.ts
'use server'; // Mark this file as containing Server Actions

import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Define input schema for validation
const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function signupUser(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());

  // Validate input
  const validationResult = signupSchema.safeParse(rawFormData);
  if (!validationResult.success) {
    // Combine error messages
    const errors = validationResult.error.errors.map(e => e.message).join(', ');
    return { success: false, error: errors };
  }

  const { name, email, password } = validationResult.data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: 'User with this email already exists.' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is salt rounds

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return { success: true, message: 'User created successfully!' };

  } catch (error) {
    console.error('Signup Error:', error);
    return { success: false, error: 'An unexpected error occurred during signup.' };
  }
}