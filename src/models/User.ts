import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  department: string;
  password?: string;
  role: 'employee' | 'department_head' | 'hr' | 'admin';
  leaveBalance: {
    casual: number;
    sick: number;
    short: number;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ['employee', 'department_head', 'hr', 'admin'],
    default: 'employee',
  },
  leaveBalance: {
    casual: { type: Number, default: 10 },
    sick: { type: Number, default: 8 },
    short: { type: Number, default: 5 }
  }
}, { timestamps: true });

UserSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('password') || !this.password) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err: any) {
    throw err;
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

if (mongoose.models.User) {
  delete mongoose.models.User;
}
export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
