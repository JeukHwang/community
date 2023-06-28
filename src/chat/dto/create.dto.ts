import { IsBoolean, IsString } from 'class-validator';

export class CreateChatRequestDto {
  @IsString()
  content: string;
  @IsBoolean()
  isAnonymous: boolean;
  @IsString()
  postId: string;
  @IsString()
  parentChatId?: string;
}
