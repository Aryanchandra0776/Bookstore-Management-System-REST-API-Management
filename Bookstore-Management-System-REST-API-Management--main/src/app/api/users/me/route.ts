// GET /api/users/me - Get current user profile
import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/services/authService';
import { getAuthenticatedUser } from '@/lib/authorization';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 401,
          error: 'Unauthorized',
          message: 'Authentication required',
          path: '/api/users/me',
        },
        { status: 401 }
      );
    }

    // Get full user details
    const fullUser = await getUserById(user.userId);

    if (!fullUser) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 404,
          error: 'Not Found',
          message: 'User not found',
          path: '/api/users/me',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(fullUser);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch user profile',
        path: '/api/users/me',
      },
      { status: 500 }
    );
  }
}
