import { IsString } from 'class-validator';

export class DestroyRequestDto {
  @IsString()
  spaceId: string;
}
