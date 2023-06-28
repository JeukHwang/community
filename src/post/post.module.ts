import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SpaceModule } from 'src/space/space.module';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [PrismaModule, forwardRef(() => SpaceModule)],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}
