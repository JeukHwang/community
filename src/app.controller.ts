import {
  Body,
  Controller,
  Get,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Max, MaxLength, Min, MinLength } from 'class-validator';
import { AppService } from './app.service';
import { Public } from './auth/decorator/skip-auth.decorator';
import { download, upload } from './s3';

class TestTypeCheckDto {
  @MinLength(5)
  @MaxLength(10)
  string: string;
  @Min(-10)
  @Max(10)
  number: number;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('/test/public-date')
  getDatePublicly(): string {
    return this.appService.getDatePublicly();
  }

  @Get('/test/private-date')
  getDatePrivately(): string {
    return this.appService.getDatePrivately();
  }

  @Public()
  @Get('/test/public-ping')
  getPrivate(@Body() body: JSON): string {
    return this.appService.getPingPublicly(body);
  }

  @Public()
  @Post('/test/public-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file) {
    // console.log(file);
    const result = await upload(file);
    // console.log(result);
    return { key: result.Key };
  }

  @Public()
  @Post('/test/public-download/')
  async downloadFile(@Body() body) {
    const result = await download(body.key);
    return new StreamableFile(result);
  }

  @Public()
  @Post('/test/public-typecheck')
  async typeCheck(@Body() body: TestTypeCheckDto) {
    return body;
  }
}
