import { Body, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorator/skip-auth.decorator';

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
}
