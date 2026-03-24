import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/utils/db';
import { Leave } from '@/models/Leave';
import { User } from '@/models/User';
import { verifyToken } from '@/utils/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);

    if (payload.role !== 'department_head' && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Department Head access required.' }, { status: 403 });
    }

    await connectToDatabase();
    const hodUser = await User.findById(payload.userId);
    const deptUsers = await User.find({ department: hodUser?.department }).select('_id');

    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');

    const query: any = { user: { $in: deptUsers.map((u: any) => u._id) } };

    if (dateParam) {
      const startOfDay = new Date(dateParam);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(dateParam);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.startDate = { $lte: endOfDay };
      query.endDate = { $gte: startOfDay };
    }

    const leaves = await Leave.find(query).populate('user', 'username email department').sort({ createdAt: -1 });

    return NextResponse.json({ leaves });
  } catch (error: any) {
    console.error('Head dashboard API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
