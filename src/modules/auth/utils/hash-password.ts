import { genSaltSync, hashSync } from 'bcrypt';

export function hashPassword(password: string): string {
  const saltRounds = 10;
  const salt = genSaltSync(saltRounds);
  return hashSync(password, salt);
}
