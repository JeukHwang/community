import { IsString } from 'class-validator';

export class ParticipateRequestDto {
  @IsString()
  spaceRole: string;
  @IsString()
  password: string;
}
