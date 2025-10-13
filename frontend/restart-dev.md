# Development Server Restart Instructions

If you're experiencing import/export issues, try the following steps:

1. **Stop the development server** (Ctrl+C)
2. **Clear the cache**:
   ```bash
   rm -rf node_modules/.vite
   rm -rf dist
   ```
3. **Restart the development server**:
   ```bash
   npm run dev
   ```

## Alternative Solutions

If the issue persists:

1. **Clear all caches**:
   ```bash
   npm run build
   rm -rf node_modules/.vite
   rm -rf dist
   npm run dev
   ```

2. **Check TypeScript compilation**:
   ```bash
   npx tsc --noEmit
   ```

3. **Verify all dependencies are installed**:
   ```bash
   npm install
   ```

The import/export issues have been resolved by:
- ✅ Using `import type` syntax for type-only imports
- ✅ Ensuring all exports are properly defined in kanban.ts
- ✅ Fixing circular import issues
- ✅ Using consistent import patterns across all files

All Kanban components should now work correctly!