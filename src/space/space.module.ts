import { Module, forwardRef } from '@nestjs/common';
import { PostModule } from 'src/post/post.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SpaceController } from './space.controller';
import { SpaceService } from './space.service';
import { PostService } from 'src/post/post.service';

@Module({
  imports: [forwardRef(() => PostModule), PrismaModule],
  providers: [SpaceService, PostService],
  controllers: [SpaceController],
  exports: [SpaceService],
})
export class SpaceModule {}
