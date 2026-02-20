# 📚 Bookstore Management System - REST API

A complete, production-ready REST API for bookstore operations including authentication, book management, and order processing with real-time stock validation.

## 🎯 Overview

This is a comprehensive REST API built with Next.js 16, TypeScript, and Prisma that provides full bookstore management capabilities including:
- JWT-based authentication with role-based access control
- Book catalog management with search and filtering
- Order processing with automatic stock validation and decrement
- Admin dashboard capabilities
- RESTful design with proper HTTP status codes and error handling

## 🛠️ Technology Stack

### Core Framework
- **⚡ Next.js 16** - React framework with App Router
- **📘 TypeScript 5** - Type-safe development
- **🎨 Tailwind CSS 4** - Utility-first styling
- **🧩 shadcn/ui** - UI component library

### Backend & Database
- **🗄️ Prisma ORM** - Type-safe database access
- **💾 SQLite** - Default database (easily switchable to MySQL)
- **🔐 JWT (jose)** - JSON Web Token authentication
- **🔒 bcryptjs** - Password hashing

### Development Tools
- **🐘 Bun** - Fast JavaScript runtime and package manager
- **📦 ESLint** - Code linting and quality checks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun installed
- Git for version control

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd my-project

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# Push database schema
bun run db:push

# Seed the database with sample data
bunx tsx prisma/seed.ts

# Start development server
bun run dev
```

The API will be available at `http://localhost:3000` and the interactive documentation at `/`.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── books/
│   │   │   ├── route.ts              # GET (list), POST (create)
│   │   │   └── [id]/route.ts        # GET, PUT, DELETE by ID
│   │   ├── orders/
│   │   │   ├── route.ts              # GET (list), POST (create)
│   │   │   └── [id]/route.ts        # GET details, PUT status
│   │   ├── register/route.ts         # POST register
│   │   ├── login/route.ts            # POST login
│   │   └── users/me/route.ts         # GET current user
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # API documentation
│   └── globals.css                   # Global styles
├── components/ui/                    # shadcn/ui components
├── services/
│   ├── bookService.ts               # Book business logic
│   ├── authService.ts               # Authentication logic
│   └── orderService.ts              # Order business logic
├── types/
│   └── api.ts                       # TypeScript types & DTOs
├── lib/
│   ├── auth.ts                      # JWT utilities
│   ├── authorization.ts             # Authorization helpers
│   └── db.ts                        # Prisma client
└── middleware.ts                    # Auth middleware

prisma/
├── schema.prisma                    # Database schema
└── seed.ts                          # Database seeder
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid JWT token in the `Authorization` header.

### How to Authenticate

1. **Register** a new user account:
   ```bash
   POST /api/register
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "password123"
   }
   ```

2. **Login** to receive a JWT token:
   ```bash
   POST /api/login
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ```

3. **Use the token** in subsequent requests:
   ```bash
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### User Roles

- **CUSTOMER**: Can browse books, place orders, and view their own orders
- **ADMIN**: Full access including book management and order status updates

## 📚 API Endpoints

### Authentication

#### Register User
```http
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/users/me
Authorization: Bearer <token>
```

### Books

#### List Books (Public)
```http
GET /api/books?page=1&size=10&sort=createdAt&q=search-term&genre=Fiction
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `size` (optional): Items per page, max 100 (default: 10)
- `sort` (optional): Sort field, prefix with `-` for descending (default: createdAt)
- `q` (optional): Search by title or author
- `genre` (optional): Filter by genre

#### Get Book Details (Public)
```http
GET /api/books/{id}
```

#### Create Book (Admin Only)
```http
POST /api/books
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "The Great Gatsby",
  "authors": ["F. Scott Fitzgerald"],
  "genre": "Classic Literature",
  "isbn": "9780743273565",
  "price": 12.99,
  "description": "A masterpiece of American fiction",
  "stockQuantity": 50,
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Update Book (Admin Only)
```http
PUT /api/books/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 14.99,
  "stockQuantity": 40
}
```

#### Delete Book (Admin Only)
```http
DELETE /api/books/{id}
Authorization: Bearer <token>
```

### Orders

#### Place Order (Customer Only)
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "bookId": "book-id-1",
      "quantity": 2
    },
    {
      "bookId": "book-id-2",
      "quantity": 1
    }
  ]
}
```

Note: Stock is validated atomically and decremented on successful order placement.

#### List Orders
```http
GET /api/orders?page=1&size=10
Authorization: Bearer <token>
```

- Admin: Returns all orders
- Customer: Returns only their orders

#### Get Order Details
```http
GET /api/orders/{id}
Authorization: Bearer <token>
```

- Admin: Can access any order
- Customer: Can only access their own orders

#### Update Order Status (Admin Only)
```http
PUT /api/orders/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "SHIPPED"
}
```

Valid statuses: `PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED`

## 🎯 Error Response Format

All errors follow a consistent format:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Detailed error message",
  "path": "/api/endpoint"
}
```

HTTP Status Codes:
- `200 OK`: Successful GET, PUT, DELETE
- `201 Created`: Successful POST
- `400 Bad Request`: Invalid input or validation error
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

## 🧪 Testing

### Run Tests
```bash
bun run lint
```

### Test Credentials

The database is seeded with test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bookstore.com | admin123 |
| Customer 1 | john@example.com | customer123 |
| Customer 2 | jane@example.com | customer123 |

### Seed Database
```bash
bunx tsx prisma/seed.ts
```

This creates:
- 1 admin user
- 2 customer users
- 5 sample books
- 3 sample orders

## 🐳 Docker Deployment

### Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Build Docker Image Only

```bash
# Build the image
docker build -t bookstore-api .

# Run the container
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret-key \
  -v $(pwd)/db:/app/db \
  bookstore-api
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./db/custom.db"
JWT_SECRET="your-secret-key-change-in-production"
NODE_ENV="production"
PORT=3000
```

## 🗄️ Database Configuration

### Switch to MySQL

To use MySQL instead of SQLite:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```env
DATABASE_URL="mysql://user:password@localhost:3306/bookstore"
```

3. Push schema to MySQL:
```bash
bun run db:push
```

### Database Schema

The system uses the following entities:

- **User**: id, name, email, password (hashed), role, timestamps
- **Book**: id, title, authors (JSON array), genre, isbn, price, description, stockQuantity, imageUrl, timestamps
- **Order**: id, userId (relation), totalPrice, orderStatus, paymentStatus, timestamps
- **OrderItem**: id, orderId (relation), bookId (relation), quantity, unitPrice, subtotal, timestamps

## 🔐 Security Features

- **JWT Authentication**: Tokens expire in 7 days
- **Password Hashing**: BCrypt with 10 salt rounds
- **Role-Based Access Control**: ADMIN vs CUSTOMER permissions
- **Input Validation**: All endpoints validate input data
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **CORS**: Configured for safe cross-origin requests

## 📊 Stock Management

The order system includes robust stock management:

1. **Validation**: Stock availability is checked before order placement
2. **Atomic Decrement**: Stock is decremented within a database transaction
3. **Error Handling**: Clear error messages for insufficient stock
4. **Transaction Safety**: Orders either fully succeed or fail without partial stock changes

Example error:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Insufficient stock for book \"1984\". Available: 10, Requested: 15",
  "path": "/api/orders"
}
```

## 🔄 Payment Integration (Future)

The codebase includes hooks for payment integration:

```typescript
// src/lib/payment.ts (to be implemented)
export interface PaymentService {
  processPayment(orderId: string, amount: number): Promise<PaymentResult>;
  refundPayment(paymentId: string): Promise<void>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}

// Mock implementation provided for testing
export class MockPaymentService implements PaymentService {
  // ... implementation
}
```

To integrate Stripe or PayPal:
1. Implement the `PaymentService` interface
2. Update order creation flow to call payment service
3. Add webhooks for payment status updates

## 📈 Performance Optimizations

- **Database Indexing**: Indexed foreign keys and frequently queried fields
- **Pagination**: All list endpoints support pagination
- **Efficient Queries**: Optimized Prisma queries with select/include
- **Connection Pooling**: Prisma manages database connections efficiently

## 🧰 Development Commands

```bash
# Development
bun run dev              # Start development server
bun run lint            # Run ESLint
bun run build           # Build for production
bun start               # Start production server

# Database
bun run db:push         # Push schema changes to database
bun run db:studio       # Open Prisma Studio
bunx prisma generate    # Generate Prisma Client
bunx prisma migrate dev  # Create and apply migration

# Testing
bun test                # Run tests (when added)
bunx tsx prisma/seed.ts # Seed database
```

## 📝 API Documentation

An interactive API documentation page is available at the root URL (`/`). It includes:
- All endpoints with examples
- Request/response schemas
- Authentication information
- Interactive API tester
- Test credentials

## 🎨 Features Checklist

- ✅ JWT Authentication with role-based access
- ✅ Book CRUD operations
- ✅ Order management with stock validation
- ✅ Pagination support
- ✅ Search and filter capabilities
- ✅ Atomic stock transactions
- ✅ Global error handling
- ✅ Input validation
- ✅ Docker support
- ✅ Database seeding
- ✅ Interactive API documentation
- ✅ Comprehensive README

## 🚧 Optional Enhancements

The following features can be added as future enhancements:

- [ ] Book reviews and ratings
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Email notifications for order updates
- [ ] Rate limiting on API endpoints
- [ ] Caching layer (Redis)
- [ ] Order cancellation for customers
- [ ] Wishlist functionality
- [ ] Advanced analytics dashboard
- [ ] Book recommendations

## 🤝 Contributing

When contributing to this project:

1. Follow the existing code style and structure
2. Write clear, descriptive commit messages
3. Add tests for new features
4. Update documentation for API changes
5. Ensure all tests pass before submitting

## 📄 License

This project is provided as-is for educational and commercial use.

## 🆘 Support

For issues and questions:
- Check the API documentation at `/`
- Review error messages in the response
- Check logs for server-side errors
- Verify JWT token validity for authentication issues

---

**Built with ❤️ using Next.js, TypeScript, and Prisma**
