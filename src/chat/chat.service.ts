import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Chat, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SpaceService } from 'src/space/space.service';
import { CreateChatRequestDto } from './dto/create.dto';

export type ChatProfile = {
  id: string;
  content: string;
  isAnonymous: boolean;

  authorId: string;
  postId: string;
  parentChatId: string;

  createdAt: Date;
  updatedAt: Date;
};

export function toChatProfile(
  chat: Chat,
  isAuthorOrManager: boolean,
): ChatProfile {
  return {
    id: chat.id,
    content: chat.content,
    isAnonymous: chat.isAnonymous,
    authorId:
      chat.isAnonymous && !isAuthorOrManager ? undefined : chat.authorId,
    postId: chat.postId,
    parentChatId: chat.parentChatId,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
}

@Injectable()
export class ChatService {
  constructor(
    private prismaService: PrismaService,
    private spaceService: SpaceService,
  ) {}

  async create(
    chatInfo: CreateChatRequestDto,
    author: User,
  ): Promise<ChatProfile | null> {
    const post = await this.prismaService.post.findFirst({
      where: { id: chatInfo.postId, deletedAt: null },
      select: { spaceId: true },
    });
    if (!post) {
      throw new UnauthorizedException('Post not found.');
    }
    const isAuthorMember = await this.spaceService.isUserMember(
      post.spaceId,
      author.id,
    );
    if (!isAuthorMember) {
      throw new UnauthorizedException("You're not a member of this space.");
    }
    const isManager = await this.spaceService.isUserManager(
      post.spaceId,
      author.id,
    );
    const isAnonymous = chatInfo.isAnonymous;
    if (isManager && isAnonymous) {
      throw new UnauthorizedException('Manager cannot create anonymus chat.');
    }
    const chat = await this.prismaService.chat.create({
      data: { ...chatInfo, authorId: author.id },
    });
    return toChatProfile(chat, true);
  }

  async findAllProfile(user: User, postId: string): Promise<ChatProfile[]> {
    const post = await this.prismaService.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: { spaceId: true },
    });
    if (!post) {
      throw new UnauthorizedException('Post not found.');
    }
    const isAuthorMember = await this.spaceService.isUserMember(
      post.spaceId,
      user.id,
    );
    if (!isAuthorMember) {
      throw new UnauthorizedException("You're not a member of this space.");
    }
    const chats = await this.prismaService.chat.findMany({
      where: { postId, deletedAt: null },
    });
    const isManager = await this.spaceService.isUserManager(
      post.spaceId,
      user.id,
    );
    return chats.map((chat) =>
      toChatProfile(chat, chat.authorId === user.id || isManager),
    );
  }

  async delete(id: string, user: User): Promise<ChatProfile> {
    const chat = await this.prismaService.chat.findFirst({
      where: { id, deletedAt: null },
      select: { post: { select: { spaceId: true } }, childChat: true },
    });
    if (!chat) {
      throw new UnauthorizedException('No such chat');
    }
    const isValid =
      (await this.isUserAuthor(id, user.id)) ||
      (await this.spaceService.isUserManager(chat.post.spaceId, user.id));
    if (!isValid) {
      throw new UnauthorizedException(
        'You do not have permission to delete this chat.',
      );
    }
    // TODO: change into soft delete middleware
    const chat_update = await this.prismaService.chat.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return toChatProfile(chat_update, true);
  }

  async isUserAuthor(id: string, userId: string): Promise<boolean> {
    const chat = await this.prismaService.chat.findFirstOrThrow({
      where: { id, deletedAt: null },
      select: { authorId: true },
    });
    if (!chat) {
      //   throw new UnauthorizedException('No such chat');
      return false;
    }
    return chat.authorId === userId;
  }
}
