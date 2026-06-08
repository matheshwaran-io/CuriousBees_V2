import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminScholarsController } from './scholars.controller';
import { AdminScholarsService } from './scholars.service';
import { AdminSupervisorsController } from './supervisors.controller';
import { AdminSupervisorsService } from './supervisors.service';
import { AdminAdminsController } from './admins.controller';
import { AdminAdminsService } from './admins.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController, AdminScholarsController, AdminSupervisorsController, AdminAdminsController],
  providers: [AdminService, AdminScholarsService, AdminSupervisorsService, AdminAdminsService],
  exports: [AdminService, AdminScholarsService, AdminSupervisorsService, AdminAdminsService],
})
export class AdminModule {}
