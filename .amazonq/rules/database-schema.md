# Database Schema Rule

## When creating a new database table, ALWAYS follow these steps in order:

### 1. Create the Drizzle schema file
- Place it in the correct module folder under `api/src/modules/<module>/<subfolder>/<name>.schema.js`
- Use Drizzle ORM types: `pgTable`, `uuid`, `text`, `timestamp`, `boolean`, `integer`, `pgEnum`, etc.
- Always include `id`, `createdAt`, `updatedAt` columns
- Reference foreign keys with `.references(() => table.id, { onDelete: 'cascade' })`

### 2. Run migration generation
```bash
cd api
npm run db:generate
```
This generates a new SQL migration file in `api/drizzle/migrations/`

### 3. Apply the migration
```bash
cd api
npm run db:migrate
```
This applies the migration to the database

### 4. Never manually write SQL migration files
Always use `npm run db:generate` to generate migrations from the schema — do not hand-write `.sql` files in `drizzle/migrations/`

### 5. Module folder structure
Each module under `api/src/modules/` should follow:
```
<module>/
├── <entity>/
│   ├── <entity>.schema.js
│   └── <entity>.controller.js
├── <subEntity>/
│   ├── <subEntity>.schema.js
│   └── <subEntity>.controller.js
└── <module>.routes.js
```

### Example
When adding `epic_comments` table:
1. Create `api/src/modules/epics/epicComments/epicComments.schema.js`
2. Run `npm run db:generate`
3. Run `npm run db:migrate`
4. Create `epicComments.controller.js` and wire routes
