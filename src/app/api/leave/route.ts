import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/utils/db';
import { Leave } from '@/models/Leave';
import { verifyToken } from '@/utils/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    await connectToDatabase();

    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const departmentParam = url.searchParams.get('department');

    let query: any = {};

    // Filter by date if provided (overlapping with the specific day)
    if (dateParam) {
      const startOfDay = new Date(dateParam);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(dateParam);
      endOfDay.setUTCHours(23, 59, 59, 999);
      
      query.startDate = { $lte: endOfDay };
      query.endDate = { $gte: startOfDay };
    }

    if (payload.role === 'employee') {
      query.user = payload.userId;
    } else if (payload.role === 'department_head') {
      const { User } = await import('@/models/User');
      const hodUser = await User.findById(payload.userId);
      const deptUsers = await User.find({ department: hodUser?.department }).select('_id');
      query.user = { $in: deptUsers.map(u => u._id) };
    } else if (payload.role === 'hr' || payload.role === 'admin') {
      if (departmentParam) {
        const { User } = await import('@/models/User');
        const deptUsers = await User.find({ department: { $regex: new RegExp(departmentParam, 'i') } }).select('_id');
        query.user = { $in: deptUsers.map(u => u._id) };
      }
    }

    const leaves = await Leave.find(query)
      .populate('user', 'username email department')
      .sort({ createdAt: -1 });

    return NextResponse.json({ leaves });
  } catch (error: any) {
    console.error('Fetch Leaves Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
