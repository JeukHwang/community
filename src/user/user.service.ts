import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterRequestDto } from 'src/auth/dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';

export type UserProfile = {
  id: string;
  email: string;
  surname: string;
  givenName: string;
  profilePhoto: string;
};

export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    surname: user.surname,
    givenName: user.givenName,
    profilePhoto: user.profilePhoto,
  };
}

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(userInfo: RegisterRequestDto): Promise<User | null> {
    try {
      const defaultProfilePhoto = 'https://sparcs.org/img/symbol.svg';
      const user = await this.prismaService.user.create({
        data: {
          ...userInfo,
          profilePhoto: defaultProfilePhoto,
        },
      });
      return user;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === 'P2002') {
          console.log(
            'There is a unique constraint violation, a new user cannot be created with this email',
          );
          throw new UnauthorizedException('Unique constraint violated');
        }
      }
      throw e;
    }
  }

  async findAllProfile(): Promise<UserProfile[]> {
    const users = await this.prismaService.user.findMany({
      where: { deletedAt: null },
    });
    return users.map(toUserProfile);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prismaService.user.findFirst({
      where: { deletedAt: null, id },
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prismaService.user.findFirst({
      where: { deletedAt: null, email },
    });
    return user;
  }

  async removeById(id: string) {
    await this.prismaService.user.deleteMany({
      where: { deletedAt: null, id },
    });
  }

  async setRefreshToken(id: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    // console.log(hashedRefreshToken);
    await this.prismaService.user.updateMany({
      where: { deletedAt: null, id },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async getUserIfRefreshTokenMatches(
    id: string,
    refreshToken: string,
  ): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    return isRefreshTokenMatching ? user : null;
  }

  removeRefreshToken(id: string) {
    this.prismaService.user.updateMany({
      where: { deletedAt: null, id },
      data: { refreshToken: null },
    });
  }
}
