import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FacultiesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string }) {
    const existing = await this.prisma.faculty.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictException('Faculty with this name already exists.');
    }

    return this.prisma.faculty.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.faculty.findMany({
      include: {
        _count: {
          select: { departments: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: {
        departments: true,
      },
    });
    if (!faculty) {
      throw new NotFoundException('Faculty not found.');
    }
    return faculty;
  }

  async update(id: string, data: { name: string }) {
    await this.findOne(id);

    const existingName = await this.prisma.faculty.findFirst({
      where: { name: data.name, id: { not: id } },
    });
    if (existingName) {
      throw new ConflictException('Another faculty with this name already exists.');
    }

    return this.prisma.faculty.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.faculty.delete({
      where: { id },
    });
  }
}
