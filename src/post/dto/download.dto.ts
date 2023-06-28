import { IsString } from 'class-validator';

export class DownloadPostRequestDto {
  @IsString()
  key: string;
}
