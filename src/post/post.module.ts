import { Module } from '@nestjs/common';
import { SpaceModule } from 'src/space/space.module';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, SpaceModule],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
