import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/utils/db';
import { Leave } from '@/models/Leave';
import { User } from '@/models/User';
import { advanceWorkflow } from '@/utils/workflow';
import { verifyToken } from '@/utils/auth';
import { sendEmail } from '@/utils/email';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    const { leaveId, comment } = await req.json();

    if (!leaveId) {
       return NextResponse.json({ error: 'leaveId is required' }, { status: 400 });
    }

    if (!comment || comment.trim() === '') {
      return NextResponse.json({ error: 'A reason (comment) is strictly required when rejecting a leave.' }, { status: 400 });
    }

    await connectToDatabase();

    const leave = await Leave.findById(leaveId).populate('user');
    if (!leave) return NextResponse.json({ error: 'Leave application not found' }, { status: 404 });

    const applicant = leave.user as any;
    const approver = await User.findById(payload.userId);
    if (!approver) return NextResponse.json({ error: 'Approver user data not found' }, { status: 404 });

    // Department Head logic
    if (leave.currentStage === 'hod') {
      if (payload.role === 'department_head' && approver.department !== applicant.department) {
        return NextResponse.json({ error: 'Department heads can only reject leaves for their own department.' }, { status: 403 });
      }
    }

    try {
      advanceWorkflow(leave, 'reject', payload.userId, payload.role, comment);
    } catch (workflowError: any) {
      return NextResponse.json({ error: workflowError.message }, { status: 403 });
    }

    await leave.save();

    const subject = `Leave Application Rejected`;
    const htmlBody = `
      <p>Hello ${applicant.username},</p>
      <p>Your leave application has been <strong>rejected</strong> by your ${payload.role.replace('_', ' ')}.</p>
      <p><strong>Reason:</strong> ${comment}</p>
    `;
    sendEmail(applicant.email, subject, htmlBody).catch((e: Error) => console.error('Silent email failure:', e.message));

    return NextResponse.json({ message: `Leave application rejected successfully.`, leave: { status: leave.status, currentStage: leave.currentStage } });
  } catch (error: any) {
    console.error('Rejection Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
