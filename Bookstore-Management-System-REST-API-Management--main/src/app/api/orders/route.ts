// GET /api/orders - List orders (Admin: all, Customer: own)
// POST /api/orders - Place a new order (Customer only)
import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/services/orderService';
import { CreateOrderDTO, OrderListQuery } from '@/types/api';
import { getAuthenticatedUser, isAdmin } from '@/lib/authorization';

/**
 * GET /api/orders
 * Query params:
 * - page: page number (default: 1)
 * - size: items per page (default: 10, max: 100)
 */
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
          path: '/api/orders',
        },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query: OrderListQuery = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      size: searchParams.get('size') ? parseInt(searchParams.get('size')!) : undefined,
    };

    const userIsAdmin = isAdmin(user);
    const userId = userIsAdmin ? null : user.userId;

    const result = await getOrders(userId, userIsAdmin, query);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch orders',
        path: '/api/orders',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Place a new order (Customer only)
 */
export async function POST(request: NextRequest) {
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
          path: '/api/orders',
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: 'Order must contain at least one item',
          path: '/api/orders',
        },
        { status: 400 }
      );
    }

    // Validate items structure
    for (const item of body.items) {
      if (!item.bookId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          {
            timestamp: new Date().toISOString(),
            status: 400,
            error: 'Bad Request',
            message: 'Each item must have bookId and quantity (greater than 0)',
            path: '/api/orders',
          },
          { status: 400 }
        );
      }
    }

    // Build DTO
    const dto: CreateOrderDTO = {
      items: body.items,
    };

    // Create order
    const order = await createOrder(user.userId, dto);

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);

    const message = error.message || 'Failed to create order';

    if (message.includes('not found')) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 404,
          error: 'Not Found',
          message,
          path: '/api/orders',
        },
        { status: 404 }
      );
    }

    if (message.includes('Insufficient stock')) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message,
          path: '/api/orders',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: 'Internal Server Error',
        message,
        path: '/api/orders',
      },
      { status: 500 }
    );
  }
}
