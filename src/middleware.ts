import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');

  const path = req.nextUrl.pathname;

  // Protect all API routes except auth routes
  if (path.startsWith('/api') && !path.startsWith('/api/auth')) {
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, encodedSecret);
      
      // Basic Role-Based Authorization
      // Example: Only admin can access /api/admin paths
      if (path.startsWith('/api/admin') && payload.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // Example: Only HR or Admin can access /api/hr paths
      if (path.startsWith('/api/hr') && !['admin', 'hr'].includes(payload.role as string)) {
        return NextResponse.json({ error: 'HR access required' }, { status: 403 });
      }
      
      // Example: Only HOD or Admin can access /api/hod paths
      if (path.startsWith('/api/hod') && !['admin', 'department_head'].includes(payload.role as string)) {
        return NextResponse.json({ error: 'Department Head access required' }, { status: 403 });
      }

      // Pass user info via headers for downstream use
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-role', payload.role as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
