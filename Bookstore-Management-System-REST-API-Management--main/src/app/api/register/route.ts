// POST /api/register - Register a new user
import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/services/authService';
import { CreateUserDTO } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: 'Missing required fields: name, email, password',
          path: '/api/register',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: 'Invalid email format',
          path: '/api/register',
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 6) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: 'Password must be at least 6 characters long',
          path: '/api/register',
        },
        { status: 400 }
      );
    }

    // Build DTO
    const dto: CreateUserDTO = {
      name: body.name,
      email: body.email.toLowerCase().trim(),
      password: body.password,
    };

    // Register user
    const authResponse = await registerUser(dto);

    return NextResponse.json(authResponse, { status: 201 });
  } catch (error: any) {
    console.error('Error registering user:', error);

    const message = error.message || 'Failed to register user';

    if (message.includes('already registered')) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 409,
          error: 'Conflict',
          message,
          path: '/api/register',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: 'Internal Server Error',
        message,
        path: '/api/register',
      },
      { status: 500 }
    );
  }
}
