import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Dynamically locate root .env in monorepo parent folders
let envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  envPath = path.join(process.cwd(), '..', '.env');
}
if (!fs.existsSync(envPath)) {
  envPath = path.join(process.cwd(), '../..', '.env');
}
dotenv.config({ path: envPath });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { IncomingMessage, ServerResponse } from 'http';

// ─── Shared app bootstrap ────────────────────────────────────────────────────

async function createApp(expressInstance?: express.Express) {
  const app = expressInstance
    ? await NestFactory.create(AppModule, new ExpressAdapter(expressInstance))
    : await NestFactory.create(AppModule);

  // Keep API resources under /api while allowing a lightweight root message.
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: 'api', method: RequestMethod.GET },
    ],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS — supports local dev + all Vercel preview/production deployments
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://srm-recollab.vercel.app',
    'https://recollab.vercel.app',
    ...(process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : []),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  return app;
}

// ─── Local dev: start HTTP server ────────────────────────────────────────────

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 ReCollab API running on: http://localhost:${port}`);
}

// ─── Vercel serverless: export a request handler ─────────────────────────────
// Vercel calls the default export with (req, res) — it does NOT bind a TCP port.

let serverHandler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!serverHandler) {
    console.log('[ReCollab] Cold start — initialising NestJS...');
    const expressApp = express();
    const nestApp = await createApp(expressApp);
    await nestApp.init(); // init WITHOUT listen
    serverHandler = expressApp;
    console.log('[ReCollab] NestJS ready.');
  }
  serverHandler(req, res);
}

// ─── Entry point ─────────────────────────────────────────────────────────────
// In Vercel, the file is imported and `handler` is used.
// In local dev / production node process, bootstrap() is called directly.

if (process.env.VERCEL !== '1') {
  bootstrap();
}
