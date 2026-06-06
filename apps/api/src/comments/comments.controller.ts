import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { ApprovedGuard } from '../auth/approved.guard';
import { CommentsService } from './comments.service';
import { CreateCommentInput } from '@curiousbees/types';

@Controller('comments')
@UseGuards(ClerkAuthGuard, ApprovedGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async createComment(@Req() req: any, @Body() body: CreateCommentInput) {
    return this.commentsService.createComment(req.user.id, body);
  }
}
