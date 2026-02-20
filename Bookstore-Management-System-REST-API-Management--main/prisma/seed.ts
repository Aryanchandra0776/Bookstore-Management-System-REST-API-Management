// Database Seed Script for Bookstore Management System
import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcryptjs');

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@bookstore.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin created: ${admin.email} / admin123`);

  // Create customer users
  console.log('👤 Creating customers...');
  const customer1Password = await hashPassword('customer123');
  const customer1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: customer1Password,
      role: 'CUSTOMER',
    },
  });

  const customer2Password = await hashPassword('customer123');
  const customer2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: customer2Password,
      role: 'CUSTOMER',
    },
  });
  console.log(`✅ Customers created: ${customer1.email}, ${customer2.email} / customer123`);

  // Create books
  console.log('📚 Creating books...');
  const book1 = await prisma.book.create({
    data: {
      title: 'The Great Gatsby',
      authors: JSON.stringify(['F. Scott Fitzgerald']),
      genre: 'Classic Literature',
      isbn: '9780743273565',
      price: 12.99,
      description: 'A masterpiece of American fiction set in the Jazz Age.',
      stockQuantity: 50,
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    },
  });

  const book2 = await prisma.book.create({
    data: {
      title: 'To Kill a Mockingbird',
      authors: JSON.stringify(['Harper Lee']),
      genre: 'Classic Literature',
      isbn: '9780061120084',
      price: 14.99,
      description: 'A gripping tale of racial injustice and childhood innocence.',
      stockQuantity: 30,
      imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
    },
  });

  const book3 = await prisma.book.create({
    data: {
      title: '1984',
      authors: JSON.stringify(['George Orwell']),
      genre: 'Science Fiction',
      isbn: '9780451524935',
      price: 13.99,
      description: 'A dystopian social science fiction novel and cautionary tale.',
      stockQuantity: 25,
      imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    },
  });

  const book4 = await prisma.book.create({
    data: {
      title: 'Clean Code',
      authors: JSON.stringify(['Robert C. Martin']),
      genre: 'Technology',
      isbn: '9780132350884',
      price: 42.99,
      description: 'A handbook of agile software craftsmanship.',
      stockQuantity: 15,
      imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    },
  });

  const book5 = await prisma.book.create({
    data: {
      title: 'Design Patterns',
      authors: JSON.stringify(['Erich Gamma', 'Richard Helm', 'Ralph Johnson', 'John Vlissides']),
      genre: 'Technology',
      isbn: '9780201633610',
      price: 54.99,
      description: 'Elements of reusable object-oriented software.',
      stockQuantity: 20,
      imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    },
  });
  console.log(`✅ Books created: ${book1.title}, ${book2.title}, ${book3.title}, ${book4.title}, ${book5.title}`);

  // Create orders
  console.log('🛒 Creating orders...');
  const order1 = await prisma.order.create({
    data: {
      userId: customer1.id,
      totalPrice: 27.98,
      orderStatus: 'DELIVERED',
      paymentStatus: 'PAID',
      orderItems: {
        create: [
          {
            bookId: book1.id,
            quantity: 1,
            unitPrice: 12.99,
            subtotal: 12.99,
          },
          {
            bookId: book3.id,
            quantity: 1,
            unitPrice: 13.99,
            subtotal: 13.99,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: customer2.id,
      totalPrice: 42.99,
      orderStatus: 'SHIPPED',
      paymentStatus: 'PAID',
      orderItems: {
        create: [
          {
            bookId: book4.id,
            quantity: 1,
            unitPrice: 42.99,
            subtotal: 42.99,
          },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      userId: customer1.id,
      totalPrice: 54.99,
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING',
      orderItems: {
        create: [
          {
            bookId: book5.id,
            quantity: 1,
            unitPrice: 54.99,
            subtotal: 54.99,
          },
        ],
      },
    },
  });
  console.log(`✅ Orders created: ${order1.id}, ${order2.id}, ${order3.id}`);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Admin: admin@bookstore.com / admin123');
  console.log('   Customer 1: john@example.com / customer123');
  console.log('   Customer 2: jane@example.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
