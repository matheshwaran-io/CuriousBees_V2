import { Controller, Get, Post, Put, Body, Query, UseGuards, Req, Param, BadRequestException } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { ApprovedGuard } from '../auth/approved.guard';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityInput } from '@curiousbees/types';

@Controller('opportunities')
@UseGuards(ClerkAuthGuard, ApprovedGuard)
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  async getOpportunities(
    @Query('department') department?: string,
    @Query('researchDomain') researchDomain?: string
  ) {
    return this.opportunitiesService.getOpportunities(department, researchDomain);
  }

  @Post()
  async createOpportunity(@Req() req: any, @Body() body: CreateOpportunityInput) {
    return this.opportunitiesService.createOpportunity(req.user.id, body);
  }

  @Post(':id/request')
  async createCollaborationRequest(
    @Req() req: any,
    @Param('id') opportunityId: string,
    @Body('message') message?: string
  ) {
    return this.opportunitiesService.createCollaborationRequest(req.user.id, opportunityId, message);
  }

  @Get('requests')
  async getCollaborationRequests(@Req() req: any) {
    if (req.user.role === 'SUPERVISOR' || req.user.role === 'INSTITUTE_ADMIN') {
      return this.opportunitiesService.getRequestsForSupervisor(req.user.id);
    } else {
      return this.opportunitiesService.getRequestsForScholar(req.user.id);
    }
  }

  @Put('requests/:id')
  async updateRequestStatus(
    @Req() req: any,
    @Param('id') requestId: string,
    @Body('status') status: 'PUBLISHED' | 'REJECTED' | 'NEEDS_INFO'
  ) {
    if (req.user.role !== 'SUPERVISOR' && req.user.role !== 'INSTITUTE_ADMIN') {
      throw new BadRequestException('Only supervisors can update request status.');
    }
    if (!status || !['PUBLISHED', 'REJECTED', 'NEEDS_INFO'].includes(status)) {
      throw new BadRequestException('Invalid request status.');
    }
    return this.opportunitiesService.updateRequestStatus(req.user.id, requestId, status);
  }
}
