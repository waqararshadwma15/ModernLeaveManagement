import { ILeave } from '@/models/Leave';
import mongoose from 'mongoose';

export const advanceWorkflow = (
  leave: ILeave, 
  action: 'approve' | 'reject', 
  actorId: string | mongoose.Types.ObjectId, 
  role: string, 
  comment?: string
) => {
  if (leave.currentStage === 'completed') {
    throw new Error('Leave application workflow is already completed.');
  }

  const userObjectId = typeof actorId === 'string' ? new mongoose.Types.ObjectId(actorId) : actorId;

  // Record history
  leave.workflowHistory.push({
    actor: userObjectId,
    action: action === 'approve' ? 'approved' : 'rejected',
    date: new Date(),
    comment,
    stage: leave.currentStage
  });

  if (action === 'reject') {
    leave.status = leave.currentStage === 'hod' ? 'rejected_by_hod' : 'rejected_by_hr';
    leave.currentStage = 'completed';
    return;
  }

  // Action is approve
  if (leave.currentStage === 'hod') {
    if (role === 'department_head' || role === 'admin') {
      leave.status = 'approved_by_hod';
      leave.currentStage = 'hr'; // Pass to HR next
    } else {
      throw new Error('Unauthorized workflow advancement. Only Department Head can approve at this stage.');
    }
  } else if (leave.currentStage === 'hr') {
    if (role === 'hr' || role === 'admin') {
      leave.status = 'approved_by_hr';
      leave.currentStage = 'completed'; // Workflow finishes
    } else {
      throw new Error('Unauthorized workflow advancement. Only HR can approve at this stage.');
    }
  }
};
