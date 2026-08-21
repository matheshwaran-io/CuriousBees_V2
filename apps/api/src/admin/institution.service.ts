import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditHelperService } from './audit-helper';

@Injectable()
export class AdminInstitutionService {
  private readonly logger = new Logger(AdminInstitutionService.name);

  constructor(
    private prisma: PrismaService,
    private auditHelper: AuditHelperService,
  ) {}

  // ─── FACULTIES ─────────────────────────────────────────────────────────────

  async getFaculties() {
    return this.prisma.faculty.findMany({
      orderBy: { name: 'asc' },
      include: {
        departments: {
          include: {
            _count: {
              select: {
                users: true,
                supervisorProfiles: true,
                scholarProfiles: true,
              },
            },
          },
        },
        _count: {
          select: {
            departments: true,
            supervisorProfiles: true,
            scholarProfiles: true,
          },
        },
      },
    });
  }

  async createFaculty(actor: any, name: string) {
    if (!name || !name.trim()) throw new BadRequestException('Faculty name is required.');
    const trimmed = name.trim();

    const existing = await this.prisma.faculty.findUnique({ where: { name: trimmed } });
    if (existing) throw new ConflictException('A faculty with this name already exists.');

    const faculty = await this.prisma.faculty.create({
      data: { name: trimmed },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'FACULTY_CREATED',
      targetId: faculty.id,
      targetType: 'FACULTY',
      category: 'INSTITUTION',
      severity: 'MEDIUM',
      details: `Faculty "${faculty.name}" created.`,
      newState: { name: faculty.name },
    });

    return faculty;
  }

  async updateFaculty(actor: any, id: string, name: string) {
    if (!name || !name.trim()) throw new BadRequestException('Faculty name is required.');
    const faculty = await this.prisma.faculty.findUnique({ where: { id } });
    if (!faculty) throw new NotFoundException('Faculty not found.');

    const updated = await this.prisma.faculty.update({
      where: { id },
      data: { name: name.trim() },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'FACULTY_UPDATED',
      targetId: id,
      targetType: 'FACULTY',
      category: 'INSTITUTION',
      severity: 'LOW',
      details: `Faculty renamed from "${faculty.name}" to "${updated.name}".`,
      previousState: { name: faculty.name },
      newState: { name: updated.name },
    });

    return updated;
  }

  // ─── DEPARTMENTS ───────────────────────────────────────────────────────────

  async getDepartments() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        faculty: true,
        _count: {
          select: {
            users: true,
            supervisorProfiles: true,
            scholarProfiles: true,
          },
        },
      },
    });
  }

  async createDepartment(actor: any, data: { name: string; code: string; facultyId: string; description?: string }) {
    if (!data.name || !data.code || !data.facultyId) {
      throw new BadRequestException('Name, code, and faculty are required.');
    }

    const faculty = await this.prisma.faculty.findUnique({ where: { id: data.facultyId } });
    if (!faculty) throw new NotFoundException('Selected faculty not found.');

    const existing = await this.prisma.department.findUnique({ where: { code: data.code.trim().toUpperCase() } });
    if (existing) throw new ConflictException(`Department code "${data.code}" already exists.`);

    const dept = await this.prisma.department.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        facultyId: data.facultyId,
        description: data.description || null,
      },
      include: { faculty: true },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DEPARTMENT_CREATED',
      targetId: dept.id,
      targetType: 'DEPARTMENT',
      category: 'INSTITUTION',
      severity: 'MEDIUM',
      details: `Department "${dept.name}" (${dept.code}) created under Faculty "${faculty.name}".`,
      newState: { name: dept.name, code: dept.code, faculty: faculty.name },
    });

    return dept;
  }

  async updateDepartment(actor: any, id: string, data: { name?: string; code?: string; facultyId?: string; description?: string }) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found.');

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.code) updateData.code = data.code.trim().toUpperCase();
    if (data.facultyId) updateData.facultyId = data.facultyId;
    if (data.description !== undefined) updateData.description = data.description;

    const updated = await this.prisma.department.update({
      where: { id },
      data: updateData,
      include: { faculty: true },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DEPARTMENT_UPDATED',
      targetId: id,
      targetType: 'DEPARTMENT',
      category: 'INSTITUTION',
      severity: 'LOW',
      details: `Department "${dept.name}" updated.`,
      previousState: { name: dept.name, code: dept.code },
      newState: { name: updated.name, code: updated.code },
    });

    return updated;
  }

  // ─── CAMPUSES ──────────────────────────────────────────────────────────────

  async getCampuses() {
    return this.prisma.campus.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createCampus(actor: any, data: { name: string; code: string; location?: string }) {
    if (!data.name || !data.code) throw new BadRequestException('Campus name and code are required.');

    const campus = await this.prisma.campus.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        location: data.location || null,
        status: 'ACTIVE',
      },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CAMPUS_CREATED',
      targetId: campus.id,
      targetType: 'CAMPUS',
      category: 'INSTITUTION',
      severity: 'LOW',
      details: `Campus "${campus.name}" created.`,
      newState: { name: campus.name, code: campus.code },
    });

    return campus;
  }

  async updateCampus(actor: any, id: string, data: { name?: string; code?: string; location?: string; status?: string }) {
    const campus = await this.prisma.campus.findUnique({ where: { id } });
    if (!campus) throw new NotFoundException('Campus not found.');

    const updated = await this.prisma.campus.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : undefined,
        code: data.code ? data.code.trim().toUpperCase() : undefined,
        location: data.location !== undefined ? data.location : undefined,
        status: data.status ? data.status : undefined,
      },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CAMPUS_UPDATED',
      targetId: id,
      targetType: 'CAMPUS',
      category: 'INSTITUTION',
      severity: 'LOW',
      details: `Campus "${campus.name}" updated.`,
      previousState: campus,
      newState: updated,
    });

    return updated;
  }
}
