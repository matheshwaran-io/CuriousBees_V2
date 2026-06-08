import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; code: string; facultyId: string; description?: string }) {
    // Check if faculty exists
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: data.facultyId },
    });
    if (!faculty) {
      throw new NotFoundException(`Faculty with ID "${data.facultyId}" not found.`);
    }

    // Name is not unique globally, but we check for duplicates in the same Faculty
    const existingName = await this.prisma.department.findFirst({
      where: { name: data.name, facultyId: data.facultyId },
    });
    if (existingName) {
      throw new ConflictException('Department with this name already exists in this faculty.');
    }

    const existingCode = await this.prisma.department.findUnique({
      where: { code: data.code },
    });
    if (existingCode) {
      throw new ConflictException('Department with this code already exists.');
    }

    return this.prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        facultyId: data.facultyId,
      },
    });
  }

  async findAll(facultyId?: string) {
    return this.prisma.department.findMany({
      where: facultyId ? { facultyId } : {},
      include: {
        faculty: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        faculty: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
    if (!dept) {
      throw new NotFoundException('Department not found.');
    }
    return dept;
  }

  async update(id: string, data: { name?: string; code?: string; facultyId?: string; description?: string }) {
    await this.findOne(id);

    if (data.facultyId) {
      const faculty = await this.prisma.faculty.findUnique({
        where: { id: data.facultyId },
      });
      if (!faculty) {
        throw new NotFoundException(`Faculty with ID "${data.facultyId}" not found.`);
      }
    }

    if (data.name) {
      const currentDept = await this.prisma.department.findUnique({ where: { id } });
      const targetFacultyId = data.facultyId || currentDept?.facultyId;
      if (targetFacultyId) {
        const existingName = await this.prisma.department.findFirst({
          where: { name: data.name, facultyId: targetFacultyId, id: { not: id } },
        });
        if (existingName) {
          throw new ConflictException('Another department with this name already exists in this faculty.');
        }
      }
    }

    if (data.code) {
      const existingCode = await this.prisma.department.findFirst({
        where: { code: data.code, id: { not: id } },
      });
      if (existingCode) {
        throw new ConflictException('Another department with this code already exists.');
      }
    }

    return this.prisma.department.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.department.delete({
      where: { id },
    });
  }
}
