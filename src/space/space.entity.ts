import { User } from 'src/user/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Space {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  managerPassword: string;

  @Column()
  paticipantPassword: string;

  @Column()
  name: string;

  @Column()
  profilePhoto: string;

  @ManyToOne((type) => User, (user) => user.spaces)
  createrUserId: number;

  @Column({ default: false })
  isDeleted: boolean;
}
