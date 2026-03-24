import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import connectToDatabase from '@/utils/db';
import { Leave } from '@/models/Leave';
import { uploadToCloudinary } from '@/utils/upload';
import { verifyToken } from '@/utils/auth';
import mongoose from 'mongoose';

const upload = multer({ storage: multer.memoryStorage() });

// Helper to run middleware in Next.js pages API routines
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false, // Disallow Next.js native parser to allow Multer to handle form-data
  },
};

export default async function handler(req: any, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Authenticate Request using jwt cookie
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = await verifyToken(token);

    // 2. Parse Multiform data
    await runMiddleware(req, res, upload.single('attachment'));

    const { leaveType, startDate, endDate, reason } = req.body;
    const file = req.file;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Missing required leave form fields.' });
    }

    // Advanced Rules: Sick or short requires attachment
    if (['sick', 'short'].includes(leaveType) && !file) {
      return res.status(400).json({ error: `Attachment is strictly required for ${leaveType} leave.` });
    }

    await connectToDatabase();

    let attachmentUrl = undefined;
    if (file) {
      attachmentUrl = await uploadToCloudinary(file.buffer, 'leave_attachments');
    }

    // Determine initial stage based on role
    // Employee applied -> needs HOD approval. Department Head applied -> skips HOD, needs HR processing.
    const currentStage = payload.role === 'department_head' ? 'hr' : 'hod';
    const initialStatus = payload.role === 'department_head' ? 'approved_by_hod' : 'pending';

    const newLeave = new Leave({
      user: new mongoose.Types.ObjectId(payload.userId),
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      attachmentUrl,
      status: initialStatus,
      currentStage,
      workflowHistory: [{
        actor: new mongoose.Types.ObjectId(payload.userId),
        action: 'applied',
        stage: 'initial',
        comment: 'Leave request submitted'
      }]
    });

    await newLeave.save();

    return res.status(201).json({ message: 'Leave application submitted successfully', leave: newLeave });
  } catch (err: any) {
    console.error('Leave Apply Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
