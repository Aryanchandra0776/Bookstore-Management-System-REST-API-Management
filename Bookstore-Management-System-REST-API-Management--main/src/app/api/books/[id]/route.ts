// GET /api/books/{id} - Get book details
// PUT /api/books/{id} - Update book (Admin only)
// DELETE /api/books/{id} - Delete book (Admin only)
import { NextRequest, NextResponse } from 'next/server';
import { getBookById, updateBook, deleteBook } from '@/services/bookService';
import { UpdateBookDTO } from '@/types/api';
import { getAuthenticatedUser, requireAdmin } from '@/lib/authorization';

/**
 * GET /api/books/{id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const book = await getBookById(params.id);

    if (!book) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 404,
          error: 'Not Found',
          message: 'Book not found',
          path: `/api/books/${params.id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch book',
        path: `/api/books/${params.id}`,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/books/{id}
 * Update a book (Admin only)
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
          path: `/api/books/${params.id}`,
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
          path: `/api/books/${params.id}`,
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate at least one field is provided
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: 'At least one field must be provided for update',
          path: `/api/books/${params.id}`,
        },
        { status: 400 }
      );
    }

    // Build DTO
    const dto: UpdateBookDTO = {};

    if (body.title !== undefined) dto.title = body.title;
    if (body.authors !== undefined) {
      dto.authors = Array.isArray(body.authors) ? body.authors : [body.authors];
    }
    if (body.genre !== undefined) dto.genre = body.genre;
    if (body.isbn !== undefined) dto.isbn = body.isbn;
    if (body.price !== undefined) {
      const price = parseFloat(body.price);
      if (price < 0) {
        return NextResponse.json(
          {
            timestamp: new Date().toISOString(),
            status: 400,
            error: 'Bad Request',
            message: 'Price must be non-negative',
            path: `/api/books/${params.id}`,
          },
          { status: 400 }
        );
      }
      dto.price = price;
    }
    if (body.description !== undefined) dto.description = body.description;
    if (body.stockQuantity !== undefined) {
      const stockQuantity = parseInt(body.stockQuantity);
      if (stockQuantity < 0) {
        return NextResponse.json(
          {
            timestamp: new Date().toISOString(),
            status: 400,
            error: 'Bad Request',
            message: 'Stock quantity must be non-negative',
            path: `/api/books/${params.id}`,
          },
          { status: 400 }
        );
      }
      dto.stockQuantity = stockQuantity;
    }
    if (body.imageUrl !== undefined) dto.imageUrl = body.imageUrl;

    // Update book
    const book = await updateBook(params.id, dto);

    return NextResponse.json(book);
  } catch (error: any) {
    console.error('Error updating book:', error);

    const message = error.message || 'Failed to update book';

    if (message.includes('not found')) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 404,
          error: 'Not Found',
          message,
          path: `/api/books/${params.id}`,
        },
        { status: 404 }
      );
    }

    if (message.includes('already exists')) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 409,
          error: 'Conflict',
          message,
          path: `/api/books/${params.id}`,
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
        path: `/api/books/${params.id}`,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/books/{id}
 * Delete a book (Admin only)
 */
export async function DELETE(
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
          path: `/api/books/${params.id}`,
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
          path: `/api/books/${params.id}`,
        },
        { status: 403 }
      );
    }

    // Delete book
    await deleteBook(params.id);

    return NextResponse.json(
      {
        message: 'Book deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting book:', error);

    const message = error.message || 'Failed to delete book';

    if (message.includes('not found')) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 404,
          error: 'Not Found',
          message,
          path: `/api/books/${params.id}`,
        },
        { status: 404 }
      );
    }

    if (message.includes('referenced in orders')) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message,
          path: `/api/books/${params.id}`,
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
        path: `/api/books/${params.id}`,
      },
      { status: 500 }
    );
  }
}
