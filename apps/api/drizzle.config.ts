import type { Config } from 'drizzle-kit';
import { envSchema } from './src/config/env.schema';

// Parse environment with the schema
const env = envSchema.parse(process.env);

export default {
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
