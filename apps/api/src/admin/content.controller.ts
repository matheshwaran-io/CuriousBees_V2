import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { AdminContentService } from './content.service';

@Controller('admin/content')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(Role.INSTITUTE_ADMIN)
export class AdminContentController {
  constructor(private readonly contentService: AdminContentService) {}

  @Get('posts')
  async getPosts(@Query() query: any) {
    return this.contentService.getPosts(query);
  }

  @Post('posts/:id/hide')
  async hidePost(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any
  ) {
    if (!reason) throw new BadRequestException('Reason is required');
    return this.contentService.hidePost(req.user, id, reason);
  }

  @Post('posts/:id/restore')
  async restorePost(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any
  ) {
    return this.contentService.restorePost(req.user, id, reason);
  }

  @Delete('posts/:id')
  async deletePost(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any
  ) {
    if (!reason) throw new BadRequestException('Reason is required');
    return this.contentService.deletePost(req.user, id, reason);
  }

  @Get('publications')
  async getPublications(@Query() query: any) {
    return this.contentService.getPublications(query);
  }

  @Post('publications/:id/hide')
  async hidePublication(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any
  ) {
    if (!reason) throw new BadRequestException('Reason is required');
    return this.contentService.hidePublication(req.user, id, reason);
  }

  @Post('publications/:id/restore')
  async restorePublication(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any
  ) {
    return this.contentService.restorePublication(req.user, id, reason);
  }
}
