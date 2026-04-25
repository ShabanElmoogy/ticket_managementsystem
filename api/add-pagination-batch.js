#!/usr/bin/env node

/**
 * Batch script to add pagination to all major list endpoints.
 * This script identifies the main list endpoints and shows what needs to be updated.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// List of modules that need pagination updates
const MODULES_TO_UPDATE = [
  {
    name: 'applications',
    listMethod: 'listApplications',
    controller: 'getAllApplications',
    hasSearch: true,
    searchFields: ['name', 'version', 'description']
  },
  {
    name: 'users',
    listMethod: 'listAllUsers',
    controller: 'getAllUsers',
    hasSearch: true,
    searchFields: ['name', 'email']
  },
  {
    name: 'tickets',
    listMethod: 'listTickets',
    controller: 'getAllTickets',
    hasSearch: true,
    searchFields: ['title', 'description']
  },
  {
    name: 'tenants',
    listMethod: 'listTenants',
    controller: 'listTenants',
    hasSearch: true,
    searchFields: ['name', 'slug']
  },
  {
    name: 'templates',
    listMethod: 'listTemplates',
    controller: 'listTemplates',
    hasSearch: true,
    searchFields: ['name', 'description']
  },
  {
    name: 'tasks',
    listMethod: 'listTasks',
    controller: 'getTasks',
    hasSearch: true,
    searchFields: ['title', 'description']
  },
  {
    name: 'notifications',
    listMethod: 'listNotifications',
    controller: 'getNotifications',
    hasSearch: false
  },
  {
    name: 'labels',
    listMethod: 'listLabels',
    controller: 'getAllLabels',
    hasSearch: true,
    searchFields: ['name']
  },
  {
    name: 'kanban',
    listMethod: 'listBoards',
    controller: 'getAllBoards',
    hasSearch: true,
    searchFields: ['name', 'description']
  },
  {
    name: 'features',
    listMethod: 'listFeatures',
    controller: 'listFeatures',
    hasSearch: true,
    searchFields: ['title', 'description']
  },
  {
    name: 'epics/epics',
    listMethod: 'listEpics',
    controller: 'listEpics',
    hasSearch: true,
    searchFields: ['title', 'description']
  },
  {
    name: 'docs',
    listMethod: 'listDocs',
    controller: 'listDocs',
    hasSearch: true,
    searchFields: ['title', 'content']
  }
];

console.log('🔍 Pagination Implementation Plan\n');
console.log('The following modules need pagination updates:\n');

MODULES_TO_UPDATE.forEach((module, index) => {
  console.log(`${index + 1}. ${module.name}`);
  console.log(`   Controller: ${module.controller}`);
  console.log(`   Service: ${module.listMethod}`);
  console.log(`   Search: ${module.hasSearch ? '✅ Yes' : '❌ No'}`);
  if (module.hasSearch) {
    console.log(`   Search fields: ${module.searchFields.join(', ')}`);
  }
  console.log('');
});

console.log('📋 Implementation Steps for Each Module:\n');
console.log('1. Update repository layer:');
console.log('   - Add limit/offset/search parameters to find* methods');
console.log('   - Add count* methods for total counts');
console.log('   - Add search functionality with ILIKE conditions');
console.log('');
console.log('2. Update service layer:');
console.log('   - Import pagination utilities');
console.log('   - Check for pagination params in query');
console.log('   - Return paginated response when requested');
console.log('   - Maintain backward compatibility');
console.log('');
console.log('3. Update controller layer:');
console.log('   - Pass req.query to service methods');
console.log('');
console.log('4. Update Swagger documentation:');
console.log('   - Add page, limit, search query parameters');
console.log('   - Update response schemas');
console.log('');

// Check which files exist
console.log('📁 File Status Check:\n');
MODULES_TO_UPDATE.forEach((module) => {
  const modulePath = path.join(__dirname, 'src', 'modules', module.name);
  const serviceFile = path.join(modulePath, `${module.name.split('/').pop()}.service.js`);
  const controllerFile = path.join(modulePath, `${module.name.split('/').pop()}.controller.js`);
  const repositoryFile = path.join(modulePath, `${module.name.split('/').pop()}.repository.js`);
  
  console.log(`${module.name}:`);
  console.log(`  Service: ${fs.existsSync(serviceFile) ? '✅' : '❌'}`);
  console.log(`  Controller: ${fs.existsSync(controllerFile) ? '✅' : '❌'}`);
  console.log(`  Repository: ${fs.existsSync(repositoryFile) ? '✅' : '❌'}`);
  console.log('');
});

console.log('🚀 Next Steps:');
console.log('1. ✅ Customers module - Already implemented');
console.log('2. 🔄 Applications module - Ready to implement');
console.log('3. 🔄 Users module - Ready to implement');
console.log('4. 🔄 Tickets module - Ready to implement');
console.log('5. 🔄 Other modules - Follow the same pattern');
console.log('');
console.log('💡 Use the customers module as a reference implementation!');