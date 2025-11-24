import postgres from 'postgres';
import 'dotenv/config';

const client = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function runMigration() {
    try {
        console.log('Starting migration...');

        // Step 1: Convert blocks column from text to json
        await client`
      ALTER TABLE "docs" ALTER COLUMN "blocks" SET DATA TYPE json USING 
        CASE 
          WHEN "blocks" IS NULL OR "blocks" = '' THEN '[]'::json
          ELSE "blocks"::json
        END
    `;
        console.log('✓ Converted blocks column to json type');

        // Step 2: Set default value
        await client`
      ALTER TABLE "docs" ALTER COLUMN "blocks" SET DEFAULT '[]'::json
    `;
        console.log('✓ Set default value for blocks column');

        // Step 3: Set NOT NULL constraint
        await client`
      ALTER TABLE "docs" ALTER COLUMN "blocks" SET NOT NULL
    `;
        console.log('✓ Set NOT NULL constraint on blocks column');

        // Step 4: Add due_date column to tasks if it doesn't exist
        const checkColumn = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'due_date'
    `;

        if (checkColumn.length === 0) {
            await client`
        ALTER TABLE "tasks" ADD COLUMN "due_date" timestamp
      `;
            console.log('✓ Added due_date column to tasks table');
        } else {
            console.log('✓ due_date column already exists');
        }

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await client.end();
        process.exit(0);
    }
}

runMigration();
