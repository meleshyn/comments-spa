import type { Config } from 'drizzle-kit';
import { envSchema } from './src/config/env.schema';

// Parse environment with the schema
const env = envSchema.parse(process.env);

export default {
  schema: './src/db/schema.ts',
  out: './migrations',
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
