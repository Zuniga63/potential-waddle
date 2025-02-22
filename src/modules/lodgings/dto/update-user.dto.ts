import { IsUUID } from 'class-validator';

export class UpdateLodgingUserDto {
  @IsUUID()
  userId: string;
}
