import { cookies } from 'next/headers';
import { verifyToken } from '@/utils/auth';
import { User } from '@/models/User';
import connectToDatabase from '@/utils/db';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return <div className="min-h-screen grid items-center justify-center font-bold text-red-500">Unauthorized. Please login.</div>;

  try {
    const payload = await verifyToken(token);
    if (payload.role !== 'admin') {
      return <div className="min-h-screen grid items-center justify-center font-bold text-red-500">Forbidden. Admin access required.</div>;
    }

    await connectToDatabase();
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    const initialUsers = JSON.parse(JSON.stringify(users));

    const admin = await User.findById(payload.userId);
    const serializedUser = JSON.parse(JSON.stringify(admin));

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar user={serializedUser} />
        <div className="p-4 py-8 md:p-10">
          <div className="max-w-7xl mx-auto">
            <AdminDashboard initialUsers={initialUsers} />
          </div>
        </div>
      </div>
    );
  } catch (err) {
    return <div className="min-h-screen grid items-center justify-center font-bold text-red-500">Token verification failed or session expired.</div>;
  }
}
