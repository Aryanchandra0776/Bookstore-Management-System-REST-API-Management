'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Users, ShoppingCart, Lock, Copy, Check } from 'lucide-react';

interface Endpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  adminOnly?: boolean;
  params?: string;
  requestBody?: any;
  response?: any;
  codeExample?: string;
}

const bookEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/books',
    description: 'Get paginated list of books with search and filter options',
    auth: false,
    params: 'page (optional), size (optional), sort (optional), q (search), genre (filter)',
    response: {
      data: [
        {
          id: 'string',
          title: 'string',
          authors: ['string'],
          genre: 'string',
          isbn: 'string',
          price: 12.99,
          stockQuantity: 50,
        },
      ],
      pagination: {
        page: 1,
        size: 10,
        totalElements: 100,
        totalPages: 10,
      },
    },
  },
  {
    method: 'GET',
    path: '/api/books/{id}',
    description: 'Get details of a specific book',
    auth: false,
    response: {
      id: 'string',
      title: 'string',
      authors: ['string'],
      genre: 'string',
      isbn: 'string',
      price: 12.99,
      stockQuantity: 50,
      description: 'string',
      imageUrl: 'string',
    },
  },
  {
    method: 'POST',
    path: '/api/books',
    description: 'Create a new book',
    auth: true,
    adminOnly: true,
    requestBody: {
      title: 'The Great Gatsby',
      authors: ['F. Scott Fitzgerald'],
      genre: 'Classic Literature',
      isbn: '9780743273565',
      price: 12.99,
      description: 'A masterpiece of American fiction',
      stockQuantity: 50,
      imageUrl: 'https://example.com/image.jpg',
    },
  },
  {
    method: 'PUT',
    path: '/api/books/{id}',
    description: 'Update an existing book',
    auth: true,
    adminOnly: true,
    requestBody: {
      price: 14.99,
      stockQuantity: 40,
    },
  },
  {
    method: 'DELETE',
    path: '/api/books/{id}',
    description: 'Delete a book',
    auth: true,
    adminOnly: true,
  },
];

const authEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/register',
    description: 'Register a new user account',
    auth: false,
    requestBody: {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    },
    response: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      tokenType: 'Bearer',
      expiresIn: 604800,
      user: {
        id: 'string',
        name: 'string',
        email: 'string',
        role: 'CUSTOMER',
      },
    },
  },
  {
    method: 'POST',
    path: '/api/login',
    description: 'Authenticate and receive JWT token',
    auth: false,
    requestBody: {
      email: 'john@example.com',
      password: 'password123',
    },
    response: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      tokenType: 'Bearer',
      expiresIn: 604800,
      user: {
        id: 'string',
        name: 'string',
        email: 'string',
        role: 'CUSTOMER',
      },
    },
  },
  {
    method: 'GET',
    path: '/api/users/me',
    description: 'Get current authenticated user profile',
    auth: true,
    response: {
      id: 'string',
      name: 'string',
      email: 'string',
      role: 'CUSTOMER',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  },
];

const orderEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/orders',
    description: 'Place a new order (validates stock availability)',
    auth: true,
    requestBody: {
      items: [
        {
          bookId: 'string',
          quantity: 2,
        },
      ],
    },
    response: {
      id: 'string',
      userId: 'string',
      totalPrice: 25.98,
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING',
      orderItems: [
        {
          bookId: 'string',
          quantity: 2,
          unitPrice: 12.99,
          subtotal: 25.98,
        },
      ],
    },
  },
  {
    method: 'GET',
    path: '/api/orders',
    description: 'List orders (Admin: all, Customer: own orders)',
    auth: true,
    params: 'page (optional), size (optional)',
  },
  {
    method: 'GET',
    path: '/api/orders/{id}',
    description: 'Get order details (Admin or order owner)',
    auth: true,
  },
  {
    method: 'PUT',
    path: '/api/orders/{id}/status',
    description: 'Update order status (Admin only)',
    auth: true,
    adminOnly: true,
    requestBody: {
      status: 'SHIPPED',
    },
  },
];

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [copied, setCopied] = useState(false);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-500';
      case 'POST':
        return 'bg-blue-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`${getMethodColor(endpoint.method)} px-3 py-1 rounded text-white font-bold text-sm`}>
              {endpoint.method}
            </span>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{endpoint.path}</code>
          </div>
          <div className="flex items-center gap-2">
            {endpoint.adminOnly && (
              <Badge variant="destructive">Admin Only</Badge>
            )}
            {endpoint.auth && !endpoint.adminOnly && (
              <Badge variant="secondary">Auth Required</Badge>
            )}
            {!endpoint.auth && (
              <Badge variant="outline">Public</Badge>
            )}
          </div>
        </div>
        <CardDescription>{endpoint.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {endpoint.params && (
          <div className="mb-4">
            <Label className="text-sm font-semibold">Query Parameters:</Label>
            <p className="text-sm text-muted-foreground mt-1">{endpoint.params}</p>
          </div>
        )}
        {endpoint.requestBody && (
          <div className="mb-4">
            <Label className="text-sm font-semibold">Request Body:</Label>
            <div className="relative mt-1">
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-2"
                onClick={() => copyCode(JSON.stringify(endpoint.requestBody, null, 2))}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto mt-2">
                <code>{JSON.stringify(endpoint.requestBody, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}
        {endpoint.response && (
          <div>
            <Label className="text-sm font-semibold">Response:</Label>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto mt-1">
              <code>{JSON.stringify(endpoint.response, null, 2)}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InteractiveTester() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (method: string, path: string, body?: any) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(path, options);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Tester</CardTitle>
        <CardDescription>Test the endpoints directly from this page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="token">JWT Token (Optional)</Label>
          <Input
            id="token"
            placeholder="Paste your JWT token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Quick Tests</Label>
            <div className="space-y-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => testEndpoint('GET', '/api/books')}
              >
                Get All Books
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => testEndpoint('POST', '/api/register', {
                  name: 'Test User',
                  email: `test${Date.now()}@example.com`,
                  password: 'test123',
                })}
              >
                Register User
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => testEndpoint('POST', '/api/login', {
                  email: 'john@example.com',
                  password: 'customer123',
                })}
              >
                Login (Customer)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => testEndpoint('POST', '/api/login', {
                  email: 'admin@bookstore.com',
                  password: 'admin123',
                })}
              >
                Login (Admin)
              </Button>
            </div>
          </div>

          <div>
            <Label>Result</Label>
            <ScrollArea className="h-48 mt-2 border rounded">
              <pre className="p-3 text-xs font-mono">
                {loading ? 'Loading...' : result || 'Run a test to see the result'}
              </pre>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BookstoreAPIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Bookstore Management API
          </h1>
          <p className="text-xl text-muted-foreground">
            A complete REST API for bookstore operations with authentication and order management
          </p>
        </div>

        <InteractiveTester />

        <Separator />

        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="books" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              Books
            </TabsTrigger>
            <TabsTrigger value="auth" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Authentication
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📚 Book Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage books in the catalog. Customers can browse, search, and filter books. 
                Admins can create, update, and delete books.
              </p>
            </div>
            {bookEndpoints.map((endpoint, idx) => (
              <EndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🔐 Authentication</h3>
              <p className="text-sm text-muted-foreground">
                JWT-based authentication system. Register new users, login to receive a token, 
                and access protected endpoints. Two roles: CUSTOMER and ADMIN.
              </p>
            </div>
            {authEndpoints.map((endpoint, idx) => (
              <EndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🛒 Order Management</h3>
              <p className="text-sm text-muted-foreground">
                Place orders with automatic stock validation and decrement. 
                Orders reduce stock atomically. Admins can manage all orders and update status.
              </p>
            </div>
            {orderEndpoints.map((endpoint, idx) => (
              <EndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid md:grid-cols-2 gap-4 text-sm">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>JWT Authentication with role-based access control</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Paginated responses with metadata</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Search books by title or author</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Filter books by genre</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Automatic stock validation on order placement</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Atomic stock decrement with transactions</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Global error handling with consistent responses</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Input validation with clear error messages</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Credentials</CardTitle>
            <CardDescription>Use these credentials to test the API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-muted p-3 rounded">
                <div className="font-semibold mb-1">Admin</div>
                <div className="font-mono text-xs">admin@bookstore.com</div>
                <div className="font-mono text-xs">admin123</div>
              </div>
              <div className="bg-muted p-3 rounded">
                <div className="font-semibold mb-1">Customer 1</div>
                <div className="font-mono text-xs">john@example.com</div>
                <div className="font-mono text-xs">customer123</div>
              </div>
              <div className="bg-muted p-3 rounded">
                <div className="font-semibold mb-1">Customer 2</div>
                <div className="font-mono text-xs">jane@example.com</div>
                <div className="font-mono text-xs">customer123</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Response Format</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
              <code>{`{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Detailed error message",
  "path": "/api/endpoint"
}`}</code>
            </pre>
          </CardContent>
        </Card>

        <footer className="text-center text-sm text-muted-foreground py-8">
          <p>Bookstore Management API • Built with Next.js, TypeScript, and Prisma</p>
        </footer>
      </div>
    </div>
  );
}
