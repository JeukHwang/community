import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Post, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SpaceService } from 'src/space/space.service';

export type PostInitialProfile = {
  title: string;
  content: string;
  type: string;
  isAnonymous: boolean;

  authorId: string;
  spaceId: string;
};

export type PostProfile = {
  id: string;
  title: string;
  content: string;
  type: string;
  isAnonymous: boolean;

  authorId: string;
  spaceId: string;

  createdAt: Date;
  updatedAt: Date;
};

export function toPostProfile(
  user: User,
  isManager: boolean,
): (post: Post) => PostProfile {
  return (post: Post): PostProfile => {
    const isOwner = post.authorId === user.id;
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      type: post.type,
      isAnonymous: post.isAnonymous,

      authorId: isManager || isOwner ? post.authorId : undefined,
      spaceId: post.spaceId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  };
}

@Injectable()
export class PostService {
  constructor(
    private prismaService: PrismaService,
    private spaceService: SpaceService,
  ) {}

  async create(
    postInfo: PostInitialProfile,
    author: User,
  ): Promise<PostProfile | null> {
    const isAuthorSigned = author.id === postInfo.authorId;
    const isAuthorMember = await this.spaceService.isUserMember(
      postInfo.spaceId,
      postInfo.authorId,
    );
    if (!isAuthorSigned || !isAuthorMember) {
      return null;
    }
    const isManager = await this.spaceService.isUserManager(
      postInfo.spaceId,
      postInfo.authorId,
    );
    const isNotice = postInfo.type === 'notice';
    const isAnonymous = postInfo.isAnonymous;
    const isValid = (isManager && !isAnonymous) || (!isManager && !isNotice);
    if (!isValid) {
      return null;
    }
    const post = await this.prismaService.post.create({
      data: { ...postInfo },
    });
    return post;
  }

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
    return posts.map(toPostProfile(user, isManager));
  }

  async deletePost(id: string, user: User): Promise<Post | null> {
    const post = await this.prismaService.post.findUnique({
      where: { id },
      include: { space: true },
    });
    if (
      this.isUserAuthor(id, user.id) ||
      this.spaceService.isUserManager(post.space.id, user.id)
    ) {
      await this.prismaService.post.delete({ where: { id } });
    }
    return null;
  }

  async isUserAuthor(id: string, userId: string): Promise<boolean> {
    try {
      const author = await this.prismaService.post
        .findFirstOrThrow({
          where: { id, deletedAt: null },
          select: { author: true },
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
