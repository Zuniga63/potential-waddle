import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param } from '@nestjs/common';

import { SwaggerTags } from 'src/config';
import { UsersService } from '../services';
import { UserDto } from '../dto/user.dto';
import { RestaurantDto } from 'src/modules/restaurants/dto';
import { CommerceIndexDto } from 'src/modules/commerce/dto';
import { LodgingIndexDto } from 'src/modules/lodgings/dto';
import { UserGuideDto } from '../dto/user-guide.dto';
import { UserTransportDto } from '../dto/user-transport.dto';

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

  @Get(':id/guide')
  @ApiOperation({ summary: 'Get guide by user ID' })
  @ApiOkResponse({ description: 'Return all guide for a user', type: [UserGuideDto] })
  findUserGuide(@Param('id') userId: string) {
    return this.usersService.getUserGuide(userId);
  }

  @Get(':id/lodgings')
  @ApiOperation({ summary: 'Get lodgings by user ID' })
  @ApiOkResponse({ description: 'Return all lodgings for a user', type: [LodgingIndexDto] })
  findUserLodgings(@Param('id') userId: string) {
    return this.usersService.getUserLodgings(userId);
  }

  @Get(':id/commerce')
  @ApiOperation({ summary: 'Get commerce by user ID' })
  @ApiOkResponse({ description: 'Return all commerce for a user', type: [CommerceIndexDto] })
  findUserCommerce(@Param('id') userId: string) {
    return this.usersService.getUserCommerce(userId);
  }

  @Get(':id/restaurants')
  @ApiOperation({ summary: 'Get restaurants by user ID' })
  @ApiOkResponse({ description: 'Return all restaurants for a user', type: [RestaurantDto] })
  findUserRestaurants(@Param('id') userId: string) {
    return this.usersService.getUserRestaurants(userId);
  }

  @Get(':id/transport')
  @ApiOperation({ summary: 'Get transport by user ID' })
  @ApiOkResponse({ description: 'Return all transport for a user', type: [UserTransportDto] })
  findUserTransport(@Param('id') userId: string) {
    return this.usersService.getUserTransport(userId);
  }
}
