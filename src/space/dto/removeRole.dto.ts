import { IsString } from 'class-validator';

export class RemoveRoleRequestDto {
  @IsString()
  spaceId: string;
  @IsString()
  spaceRole: string;
}
