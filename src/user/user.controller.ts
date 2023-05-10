import { Controller, Get } from '@nestjs/common';
import { User } from '@prisma/client';
import { Public } from 'src/auth/decorator/skip-auth.decorator';
import { CurrentUser } from './decorator/current.decorator';
import { UserProfile, UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Get('all')
  async getAll(): Promise<UserProfile[]> {
    return await this.userService.findAllProfile();
  }

  @Get('current')
  async getCurrentUser(@CurrentUser() user): Promise<User> {
    return user;
  }
}
