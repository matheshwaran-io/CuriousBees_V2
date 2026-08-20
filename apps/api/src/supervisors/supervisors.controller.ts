import { Controller, Get, Put, Query, Param, UseGuards, Req } from '@nestjs/common';
import { SupervisorsService } from './supervisors.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { SupervisorGuard } from '../auth/guards/supervisor.guard';

@Controller()
export class SupervisorsController {
  constructor(private readonly supervisorsService: SupervisorsService) {}

  @Get('supervisors')
  async getSupervisors(
    @Query('departmentId') departmentId?: string,
    @Query('facultyId') facultyId?: string,
    @Query('search') search?: string
  ) {
    return this.supervisorsService.getSupervisors(departmentId, facultyId, search);
  }

  @UseGuards(SupabaseAuthGuard, SupervisorGuard)
  @Get('supervisor/pending-scholars')
  async getPendingScholars(@Req() req: any) {
    return this.supervisorsService.getPendingScholars(req.user.id);
  }

  @UseGuards(SupabaseAuthGuard, SupervisorGuard)
  @Put('supervisor/approve/:id')
  async approveScholar(@Req() req: any, @Param('id') scholarId: string) {
    return this.supervisorsService.approveScholar(req.user.id, scholarId);
  }

  @UseGuards(SupabaseAuthGuard, SupervisorGuard)
  @Put('supervisor/reject/:id')
  async rejectScholar(@Req() req: any, @Param('id') scholarId: string) {
    return this.supervisorsService.rejectScholar(req.user.id, scholarId);
  }
}
