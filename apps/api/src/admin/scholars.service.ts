import { Injectable, BadRequestException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClerkService } from '../auth/clerk.service';
import { Role, UserStatus } from '@prisma/client';
import * as xlsx from 'xlsx';
import { SUPERADMIN_EMAIL } from './admin.constants';

@Injectable()
export class AdminScholarsService {
  private readonly logger = new Logger(AdminScholarsService.name);

  constructor(
    private prisma: PrismaService,
    private clerkService: ClerkService
  ) {}

  async getScholars() {
    return this.prisma.user.findMany({
      where: { role: Role.RESEARCH_SCHOLAR },
      orderBy: { createdAt: 'desc' },
      include: {
        departmentRef: true,
        supervisor: true,
        scholarProfile: true,
      },
    });
  }

  async createScholar(adminId: string, data: any) {
    const email = data.email.toLowerCase();
    
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('User with this email already exists.');
    }

    let departmentName: string | null = null;
    let facultyName: string | null = null;

    if (data.departmentId) {
      const dept = await this.prisma.department.findUnique({ 
        where: { id: data.departmentId },
        include: { faculty: true }
      });
      if (dept) {
        departmentName = dept.name;
        facultyName = dept.faculty.name;
      }
    }

    let supervisorEmail: string | null = null;
    if (data.supervisorId) {
      const sup = await this.prisma.user.findUnique({ where: { id: data.supervisorId } });
      if (sup) supervisorEmail = sup.email;
    }

    const scholar = await this.prisma.user.create({
      data: {
        name: data.name,
        email,
        role: Role.RESEARCH_SCHOLAR,
        department: departmentName,
        departmentId: data.departmentId || null,
        faculty: facultyName,
        supervisorId: data.supervisorId || null,
        supervisorEmail,
        status: UserStatus.ACTIVE,
        approved: true,
        onboardingCompleted: true,
        scholarProfile: data.departmentId && data.facultyId ? {
          create: {
            facultyId: data.facultyId,
            departmentId: data.departmentId,
            researchArea: data.researchArea || 'General Research',
          }
        } : undefined
      },
      include: {
        departmentRef: true,
        supervisor: true,
        scholarProfile: true,
      },
    });

    await this.logAudit(adminId, 'CREATE_SCHOLAR', `Created scholar ${email}`);

    try {
      await this.clerkService.client.invitations.createInvitation({
        emailAddress: email,
        ignoreExisting: true,
      });
      this.logger.log(`Sent Clerk B2B invitation to scholar ${email}`);
    } catch (err: any) {
      this.logger.warn(`Failed to send Clerk invitation to ${email}: ${err.message}`);
    }

    return scholar;
  }

  async updateScholarStatus(adminId: string, id: string, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Scholar not found.');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status,
        approved: status === UserStatus.ACTIVE,
        suspended: status === UserStatus.SUSPENDED,
      },
    });

    await this.logAudit(adminId, 'UPDATE_SCHOLAR_STATUS', `Changed status to ${status} for scholar ${user.email}`);
    return updated;
  }

  async assignSupervisor(adminId: string, scholarId: string, supervisorId: string) {
    const scholar = await this.prisma.user.findUnique({ where: { id: scholarId } });
    if (!scholar) throw new BadRequestException('Scholar not found.');

    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor) throw new BadRequestException('Supervisor not found.');

    const updated = await this.prisma.user.update({
      where: { id: scholarId },
      data: {
        supervisorId: supervisor.id,
        supervisorEmail: supervisor.email,
      },
      include: { supervisor: true }
    });

    await this.logAudit(adminId, 'ASSIGN_SUPERVISOR', `Assigned supervisor ${supervisor.email} to scholar ${scholar.email}`);
    return updated;
  }

  async deleteScholar(adminId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Scholar not found.');

    await this.prisma.user.delete({ where: { id } });
    await this.logAudit(adminId, 'DELETE_SCHOLAR', `Deleted scholar ${user.email}`);
    return { success: true };
  }

  async importScholars(adminId: string, fileBuffer: Buffer, fileName: string) {
    const isCsv = fileName.toLowerCase().endsWith('.csv');
    let rawRows: any[] = [];

    try {
      if (isCsv) {
        rawRows = this.parseCsv(fileBuffer.toString('utf-8'));
      } else {
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      }
    } catch (err: any) {
      throw new BadRequestException(`Failed to read file: ${err.message}`);
    }

    const report = { total: rawRows.length, successCount: 0, failedCount: 0, errors: [] as any[], successes: [] as string[] };
    
    const dbUsers = await this.prisma.user.findMany();
    const dbFaculties = await this.prisma.faculty.findMany();
    const dbDepts = await this.prisma.department.findMany({ include: { faculty: true } });
    const userEmails = new Set(dbUsers.map(u => u.email.toLowerCase()));

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2;
      const email = String(row.email || row.Email || '').trim().toLowerCase();
      const name = String(row.name || row.Name || '').trim();
      const facultyStr = String(row.faculty || row.Faculty || '').trim();
      const departmentStr = String(row.department || row.Department || '').trim();
      const supervisorStr = String(row.supervisor || row.Supervisor || '').trim().toLowerCase();

      if (!email) { report.failedCount++; report.errors.push({ row: rowNum, message: 'Missing email' }); continue; }
      if (!name) { report.failedCount++; report.errors.push({ row: rowNum, email, message: 'Missing name' }); continue; }
      if (userEmails.has(email)) { report.failedCount++; report.errors.push({ row: rowNum, email, message: 'User already exists' }); continue; }

      let facultyId = null;
      let departmentId = null;
      let facultyName = null;
      let departmentName = null;

      if (departmentStr) {
        const dept = dbDepts.find(d => d.name.toLowerCase() === departmentStr.toLowerCase() || d.code.toLowerCase() === departmentStr.toLowerCase());
        if (dept) {
          departmentId = dept.id;
          departmentName = dept.name;
          facultyId = dept.facultyId;
          facultyName = dept.faculty.name;
        } else {
          report.failedCount++; report.errors.push({ row: rowNum, email, message: `Department '${departmentStr}' not found.` }); continue;
        }
      }

      let supervisorId = null;
      let supervisorEmail = null;
      if (supervisorStr) {
        const sup = dbUsers.find(u => u.role === Role.RESEARCH_SUPERVISOR && (u.email.toLowerCase() === supervisorStr || u.name?.toLowerCase() === supervisorStr));
        if (sup) {
          supervisorId = sup.id;
          supervisorEmail = sup.email;
        } else {
          report.failedCount++; report.errors.push({ row: rowNum, email, message: `Supervisor '${supervisorStr}' not found.` }); continue;
        }
      }

      try {
        await this.prisma.user.create({
          data: {
            name, email, role: Role.RESEARCH_SCHOLAR, status: UserStatus.ACTIVE, approved: true, onboardingCompleted: true,
            faculty: facultyName, department: departmentName, departmentId, supervisorId, supervisorEmail,
            scholarProfile: facultyId && departmentId ? {
              create: { facultyId, departmentId, researchArea: 'Imported Scholar' }
            } : undefined
          }
        });

        try {
          await this.clerkService.client.invitations.createInvitation({
            emailAddress: email,
            ignoreExisting: true,
          });
        } catch (invErr: any) {
          this.logger.warn(`Failed to invite imported scholar ${email}: ${invErr.message}`);
        }

        userEmails.add(email);
        report.successCount++;
        report.successes.push(email);
      } catch (e: any) {
        report.failedCount++;
        report.errors.push({ row: rowNum, email, message: e.message });
      }
    }

    await this.logAudit(adminId, 'IMPORT_SCHOLARS', `Imported ${report.successCount} scholars, ${report.failedCount} failed.`);
    return report;
  }

  private parseCsv(text: string): any[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells: string[] = [];
      let current = ''; let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        if (line[c] === '"' || line[c] === "'") inQuotes = !inQuotes;
        else if (line[c] === ',' && !inQuotes) { cells.push(current.trim()); current = ''; }
        else current += line[c];
      }
      cells.push(current.trim());
      const row: any = {};
      for (let h = 0; h < headers.length; h++) row[headers[h]] = cells[h] || '';
      rows.push(row);
    }
    return rows;
  }

  private async logAudit(userId: string, action: string, details: string) {
    try {
      await this.prisma.auditLog.create({
        data: { userId, action, details }
      });
    } catch (e) {
      this.logger.error('Failed to write audit log', e);
    }
  }
}
