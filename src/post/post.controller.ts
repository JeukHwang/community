import { Body, Controller, Get, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from 'src/user/decorator/current.decorator';
import { CreatePostRequestDto } from './dto/create.dto';
import { DeletePostRequestDto } from './dto/delete.dto';
import { PostProfile, PostService } from './post.service';
import { GetAllPostRequestDto } from './dto/getAll.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('all')
  async getAll(
    @Body() body: GetAllPostRequestDto,
    @CurrentUser() user: User,
  ): Promise<PostProfile[]> {
    return await this.postService.findAllProfile(user, body.spaceId);
  }

  @Post('create')
  async create(
    @Body() body: CreatePostRequestDto,
    @CurrentUser() user: User,
  ): Promise<PostProfile | null> {
    const postInfo = {
      ...body,
    };
    return await this.postService.create(postInfo, user);
  }

  @Post('delete')
  async deletePost(
    @Body() body: DeletePostRequestDto,
    @CurrentUser() user: User,
  ): Promise<PostProfile | null> {
    const { postId } = body;
    return await this.postService.deletePost(postId, user);
  }
}
