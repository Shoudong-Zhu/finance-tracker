// src/app/dashboard/page.tsx
import { auth } from '../auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const session = await auth();

    // Although middleware protects, good practice to double-check in sensitive pages
    if (!session) {
       redirect('/login'); // Should be handled by middleware, but belt-and-suspenders
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p>Welcome to your protected dashboard, {session.user?.name || session.user?.email}!</p>
            {/* Dashboard content will go here */}
        </div>
    );
}