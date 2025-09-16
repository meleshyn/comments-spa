import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { envSchema } from './src/config/env.schema';

// Load environment variables for Drizzle CLI
dotenv.config({ path: ['.env.local', '.env'] });

// Parse environment with the schema
const env = envSchema.parse(process.env);

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.NODE_ENV !== 'development',
  },
  verbose: true,
  strict: true,
} satisfies Config;
