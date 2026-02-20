// GET /api/orders/{id} - Get order details (Admin or order owner)
// PUT /api/orders/{id}/status - Update order status (Admin only)
import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus, cancelOrder } from '@/services/orderService';
import { UpdateOrderStatusDTO } from '@/types/api';
import { getAuthenticatedUser, isAdmin, requireAdmin, canAccessResource } from '@/lib/authorization';

/**
 * GET /api/orders/{id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
          path: `/api/orders/${params.id}`,
        },
        { status: 401 }
      );
    }

    // Get order
    const order = await getOrderById(params.id);

    if (!order) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 404,
          error: 'Not Found',
          message: 'Order not found',
          path: `/api/orders/${params.id}`,
        },
        { status: 404 }
      );
    }

    // Check permission (admin or order owner)
    if (!canAccessResource(user, order.userId)) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 403,
          error: 'Forbidden',
          message: 'You do not have permission to access this order',
          path: `/api/orders/${params.id}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch order',
        path: `/api/orders/${params.id}`,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orders/{id}/status
 * Update order status (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
          path: `/api/orders/${params.id}`,
        },
        { status: 401 }
      );
    }

    // Check admin role
    try {
      requireAdmin(user);
    } catch (error) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 403,
          error: 'Forbidden',
          message: 'Admin access required',
          path: `/api/orders/${params.id}`,
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: 'Missing required field: status',
          path: `/api/orders/${params.id}`,
        },
        { status: 400 }
      );
    }

    // Validate status enum
    const validStatuses = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
          path: `/api/orders/${params.id}`,
        },
        { status: 400 }
      );
    }

    // Build DTO
    const dto: UpdateOrderStatusDTO = {
      status: body.status,
    };

    // Update order status
    const order = await updateOrderStatus(params.id, dto);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error updating order status:', error);

    const message = error.message || 'Failed to update order status';

    if (message.includes('not found')) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 404,
          error: 'Not Found',
          message,
          path: `/api/orders/${params.id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: 'Internal Server Error',
        message,
        path: `/api/orders/${params.id}`,
      },
      { status: 500 }
    );
  }
}
