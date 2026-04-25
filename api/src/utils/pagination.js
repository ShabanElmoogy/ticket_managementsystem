/**
 * pagination.js
 * Shared pagination utilities for consistent pagination across all list endpoints.
 */

import { sql } from 'drizzle-orm';

// ── Constants ──────────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ── Pagination helpers ────────────────────────────────────────────────────────

/**
 * Parse and validate pagination parameters from query string with comprehensive error handling.
 * @param {Object} query - Express req.query object
 * @returns {Object} { page, limit, offset }
 * @throws {Error} When parameters are invalid
 */
export function parsePaginationParams(query) {
  // Parse with defaults
  let page = parseInt(query.page || '1', 10);
  let limit = parseInt(query.limit || String(DEFAULT_PAGE_SIZE), 10);

  // Validate page
  if (!Number.isInteger(page) || page < 1) {
    throw Object.assign(new Error('Page must be a positive integer'), { status: 400 });
  }

  // Validate and constrain limit
  if (!Number.isInteger(limit) || limit < 1) {
    throw Object.assign(new Error('Limit must be a positive integer'), { status: 400 });
  }
  
  limit = Math.min(limit, MAX_PAGE_SIZE);  // Enforce maximum
  
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build comprehensive paginated response with navigation metadata.
 * @param {Array} data - The actual data items
 * @param {number} total - Total count of items (before pagination)
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Structured paginated response
 */
export function buildPaginatedResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
      // Additional metadata for client convenience
      startIndex: (page - 1) * limit + 1,
      endIndex: Math.min(page * limit, total),
    },
  };
}

/**
 * Execute a paginated query with count.
 * This is a helper for the common pattern of running a count query + data query.
 * 
 * @param {Object} db - Drizzle database instance
 * @param {Object} baseQuery - Base query builder (without limit/offset)
 * @param {Object} countQuery - Count query builder
 * @param {number} limit - Items per page
 * @param {number} offset - Items to skip
 * @param {number} page - Current page number
 * @returns {Object} Paginated response
 */
export async function executePaginatedQuery(db, baseQuery, countQuery, limit, offset, page) {
  // Execute count and data queries in parallel
  const [dataRows, countRows] = await Promise.all([
    baseQuery.limit(limit).offset(offset),
    countQuery,
  ]);

  // Extract total count (Drizzle count() returns [{ count: "123" }])
  const total = Number(countRows[0]?.count ?? 0);

  return buildPaginatedResponse(dataRows, total, page, limit);
}

/**
 * Add search functionality to a query.
 * @param {Object} query - Drizzle query builder
 * @param {string} searchTerm - Search term from query params
 * @param {Array} searchColumns - Array of column references to search in
 * @returns {Object} Modified query with search conditions
 */
export function addSearchToQuery(query, searchTerm, searchColumns) {
  if (!searchTerm || !searchColumns.length) return query;

  // Create ILIKE conditions for each search column
  const searchConditions = searchColumns.map(column => 
    sql`${column} ILIKE ${`%${searchTerm}%`}`
  );

  // Combine with OR
  const searchCondition = searchConditions.reduce((acc, condition, index) => {
    if (index === 0) return condition;
    return sql`${acc} OR ${condition}`;
  });

  return query.where(searchCondition);
}

/**
 * Parse and sanitize search parameter with validation.
 * @param {Object} query - Express req.query object
 * @returns {string|null} Cleaned search term or null
 * @throws {Error} When search term is too long
 */
export function parseSearchParam(query) {
  const search = query.search || query.q;
  if (!search || typeof search !== 'string') return null;
  
  const cleaned = search.trim();
  if (cleaned.length === 0) return null;
  if (cleaned.length > 100) {  // Prevent extremely long search terms
    throw Object.assign(new Error('Search term too long (max 100 characters)'), { status: 400 });
  }
  
  return cleaned;
}

/**
 * Middleware to add pagination helpers to request object.
 * Usage: app.use(paginationMiddleware);
 */
export function paginationMiddleware(req, res, next) {
  req.pagination = parsePaginationParams(req.query);
  req.search = parseSearchParam(req.query);
  next();
}

// ── Validation ─────────────────────────────────────────────────────────────────

/**
 * Validate pagination parameters and throw descriptive errors.
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 */
export function validatePaginationParams(page, limit) {
  if (!Number.isInteger(page) || page < 1) {
    throw Object.assign(new Error('Page must be a positive integer'), { status: 400 });
  }
  
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw Object.assign(
      new Error(`Limit must be between 1 and ${MAX_PAGE_SIZE}`), 
      { status: 400 }
    );
  }
}

// ── Sorting support ───────────────────────────────────────────────────────────

/**
 * Parse and validate sorting parameters from query string.
 * @param {Object} query - Express req.query object
 * @param {Array} allowedFields - Array of allowed sort field names
 * @returns {Object} { sort, order }
 * @throws {Error} When sort field is not allowed
 */
export function parseSortParams(query, allowedFields = []) {
  const sort = query.sort || (allowedFields.includes('createdAt') ? 'createdAt' : allowedFields[0]);
  const order = query.order === 'asc' ? 'asc' : 'desc';
  
  if (allowedFields.length > 0 && !allowedFields.includes(sort)) {
    throw Object.assign(
      new Error(`Invalid sort field. Allowed: ${allowedFields.join(', ')}`), 
      { status: 400 }
    );
  }
  
  return { sort, order };
}

// ── Legacy support ─────────────────────────────────────────────────────────────

/**
 * Wrap existing service methods to add pagination support while maintaining backward compatibility.
 * @param {Function} originalMethod - The original service method
 * @param {Function} countMethod - Method to get total count
 * @returns {Function} Paginated version of the method
 */
export function addPaginationToMethod(originalMethod, countMethod) {
  return async function paginatedMethod(...args) {
    // Check if last argument contains pagination params
    const lastArg = args[args.length - 1];
    const hasPagination = lastArg && typeof lastArg === 'object' && 
                         ('page' in lastArg || 'limit' in lastArg || 'offset' in lastArg);

    if (!hasPagination) {
      // No pagination requested - return original behavior
      return originalMethod.apply(this, args);
    }

    // Extract pagination params and remove from args
    const paginationParams = args.pop();
    const { page, limit, offset } = paginationParams;

    // Get total count and paginated data
    const [data, total] = await Promise.all([
      originalMethod.apply(this, [...args, { limit, offset }]),
      countMethod.apply(this, args),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  };
}