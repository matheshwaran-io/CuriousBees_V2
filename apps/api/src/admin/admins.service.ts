import { Injectable, BadRequestException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClerkService } from '../auth/clerk.service';
import { Role, UserStatus } from '@prisma/client';
import * as xlsx from 'xlsx';
import { SUPERADMIN_EMAIL } from './admin.constants';

@Injectable()
export class AdminAdminsService {
  private readonly logger = new Logger(AdminAdminsService.name);

  constructor(
    private prisma: PrismaService,
    private clerkService: ClerkService
  ) {}

  async getAdmins() {
    return this.prisma.user.findMany({
      where: { role: Role.INSTITUTE_ADMIN },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdmin(adminId: string, data: any) {
    const email = data.email.toLowerCase();
    
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('User with this email already exists.');
    }

    const admin = await this.prisma.user.create({
      data: {
        name: data.name,
        email,
        role: Role.INSTITUTE_ADMIN,
        status: UserStatus.ACTIVE,
        approved: true,
        onboardingCompleted: true,
      },
    });

    await this.logAudit(adminId, 'CREATE_ADMIN', `Created institute admin ${email}`);

    try {
      await this.clerkService.client.invitations.createInvitation({
        emailAddress: email,
        ignoreExisting: true,
      });
      this.logger.log(`Sent Clerk B2B invitation to admin ${email}`);
    } catch (err: any) {
      this.logger.warn(`Failed to send Clerk invitation to ${email}: ${err.message}`);
    }

    return admin;
  }

  async updateAdminStatus(adminId: string, id: string, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Admin not found.');
    if (user.email.toLowerCase() === SUPERADMIN_EMAIL) {
      throw new ForbiddenException('The protected superadmin account cannot be suspended or modified.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status,
        approved: status === UserStatus.ACTIVE,
        suspended: status === UserStatus.SUSPENDED,
      },
    });

    await this.logAudit(adminId, 'UPDATE_ADMIN_STATUS', `Changed status to ${status} for admin ${user.email}`);
    return updated;
  }

  async deleteAdmin(adminId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Admin not found.');
    if (user.email.toLowerCase() === SUPERADMIN_EMAIL) {
      throw new ForbiddenException('The protected superadmin account cannot be deleted.');
    }

    await this.prisma.user.delete({ where: { id } });
    await this.logAudit(adminId, 'DELETE_ADMIN', `Deleted admin ${user.email}`);
    return { success: true };
  }

  async importAdmins(adminId: string, fileBuffer: Buffer, fileName: string) {
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
    const userEmails = new Set(dbUsers.map(u => u.email.toLowerCase()));

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2;
      const email = String(row.email || row.Email || '').trim().toLowerCase();
      const name = String(row.name || row.Name || '').trim();

      if (!email) { report.failedCount++; report.errors.push({ row: rowNum, message: 'Missing email' }); continue; }
      if (!name) { report.failedCount++; report.errors.push({ row: rowNum, email, message: 'Missing name' }); continue; }
      if (userEmails.has(email)) { report.failedCount++; report.errors.push({ row: rowNum, email, message: 'User already exists' }); continue; }

      try {
        await this.prisma.user.create({
          data: {
            name, email, role: Role.INSTITUTE_ADMIN, status: UserStatus.ACTIVE, approved: true, onboardingCompleted: true
          }
        });

        try {
          await this.clerkService.client.invitations.createInvitation({
            emailAddress: email,
            ignoreExisting: true,
          });
        } catch (invErr: any) {
          this.logger.warn(`Failed to invite imported admin ${email}: ${invErr.message}`);
        }

        userEmails.add(email);
        report.successCount++;
        report.successes.push(email);
      } catch (e: any) {
        report.failedCount++;
        report.errors.push({ row: rowNum, email, message: e.message });
      }
    }

    await this.logAudit(adminId, 'IMPORT_ADMINS', `Imported ${report.successCount} admins, ${report.failedCount} failed.`);
    return report;
  }

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 for performance
    });
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
