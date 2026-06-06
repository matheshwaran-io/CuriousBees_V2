# CuriousBees V2 — Updated GitIgnore Recommendation

This document presents an optimized `.gitignore` template for the CuriousBees V2 monorepo. It ensures that credentials, build caches, package locks of alternative managers, OS files, and developer IDE assets are prevented from being committed.

---

## 🛠️ Recommended `.gitignore` File

```gitignore
# ==========================================
# CURIOUSBEES V2 — STANDARDIZED .GITIGNORE
# ==========================================

# 📦 1. Dependency Resolution Cache
node_modules/
.pnp
.pnp.js
*.tsbuildinfo

# 🚀 2. Next.js Build Output
.next/
out/
build/
apps/web/tsconfig.tsbuildinfo

# 📡 3. NestJS API Compile Target
dist/
apps/api/dist/
apps/api/tsconfig.tsbuildinfo
.nest-cli.json

# 🗄️ 4. Prisma Database Client Artifacts
.prisma/
# Note: Keep schema.prisma and seed.ts versioned, but ignore binary models
*.db
*.db-journal

# ⚡ 5. Supabase Local Configuration Cache
supabase/.temp/

# 🔐 6. Environment Configurations & Secrets
# Ignore all actual key-value files
.env
.env.local
.env.development
.env.production
.env.test
.env.development.local
.env.production.local
.env.test.local
.env.*.local

# Do NOT ignore the example config templates
!.env.example
!apps/web/.env.example
!apps/api/.env.example

# 📑 7. Diagnostic Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# 🔬 8. Testing Outputs
coverage/
.nyc_output/
.jest/

# 💻 9. IDE & Code Editor Files
.vscode/*
!.vscode/extensions.json
!.vscode/launch.json
!.vscode/settings.json
!.vscode/tasks.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.classpath
.project
.settings/

# 🌐 10. Platform Hosting Outputs
.vercel/

# 🍎 11. Operating System Metadata
.DS_Store
.DS_Store?
._*
Thumbs.db
ehthumbs.db

# 🤖 12. Local AI Sandbox / IDE Agent Tools
.gemini/
.agents/
!packages/
```
