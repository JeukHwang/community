import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Space, SpaceRole, User, UserSpace } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRequestDto } from './dto/create.dto';

export type SpaceProfile = {
  id: string;
  name: string;
  profilePhoto: string;
  // memberCount: number
};
export type SpaceRoleProfile = {
  id: string;
  name: string;
  isManager: boolean;
};

export function toSpaceProfile(space: Space): SpaceProfile {
  return {
    id: space.id,
    name: space.name,
    profilePhoto: space.profilePhoto,
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
  constructor(private prismaService: PrismaService) {}

  private async validateSpaceInfo(spaceInfo: CreateRequestDto): Promise<void> {
    const isNameUnique =
      (await this.prismaService.space.count({
        where: { name: spaceInfo.name },
      })) == 0;
    if (!isNameUnique) {
      throw new UnauthorizedException('Duplicated name');
    }
    const isPasswordSame =
      spaceInfo.managerPassword === spaceInfo.participantPassword;
    if (isPasswordSame) {
      throw new UnauthorizedException('Use two different passwords');
    }

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
      throw error;
    }

    const defaultProfilePhoto = 'https://sparcs.org/img/symbol.svg';
    const managerPassword = await bcrypt.hash(spaceInfo.managerPassword, 10);
    const participantPassword = await bcrypt.hash(
      spaceInfo.participantPassword,
      10,
    );
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
    return toSpaceProfile(space);
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

  async findAllSpaceProfile(): Promise<SpaceProfile[]> {
    const space = await this.prismaService.space.findMany({
      where: { deletedAt: null },
    });
    return space.map(toSpaceProfile);
  }

  async findSpaceRole(
    spaceName: string,
    password: string,
  ): Promise<SpaceRoleProfile[]> {
    const space = await this.findByName(spaceName);
    if (!space) {
      throw new UnauthorizedException('Invalid space name');
    }
    const isManagerPassword = await bcrypt.compare(
      password,
      space.managerPassword,
    );
    const isParticipantPassword = await bcrypt.compare(
      password,
      space.participantPassword,
    );
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

  async removeSpaceRole(spaceName: string, spaceRole: string, user: User) {
    const space = await this.findByName(spaceName);
    if (!space) {
      throw new UnauthorizedException('Invalid space name');
    }
    const role = await this.prismaService.spaceRole.findFirst({
      where: { deletedAt: null, spaceId: space.id, name: spaceRole },
    });
    if (!role) {
      throw new UnauthorizedException('Invalid role name');
    }
    const userSpace = await this.prismaService.userSpace.findFirst({
      where: {
        deletedAt: null,
        spaceId: space.id,
        userId: user.id,
      },
      include: {
        role: {
          select: {
            isManager: true,
          },
        },
      },
    });

    const amIManager = userSpace.role.isManager;
    if (!amIManager) {
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
    spaceName: string,
    spaceRole: string,
    password: string,
    user: User,
  ): Promise<UserSpace> {
    const space = await this.findByName(spaceName);
    if (!space) {
      throw new UnauthorizedException('Invalid space name');
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
      ? await bcrypt.compare(password, space.managerPassword)
      : await bcrypt.compare(password, space.participantPassword);
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

  async destroy(spaceName: string, user: User): Promise<void> {
    const space = await this.findByName(spaceName);
    if (!space) {
      throw new UnauthorizedException('Invalid space id');
    }
    if (space.creatorId !== user.id) {
      throw new UnauthorizedException('Only creator can destroy space');
    }
    await this.prismaService.space.updateMany({
      where: { deletedAt: null, id: space.id },
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
