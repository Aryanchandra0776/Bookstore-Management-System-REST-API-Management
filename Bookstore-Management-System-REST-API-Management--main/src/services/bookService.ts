// Book Service - Business Logic for Book Operations
import { db } from '@/lib/db';
import { Book, CreateBookDTO, UpdateBookDTO, BookListQuery, PaginatedResponse } from '@/types/api';
import { Prisma } from '@prisma/client';

/**
 * Parse authors JSON string to array
 */
function parseAuthors(authorsStr: string): string[] {
  try {
    return JSON.parse(authorsStr);
  } catch {
    return [authorsStr];
  }
}

/**
 * Serialize authors array to JSON string
 */
function serializeAuthors(authors: string[]): string {
  return JSON.stringify(authors);
}

/**
 * Transform Prisma Book entity to API Book type
 */
function transformBook(prismaBook: any): Book {
  return {
    id: prismaBook.id,
    title: prismaBook.title,
    authors: parseAuthors(prismaBook.authors),
    genre: prismaBook.genre,
    isbn: prismaBook.isbn,
    price: prismaBook.price,
    description: prismaBook.description,
    stockQuantity: prismaBook.stockQuantity,
    imageUrl: prismaBook.imageUrl,
    createdAt: prismaBook.createdAt,
    updatedAt: prismaBook.updatedAt,
  };
}

/**
 * Get paginated list of books with optional search and filter
 */
export async function getBooks(query: BookListQuery): Promise<PaginatedResponse<Book>> {
  const page = query.page || 1;
  const size = Math.min(query.size || 10, 100); // Max 100 items per page
  const skip = (page - 1) * size;
  const sort = query.sort || 'createdAt';
  const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';
  const sortField = sort.replace(/^-/, '');
  const searchQuery = query.q?.toLowerCase();
  const genreFilter = query.genre;

  // Build where clause
  const where: Prisma.BookWhereInput = {};

  // Search by title or author
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery } },
      { authors: { contains: searchQuery } },
    ];
  }

  // Filter by genre
  if (genreFilter) {
    where.genre = genreFilter;
  }

  // Build order by clause
  const orderBy: Prisma.BookOrderByWithRelationInput = {};
  orderBy[sortField as keyof Prisma.BookOrderByWithRelationInput] = sortOrder;

  // Get total count
  const totalElements = await db.book.count({ where });

  // Get books with pagination
  const prismaBooks = await db.book.findMany({
    where,
    skip,
    take: size,
    orderBy,
  });

  const data = prismaBooks.map(transformBook);

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
 * Get a single book by ID
 */
export async function getBookById(id: string): Promise<Book | null> {
  const prismaBook = await db.book.findUnique({
    where: { id },
  });

  if (!prismaBook) {
    return null;
  }

  return transformBook(prismaBook);
}

/**
 * Create a new book
 */
export async function createBook(dto: CreateBookDTO): Promise<Book> {
  // Check if ISBN already exists
  const existingBook = await db.book.findUnique({
    where: { isbn: dto.isbn },
  });

  if (existingBook) {
    throw new Error('A book with this ISBN already exists');
  }

  const prismaBook = await db.book.create({
    data: {
      title: dto.title,
      authors: serializeAuthors(dto.authors),
      genre: dto.genre,
      isbn: dto.isbn,
      price: dto.price,
      description: dto.description,
      stockQuantity: dto.stockQuantity,
      imageUrl: dto.imageUrl,
    },
  });

  return transformBook(prismaBook);
}

/**
 * Update an existing book
 */
export async function updateBook(id: string, dto: UpdateBookDTO): Promise<Book> {
  // Check if book exists
  const existingBook = await db.book.findUnique({
    where: { id },
  });

  if (!existingBook) {
    throw new Error('Book not found');
  }

  // Check if new ISBN conflicts with another book
  if (dto.isbn && dto.isbn !== existingBook.isbn) {
    const bookWithIsbn = await db.book.findUnique({
      where: { isbn: dto.isbn },
    });

    if (bookWithIsbn) {
      throw new Error('A book with this ISBN already exists');
    }
  }

  const updateData: Prisma.BookUpdateInput = {};

  if (dto.title !== undefined) updateData.title = dto.title;
  if (dto.authors !== undefined) updateData.authors = serializeAuthors(dto.authors);
  if (dto.genre !== undefined) updateData.genre = dto.genre;
  if (dto.isbn !== undefined) updateData.isbn = dto.isbn;
  if (dto.price !== undefined) updateData.price = dto.price;
  if (dto.description !== undefined) updateData.description = dto.description;
  if (dto.stockQuantity !== undefined) updateData.stockQuantity = dto.stockQuantity;
  if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;

  const prismaBook = await db.book.update({
    where: { id },
    data: updateData,
  });

  return transformBook(prismaBook);
}

/**
 * Delete a book
 */
export async function deleteBook(id: string): Promise<void> {
  // Check if book exists
  const existingBook = await db.book.findUnique({
    where: { id },
  });

  if (!existingBook) {
    throw new Error('Book not found');
  }

  // Check if book is referenced in any orders
  const orderItemsCount = await db.orderItem.count({
    where: { bookId: id },
  });

  if (orderItemsCount > 0) {
    throw new Error('Cannot delete book that is referenced in orders');
  }

  await db.book.delete({
    where: { id },
  });
}

/**
 * Get all unique genres
 */
export async function getGenres(): Promise<string[]> {
  const books = await db.book.findMany({
    select: { genre: true },
    distinct: ['genre'],
  });

  return books.map(book => book.genre);
}

/**
 * Check stock availability for a book
 */
export async function checkStockAvailability(bookId: string, quantity: number): Promise<boolean> {
  const book = await db.book.findUnique({
    where: { id: bookId },
    select: { stockQuantity: true },
  });

  if (!book) {
    throw new Error('Book not found');
  }

  return book.stockQuantity >= quantity;
}

/**
 * Decrement stock for a book
 */
export async function decrementStock(bookId: string, quantity: number): Promise<void> {
  const book = await db.book.findUnique({
    where: { id: bookId },
    select: { stockQuantity: true },
  });

  if (!book) {
    throw new Error('Book not found');
  }

  if (book.stockQuantity < quantity) {
    throw new Error('Insufficient stock');
  }

  await db.book.update({
    where: { id: bookId },
    data: {
      stockQuantity: {
        decrement: quantity,
      },
    },
  });
}
