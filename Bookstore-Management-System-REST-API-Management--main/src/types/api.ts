// Bookstore Management System - API Types and DTOs

import { UserRole, OrderStatus, PaymentStatus } from '@prisma/client';

// ============================================================================
// BOOK TYPES
// ============================================================================

export interface Book {
  id: string;
  title: string;
  authors: string[]; // Parsed from JSON string
  genre: string;
  isbn: string;
  price: number;
  description?: string | null;
  stockQuantity: number;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookDTO {
  title: string;
  authors: string[];
  genre: string;
  isbn: string;
  price: number;
  description?: string;
  stockQuantity: number;
  imageUrl?: string;
}

export interface UpdateBookDTO {
  title?: string;
  authors?: string[];
  genre?: string;
  isbn?: string;
  price?: number;
  description?: string;
  stockQuantity?: number;
  imageUrl?: string;
}

export interface BookListQuery {
  page?: number;
  size?: number;
  sort?: string;
  q?: string; // search query for title/author
  genre?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface OrderItem {
  id: string;
  bookId: string;
  book?: {
    id: string;
    title: string;
    authors: string[];
    imageUrl?: string | null;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  orderItems: OrderItem[];
  totalPrice: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderItemDTO {
  bookId: string;
  quantity: number;
}

export interface CreateOrderDTO {
  items: CreateOrderItemDTO[];
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
}

export interface OrderListQuery {
  page?: number;
  size?: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

// ============================================================================
// PAYMENT HOOK TYPES (for future integration)
// ============================================================================

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  message?: string;
}

// ============================================================================
// API RESPONSE WRAPPER
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
