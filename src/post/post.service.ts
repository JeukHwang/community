import {
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { Post, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { upload } from 'src/s3';
import { SpaceService } from 'src/space/space.service';
import { CreatePostRequestDto } from './dto/create.dto';

export type PostProfile = {
  id: string;
  title: string;
  content: string;
  type: 'notice' | 'question';
  isAnonymous: boolean;
  file: string;

  authorId: string;
  spaceId: string;

  createdAt: Date;
  updatedAt: Date;
};

export function toPostProfile(
  post: Post,
  isAuthorOrManager: boolean,
): PostProfile {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    type: post.type as 'notice' | 'question',
    isAnonymous: post.isAnonymous,
    authorId:
      post.isAnonymous && !isAuthorOrManager ? undefined : post.authorId,
    spaceId: post.spaceId,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    file: post.file,
  };
}

@Injectable()
export class PostService {
  constructor(
    private prismaService: PrismaService,
    @Inject(forwardRef(() => SpaceService))
    private spaceService: SpaceService,
  ) {}

  async create(
    postInfo: CreatePostRequestDto,
    author: User,
    file: Express.Multer.File,
  ): Promise<PostProfile | null> {
    const isAuthorMember = await this.spaceService.isUserMember(
      postInfo.spaceId,
      author.id,
    );
    if (!isAuthorMember) {
      throw new UnauthorizedException("You're not a member of this space.");
    }
    const isManager = await this.spaceService.isUserManager(
      postInfo.spaceId,
      author.id,
    );
    const isAnonymous = postInfo.isAnonymous;
    if (isManager && isAnonymous) {
      throw new UnauthorizedException('Manager cannot create anonymus post.');
    }
    const isNotice = postInfo.type === 'notice';
    if (!isManager && isNotice) {
      throw new UnauthorizedException('Only manager can create notice.');
    }
    const result = await upload(file);
    const post = await this.prismaService.post.create({
      data: { ...postInfo, isAnonymous, authorId: author.id, file: result.Key },
    });

    return toPostProfile(post, true);
  }

  //   aysnc uploadeFile(files: Array<Express.Multer.File>) {

  //   }

  async findAllProfile(user: User, spaceId: string): Promise<PostProfile[]> {
    const isAuthorMember = await this.spaceService.isUserMember(
      spaceId,
      user.id,
    );
    if (!isAuthorMember) {
      throw new UnauthorizedException("You're not a member of this space.");
    }
    const posts = await this.prismaService.post.findMany({
      where: { spaceId, deletedAt: null },
    });
    const isManager = await this.spaceService.isUserManager(spaceId, user.id);
    return posts.map((post) =>
      toPostProfile(post, post.authorId === user.id || isManager),
    );
  }

  async delete(id: string, user: User): Promise<PostProfile> {
    const post = await this.prismaService.post.findFirst({
      where: { id, deletedAt: null },
      include: { space: { select: { id: true } } },
    });
    if (!post) {
      throw new UnauthorizedException('No such post');
    }
    const isValid =
      (await this.isUserAuthor(id, user.id)) ||
      (await this.spaceService.isUserManager(post.space.id, user.id));
    if (!isValid) {
      throw new UnauthorizedException(
        'You do not have permission to delete this post.',
      );
    }
    // TODO: change into soft delete middleware
    const post_update = await this.prismaService.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    // TODO: change into soft delete middleware
    // remove all chats
    await this.prismaService.chat.updateMany({
      where: { postId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return toPostProfile(post_update, true);
  }

  async isUserAuthor(id: string, userId: string): Promise<boolean> {
    try {
      const author = await this.prismaService.post
        .findFirstOrThrow({
          where: { id, deletedAt: null },
        })
        .author();
      return author.id === userId;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return false;
      }
    }
  }
}
