# Frontend Deployment (Vercel)

The Next.js frontend (`apps/web`) is optimized for deployment on Vercel.

## Pre-requisites
1. A Vercel account.
2. The Vercel CLI installed (`npm i -g vercel`), or GitHub Integration.

## Environment Variables
In the Vercel Dashboard, ensure the following are set for `apps/web`:
- `NEXT_PUBLIC_API_URL` (URL of your deployed backend)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## Deployment Steps
1. Navigate to the project root.
2. Run `vercel`.
3. Link the project to your Vercel account.
4. When prompted for the "Root Directory", you can either leave it as the monorepo root and configure the build command, or set it to `apps/web`.
5. Vercel automatically detects Next.js workspaces and configures the build settings appropriately.
6. For production: `vercel --prod`.
