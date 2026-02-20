// Authorization Utilities for Bookstore Management System
import { UserRole } from '@prisma/client';
import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Extract and verify authenticated user from request
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  // Check for custom headers first (set by middleware if it exists)
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const role = request.headers.get('x-user-role');

  if (userId && email && role) {
    return {
      userId,
      email,
      role: role as UserRole,
    };
  }

  // Otherwise, verify from Authorization header
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === UserRole.ADMIN;
}

/**
 * Check if user can access a resource (either admin or owner)
 */
export function canAccessResource(
  user: AuthenticatedUser,
  resourceOwnerId: string
): boolean {
  return isAdmin(user) || user.userId === resourceOwnerId;
}

/**
 * Require admin role, throw error if not admin
 */
export function requireAdmin(user: AuthenticatedUser): void {
  if (!isAdmin(user)) {
    throw new Error('Forbidden: Admin access required');
  }
}

/**
 * Require resource ownership or admin role
 */
export function requireOwnershipOrAdmin(
  user: AuthenticatedUser,
  resourceOwnerId: string
): void {
  if (!canAccessResource(user, resourceOwnerId)) {
    throw new Error('Forbidden: You do not have permission to access this resource');
  }
}
