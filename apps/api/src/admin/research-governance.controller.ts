import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { AdminResearchGovernanceService } from './research-governance.service';

@Controller('admin/research-governance')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(Role.INSTITUTE_ADMIN)
export class AdminResearchGovernanceController {
  constructor(private readonly researchGovService: AdminResearchGovernanceService) {}

  @Get('workspaces')
  async getWorkspaces(@Query() query: any) {
    return this.researchGovService.getWorkspaces(query);
  }

  @Get('overview')
  async getOverview() {
    return this.researchGovService.getResearchOverview();
  }
}
