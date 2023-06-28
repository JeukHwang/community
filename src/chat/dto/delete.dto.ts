import { IsString } from 'class-validator';

export class DeleteChatRequestDto {
  @IsString()
  chatId: string;
}
