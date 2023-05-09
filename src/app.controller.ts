import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorator/skip-auth.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('/test/public')
  getPublic(): string {
    return this.appService.getPublic();
  }

  @Get('/test/private')
  getPrivate(): string {
    return this.appService.getPrivate();
  }
}
