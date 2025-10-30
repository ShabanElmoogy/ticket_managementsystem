#!/usr/bin/env node

import { existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!existsSync(nodeModulesPath)) {
  console.log('Installing dependencies...');
  try {
    execSync('npm install --production', { stdio: 'inherit', cwd: __dirname });
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Check if express is available
try {
  await import('express');
} catch (error) {
  console.log('Express not found, installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  } catch (installError) {
    console.error('Failed to install dependencies:', installError.message);
    process.exit(1);
  }
}

// Run Prisma migrations
try {
  console.log('Running Prisma migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: __dirname });
} catch (error) {
  console.error('Failed to run migrations:', error.message);
  process.exit(1);
}

// Start the server
import('./server.js');