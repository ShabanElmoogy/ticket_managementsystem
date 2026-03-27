import 'dotenv/config';
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
});

async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log("Connected Successfully:", result);
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

testConnection();
