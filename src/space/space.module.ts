import { Module } from '@nestjs/common';
import { SpaceService } from './space.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SpaceController } from './space.controller';

@Module({
  imports: [PrismaModule],
  providers: [SpaceService],
  controllers: [SpaceController],
})
export class SpaceModule {}
