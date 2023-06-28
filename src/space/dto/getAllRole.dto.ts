import { IsString } from 'class-validator';

export class GetAllRoleRequestDto {
  @IsString()
  spaceId: string;
  @IsString()
  password: string;
}
