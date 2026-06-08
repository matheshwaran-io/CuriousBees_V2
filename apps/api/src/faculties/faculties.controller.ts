import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FacultiesService } from './faculties.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { ApprovedGuard } from '../auth/approved.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('faculties')
export class FacultiesController {
  constructor(private readonly facultiesService: FacultiesService) {}

  @Get()
  async findAll() {
    return this.facultiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.facultiesService.findOne(id);
  }

  @Post()
  @UseGuards(ClerkAuthGuard, ApprovedGuard, AdminGuard)
  async create(@Body() body: { name: string }) {
    return this.facultiesService.create(body);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard, ApprovedGuard, AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() body: { name: string }
  ) {
    return this.facultiesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard, ApprovedGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    return this.facultiesService.remove(id);
  }
}
