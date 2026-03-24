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

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { leaveType, startDate, endDate, reason, attachmentUrl } = await req.json();

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json({ error: 'End date cannot be before start date' }, { status: 400 });
    }

    await connectToDatabase();

    // Check for overlapping leaves
    const overlapping = await Leave.findOne({
      user: payload.userId,
      status: { $in: ['pending', 'approved_by_hod', 'approved_by_hr'] },
      $or: [
        { startDate: { $lte: end, $gte: start } },
        { endDate: { $lte: end, $gte: start } },
        { startDate: { $lte: start }, endDate: { $gte: end } }
      ]
    });

    if (overlapping) {
      return NextResponse.json({ error: 'You already have an overlapping leave request' }, { status: 400 });
    }

    const newLeave = new Leave({
      user: payload.userId,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      attachmentUrl,
      status: 'pending',
      currentStage: 'hod',
      workflowHistory: [{
        actor: payload.userId,
        action: 'applied',
        date: new Date(),
        comment: 'Leave request submitted',
        stage: 'Employee'
      }]
    });

    await newLeave.save();

    return NextResponse.json({ message: 'Leave request submitted successfully', leave: newLeave }, { status: 201 });
  } catch (error: any) {
    console.error('Apply Leave Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
