import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { AdminRolesService } from './roles.service';

@Controller('admin/roles-permissions')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(Role.INSTITUTE_ADMIN)
export class AdminRolesController {
  constructor(private readonly rolesService: AdminRolesService) {}

  @Get()
  async getPermissionsMatrix() {
    return this.rolesService.getPermissionsMatrix();
  }
}
