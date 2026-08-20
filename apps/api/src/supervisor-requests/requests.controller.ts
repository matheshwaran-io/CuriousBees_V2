import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';

@Controller('supervisor-requests')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  async getRequests(@Req() req: any) {
    return this.requestsService.getRequests(req.user.id, req.user.role);
  }

  @Get(':id')
  async getRequestById(@Req() req: any, @Param('id') requestId: string) {
    return this.requestsService.getRequestById(req.user.id, req.user.role, requestId);
  }

  @Post()
  @Roles(Role.RESEARCH_SCHOLAR)
  async createRequest(@Req() req: any, @Body('supervisorId') supervisorId: string) {
    if (!supervisorId) {
      throw new BadRequestException('supervisorId is required.');
    }
    return this.requestsService.createRequest(req.user.id, supervisorId);
  }

  @Delete(':id')
  @Roles(Role.RESEARCH_SCHOLAR)
  async cancelRequest(@Req() req: any, @Param('id') requestId: string) {
    return this.requestsService.cancelRequest(req.user.id, requestId);
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
