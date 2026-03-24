import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/utils/db';
import { Leave } from '@/models/Leave';
import { User } from '@/models/User';
import { advanceWorkflow } from '@/utils/workflow';
import { verifyToken } from '@/utils/auth';
import { sendEmail } from '@/utils/email';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);

    const { action, comment } = await req.json();
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "reject"' }, { status: 400 });
    }

    if (action === 'reject' && (!comment || comment.trim() === '')) {
      return NextResponse.json({ error: 'A reason is strictly required when rejecting a leave.' }, { status: 400 });
    }

    await connectToDatabase();

    const { id } = await params;
    // Populate the user so we can access their email and department
    const leave = await Leave.findById(id).populate('user');
    if (!leave) {
      return NextResponse.json({ error: 'Leave application not found' }, { status: 404 });
    }

    const applicant = leave.user as any;
    const approver = await User.findById(payload.userId);

    if (!approver) return NextResponse.json({ error: 'Approver user data not found' }, { status: 404 });

    // Department Head logic: must match department
    if (leave.currentStage === 'hod') {
      if (payload.role === 'department_head' && approver.department !== applicant.department) {
        return NextResponse.json({ error: 'Department heads can only approve leaves for their own department.' }, { status: 403 });
      }
    }

    // Advance workflow using utility
    try {
      advanceWorkflow(leave, action as 'approve' | 'reject', payload.userId, payload.role, comment);
    } catch (workflowError: any) {
      return NextResponse.json({ error: workflowError.message }, { status: 403 });
    }

    await leave.save();

    // Send email notification asynchronously
    const subject = `Leave Application ${action === 'approve' ? 'Approved' : 'Rejected'}`;
    const htmlBody = `
      <p>Hello ${applicant.username},</p>
      <p>Your leave application has been <strong>${action}d</strong> by your ${payload.role.replace('_', ' ')}.</p>
      ${comment ? `<p><strong>Reason/Comment:</strong> ${comment}</p>` : ''}
      <p>Current Status: ${leave.status}</p>
    `;

    // Attempt to send email, catch and ignore if it fails so API still returns 200 OK
    sendEmail(applicant.email, subject, htmlBody).catch((e: Error) => console.error('Silent email failure:', e.message));

    return NextResponse.json({ 
      message: `Leave application ${action}d successfully. Email notification dispatched.`,
      leave: { status: leave.status, currentStage: leave.currentStage }
    });
  } catch (error: any) {
    console.error('Approval Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
