import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async searchFeed(query: string) {
    if (!query || query.trim() === '') {
      return { threads: [], publications: [], users: [] };
    }

    const term = query.trim();
    
    const threads = await this.prisma.thread.findMany({
      where: {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { content: { contains: term, mode: 'insensitive' } },
          { tags: { has: term } }
        ]
      },
      include: {
        author: {
          select: { id: true, name: true, image: true, role: true, department: true }
        },
        _count: { select: { comments: true, likes: true, shares: true, saves: true } }
      },
      take: 10
    });

    const publications = await this.prisma.publication.findMany({
      where: {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { authors: { contains: term, mode: 'insensitive' } }
        ]
      },
      take: 10
    });

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { department: { contains: term, mode: 'insensitive' } },
          { bio: { contains: term, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, image: true, role: true, department: true },
      take: 10
    });

    return { threads, publications, users };
  }

  async getSuggestedPeers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { interests: { include: { interest: true } } }
    });

    if (!user) return [];

    const userInterests = user.interests.map(i => i.interest.name);

    // Basic logic: same department or shared interests, not self
    const peers = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        status: 'ACTIVE',
        OR: [
          { department: user.department },
          {
            interests: {
              some: {
                interest: { name: { in: userInterests } }
              }
            }
          }
        ]
      },
      select: { id: true, name: true, image: true, role: true, department: true },
      take: 5
    });

    return peers;
  }

  async getTrendingResearch() {
    // 1. Fetch tags & activity metrics from database threads
    const threads = await this.prisma.thread.findMany({
      select: { tags: true, _count: { select: { comments: true, likes: true, shares: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // 2. Fetch active institutional research interests and scholar/supervisor counts
    const interests = await this.prisma.researchInterest.findMany({
      include: {
        _count: { select: { users: true } }
      }
    });

    const tagCounts: Record<string, { display: string; count: number }> = {};

    // Add weights from DB posts
    for (const thread of threads) {
      const weight = 1 + thread._count.likes + (thread._count.comments * 2) + (thread._count.shares * 3);
      for (const tag of thread.tags) {
        if (tag && tag.trim()) {
          const key = tag.trim().toLowerCase();
          if (!tagCounts[key]) {
            tagCounts[key] = { display: tag.trim(), count: 0 };
          }
          tagCounts[key].count += weight;
        }
      }
    }

    // Add weights from DB scholar & supervisor interest counts
    for (const interest of interests) {
      if (interest.name) {
        const key = interest.name.trim().toLowerCase();
        const userWeight = Math.max(1, interest._count.users) * 3;
        if (!tagCounts[key]) {
          tagCounts[key] = { display: interest.name.trim(), count: 0 };
        }
        tagCounts[key].count += userWeight;
      }
    }

    // Dynamic fallbacks if DB is completely fresh
    if (Object.keys(tagCounts).length === 0) {
      const defaults = [
        { key: 'artificial intelligence', display: 'Artificial Intelligence', count: 18 },
        { key: 'deep learning', display: 'Deep Learning', count: 14 },
        { key: 'knowledge graphs', display: 'Knowledge Graphs', count: 11 },
        { key: 'quantum computing', display: 'Quantum Computing', count: 8 },
        { key: 'bioinformatics', display: 'Bioinformatics', count: 6 },
      ];
      for (const item of defaults) {
        tagCounts[item.key] = { display: item.display, count: item.count };
      }
    }

    const sortedTags = Object.values(tagCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(item => ({
        tag: item.display,
        count: Math.floor(item.count)
      }));

    return sortedTags;
  }
}
