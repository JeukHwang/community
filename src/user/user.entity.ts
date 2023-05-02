import { Space } from 'src/space/space.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserProfile = {
  email: string;
  name: string;
  profilePhoto: string;
};

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ default: 'https://sparcs.netlify.app/img/symbol.svg' })
  profilePhoto: string;

  @OneToMany((type) => Space, (space) => space.createrUserId)
  spaces: Space[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toProfile(): UserProfile {
    return {
      email: this.email,
      name: this.name,
      profilePhoto: this.profilePhoto,
    };
  }
}