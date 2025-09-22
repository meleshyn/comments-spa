import { z } from 'zod';

// Define the environment schema
export const envSchema = z.object({
  // Google Cloud Storage configuration
  GCS_PROJECT_ID: z.string().min(1),
  GCS_KEY_FILE: z.string().min(1),
  GCS_BUCKET_NAME: z.string().min(1),

  // Frontend configuration
  FRONTEND_URL: z.string().url(),

  // Database configuration
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  // Application configuration
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // reCAPTCHA configuration
  RECAPTCHA_SECRET_KEY: z.string().min(1),
});

// Type inference from the schema
export type Env = z.infer<typeof envSchema>;

// Validation function for use with NestJS ConfigModule
export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
