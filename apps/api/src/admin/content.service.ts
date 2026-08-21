import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditHelperService } from './audit-helper';

@Injectable()
export class AdminContentService {
  private readonly logger = new Logger(AdminContentService.name);

  constructor(
    private prisma: PrismaService,
    private auditHelper: AuditHelperService,
  ) {}

  // ─── POSTS & DISCUSSIONS ───────────────────────────────────────────────────

  async getPosts(query: {
    search?: string;
    hidden?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.hidden === 'true') {
      where.hidden = true;
    } else if (query.hidden === 'false') {
      where.hidden = false;
    }

    if (query.type && query.type !== 'ALL') {
      where.type = query.type;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { content: { contains: s, mode: 'insensitive' } },
        { author: { name: { contains: s, mode: 'insensitive' } } },
        { author: { email: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true, department: true, image: true },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              reports: true,
              shares: true,
            },
          },
        },
      }),
      this.prisma.thread.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async hidePost(actor: any, postId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Reason is required to hide a post.');
    }

    const post = await this.prisma.thread.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found.');

    const updated = await this.prisma.thread.update({
      where: { id: postId },
      data: {
        hidden: true,
        moderatedAt: new Date(),
        moderatedBy: actor.id,
        moderationReason: reason,
      },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'POST_HIDDEN',
      targetId: post.id,
      targetType: 'POST',
      category: 'MODERATION',
      severity: 'MEDIUM',
      details: `Post "${post.title.substring(0, 40)}" hidden. Reason: ${reason}`,
      previousState: { hidden: post.hidden },
      newState: { hidden: true, moderationReason: reason },
      metadata: { postId, reason },
    });

    return updated;
  }

  async restorePost(actor: any, postId: string, reason: string) {
    const post = await this.prisma.thread.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found.');

    const updated = await this.prisma.thread.update({
      where: { id: postId },
      data: {
        hidden: false,
        moderatedAt: new Date(),
        moderatedBy: actor.id,
        moderationReason: reason || 'Restored by administrator',
      },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'POST_RESTORED',
      targetId: post.id,
      targetType: 'POST',
      category: 'MODERATION',
      severity: 'LOW',
      details: `Post "${post.title.substring(0, 40)}" restored. Reason: ${reason || 'Administrative review'}`,
      previousState: { hidden: post.hidden },
      newState: { hidden: false },
      metadata: { postId, reason },
    });

    return updated;
  }

  async deletePost(actor: any, postId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Reason is required to remove a post.');
    }

    const post = await this.prisma.thread.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found.');

    await this.prisma.thread.delete({ where: { id: postId } });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'POST_DELETED',
      targetId: post.id,
      targetType: 'POST',
      category: 'MODERATION',
      severity: 'HIGH',
      details: `Post "${post.title.substring(0, 40)}" permanently deleted. Reason: ${reason}`,
      previousState: { id: post.id, title: post.title, authorId: post.authorId },
      newState: null,
      metadata: { postId, reason },
    });

    return { success: true };
  }

  // ─── PUBLICATIONS ──────────────────────────────────────────────────────────

  async getPublications(query: {
    search?: string;
    hidden?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.hidden === 'true') {
      where.hidden = true;
    } else if (query.hidden === 'false') {
      where.hidden = false;
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { authors: { contains: s, mode: 'insensitive' } },
        { publisher: { contains: s, mode: 'insensitive' } },
        { doi: { contains: s, mode: 'insensitive' } },
        { user: { name: { contains: s, mode: 'insensitive' } } },
        { user: { email: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.publication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, department: true },
          },
        },
      }),
      this.prisma.publication.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async hidePublication(actor: any, pubId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Reason is required to moderate/hide a publication.');
    }

    const pub = await this.prisma.publication.findUnique({ where: { id: pubId } });
    if (!pub) throw new NotFoundException('Publication not found.');

    const updated = await this.prisma.publication.update({
      where: { id: pubId },
      data: {
        hidden: true,
        moderatedAt: new Date(),
        moderatedBy: actor.id,
        moderationReason: reason,
      },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'PUBLICATION_MODERATED',
      targetId: pub.id,
      targetType: 'PUBLICATION',
      category: 'MODERATION',
      severity: 'MEDIUM',
      details: `Publication "${pub.title.substring(0, 40)}" hidden. Reason: ${reason}`,
      previousState: { hidden: pub.hidden },
      newState: { hidden: true, moderationReason: reason },
      metadata: { pubId, reason },
    });

    return updated;
  }

  async restorePublication(actor: any, pubId: string, reason: string) {
    const pub = await this.prisma.publication.findUnique({ where: { id: pubId } });
    if (!pub) throw new NotFoundException('Publication not found.');

    const updated = await this.prisma.publication.update({
      where: { id: pubId },
      data: {
        hidden: false,
        moderatedAt: new Date(),
        moderatedBy: actor.id,
        moderationReason: reason || 'Restored by administrator',
      },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'PUBLICATION_RESTORED',
      targetId: pub.id,
      targetType: 'PUBLICATION',
      category: 'MODERATION',
      severity: 'LOW',
      details: `Publication "${pub.title.substring(0, 40)}" restored. Reason: ${reason || 'Administrative review'}`,
      previousState: { hidden: pub.hidden },
      newState: { hidden: false },
      metadata: { pubId, reason },
    });

    return updated;
  }
}
