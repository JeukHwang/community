import { IsString } from 'class-validator';

export class GetAllPostRequestDto {
  @IsString()
  spaceId: string;
}
