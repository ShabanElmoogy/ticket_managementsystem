# MySQL Setup Guide for Ticket Management System

## Prerequisites

1. **Install MySQL Server**
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or install via package manager:
     - Windows: Download MySQL Installer
     - macOS: `brew install mysql`
     - Ubuntu: `sudo apt install mysql-server`

2. **Start MySQL Service**
   - Windows: MySQL should start automatically after installation
   - macOS: `brew services start mysql`
   - Ubuntu: `sudo systemctl start mysql`

## Database Setup

### 1. Connect to MySQL
```bash
mysql -u root -p
```

### 2. Create Database
```sql
CREATE DATABASE ticket_management;
```

### 3. Create User (Optional but recommended)
```sql
CREATE USER 'ticket_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON ticket_management.* TO 'ticket_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Update Environment Variables
Edit the `.env` file in the backend folder:

```env
# For root user (default)
DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/ticket_management"

# Or for custom user
DATABASE_URL="mysql://ticket_user:your_secure_password@localhost:3306/ticket_management"
```

## Application Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Generate Prisma Client
```bash
npm run db:generate
```

### 3. Push Database Schema
```bash
npm run db:push
```

### 4. Seed Database with Sample Data
```bash
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

## Quick Setup (All in One)
```bash
cd backend
npm run setup
npm run dev
```

## Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Make sure MySQL service is running
   - Check if port 3306 is available
   - Verify username/password in DATABASE_URL

2. **Access Denied**
   - Check MySQL user permissions
   - Verify password in DATABASE_URL
   - Try connecting with mysql client first

3. **Database Not Found**
   - Create the database manually: `CREATE DATABASE ticket_management;`
   - Or use `npm run db:push` to create it automatically

4. **Port Already in Use**
   - Change PORT in .env file
   - Or stop other services using port 3001

### MySQL Commands Reference:

```sql
-- Show databases
SHOW DATABASES;

-- Use database
USE ticket_management;

-- Show tables
SHOW TABLES;

-- Show table structure
DESCRIBE users;
DESCRIBE tickets;
DESCRIBE comments;

-- Check data
SELECT * FROM users;
SELECT * FROM tickets;
```

## Default Login Credentials

After seeding the database:

- **Admin**: admin@company.com / admin123
- **Employee 1**: john@company.com / employee123
- **Employee 2**: sarah@company.com / employee123

## Environment Variables Reference

```env
# Database
DATABASE_URL="mysql://username:password@host:port/database_name"

# JWT Secret (change in production)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Port
PORT=3001
```

## Production Notes

1. **Security**: Change JWT_SECRET to a strong random string
2. **Database**: Use a dedicated MySQL user with limited privileges
3. **SSL**: Enable SSL for database connections in production
4. **Backup**: Set up regular database backups
5. **Monitoring**: Monitor database performance and connections