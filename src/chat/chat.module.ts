import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SpaceModule } from 'src/space/space.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [PrismaModule, SpaceModule],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
