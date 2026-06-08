import { Controller, Get, Post, Put, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';

@Controller('supervisor-requests')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  async getRequests(@Req() req: any) {
    return this.requestsService.getRequests(req.user.id, req.user.role);
  }

  @Post()
  @Roles(Role.RESEARCH_SCHOLAR)
  async createRequest(@Req() req: any, @Body('supervisorId') supervisorId: string) {
    if (!supervisorId) {
      throw new BadRequestException('supervisorId is required.');
    }
    return this.requestsService.createRequest(req.user.id, supervisorId);
  }

  @Put(':id/approve')
  @Roles(Role.RESEARCH_SUPERVISOR)
  async approveRequest(@Req() req: any, @Param('id') requestId: string) {
    return this.requestsService.approveRequest(req.user.id, requestId);
  }

  @Put(':id/reject')
  @Roles(Role.RESEARCH_SUPERVISOR)
  async rejectRequest(@Req() req: any, @Param('id') requestId: string) {
    return this.requestsService.rejectRequest(req.user.id, requestId);
  }
}
