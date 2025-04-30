// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { signupUser } from '@/actions/authActions'; // Import the server action
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const formData = new FormData(e.currentTarget); // Get form data

    const result = await signupUser(formData); // Call the server action

    if (result.success) {
      setSuccessMessage(result.message || 'Signup successful! Redirecting to login...');
      // Optionally redirect after a delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      setError(result.error || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4 text-center">Sign Up</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="name">Name</label>
          <input id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded text-gray-900" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded text-gray-900" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 border rounded text-gray-900" />
        </div>
        <button type="submit" className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Sign Up
        </button>
        <p className="text-center mt-4 text-gray-600">
         Already have an account? <a href="/login" className="text-blue-500 hover:underline">Log In</a>
        </p>
      </form>
    </div>
  );
}