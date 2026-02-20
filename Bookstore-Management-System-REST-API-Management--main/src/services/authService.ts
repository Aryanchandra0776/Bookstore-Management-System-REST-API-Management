// Auth Service - Business Logic for Authentication Operations
import { db } from '@/lib/db';
import { User, CreateUserDTO, LoginDTO, AuthResponse } from '@/types/api';
import { generateToken, hashPassword, comparePassword, getTokenExpiresIn } from '@/lib/auth';

/**
 * Transform Prisma User entity to API User type (excluding password)
 */
function transformUser(prismaUser: any): User {
  return {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    role: prismaUser.role,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  };
}

/**
 * Register a new user
 */
export async function registerUser(dto: CreateUserDTO): Promise<AuthResponse> {
  // Check if email already exists
  const existingUser = await db.user.findUnique({
    where: { email: dto.email },
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const hashedPassword = await hashPassword(dto.password);

  // Create user
  const prismaUser = await db.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: 'CUSTOMER', // Default role
    },
  });

  const user = transformUser(prismaUser);

  // Generate JWT token
  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: getTokenExpiresIn(),
    user,
  };
}

/**
 * Authenticate user and return token
 */
export async function loginUser(dto: LoginDTO): Promise<AuthResponse> {
  // Find user by email
  const prismaUser = await db.user.findUnique({
    where: { email: dto.email },
  });

  if (!prismaUser) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await comparePassword(dto.password, prismaUser.password);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const user = transformUser(prismaUser);

  // Generate JWT token
  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: getTokenExpiresIn(),
    user,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const prismaUser = await db.user.findUnique({
    where: { id },
  });

  if (!prismaUser) {
    return null;
  }

  return transformUser(prismaUser);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const prismaUser = await db.user.findUnique({
    where: { email },
  });

  if (!prismaUser) {
    return null;
  }

  return transformUser(prismaUser);
}
