import { IsString } from 'class-validator';

export class DeletePostRequestDto {
  @IsString()
  postId: string;
}
