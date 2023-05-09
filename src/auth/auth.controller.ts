import {
  Body,
  Controller,
  HttpException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Response } from 'express';
import { UserProfile, UserService, toProfile } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { Public } from './decorator/skip-auth.decorator';
import { RegisterRequestDto } from './dto/register.dto';
import { JwtRefreshGuard } from './guard/jwt-refresh.guard';
import { LocalAuthGuard } from './guard/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('signup')
  async signUp(@Body() userInfo: RegisterRequestDto): Promise<UserProfile> {
    return await this.authService.register(userInfo);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('signin')
  async signIn(
    @Req() req: Request & { user: User },
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserProfile> {
    const user = req.user;
    const { accessToken, ...accessOption } =
      this.authService.getCookieWithJwtAccessToken(user.id);
    const { refreshToken, ...refreshOption } =
      this.authService.getCookieWithJwtRefreshToken(user.id);
    await this.userService.setRefreshToken(user.id, refreshToken);

    res.cookie('Authentication', accessToken, accessOption);
    res.cookie('Refresh', refreshToken, refreshOption);
    // console.log(`Access token: ${accessToken}`);
    // console.log(`Refresh token: ${refreshToken}`);
    return toProfile(user);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@Req() req, @Res({ passthrough: true }) res: Response): void {
    const user = req.user;
    const { accessToken, ...accessOption } =
      this.authService.getCookieWithJwtAccessToken(user.id);

    res.cookie('Authentication', accessToken, accessOption);
    throw new HttpException('Success', 200);
    // console.log(`Access token: ${accessToken}`);
  }

  @Post('signout')
  async signOut(
    @Req() req: Request & { user: User },
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { accessOption, refreshOption } =
      this.authService.getCookiesForSignOut();
    await this.userService.removeRefreshToken(req.user.id);

    res.cookie('Authentication', '', accessOption);
    res.cookie('Refresh', '', refreshOption);

    throw new HttpException('Success', 200);
  }
}
