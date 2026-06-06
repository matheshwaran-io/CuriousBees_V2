import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import Redis from 'ioredis';
import * as os from 'os';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(['', 'api'])
  healthCheck() {
    return {
      message: 'Welcome to CuriousBees API',
      status: 'ok',
      service: 'CuriousBees API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      docs: '/api/docs',
    };
  }

  @Get(['health', 'api/health'])
  async health() {
    let databaseConnected = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;
    } catch (err: any) {
      // Database offline
    }

    let redisConnected = false;
    try {
      const redis = process.env.REDIS_URL
        ? new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            connectTimeout: 2000,
          })
        : new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            maxRetriesPerRequest: 1,
            connectTimeout: 2000,
          });
      const res = await redis.ping();
      if (res === 'PONG') {
        redisConnected = true;
      }
      redis.disconnect();
    } catch (err: any) {
      // Redis offline
    }

    const isHealthy = databaseConnected && redisConnected;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      api: true,
      database: databaseConnected,
      redis: redisConnected,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get(['system', 'api/system'])
  async system() {
    const memory = process.memoryUsage();
    return {
      status: 'ok',
      os: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        cpus: os.cpus().length,
      },
      process: {
        uptime: process.uptime(),
        memoryUsage: {
          rss: `${Math.round((memory.rss / 1024 / 1024) * 100) / 100} MB`,
          heapTotal: `${Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100} MB`,
          heapUsed: `${Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100} MB`,
          external: `${Math.round((memory.external / 1024 / 1024) * 100) / 100} MB`,
        },
        pid: process.pid,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get(['version', 'api/version'])
  version() {
    return {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };
  }
}
