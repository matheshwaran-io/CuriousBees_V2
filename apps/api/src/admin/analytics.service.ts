import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getAnalytics(range: string = '30D') {
    let days = 30;
    if (range === '7D') days = 7;
    else if (range === '30D') days = 30;
    else if (range === '6M') days = 180;
    else if (range === '1Y') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalUsers,
      totalScholars,
      totalSupervisors,
      totalAdmins,
      totalPosts,
      totalPublications,
      totalWorkspaces,
      totalReports,
      departments,
      usersByDate,
      postsByDate,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'RESEARCH_SCHOLAR' } }),
      this.prisma.user.count({ where: { role: 'RESEARCH_SUPERVISOR' } }),
      this.prisma.user.count({ where: { role: 'INSTITUTE_ADMIN' } }),
      this.prisma.thread.count(),
      this.prisma.publication.count(),
      this.prisma.workspace.count(),
      this.prisma.moderationReport.count(),
      this.prisma.department.findMany({
        select: {
          name: true,
          code: true,
          _count: {
            select: { users: true, supervisorProfiles: true, scholarProfiles: true },
          },
        },
      }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, role: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.thread.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Build timeline buckets
    const timelineMap: Record<string, { date: string; users: number; posts: number }> = {};
    for (let i = 0; i <= Math.min(days, 30); i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      timelineMap[key] = { date: key, users: 0, posts: 0 };
    }

    usersByDate.forEach((u) => {
      const key = u.createdAt.toISOString().split('T')[0];
      if (timelineMap[key]) timelineMap[key].users++;
    });

    postsByDate.forEach((p) => {
      const key = p.createdAt.toISOString().split('T')[0];
      if (timelineMap[key]) timelineMap[key].posts++;
    });

    const userActivityTimeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: {
        totalUsers,
        totalScholars,
        totalSupervisors,
        totalAdmins,
        totalPosts,
        totalPublications,
        totalWorkspaces,
        totalReports,
      },
      distribution: {
        scholars: totalScholars,
        supervisors: totalSupervisors,
        admins: totalAdmins,
      },
      departmentActivity: departments.map((d) => ({
        name: d.name,
        code: d.code,
        userCount: d._count.users,
        supervisorCount: d._count.supervisorProfiles,
        scholarCount: d._count.scholarProfiles,
      })),
      timeline: userActivityTimeline,
      range,
    };
  }
}
