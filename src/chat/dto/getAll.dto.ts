import { IsString } from 'class-validator';

export class GetAllChatRequestDto {
  @IsString()
  postId: string;
}
