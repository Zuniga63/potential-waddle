import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';

import { SwaggerTags } from 'src/config';
import { UsersService } from '../services';
import { UserDto } from '../dto/user.dto';

@Controller('users')
@ApiTags(SwaggerTags.Users)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ description: 'Return all users', type: [UserDto] })
  findAll() {
    return this.usersService.findAll();
  }
}
