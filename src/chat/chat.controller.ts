import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChatProfile, ChatService } from './chat.service';
import { CreateChatRequestDto } from './dto/create.dto';
import { DeleteChatRequestDto } from './dto/delete.dto';
import { GetAllChatRequestDto } from './dto/getAll.dto';
import { CurrentUser } from 'src/user/decorator/current.decorator';
import { User } from '@prisma/client';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('all')
  async getAll(
    @Body() body: GetAllChatRequestDto,
    @CurrentUser() user: User,
  ): Promise<ChatProfile[]> {
    return await this.chatService.findAllProfile(user, body.postId);
  }

  @Post('create')
  async create(
    @Body() body: CreateChatRequestDto,
    @CurrentUser() user: User,
  ): Promise<ChatProfile | null> {
    const chatInfo = {
      ...body,
    };
    return await this.chatService.create(chatInfo, user);
  }

  @Post('delete')
  async delete(
    @Body() body: DeleteChatRequestDto,
    @CurrentUser() user: User,
  ): Promise<ChatProfile | null> {
    const { chatId } = body;
    return await this.chatService.delete(chatId, user);
  }
}
