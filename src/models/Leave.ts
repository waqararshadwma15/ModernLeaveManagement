import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWorkflowHistory {
  actor: mongoose.Types.ObjectId;
  action: 'applied' | 'approved' | 'rejected';
  date: Date;
  comment?: string;
  stage: string;
}

export interface ILeave extends Document {
  user: mongoose.Types.ObjectId;
  leaveType: 'casual' | 'sick' | 'short';
  startDate: Date;
  endDate: Date;
  reason: string;
  attachmentUrl?: string;
  status: 'pending' | 'approved_by_hod' | 'rejected_by_hod' | 'approved_by_hr' | 'rejected_by_hr';
  currentStage: 'hod' | 'hr' | 'completed';
  nextApprover?: mongoose.Types.ObjectId;
  workflowHistory: IWorkflowHistory[];
}

const LeaveSchema = new Schema<ILeave>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { type: String, enum: ['casual', 'sick', 'short'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  attachmentUrl: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved_by_hod', 'rejected_by_hod', 'approved_by_hr', 'rejected_by_hr'],
    default: 'pending'
  },
  currentStage: {
    type: String,
    enum: ['hod', 'hr', 'completed'],
    default: 'hod'
  },
  nextApprover: { type: Schema.Types.ObjectId, ref: 'User' },
  workflowHistory: [{
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['applied', 'approved', 'rejected'] },
    date: { type: Date, default: Date.now },
    comment: { type: String },
    stage: { type: String }
  }]
}, { timestamps: true });

export const Leave: Model<ILeave> = mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);
