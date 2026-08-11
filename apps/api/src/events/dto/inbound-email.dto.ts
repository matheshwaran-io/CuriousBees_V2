import { IsOptional, IsString, IsObject } from 'class-validator';

export class InboundEmailDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  created_at?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  @IsString()
  to?: any;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  html?: string;
}
