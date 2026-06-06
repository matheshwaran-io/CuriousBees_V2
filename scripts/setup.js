const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏁 Starting CuriousBees V2 Development Environment Setup...\n');

const rootDir = path.resolve(__dirname, '..');

const execOptions = {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
  }
};

try {
  // 1. Prisma Client Generation
  console.log('📦 [1/3] Generating Prisma database client...');
  execSync('npx prisma generate --schema=apps/api/prisma/schema.prisma', execOptions);

  // 2. Build Shared Packages
  console.log('\n🏗️ [2/3] Building all monorepo shared packages...');
  execSync('npx tsc -b packages/types packages/shared-utils packages/constants', execOptions);

  // 3. Run Typecheck Checks
  console.log('\n🔬 [3/3] Running TypeScript compiler checks (typecheck)...');
  execSync('npm run typecheck', execOptions);

  console.log('\n✅ Setup completed successfully! All code is validated and ready.');
  console.log('💡 To start the development services, run: npm run dev');
} catch (error) {
  console.error('\n❌ Setup failed during code execution:', error.message);
  process.exit(1);
}
