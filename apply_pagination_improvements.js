#!/usr/bin/env node

/**
 * Script to apply pagination improvements to all remaining modules
 * This applies the same validation and caching patterns used in customers module
 */

const fs = require('fs');
const path = require('path');

// Modules that need updates (excluding already updated ones)
const MODULES_TO_UPDATE = [
  'templates', 'tasks', 'labels', 'notifications', 'kanban'
];

// Service layer improvements
const SERVICE_IMPROVEMENTS = {
  // Add input validation and enhanced documentation
  addValidation: (content) => {
    // Add validation for pagination parameters
    const validationCode = `
  // Additional validation for pagination parameters
  if (page < 1) {
    throw fail('Page must be >= 1', 400);
  }
  if (limit < 1 || limit > 100) {
    throw fail('Limit must be between 1 and 100', 400);
  }

  // Execute count and data queries in parallel for optimal performance`;

    return content.replace(
      /\/\/ Get total count and paginated data in parallel/g,
      validationCode
    );
  },

  // Enhance documentation
  enhanceDocumentation: (content) => {
    return content.replace(
      /\/\*\*\s*\n\s*\* List \w+ with optional pagination and search\.\s*\n/g,
      `/**
 * List $1 with optional pagination and search.
 * Maintains backward compatibility while adding comprehensive validation.
`
    ).replace(
      /@returns \{Array\|Object\}/g,
      '@returns {Promise<Array|Object>}'
    );
  },

  // Update legacy behavior comments
  updateComments: (content) => {
    return content.replace(
      /\/\/ Legacy behavior - return all \w+/g,
      '// Legacy behavior - return all $1 as array'
    ).replace(
      /\/\/ Paginated response$/gm,
      '// Paginated response with validation'
    );
  }
};

// Controller layer improvements
const CONTROLLER_IMPROVEMENTS = {
  addValidation: (content) => {
    const validationCode = `  try {
    // Validate query parameters early
    if (req.query.page && isNaN(parseInt(req.query.page))) {
      return res.status(400).json({ error: 'Page must be a number' });
    }
    if (req.query.limit && isNaN(parseInt(req.query.limit))) {
      return res.status(400).json({ error: 'Limit must be a number' });
    }
    if (req.query.search && typeof req.query.search === 'string' && req.query.search.length > 100) {
      return res.status(400).json({ error: 'Search term too long (max 100 characters)' });
    }

    // Call service with all query parameters
    const result = await`;

    return content.replace(
      /try \{\s*\n\s*res\.json\(await/g,
      validationCode
    );
  },

  addCaching: (content) => {
    const cachingCode = `
    
    // Set appropriate cache headers based on response type
    if (Array.isArray(result)) {
      // Legacy array response - shorter cache for dynamic data
      res.set('Cache-Control', 'private, max-age=60');
    } else {
      // Paginated response - can cache longer due to pagination metadata
      res.set('Cache-Control', 'private, max-age=300');
    }

    res.json(result);`;

    return content.replace(
      /res\.json\(await [^)]+\)\);/g,
      'result);' + cachingCode
    );
  }
};

function updateModule(moduleName) {
  const servicePath = `api/src/modules/${moduleName}/${moduleName}.service.js`;
  const controllerPath = `api/src/modules/${moduleName}/${moduleName}.controller.js`;

  console.log(`Updating ${moduleName} module...`);

  // Update service file
  if (fs.existsSync(servicePath)) {
    let serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    // Apply service improvements
    serviceContent = SERVICE_IMPROVEMENTS.addValidation(serviceContent);
    serviceContent = SERVICE_IMPROVEMENTS.enhanceDocumentation(serviceContent);
    serviceContent = SERVICE_IMPROVEMENTS.updateComments(serviceContent);
    
    fs.writeFileSync(servicePath, serviceContent);
    console.log(`  ✅ Updated ${servicePath}`);
  }

  // Update controller file
  if (fs.existsSync(controllerPath)) {
    let controllerContent = fs.readFileSync(controllerPath, 'utf8');
    
    // Apply controller improvements
    controllerContent = CONTROLLER_IMPROVEMENTS.addValidation(controllerContent);
    controllerContent = CONTROLLER_IMPROVEMENTS.addCaching(controllerContent);
    
    fs.writeFileSync(controllerPath, controllerContent);
    console.log(`  ✅ Updated ${controllerPath}`);
  }
}

// Apply improvements to all remaining modules
console.log('Applying pagination improvements to remaining modules...\n');

MODULES_TO_UPDATE.forEach(updateModule);

console.log('\n✅ All pagination improvements applied successfully!');
console.log('\nModules updated:');
MODULES_TO_UPDATE.forEach(module => console.log(`  - ${module}`));

console.log('\nNext steps:');
console.log('1. Run diagnostics to verify no errors');
console.log('2. Test pagination endpoints');
console.log('3. Monitor performance improvements');