// POST /api/login - Authenticate user and return JWT token
import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/services/authService';
import { LoginDTO } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: 'Missing required fields: email, password',
          path: '/api/login',
        },
        { status: 400 }
      );
    }

    // Build DTO
    const dto: LoginDTO = {
      email: body.email.toLowerCase().trim(),
      password: body.password,
    };

    // Login user
    const authResponse = await loginUser(dto);

    return NextResponse.json(authResponse);
  } catch (error: any) {
    console.error('Error logging in user:', error);

    const message = error.message || 'Failed to authenticate user';

    // Return 401 for invalid credentials (don't reveal specific reason)
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
        path: '/api/login',
      },
      { status: 401 }
    );
  }
}
