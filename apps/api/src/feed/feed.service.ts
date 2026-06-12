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
    // Basic logic: most used tags in recent threads
    const recentThreads = await this.prisma.thread.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      select: { tags: true, _count: { select: { comments: true, likes: true } } }
    });

    const tagCounts: Record<string, number> = {};
    for (const thread of recentThreads) {
      const weight = 1 + thread._count.likes + (thread._count.comments * 2);
      for (const tag of thread.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + weight;
      }
    }

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    return sortedTags.length > 0 ? sortedTags : ['Neuroscience', 'AI', 'QuantumComputing', 'Biotech'];
  }
}
