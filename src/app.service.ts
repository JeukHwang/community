import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getDatePublicly(): string {
    return `Public Date | ${new Date().toISOString()}`;
  }

  getDatePrivately(): string {
    return `Private Date | ${new Date().toISOString()}`;
  }

  getPingPublicly(data: JSON): string {
    return `Public Ping | ${JSON.stringify(data)}`;
  }
}
