import { User } from 'src/users/entities/user.entity';

export interface AuthLoginInterfaceReturn {
  access_token: string;
  refresh_token: string;
  user: Partial<User>;
}
