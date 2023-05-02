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
  surname: string;
  givenName: string;
  profilePhoto: string;
};

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  surname: string;

  @Column()
  givenName: string;

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
      surname: this.surname,
      givenName: this.givenName,
      profilePhoto: this.profilePhoto,
    };
  }
}
