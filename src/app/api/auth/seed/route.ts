import { NextResponse } from 'next/server';
import connectToDatabase from '@/utils/db';
import { User } from '@/models/User';

export async function POST(req: Request) {
  try {
    const { username, email, department, password, role } = await req.json();

    if (!username || !email || !department || !password || !role) {
      return NextResponse.json({ error: 'Username, email, department, password, and role are required' }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const validRoles = ['employee', 'department_head', 'hr', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    const newUser = new User({
      username,
      email,
      department,
      password, // Mongoose schema pre-save hook will hash this
      role
    });

    await newUser.save();

    return NextResponse.json({ 
      message: 'User created successfully', 
      user: { id: newUser._id, username: newUser.username, role: newUser.role } 
    }, { status: 201 });
  } catch (error: any) {
    console.error('User creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export async function GET() {
  try {
    console.log('Seed: Starting GET request');
    await connectToDatabase();
    console.log('Seed: Connected to database');
    
    // Check if any admin exists
    console.log('Seed: Searching for admin user');
    const adminExists = await User.findOne({ role: 'admin' });
    console.log('Seed: Admin search complete', adminExists ? 'Found' : 'Not found');
    
    if (adminExists) {
        return NextResponse.json({ 
            message: 'Admin already exists. Use the existing credentials.',
            username: adminExists.username
        });
    }

    console.log('Seed: Creating default admin user');
    const defaultAdmin = new User({
      username: 'admin',
      email: 'admin@company.com',
      department: 'Management',
      password: 'admin123',
      role: 'admin'
    });

    console.log('Seed: Saving default admin user');
    await defaultAdmin.save();
    console.log('Seed: Default admin saved successfully');

    return NextResponse.json({
      message: 'Default admin created successfully',
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    });

  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed default admin', details: error.message, stack: error.stack }, { status: 500 });
  }
}
