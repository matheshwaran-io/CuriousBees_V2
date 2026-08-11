import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateThreadInput } from '@curiousbees/types';
import { CreateThreadSchema } from '@curiousbees/shared-utils';

@Injectable()
export class ThreadsService {
  constructor(private prisma: PrismaService) {}

  async getThreads(search?: string, tag?: string, type?: string, userId?: string, sort?: 'latest' | 'top') {
    const threads = await this.prisma.thread.findMany({
      where: {
        ...(tag && {
          tags: {
            has: tag
          }
        }),
        ...(type && type !== 'ALL' && {
          type: type as any
        }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            faculty: true,
            department: true,
            followers: userId ? {
              where: { followerId: userId },
              select: { id: true }
            } : undefined
          }
        },
        attachments: true,
        likes: userId ? {
          where: { userId }
        } : undefined,
        saves: userId ? {
          where: { userId }
        } : undefined,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
                department: true
              }
            }
          }
        },
        _count: {
          select: { comments: true, likes: true, saves: true }
        }
      },
      orderBy: sort === 'top' ? [
        { likes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
        { createdAt: 'desc' }
      ] : {
        createdAt: 'desc'
      }
    });

    // Deterministic feed ranking for V1 (if this is the main feed)
    if (userId && !search && !tag && sort !== 'top') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      threads.sort((a, b) => {
        const aFollowed = (a.author as any).followers?.length > 0;
        const bFollowed = (b.author as any).followers?.length > 0;
        
        // Prioritize recent posts from followed users
        if (aFollowed && a.createdAt > weekAgo && (!bFollowed || b.createdAt <= weekAgo)) return -1;
        if (bFollowed && b.createdAt > weekAgo && (!aFollowed || a.createdAt <= weekAgo)) return 1;
        
        // Otherwise default to createdAt desc
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    return threads;
  }

  async getThreadCounts(search?: string, userId?: string) {
    const whereClause: any = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    } : undefined;

    const counts = await this.prisma.thread.groupBy({
      by: ['type'],
      _count: { _all: true },
      where: whereClause
    });

    const totalCount = await this.prisma.thread.count({
      where: whereClause
    });

    let savedCount = 0;
    if (userId) {
      savedCount = await this.prisma.savedThread.count({
        where: { userId }
      });
    }

    const result: Record<string, number> = { ALL: totalCount, SAVED: savedCount, saved: savedCount };
    counts.forEach(c => {
      result[c.type as string] = (c as any)._count._all;
    });

    return result;
  }

  async getThreadById(id: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            faculty: true,
            department: true,
            bio: true
          }
        },
        attachments: true,
        _count: {
          select: { comments: true, likes: true, saves: true }
        },
        comments: {
          where: { parentId: null },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                faculty: true,
                department: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    faculty: true,
                    department: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!thread) {
      throw new NotFoundException('Research thread not found.');
    }

    return thread;
  }

  async getThreadPublic(id: string) {
    return this.prisma.thread.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            faculty: true,
            department: true,
          }
        },
        attachments: true,
        _count: {
          select: { comments: true, likes: true }
        },
        comments: {
          where: { parentId: null },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
                department: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async createThread(authorId: string, input: CreateThreadInput) {
    const parsed = CreateThreadSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0].message);
    }

    const { title, content, tags, type, isPaper, paperJournal, attachments } = parsed.data;

    return this.prisma.thread.create({
      data: {
        title,
        content,
        tags,
        type: type || 'TEXT',
        isPaper: isPaper || false,
        paperJournal,
        authorId,
        attachments: attachments && attachments.length > 0 ? {
          create: attachments.map(att => ({
            name: att.name,
            url: att.url,
            size: att.size,
            type: att.type
          }))
        } : undefined
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            faculty: true,
            department: true
          }
        },
        attachments: true,
        _count: {
          select: { comments: true, likes: true, saves: true }
        }
      }
    });
  }

  async toggleLike(threadId: string, userId: string) {
    const existing = await this.prisma.threadLike.findUnique({
      where: {
        threadId_userId: { threadId, userId }
      }
    });

    let liked = false;
    if (existing) {
      await this.prisma.threadLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await this.prisma.threadLike.create({
        data: { threadId, userId }
      });
      liked = true;
    }

    const likesCount = await this.prisma.threadLike.count({ where: { threadId } });
    return { liked, likesCount };
  }

  async getLikedThreads(userId: string) {
    const likedRecords = await this.prisma.threadLike.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        thread: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                faculty: true,
                department: true
              }
            },
            attachments: true,
            likes: { where: { userId } },
            saves: { where: { userId } },
            comments: {
              orderBy: { createdAt: 'asc' },
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    role: true,
                    department: true
                  }
                }
              }
            },
            _count: {
              select: { comments: true, likes: true, saves: true }
            }
          }
        }
      }
    });

    return likedRecords.map(r => r.thread);
  }

  async toggleSave(threadId: string, userId: string) {
    const existing = await this.prisma.savedThread.findUnique({
      where: {
        threadId_userId: { threadId, userId }
      }
    });

    if (existing) {
      await this.prisma.savedThread.delete({ where: { id: existing.id } });
      await this.prisma.auditLog.create({
        data: { userId, action: 'Post Unsaved', details: `Unsaved thread ${threadId}` }
      });
      return { saved: false };
    } else {
      await this.prisma.savedThread.create({
        data: { threadId, userId }
      });
      await this.prisma.auditLog.create({
        data: { userId, action: 'Post Saved', details: `Saved thread ${threadId}` }
      });
      return { saved: true };
    }
  }

  async shareThread(threadId: string, userId: string, platform?: string) {
    return { success: true };
  }

  async reportThread(threadId: string, reporterId: string, reason: string, description?: string) {
    if (!reason) {
      throw new BadRequestException('Reason is required');
    }
    const report = await this.prisma.threadReport.create({
      data: {
        threadId,
        reporterId,
        reason,
        description
      }
    });
    await this.prisma.auditLog.create({
      data: { userId: reporterId, action: 'Post Reported', details: `Reported thread ${threadId} for ${reason}` }
    });
    return report;
  }

  async requestCollaboration(threadId: string, scholarId: string, message?: string) {
    const thread = await this.prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    return this.prisma.collaborationRequest.create({
      data: {
        scholarId,
        threadId,
        message
      }
    });
  }

  async getSavedThreads(userId: string) {
    const saved = await this.prisma.savedThread.findMany({
      where: { userId },
      include: {
        thread: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                faculty: true,
                department: true
              }
            },
            attachments: true,
            likes: {
              where: { userId }
            },
            saves: {
              where: { userId }
            },
            _count: {
              select: { comments: true, likes: true, saves: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return saved.map(s => s.thread);
  }

  async deleteThread(threadId: string, userId: string) {
    const thread = await this.prisma.thread.findUnique({ where: { id: threadId }, include: { author: true }});
    // Check if user is author or admin
    if (!thread || (thread.authorId !== userId && thread.author.role !== 'INSTITUTE_ADMIN')) {
      throw new BadRequestException('Unauthorized or thread not found');
    }
    await this.prisma.thread.delete({ where: { id: threadId } });
    await this.prisma.auditLog.create({
      data: { userId, action: 'Post Deleted', details: `Deleted thread ${threadId}` }
    });
    return { success: true };
  }

  async updateThread(threadId: string, userId: string, data: Partial<CreateThreadInput>) {
    const thread = await this.prisma.thread.findUnique({ where: { id: threadId }, include: { author: true }});
    if (!thread || (thread.authorId !== userId && thread.author.role !== 'INSTITUTE_ADMIN')) {
      throw new BadRequestException('Unauthorized or thread not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { attachments, ...updateData } = data; // skip attachment editing for now

    const updated = await this.prisma.thread.update({
      where: { id: threadId },
      data: updateData as any, // Cast to any to handle type diffs, or selectively pick fields
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            faculty: true,
            department: true
          }
        },
        attachments: true,
        _count: {
          select: { comments: true, likes: true, saves: true }
        }
      }
    });
    
    await this.prisma.auditLog.create({
      data: { userId, action: 'Post Edited', details: `Edited thread ${threadId}` }
    });

    return updated;
  }
}
