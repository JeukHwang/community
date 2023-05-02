import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UserService {
  async create(
    surname: string,
    givenName: string,
    email: string,
    password: string,
  ) {
    const user = User.create({ surname, givenName, email, password });
    await user.save();
    return user;
  }

  findAll(): Promise<User[]> {
    return User.find();
  }

  findOne(id: number): Promise<User | null> {
    return User.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await User.softRemove(user);
  }
}
