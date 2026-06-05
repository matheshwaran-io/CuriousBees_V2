const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏁 Starting CuriousBees database setup...');

// Resolve monorepo root directory
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from root .env
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from: ${envPath}`);
  require('dotenv').config({ path: envPath });
} else {
  console.warn('⚠️ No .env file found at root. Proceeding with system environment variables.');
}

const execOptions = {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
  }
};

try {
  console.log('\n📦 1. Generating Prisma client...');
  execSync('npx prisma generate --schema=apps/api/prisma/schema.prisma', execOptions);

  console.log('\n🗄️ 2. Pushing database schema (db push)...');
  execSync('npx prisma db push --schema=apps/api/prisma/schema.prisma --accept-data-loss', execOptions);

  console.log('\n🌱 3. Seeding database...');
  execSync('npm run db:seed', execOptions);

  console.log('\n✅ Database setup completed successfully!');
} catch (error) {
  console.error('\n❌ Database setup failed:', error.message);
  process.exit(1);
}
