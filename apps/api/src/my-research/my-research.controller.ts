import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MyResearchService } from './my-research.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { ApprovedGuard } from '../auth/approved.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { ResearchStatus, ResearchStage, MilestoneStatus, MilestonePriority } from '@prisma/client';

@Controller('my-research')
@UseGuards(SupabaseAuthGuard, ApprovedGuard, RolesGuard)
@Roles(Role.RESEARCH_SCHOLAR)
export class MyResearchController {
  constructor(private readonly myResearchService: MyResearchService) {}

  @Get()
  async getMyResearchProfile(@Req() req: any) {
    return this.myResearchService.getOrCreateResearchProfile(req.user.id);
  }

  @Patch()
  async updateMyResearchProfile(
    @Req() req: any,
    @Body()
    body: {
      title?: string;
      researchArea?: string;
      abstract?: string;
      status?: ResearchStatus;
      currentStage?: ResearchStage;
      startDate?: string;
      expectedCompletionDate?: string;
    },
  ) {
    return this.myResearchService.updateResearchProfile(req.user.id, body);
  }

  @Get('milestones')
  async getMilestones(@Req() req: any) {
    return this.myResearchService.getMilestones(req.user.id);
  }

  @Post('milestones')
  async createMilestone(
    @Req() req: any,
    @Body()
    body: {
      title: string;
      description?: string;
      stage?: ResearchStage;
      priority?: MilestonePriority;
      dueDate?: string;
    },
  ) {
    return this.myResearchService.createMilestone(req.user.id, body);
  }

  @Patch('milestones/:id')
  async updateMilestone(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      stage?: ResearchStage;
      status?: MilestoneStatus;
      priority?: MilestonePriority;
      dueDate?: string;
    },
  ) {
    return this.myResearchService.updateMilestone(req.user.id, id, body);
  }

  @Post('milestones/:id/complete')
  async completeMilestone(@Req() req: any, @Param('id') id: string) {
    return this.myResearchService.completeMilestone(req.user.id, id);
  }

  @Get('activity')
  async getActivityTimeline(@Req() req: any) {
    return this.myResearchService.getActivityTimeline(req.user.id);
  }

  @Get('materials')
  async getResearchMaterials(@Req() req: any) {
    return this.myResearchService.getResearchMaterials(req.user.id);
  }
}
