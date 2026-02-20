// GET /api/books - List books with pagination, search, and filter
// POST /api/books - Create a new book (Admin only)
import { NextRequest, NextResponse } from 'next/server';
import { getBooks, createBook, getGenres } from '@/services/bookService';
import { CreateBookDTO, BookListQuery } from '@/types/api';
import { getAuthenticatedUser, requireAdmin } from '@/lib/authorization';

/**
 * GET /api/books
 * Query params:
 * - page: page number (default: 1)
 * - size: items per page (default: 10, max: 100)
 * - sort: sort field (default: createdAt), prefix with - for descending
 * - q: search query for title or author
 * - genre: filter by genre
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query: BookListQuery = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      size: searchParams.get('size') ? parseInt(searchParams.get('size')!) : undefined,
      sort: searchParams.get('sort') || undefined,
      q: searchParams.get('q') || undefined,
      genre: searchParams.get('genre') || undefined,
    };

    const result = await getBooks(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch books',
        path: '/api/books',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/books
 * Create a new book (Admin only)
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
          path: '/api/books',
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
          path: '/api/books',
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.authors || !body.genre || !body.isbn || !body.price || body.stockQuantity === undefined) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: 'Missing required fields: title, authors, genre, isbn, price, stockQuantity',
          path: '/api/books',
        },
        { status: 400 }
      );
    }

    // Validate data types
    const dto: CreateBookDTO = {
      title: body.title,
      authors: Array.isArray(body.authors) ? body.authors : [body.authors],
      genre: body.genre,
      isbn: body.isbn,
      price: parseFloat(body.price),
      description: body.description,
      stockQuantity: parseInt(body.stockQuantity),
      imageUrl: body.imageUrl,
    };

    // Validate numeric fields
    if (dto.price < 0) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: 'Price must be non-negative',
          path: '/api/books',
        },
        { status: 400 }
      );
    }

    if (dto.stockQuantity < 0) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: 'Stock quantity must be non-negative',
          path: '/api/books',
        },
        { status: 400 }
      );
    }

    // Create book
    const book = await createBook(dto);

    return NextResponse.json(book, { status: 201 });
  } catch (error: any) {
    console.error('Error creating book:', error);

    const message = error.message || 'Failed to create book';

    if (message.includes('already exists')) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 409,
          error: 'Conflict',
          message,
          path: '/api/books',
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
        path: '/api/books',
      },
      { status: 500 }
    );
  }
}
