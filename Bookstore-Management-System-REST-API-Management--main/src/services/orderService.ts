// Order Service - Business Logic for Order Operations
import { db } from '@/lib/db';
import { Order, CreateOrderDTO, UpdateOrderStatusDTO, OrderListQuery, PaginatedResponse } from '@/types/api';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { checkStockAvailability, decrementStock, getBookById } from './bookService';

/**
 * Transform Prisma Order entity to API Order type
 */
async function transformOrder(prismaOrder: any): Promise<Order> {
  // Parse authors for each book in order items
  const orderItems = await Promise.all(
    prismaOrder.orderItems.map(async (item: any) => {
      let bookDetails = null;
      if (item.book) {
        bookDetails = {
          id: item.book.id,
          title: item.book.title,
          authors: JSON.parse(item.book.authors),
          imageUrl: item.book.imageUrl,
        };
      }
      return {
        id: item.id,
        bookId: item.bookId,
        book: bookDetails,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      };
    })
  );

  return {
    id: prismaOrder.id,
    userId: prismaOrder.userId,
    user: prismaOrder.user
      ? {
          id: prismaOrder.user.id,
          name: prismaOrder.user.name,
          email: prismaOrder.user.email,
        }
      : undefined,
    orderItems,
    totalPrice: prismaOrder.totalPrice,
    orderStatus: prismaOrder.orderStatus,
    paymentStatus: prismaOrder.paymentStatus,
    createdAt: prismaOrder.createdAt,
    updatedAt: prismaOrder.updatedAt,
  };
}

/**
 * Get paginated list of orders
 */
export async function getOrders(
  userId: string | null,
  isAdmin: boolean,
  query: OrderListQuery
): Promise<PaginatedResponse<Order>> {
  const page = query.page || 1;
  const size = Math.min(query.size || 10, 100); // Max 100 items per page
  const skip = (page - 1) * size;

  // Build where clause based on user role
  const where = isAdmin ? {} : { userId };

  // Get total count
  const totalElements = await db.order.count({ where });

  // Get orders with pagination
  const prismaOrders = await db.order.findMany({
    where,
    skip,
    take: size,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          book: true,
        },
      },
    },
  });

  const data = await Promise.all(prismaOrders.map(transformOrder));

  return {
    data,
    pagination: {
      page,
      size,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      hasNext: skip + size < totalElements,
      hasPrevious: page > 1,
    },
  };
}

/**
 * Get a single order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const prismaOrder = await db.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          book: true,
        },
      },
    },
  });

  if (!prismaOrder) {
    return null;
  }

  return transformOrder(prismaOrder);
}

/**
 * Place a new order
 * This includes stock validation and atomic decrement
 */
export async function createOrder(userId: string, dto: CreateOrderDTO): Promise<Order> {
  // Validate that items are provided
  if (!dto.items || dto.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // Get books and validate stock availability
  const orderItems = [];
  let totalPrice = 0;

  for (const item of dto.items) {
    if (!item.bookId || !item.quantity || item.quantity <= 0) {
      throw new Error('Invalid order item');
    }

    // Get book details
    const book = await getBookById(item.bookId);
    if (!book) {
      throw new Error(`Book with ID ${item.bookId} not found`);
    }

    // Check stock availability
    const isAvailable = await checkStockAvailability(item.bookId, item.quantity);
    if (!isAvailable) {
      throw new Error(
        `Insufficient stock for book "${book.title}". Available: ${book.stockQuantity}, Requested: ${item.quantity}`
      );
    }

    const subtotal = book.price * item.quantity;
    totalPrice += subtotal;

    orderItems.push({
      bookId: item.bookId,
      quantity: item.quantity,
      unitPrice: book.price,
      subtotal,
    });
  }

  // Use transaction to ensure atomicity
  const result = await db.$transaction(async (tx) => {
    // Decrement stock for each book
    for (const item of orderItems) {
      const book = await tx.book.findUnique({
        where: { id: item.bookId },
        select: { stockQuantity: true },
      });

      if (!book || book.stockQuantity < item.quantity) {
        throw new Error(
          'Stock validation failed during order processing. Please try again.'
        );
      }

      await tx.book.update({
        where: { id: item.bookId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Create order
    const prismaOrder = await tx.order.create({
      data: {
        userId,
        totalPrice,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    });

    return prismaOrder;
  });

  return transformOrder(result);
}

/**
 * Update order status (Admin only)
 */
export async function updateOrderStatus(id: string, dto: UpdateOrderStatusDTO): Promise<Order> {
  // Check if order exists
  const existingOrder = await db.order.findUnique({
    where: { id },
  });

  if (!existingOrder) {
    throw new Error('Order not found');
  }

  // Update order status
  const prismaOrder = await db.order.update({
    where: { id },
    data: {
      orderStatus: dto.status,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          book: true,
        },
      },
    },
  });

  return transformOrder(prismaOrder);
}

/**
 * Cancel an order (Customer only, for their own orders)
 */
export async function cancelOrder(orderId: string, userId: string): Promise<Order> {
  // Check if order exists and belongs to user
  const existingOrder = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) {
    throw new Error('Order not found');
  }

  if (existingOrder.userId !== userId) {
    throw new Error('You can only cancel your own orders');
  }

  if (existingOrder.orderStatus !== OrderStatus.PENDING) {
    throw new Error('Only pending orders can be cancelled');
  }

  // Use transaction to restore stock and cancel order
  const result = await db.$transaction(async (tx) => {
    // Restore stock for each book
    const orderItems = await tx.orderItem.findMany({
      where: { orderId },
    });

    for (const item of orderItems) {
      await tx.book.update({
        where: { id: item.bookId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
    }

    // Cancel order
    const prismaOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: OrderStatus.CANCELLED,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    });

    return prismaOrder;
  });

  return transformOrder(result);
}
