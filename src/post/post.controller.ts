import {
  Body,
  Controller,
  Get,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { download } from 'src/s3';
import { CurrentUser } from 'src/user/decorator/current.decorator';
import { CreatePostRequestDto } from './dto/create.dto';
import { DeletePostRequestDto } from './dto/delete.dto';
import { GetAllPostRequestDto } from './dto/getAll.dto';
import { PostProfile, PostService } from './post.service';
import { DownloadPostRequestDto } from './dto/download.dto';

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
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() body: CreatePostRequestDto,
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PostProfile | null> {
    const postInfo = {
      ...body,
    };
    return await this.postService.create(postInfo, user, file);
  }

  @Post('download-file')
  async downloadFile(@Body() body: DownloadPostRequestDto) {
    const result = await download(body.key);
    return new StreamableFile(result);
  }

  @Post('delete')
  async delete(
    @Body() body: DeletePostRequestDto,
    @CurrentUser() user: User,
  ): Promise<PostProfile | null> {
    const { postId } = body;
    return await this.postService.delete(postId, user);
  }
}
