import {
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { Space, SpaceRole, User, UserSpace } from '@prisma/client';
import { PostService } from 'src/post/post.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRequestDto } from './dto/create.dto';

export type SpaceProfile = {
  id: string;
  name: string;
  profilePhoto: string;

  managerPassword: string;
  participantPassword: string;
  // memberCount: number
};
export type SpaceRoleProfile = {
  id: string;
  name: string;
  isManager: boolean;
};

export function toSpaceProfile(space: Space, isManager: boolean): SpaceProfile {
  return {
    id: space.id,
    name: space.name,
    profilePhoto: space.profilePhoto,

    managerPassword: isManager ? space.managerPassword : undefined,
    participantPassword: isManager ? space.participantPassword : undefined,
    // memberCount: 0,
  };
}

export function toSpaceRoleProfile(role: SpaceRole): SpaceRoleProfile {
  return {
    id: role.id,
    name: role.name,
    isManager: role.isManager,
  };
}

@Injectable()
export class SpaceService {
  constructor(
    private prismaService: PrismaService,
    @Inject(forwardRef(() => PostService))
    private postService: PostService,
  ) {}

  private async getPassword(): Promise<string> {
    const code = Array.from(Array(8), () =>
      Math.floor(Math.random() * 36).toString(36),
    ).join('');
    const space = await this.prismaService.space.findMany({
      where: {
        OR: [
          { managerPassword: code, deletedAt: null },
          { participantPassword: code, deletedAt: null },
        ],
      },
    });
    return space.length === 0 ? code : this.getPassword();
  }

  private async validateSpaceInfo(spaceInfo: CreateRequestDto): Promise<void> {
    for (let i = 0; i < spaceInfo.role.length - 1; i++) {
      for (let j = 1; j < spaceInfo.role.length; j++) {
        if (i !== j && spaceInfo.role[i].name === spaceInfo.role[j].name) {
          throw new UnauthorizedException('Duplicated role name');
        }
      }
    }
    const atLeastOneManager = spaceInfo.role.some((role) => role.isManager);
    const atLeastOneParticipant = spaceInfo.role.some(
      (role) => !role.isManager,
    );
    if (!atLeastOneManager || !atLeastOneParticipant) {
      throw new UnauthorizedException(
        'One manager and participant is required at least',
      );
    }

    const defaultRole = spaceInfo.role.find(
      (role) => role.name === spaceInfo.defaultRole,
    );
    const isValidDefaultRole = defaultRole && defaultRole.isManager;
    if (!isValidDefaultRole) {
      throw new UnauthorizedException('Invalid default role');
    }
  }

  async create(
    spaceInfo: CreateRequestDto,
    user: User,
  ): Promise<SpaceProfile | null> {
    try {
      await this.validateSpaceInfo(spaceInfo);
    } catch (error) {
      console.log('Create space', error);
      throw new UnauthorizedException('Space creation failed');
    }
    const defaultProfilePhoto = 'https://sparcs.org/img/symbol.svg';
    const managerPassword = await this.getPassword();
    const participantPassword = await this.getPassword();
    const space = await this.prismaService.space.create({
      data: {
        managerPassword: managerPassword,
        participantPassword: participantPassword,
        name: spaceInfo.name,
        profilePhoto: defaultProfilePhoto,
        creator: {
          connect: {
            id: user.id,
          },
        },
      },
    });
    await this.prismaService.spaceRole.createMany({
      data: spaceInfo.role.map((role) => ({
        name: role.name,
        isManager: role.isManager,
        spaceId: space.id,
      })),
    });
    const defaultRole = await this.prismaService.spaceRole.findFirst({
      where: {
        deletedAt: null,
        name: spaceInfo.defaultRole,
      },
    });
    await this.prismaService.userSpace.create({
      data: {
        spaceId: space.id,
        userId: user.id,
        roleId: defaultRole.id,
      },
    });
    return toSpaceProfile(space, true);
  }

  async findById(id: string): Promise<Space | null> {
    const space = await this.prismaService.space.findFirst({
      where: { deletedAt: null, id },
    });
    return space;
  }

  async findByName(name: string): Promise<Space | null> {
    const space = await this.prismaService.space.findFirst({
      where: { deletedAt: null, name },
    });
    return space;
  }

  async findAllSpaceProfile(user: User): Promise<SpaceProfile[]> {
    const spaces = await this.prismaService.space.findMany({
      where: { deletedAt: null },
    });
    return await Promise.all(
      spaces.map(async (space) => {
        const isUserManager = await this.isUserManager(space.id, user.id);
        return toSpaceProfile(space, isUserManager);
      }),
    );
  }

  async findSpaceRole(
    spaceId: string,
    password: string,
  ): Promise<SpaceRoleProfile[]> {
    const space = await this.findById(spaceId);
    if (!space) {
      throw new UnauthorizedException('Invalid space id');
    }
    const isManagerPassword = password === space.managerPassword;
    const isParticipantPassword = password === space.participantPassword;
    if (!(isManagerPassword || isParticipantPassword)) {
      throw new UnauthorizedException('Invalid password');
    }
    const role = await this.prismaService.spaceRole.findMany({
      where: {
        deletedAt: null,
        spaceId: space.id,
        isManager: isManagerPassword,
      },
    });
    return role.map(toSpaceRoleProfile);
  }

  async removeSpaceRole(spaceId: string, spaceRole: string, user: User) {
    const space = await this.findById(spaceId);
    if (!space) {
      throw new UnauthorizedException('Invalid space id');
    }
    const role = await this.prismaService.spaceRole.findFirst({
      where: { deletedAt: null, spaceId: space.id, name: spaceRole },
    });
    if (!role) {
      throw new UnauthorizedException('Invalid role name');
    }
    const userRole = await this.prismaService.userSpace
      .findFirst({
        where: {
          deletedAt: null,
          spaceId: space.id,
          userId: user.id,
        },
      })
      .role();
    if (!userRole.isManager) {
      throw new UnauthorizedException('Only manager can remove role');
    }

    const noMemberForRole =
      (await this.prismaService.userSpace.count({
        where: { deletedAt: null, roleId: role.id },
      })) == 0;
    if (!noMemberForRole) {
      throw new UnauthorizedException('There are members for this role');
    }
    const remainRoleForSpace =
      (await this.prismaService.spaceRole.count({
        where: {
          deletedAt: null,
          spaceId: space.id,
          isManager: role.isManager,
        },
      })) > 1;
    if (!remainRoleForSpace) {
      throw new UnauthorizedException(
        `There are no other ${
          role.isManager ? 'manager' : 'participants'
        } roles for this space`,
      );
    }
    await this.prismaService.spaceRole.updateMany({
      where: { deletedAt: null, id: role.id },
      data: { deletedAt: new Date() },
    });
  }

  async participate(
    spaceRole: string,
    password: string,
    user: User,
  ): Promise<UserSpace> {
    const space = await this.prismaService.space.findFirst({
      where: {
        OR: [
          { managerPassword: password, deletedAt: null },
          { participantPassword: password, deletedAt: null },
        ],
      },
    });
    if (!space) {
      throw new UnauthorizedException('Invalid space id');
    }
    const isMember = await this.isUserMember(space.id, user.id);
    if (isMember) {
      throw new UnauthorizedException('Already member');
    }
    const role = await this.prismaService.spaceRole.findFirst({
      where: { deletedAt: null, spaceId: space.id, name: spaceRole },
    });
    if (!role) {
      throw new UnauthorizedException('Invalid role name');
    }
    const isValidRoleWithPassword = role.isManager
      ? password === space.managerPassword
      : password === space.participantPassword;
    if (!isValidRoleWithPassword) {
      throw new UnauthorizedException('Invalid password');
    }
    const userSpace = await this.prismaService.userSpace.create({
      data: {
        spaceId: space.id,
        userId: user.id,
        roleId: role.id,
      },
    });
    return userSpace;
  }

  async destroy(spaceId: string, user: User): Promise<void> {
    // const space = await this.findById(spaceId);
    const space = await this.prismaService.space.findFirst({
      where: { id: spaceId, deletedAt: null },
      select: { creatorId: true, post: true },
    });
    if (!space) {
      throw new UnauthorizedException('Invalid space id');
    }
    if (space.creatorId !== user.id) {
      throw new UnauthorizedException('Only creator can destroy space');
    }
    // remove all posts
    await Promise.all(
      space.post.map((post) => this.postService.delete(post.id, user)),
    );
    await this.prismaService.space.updateMany({
      where: { id: spaceId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async isUserMember(spaceId: string, userId: string): Promise<boolean> {
    try {
      const userSpace = await this.prismaService.userSpace
        .findFirstOrThrow({ where: { deletedAt: null, spaceId, userId } })
        .role();
      return userSpace !== null;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return false;
      }
    }
  }

  async isUserManager(spaceId: string, userId: string): Promise<boolean> {
    try {
      const userSpace = await this.prismaService.userSpace
        .findFirstOrThrow({ where: { deletedAt: null, spaceId, userId } })
        .role();
      return userSpace.isManager ? true : false;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return false;
      }
    }
  }
}
