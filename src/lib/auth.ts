import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcrypt';

export const authConfig: NextAuthOptions = {
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
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          console.error('Invalid password');
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // REMOVE: : { token: any; user: any }
    async jwt({ token, user }) {
      if (user) {
        // user object here might be AdapterUser or User type from next-auth
        token.id = user.id;
      }
      return token;
    },
    // REMOVE: : { session: any; token: any }
    async session({ session, token }) {
      // token here is the JWT type from next-auth/jwt
      // session here is the Session type from next-auth
      if (session?.user && token?.id) {
        // Add id to session user - requires type assertion or module augmentation
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  }
};

export const auth = () => getServerSession(authConfig); 