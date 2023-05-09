import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';

type Payload = {
  email: string;
  sub: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => request?.cookies?.Authentication,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload) {
    return this.userService.findById(payload.id);
    // const { sub: email } = payload;
    // const user = await this.userService.findByEmail(email);
    // if (!user) {
    //   throw new UnauthorizedException('Access denied');
    // }
    // return user; // save into req.user
  }
}
