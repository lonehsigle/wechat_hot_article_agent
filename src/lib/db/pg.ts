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

export { getDb as db, getPool };
export * from './schema.pg';
