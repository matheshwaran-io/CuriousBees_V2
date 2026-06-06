import { Controller, Get, Put, Query, Param, UseGuards, Req } from '@nestjs/common';
import { SupervisorsService } from './supervisors.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { SupervisorGuard } from '../auth/guards/supervisor.guard';

@Controller()
export class SupervisorsController {
  constructor(private readonly supervisorsService: SupervisorsService) {}

  @UseGuards(ClerkAuthGuard)
  @Get('supervisors')
  async getSupervisors(@Query('search') search?: string) {
    return this.supervisorsService.getSupervisors(search);
  }

  @UseGuards(ClerkAuthGuard, SupervisorGuard)
  @Get('supervisor/pending-scholars')
  async getPendingScholars(@Req() req: any) {
    return this.supervisorsService.getPendingScholars(req.user.id);
  }

  @UseGuards(ClerkAuthGuard, SupervisorGuard)
  @Put('supervisor/approve/:id')
  async approveScholar(@Req() req: any, @Param('id') scholarId: string) {
    return this.supervisorsService.approveScholar(req.user.id, scholarId);
  }

  @UseGuards(ClerkAuthGuard, SupervisorGuard)
  @Put('supervisor/reject/:id')
  async rejectScholar(@Req() req: any, @Param('id') scholarId: string) {
    return this.supervisorsService.rejectScholar(req.user.id, scholarId);
  }
}
