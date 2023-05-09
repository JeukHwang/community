import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => request?.cookies?.Refresh,
      ]),
      secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req, payload) {
    const refreshToken = req.cookies?.Refresh;
    return this.usersService.getUserIfRefreshTokenMatches(
      refreshToken,
      payload.id,
    );
  }
}
