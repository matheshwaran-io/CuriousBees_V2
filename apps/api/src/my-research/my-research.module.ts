import { Module } from '@nestjs/common';
import { MyResearchController } from './my-research.controller';
import { MyResearchService } from './my-research.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MyResearchController],
  providers: [MyResearchService],
  exports: [MyResearchService],
})
export class MyResearchModule {}
