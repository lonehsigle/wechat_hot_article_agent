import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.pg';
import { getDatabaseUrl } from './database-url';


let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
    });
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return pool;
}

function getDb(): ReturnType<typeof drizzle> {
  if (!db) {
    const p = getPool();
    db = drizzle(p, { schema });
  }
  return db!;
}

// For compatibility with existing code that uses getSqlite()
function getSqlite() {
  return {
    exec: async (sql: string) => {
      const client = await getPool().connect();
      try {
        await client.query(sql);
      } finally {
        client.release();
      }
    }
  };
}

// For backward compatibility - tables are created via drizzle migrations
function initDatabase() {
  // PostgreSQL tables are created via drizzle-kit push
}

export { getDb as db, getPool, getSqlite, initDatabase };
export * from './schema.pg';
