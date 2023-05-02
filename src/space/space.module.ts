import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Space } from './space.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Space])],
  providers: [],
  controllers: [],
})
export class SpaceModule {}
