// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession(); // Get session status

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">Finance Tracker</Link>
        <div>
          {status === 'loading' && <p>Loading...</p>}
          {status === 'unauthenticated' && (
            <>
              <Link href="/login" className="mr-4 hover:text-gray-300">Login</Link>
              <Link href="/signup" className="hover:text-gray-300">Sign Up</Link>
            </>
          )}
          {status === 'authenticated' && session?.user && (
            <>
              <span className="mr-4">Welcome, {session.user.name || session.user.email}</span>
               {/* Add Dashboard link if desired */}
               <Link href="/dashboard" className="mr-4 hover:text-gray-300">Dashboard</Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })} // Redirect to login after signout
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}