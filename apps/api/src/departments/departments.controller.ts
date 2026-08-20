import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { ApprovedGuard } from '../auth/approved.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async findAll(@Query('facultyId') facultyId?: string) {
    return this.departmentsService.findAll(facultyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard, ApprovedGuard, AdminGuard)
  async create(@Body() body: { name: string; code: string; facultyId: string; description?: string }) {
    return this.departmentsService.create(body);
  }

  @Put(':id')
  @UseGuards(SupabaseAuthGuard, ApprovedGuard, AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; code?: string; facultyId?: string; description?: string }
  ) {
    return this.departmentsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, ApprovedGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
