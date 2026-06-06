import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(['RESEARCH_SCHOLAR', 'RESEARCH_SUPERVISOR'])
  role: 'RESEARCH_SCHOLAR' | 'RESEARCH_SUPERVISOR';

  @IsNotEmpty()
  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  supervisorId?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
