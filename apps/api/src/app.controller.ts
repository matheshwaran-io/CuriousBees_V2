import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import Redis from 'ioredis';

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
      docs: '/api',
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
      const redis = new Redis({
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
}
