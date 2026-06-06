import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEVELOPMENT_MODE: z.preprocess((val) => {
    if (typeof val === 'string') return val.trim();
    return val;
  }, z.enum(['true', 'false']).default('false')),
  AUTH_MODE: z.literal('clerk', {
    errorMap: () => ({ message: 'AUTH_MODE must be set to "clerk"' }),
  }),
  DEV_ROLE: z.enum(['RESEARCH_SCHOLAR', 'RESEARCH_SUPERVISOR', 'INSTITUTION_ADMIN']).default('RESEARCH_SCHOLAR'),
  PORT: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10);
    return val;
  }, z.number().int().default(4000)),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection URL'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid connection URL'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection URL').optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10);
    return val;
  }, z.number().int().optional()),
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  ALLOWED_ORIGINS: z.string().optional(),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
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
