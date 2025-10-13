import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  console.log('🔍 Testing database connection...');
  console.log('📍 Database URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test if database exists and has tables
    try {
      const userCount = await prisma.user.count();
      console.log(`📊 Found ${userCount} users in database`);
      
      const ticketCount = await prisma.ticket.count();
      console.log(`🎫 Found ${ticketCount} tickets in database`);
      
      console.log('🎉 Database is ready to use!');
    } catch (error) {
      console.log('⚠️  Database connected but tables not found.');
      console.log('💡 Run: npm run db:push && npm run db:seed');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 Fix: Update your .env file with correct MySQL credentials');
      console.log('Examples:');
      console.log('- No password: DATABASE_URL="mysql://root:@localhost:3306/ticket_management"');
      console.log('- With password: DATABASE_URL="mysql://root:yourpassword@localhost:3306/ticket_management"');
    } else if (error.message.includes('Unknown database')) {
      console.log('\n🔧 Fix: Create the database first');
      console.log('Run in MySQL: CREATE DATABASE ticket_management;');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\n🔧 Fix: Start MySQL server');
      console.log('- Windows: Start MySQL service');
      console.log('- macOS: brew services start mysql');
      console.log('- Linux: sudo systemctl start mysql');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();