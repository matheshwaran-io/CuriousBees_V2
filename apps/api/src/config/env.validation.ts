import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEVELOPMENT_MODE: z.preprocess((val) => {
    if (typeof val === 'string') return val.trim();
    return val;
  }, z.enum(['true', 'false']).default('false')),
  PORT: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10);
    return val;
  }, z.number().int().default(4000)),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection URL'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid connection URL'),
  REDIS_HOST: z.string().min(1, 'REDIS_HOST is required'),
  REDIS_PORT: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10);
    return val;
  }, z.number().int().default(6379)),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  ALLOWED_ORIGINS: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
}).refine((data) => {
  if (data.DEVELOPMENT_MODE === 'false') {
    return !!data.FIREBASE_PROJECT_ID && !!data.FIREBASE_CLIENT_EMAIL && !!data.FIREBASE_PRIVATE_KEY;
  }
  return true;
}, {
  message: 'Firebase Admin SDK credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are required when DEVELOPMENT_MODE is false',
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    console.error('❌ Invalid environment variables detected on startup:');
    result.error.errors.forEach((err) => {
      console.error(`  - [${err.path.join('.') || 'Global'}]: ${err.message}`);
    });
    process.exit(1);
  }
  return result.data;
}
