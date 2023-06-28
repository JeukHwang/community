import { Body, Controller, Get, Post } from '@nestjs/common';
import { User, UserSpace } from '@prisma/client';
import { CurrentUser } from 'src/user/decorator/current.decorator';
import { CreateRequestDto } from './dto/create.dto';
import { DestroyRequestDto } from './dto/destroy.dto';
import { GetAllRoleRequestDto } from './dto/getAllRole.dto';
import { ParticipateRequestDto } from './dto/participate.dto';
import { RemoveRoleRequestDto } from './dto/removeRole.dto';
import { SpaceProfile, SpaceRoleProfile, SpaceService } from './space.service';

@Controller('space')
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

  @Get('all')
  getAll(@CurrentUser() user: User): Promise<SpaceProfile[]> {
    return this.spaceService.findAllSpaceProfile(user);
  }

  @Post('create')
  create(
    @Body() spaceInfo: CreateRequestDto,
    @CurrentUser() user: User,
  ): Promise<SpaceProfile> {
    return this.spaceService.create(spaceInfo, user);
  }

  @Post('role')
  getAllRole(@Body() body: GetAllRoleRequestDto): Promise<SpaceRoleProfile[]> {
    return this.spaceService.findSpaceRole(body.spaceId, body.password);
  }

  @Post('role/remove')
  removeRole(
    @Body() body: RemoveRoleRequestDto,
    @CurrentUser() user,
  ): Promise<void> {
    return this.spaceService.removeSpaceRole(
      body.spaceId,
      body.spaceRole,
      user,
    );
  }

  @Post('participate')
  participate(
    @Body() body: ParticipateRequestDto,
    @CurrentUser() user: User,
  ): Promise<UserSpace> {
    const { spaceRole, password } = body;
    return this.spaceService.participate(spaceRole, password, user);
  }

  @Post('destroy')
  destroy(
    @Body() body: DestroyRequestDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.spaceService.destroy(body.spaceId, user);
  }
}
