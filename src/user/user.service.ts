import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UserService {
  async create(
    surname: string,
    givenName: string,
    email: string,
    password: string,
  ): Promise<User> {
    const user = User.create({ surname, givenName, email, password });
    await user.save();
    return user;
  }

  findAll(): Promise<User[]> {
    return User.find();
  }

  findById(id: string): Promise<User | null> {
    return User.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return User.findOneBy({ email });
  }

  async removeById(id: string): Promise<void> {
    const user = await this.findById(id);
    await User.softRemove(user);
  }
}
