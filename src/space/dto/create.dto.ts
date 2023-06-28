import { IsBoolean, IsString, ValidateNested } from 'class-validator';

class Role {
  @IsString()
  name: string;
  @IsBoolean()
  isManager: boolean;
}

export class CreateRequestDto {
  @IsString()
  name: string;
  @ValidateNested()
  role: Role[];
  @IsString()
  defaultRole: string;
}
