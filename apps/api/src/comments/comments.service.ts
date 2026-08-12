import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentInput } from '@curiousbees/types';
import { CreateCommentSchema } from '@curiousbees/shared-utils';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  async createComment(authorId: string, input: CreateCommentInput) {
    const parsed = CreateCommentSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0].message);
    }

    const { content, threadId, parentId } = parsed.data;

    // Check if thread exists
    const threadExists = await this.prisma.thread.findUnique({
      where: { id: threadId }
    });
    if (!threadExists) {
      throw new BadRequestException('The thread does not exist.');
    }

    if (parentId) {
      const parentExists = await this.prisma.comment.findUnique({
        where: { id: parentId }
      });
      if (!parentExists) {
        throw new BadRequestException('The parent comment does not exist.');
      }
    }

    const newComment = await this.prisma.comment.create({
      data: {
        content,
        threadId,
        authorId,
        parentId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            department: true
          }
        }
      }
    });

    // Securely dispatch FCM Push Alert to the thread author asynchronously
    if (threadExists.authorId !== authorId) {
      const replierName = newComment.author?.name || 'A research colleague';
      const bodySnippet = content.substring(0, 60) + (content.length > 60 ? '...' : '');
      this.notifications.sendPushToUser(threadExists.authorId, {
        title: 'New Discussion Reply! 💬',
        body: `${replierName} commented: "${bodySnippet}"`,
        url: `/threads/${threadId}`
      }).catch(e => console.error('FCM Dispatch Failed:', e));
    }

    return newComment;
  }

  async updateComment(userId: string, commentId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Content cannot be empty');
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('You can only edit your own comments');

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true, role: true, department: true }
        },
        _count: { select: { likes: true } }
      }
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('You can only delete your own comments');

    await this.prisma.comment.delete({
      where: { id: commentId }
    });
    
    return { success: true };
  }

  async toggleLike(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) throw new NotFoundException('Comment not found');

    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId
        }
      }
    });

    if (existingLike) {
      await this.prisma.commentLike.delete({
        where: { id: existingLike.id }
      });
      return { liked: false };
    } else {
      await this.prisma.commentLike.create({
        data: {
          commentId,
          userId
        }
      });
      return { liked: true };
    }
  }
}
