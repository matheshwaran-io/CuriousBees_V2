import { Controller, Get, Put, Body, Query, UseGuards, Req, BadRequestException, Param } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase.guard';
import { UsersService } from './users.service';
import { UpdateProfileInput } from '@curiousbees/types';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  async updateProfile(@Req() req: any, @Body() body: UpdateProfileInput) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Get('collaborators')
  async getCollaborators(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('department') department?: string
  ) {
    return this.usersService.getCollaborators(req.user.id, search, department);
  }

  @Get('interests')
  async getAllInterests() {
    return this.usersService.getAllInterests();
  }

  @Put('request-supervisor')
  async requestSupervisor(@Req() req: any, @Body('supervisorId') supervisorId: string) {
    if (!supervisorId) {
      throw new BadRequestException('supervisorId is required.');
    }
    return this.usersService.requestSupervisor(req.user.id, supervisorId);
  }

  @Get('approvals')
  async getApprovals(@Req() req: any) {
    if (req.user.role !== 'RESEARCH_SUPERVISOR' && req.user.role !== 'INSTITUTION_ADMIN') {
      throw new BadRequestException('Only faculty supervisors can fetch pending approvals.');
    }
    return this.usersService.getApprovals(req.user.id);
  }

  @Put('approve-scholar')
  async approveScholar(@Req() req: any, @Body('scholarId') scholarId: string) {
    if (req.user.role !== 'RESEARCH_SUPERVISOR' && req.user.role !== 'INSTITUTION_ADMIN') {
      throw new BadRequestException('Only faculty supervisors can approve scholars.');
    }
    if (!scholarId) {
      throw new BadRequestException('scholarId is required.');
    }
    return this.usersService.approveScholar(req.user.id, scholarId);
  }

  @Put('decline-scholar')
  async declineScholar(@Req() req: any, @Body('scholarId') scholarId: string) {
    if (req.user.role !== 'RESEARCH_SUPERVISOR' && req.user.role !== 'INSTITUTION_ADMIN') {
      throw new BadRequestException('Only faculty supervisors can decline scholars.');
    }
    if (!scholarId) {
      throw new BadRequestException('scholarId is required.');
    }
    return this.usersService.declineScholar(req.user.id, scholarId);
  }

  @Get('all')
  async getAllUsers(@Req() req: any) {
    return this.usersService.getAllUsers(req.user.id);
  }

  @Put(':id/role')
  async updateUserRole(
    @Req() req: any,
    @Param('id') targetUserId: string,
    @Body('role') role: 'RESEARCH_SUPERVISOR' | 'RESEARCH_SCHOLAR' | 'INSTITUTION_ADMIN'
  ) {
    if (!role || !['RESEARCH_SUPERVISOR', 'RESEARCH_SCHOLAR', 'INSTITUTION_ADMIN'].includes(role)) {
      throw new BadRequestException('Invalid user role.');
    }
    return this.usersService.updateUserRole(req.user.id, targetUserId, role);
  }

  @Get('audit-logs')
  async getAuditLogs(@Req() req: any) {
    return this.usersService.getAuditLogs(req.user.id);
  }
}
