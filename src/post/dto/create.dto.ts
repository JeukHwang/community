import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsString } from 'class-validator';
const postType = ['notice', 'question'] as const;
type PostType = typeof postType[number];

export class CreatePostRequestDto {
  @IsString()
  title: string;
  @IsString()
  content: string;
  @IsIn(postType)
  type: PostType;
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isAnonymous: boolean;
  @IsString()
  spaceId: string;
}
