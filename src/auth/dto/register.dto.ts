import { IsEmail, IsString } from 'class-validator';
export class RegisterRequestDto {
  @IsEmail()
  email: string;
  @IsString()
  password: string;
  @IsString()
  surname: string;
  @IsString()
  givenName: string;
}
