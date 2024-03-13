import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

export abstract class UsersRepository {
  abstract store(data: User): Promise<User>;
  abstract findByEmail(email: string): Promise<User>;
  abstract update(id: string, data: UpdateUserDto): Promise<User>
}
