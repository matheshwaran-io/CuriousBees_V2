const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🩺 Running CuriousBees V2 Doctor Diagnostics...\n');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

// Helper for colored logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const reportSuccess = (msg) => console.log(`  ${colors.green}✅ ${msg}${colors.reset}`);
const reportWarning = (msg) => console.log(`  ${colors.yellow}⚠️  ${msg}${colors.reset}`);
const reportError = (msg) => console.log(`  ${colors.red}❌ ${msg}${colors.reset}`);

let overallHealthy = true;

// 1. Check Node.js and npm versions
console.log(`${colors.bold}1. Runtime Engine Verification:${colors.reset}`);
const nodeVer = process.version;
if (nodeVer.startsWith('v22') || nodeVer.startsWith('v20') || nodeVer.startsWith('v24')) {
  reportSuccess(`Node.js version matches specifications: ${nodeVer}`);
} else {
  reportWarning(`Recommended Node version is >=v22 (current: ${nodeVer})`);
}

// 2. Check Environment Config File
console.log(`\n${colors.bold}2. Environment Variable Configuration:${colors.reset}`);
if (!fs.existsSync(envPath)) {
  reportError('Root .env file is missing!');
  console.log(`     -> Solution: Run 'cp .env.example .env' and add configuration values.`);
  process.exit(1);
}
reportSuccess('Root .env file is present.');

// Load env variables
require('dotenv').config({ path: envPath });

// Validate 4 critical env variables
const validateUrl = (key, isOptional = false) => {
  const value = process.env[key];
  if (!value) {
    if (isOptional) {
      reportWarning(`${key} is missing (Optional)`);
      return false;
    } else {
      reportError(`${key} is missing in root .env!`);
      overallHealthy = false;
      return false;
    }
  }

  try {
    new URL(value);
    reportSuccess(`${key} format is valid.`);
    return true;
  } catch (err) {
    if (isOptional) {
      reportWarning(`${key} value "${value}" is not a valid URL (Optional)`);
    } else {
      reportError(`${key} value "${value}" is not a valid URL!`);
      overallHealthy = false;
    }
    return false;
  }
};

const hasDb = validateUrl('DATABASE_URL');
const hasDirect = validateUrl('DIRECT_URL');
const hasPublicApi = validateUrl('NEXT_PUBLIC_API_URL');
const hasRedisUrl = validateUrl('REDIS_URL', true);

// 3. Check Database Connections
console.log(`\n${colors.bold}3. Database Connection Testing:${colors.reset}`);

if (hasDb) {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL }
      }
    });

    console.log('   Pinging PostgreSQL Database via Prisma Client...');
    execSync('npx prisma db execute --schema=apps/api/prisma/schema.prisma --stdin', {
      input: 'SELECT 1;',
      stdio: 'ignore',
      cwd: rootDir,
    });
    reportSuccess('PostgreSQL connection ping succeeded! DB is active.');
  } catch (err) {
    reportError(`PostgreSQL connection failed: ${err.message}`);
    const dbUrl = process.env.DATABASE_URL || '';
    const isLocalDb = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    if (isLocalDb) {
      console.log('     -> Solution: Ensure your local PostgreSQL Docker container is running by executing: npm run docker:up');
    } else {
      console.log('     -> Solution: Ensure your internet connection is active, and verify that your cloud database (Supabase) credentials in the root .env are correct.');
    }
    overallHealthy = false;
  }
} else {
  reportError('PostgreSQL test skipped due to missing DATABASE_URL config.');
  overallHealthy = false;
}

// 4. Check Redis Connection (Optional)
console.log(`\n${colors.bold}4. Redis Caching Connection Testing (Optional):${colors.reset}`);
const redisTarget = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);

if (redisTarget) {
  try {
    const Redis = require('ioredis');
    const redis = new Redis(redisTarget, {
      maxRetriesPerRequest: 0,
      connectTimeout: 2000
    });
    
    console.log(`   Pinging Redis at ${redisTarget}...`);
    
    // Promise-based timeout handle
    const pingRedis = () => new Promise(async (resolve, reject) => {
      try {
        const res = await redis.ping();
        resolve(res);
      } catch (err) {
        reject(err);
      } finally {
        redis.disconnect();
      }
    });

    pingRedis()
      .then(() => {
        reportSuccess('Redis connection succeeded! Queue provider is active.');
      })
      .catch((err) => {
        reportWarning(`Redis connection failed: ${err.message}`);
        const isLocalRedis = redisTarget.includes('localhost') || redisTarget.includes('127.0.0.1');
        if (isLocalRedis) {
          console.log('     -> Solution: If running locally, ensure your Redis Docker container is active by running: npm run docker:up');
        } else {
          console.log('     -> Solution: Verify that your remote Redis credentials (e.g. Upstash) in the root .env are correct.');
        }
        console.log('     -> Note: The application will run fine in DEVELOPMENT_MODE, but background jobs (queues) will not execute.');
      });
  } catch (err) {
    reportWarning(`Could not verify Redis client: ${err.message}`);
  }
} else {
  reportWarning('Redis environment configuration is completely missing (skipped test).');
}

// Wait for Redis async check to settle briefly before printing summary
setTimeout(() => {
  console.log(`\n==================================================`);
  if (overallHealthy) {
    console.log(` ${colors.green}${colors.bold}🩺 DOCTOR DIAGNOSTIC STATUS: HEALTHY${colors.reset}`);
    console.log(' Your monorepo is fully configured and ready for production staging.');
  } else {
    console.log(` ${colors.red}${colors.bold}🩺 DOCTOR DIAGNOSTIC STATUS: DEGRADED / ISSUES FOUND${colors.reset}`);
    console.log(' Please fix the error blocks logged above before starting development.');
  }
  console.log(`==================================================\n`);
  process.exit(overallHealthy ? 0 : 1);
}, 2500);
