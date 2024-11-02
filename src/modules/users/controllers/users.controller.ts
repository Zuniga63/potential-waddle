import { ApiTags } from '@nestjs/swagger';
import { Controller } from '@nestjs/common';

import { SwaggerTags } from 'src/config';
import { UsersService } from '../services';

@Controller('users')
@ApiTags(SwaggerTags.Users)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
}
