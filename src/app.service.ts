import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getPublic(): string {
    return `Public at ${new Date().toISOString()}`;
  }

  getPrivate(): string {
    return `Private at ${new Date().toISOString()}`;
  }
}
