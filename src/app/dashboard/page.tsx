import { cookies } from 'next/headers';
import { verifyToken } from '@/utils/auth';
import DepartmentDashboard from '@/components/DepartmentDashboard';
import HRDashboard from '@/components/HRDashboard';
import { Leave } from '@/models/Leave';
import connectToDatabase from '@/utils/db';
import { User } from '@/models/User';
import { redirect } from 'next/navigation';

// Enforce dynamic server rendering since cookies are read
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    // If we wanted to strictly redirect we could uncomment below.
    // redirect('/api/auth/login');
    return <div className="p-8 text-center text-xl text-red-500 font-bold">Unauthorized. Please login first.</div>;
  }

  let payload;
  try {
    payload = await verifyToken(token);
  } catch (err) {
    return <div className="p-8 text-center text-xl text-red-500 font-bold">Invalid Token.</div>;
  }

  await connectToDatabase();
  const { role, userId } = payload;
  let initialLeaves = [];

  if (role === 'employee') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <h1 className="text-2xl font-semibold text-gray-600">Employee Dashboard incoming...</h1>
      </div>
    );
  }

  if (role === 'department_head') {
    const hod = await User.findById(userId);
    const deptUsers = await User.find({ department: hod?.department }).select('_id');
    const leaves = await Leave.find({ user: { $in: deptUsers.map(u => u._id) } })
      .populate('user', 'username department')
      .sort({ createdAt: -1 });
      
    // Serialize mongoose documents to plain JSON for Client Components
    initialLeaves = JSON.parse(JSON.stringify(leaves)); 
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <DepartmentDashboard initialLeaves={initialLeaves} />
        </div>
      </div>
    );
  }

  if (role === 'hr' || role === 'admin') {
    const leaves = await Leave.find({})
      .populate('user', 'username department')
      .sort({ createdAt: -1 });
      
    initialLeaves = JSON.parse(JSON.stringify(leaves));
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <HRDashboard initialLeaves={initialLeaves} />
        </div>
      </div>
    );
  }

  return <div>Access Denied</div>;
}
