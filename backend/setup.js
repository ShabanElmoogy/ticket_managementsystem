import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Ticket Management Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('Please create a .env file with your MySQL configuration.');
    console.log('See MYSQL_SETUP.md for instructions.');
    process.exit(1);
}

try {
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('\n🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('\n🗄️  Pushing database schema...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('\n🌱 Seeding database with sample data...');
    execSync('node prisma/seed.js', { stdio: 'inherit' });
    
    console.log('\n✅ Setup completed successfully!');
    console.log('\n🎉 You can now run: npm run dev');
    console.log('\nDefault login credentials:');
    console.log('👤 Admin: admin@company.com / admin123');
    console.log('👤 Employee: john@company.com / employee123');
    
} catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\nPlease check:');
    console.log('1. MySQL server is running');
    console.log('2. Database credentials in .env are correct');
    console.log('3. Database exists or can be created');
    console.log('\nSee MYSQL_SETUP.md for detailed instructions.');
    process.exit(1);
}