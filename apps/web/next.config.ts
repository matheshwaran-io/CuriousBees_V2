import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load root .env file absolutely
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
  NEXT_PUBLIC_DEVELOPMENT_MODE: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_AUTH_MODE: z.literal('clerk', {
    errorMap: () => ({ message: 'NEXT_PUBLIC_AUTH_MODE must be set to "clerk"' }),
  }),
  NEXT_PUBLIC_DEV_ROLE: z.enum(['SCHOLAR', 'SUPERVISOR', 'INSTITUTE_ADMIN']).default('SCHOLAR'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_URL is required'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
});

// Run validation at config load time (startup/build)
const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error('\n❌ Frontend environment validation failed:');
  result.error.errors.forEach((err) => {
    console.error(`  - [${err.path.join('.') || 'Global'}]: ${err.message}`);
  });
  console.error('');
  process.exit(1);
}

const nextConfig = {
  env: {},
  transpilePackages: ['@curiousbees/ui', '@curiousbees/constants'],
};

export default nextConfig;