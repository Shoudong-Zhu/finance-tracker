// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma'; // Use the shared instance
import bcrypt from 'bcrypt';

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Missing credentials');
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user || !user.password) {
          console.error('No user found or user missing password');
          return null; // User not found or missing password field
        }

        // Validate password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          console.error('Invalid password');
          return null;
        }

        console.log('User authorized:', user.email);
        // Return user object without password
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }
    })
    // You could add other providers here like Google, GitHub, etc.
    // Example: GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! })
  ],
  session: {
    strategy: 'jwt', // Use JWTs for session management
  },
  secret: process.env.NEXTAUTH_SECRET, // Use the secret from .env
  pages: {
    signIn: '/login', // Redirect users to /login if required
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for email/passwordless login)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
  },
  // Optional callbacks
  callbacks: {
      async jwt({ token, user }) {
          // Add user id to the JWT token on signin
          if (user) {
              token.id = user.id;
          }
          return token;
      },
      async session({ session, token }) {
          // Add user id to the session object
          if (session.user && token.id) {
              (session.user as any).id = token.id;
          }
          return session;
      }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };