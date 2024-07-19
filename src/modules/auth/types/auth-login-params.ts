import { User } from 'src/modules/users/entities/user.entity';

export type AuthLoginParams = {
  user: User;
  ip: string;
  userAgent: string;
};
