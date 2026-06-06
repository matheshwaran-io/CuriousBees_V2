import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { ApprovedGuard } from '../auth/approved.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @UseGuards(ClerkAuthGuard, ApprovedGuard, AdminGuard)
  async create(@Body() body: { name: string; code: string; description?: string }) {
    return this.departmentsService.create(body);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard, ApprovedGuard, AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; code?: string; description?: string }
  ) {
    return this.departmentsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard, ApprovedGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
