import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('users/onboarding')
@UseGuards(ClerkAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('supervisor')
  async onboardSupervisor(
    @Req() req: any,
    @Body() body: {
      facultyId: string;
      departmentId: string;
      designation: string;
      employeeId: string;
      maxScholars?: number;
    }
  ) {
    if (!body.facultyId || !body.departmentId || !body.designation || !body.employeeId) {
      throw new BadRequestException('All fields (facultyId, departmentId, designation, employeeId) are required.');
    }
    return this.onboardingService.onboardSupervisor(req.user.id, body);
  }

  @Post('scholar')
  async onboardScholar(
    @Req() req: any,
    @Body() body: {
      facultyId: string;
      departmentId: string;
      researchArea: string;
      supervisorId: string;
    }
  ) {
    if (!body.facultyId || !body.departmentId || !body.researchArea || !body.supervisorId) {
      throw new BadRequestException('All fields (facultyId, departmentId, researchArea, supervisorId) are required.');
    }
    return this.onboardingService.onboardScholar(req.user.id, body);
  }
}
