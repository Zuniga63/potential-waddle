import {
  Controller,
  Post,
  Body,
  Get,
  UploadedFile,
  UseInterceptors,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './services/auth.service';
import { SwaggerTags } from 'src/config';
import { UserDto } from '../users/dto/user.dto';
import { Auth } from './decorators';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ProfilePhotoDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '../users/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SessionService } from './services';

@Controller('auth/profile')
@Auth()
@ApiExtraModels(UserDto)
@ApiTags(SwaggerTags.Profile)
export class ProfileController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET USER PROFILE
  // * ----------------------------------------------------------------------------------------------------------------
  @Get()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'This end recover the info of one user',
  })
  @ApiOkResponse({
    description: 'User Info',
  })
  getProfile(@GetUser() user: User) {
    return new UserDto(user);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE USER PROFILE PHOTO
  // * ----------------------------------------------------------------------------------------------------------------
  @Post('photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ProfilePhotoDto })
  @ApiOkResponse({
    description: 'User Info',
    type: UserDto,
  })
  @ApiBadRequestResponse({ description: 'The image can not uploaded' })
  updateProfilePhoto(@UploadedFile() file: Express.Multer.File, @GetUser() user: User) {
    return this.authService.updateProfilePhoto(user, file);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE USER PROFILE PHOTO
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete('photo')
  @ApiOperation({ summary: 'Delete user profile photo', description: 'This end point delete the user profile photo' })
  @ApiOkResponse({ description: 'The image has been deleted' })
  @ApiBadRequestResponse({ description: 'The image can not deleted' })
  destroyProfilePhoto(@GetUser() user: User) {
    return this.authService.destroyProfilePhoto(user);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * CHANGE USER PASSWORD
  // * ----------------------------------------------------------------------------------------------------------------
  @Put('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change user password', description: 'This end point change the current password' })
  @ApiNoContentResponse({ description: 'Password has been changed' })
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @GetUser() user: User) {
    return this.authService.changePassword(user, changePasswordDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET USER SESSIONS
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('sessions')
  @ApiOperation({ summary: 'Get user sessions', description: 'This end point get all the user sessions' })
  @ApiOkResponse({ description: 'User sessions' })
  getSessions(@GetUser() user: User) {
    return this.sessionService.findAllByUserId(user.id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE USER SESSION
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Delete user session', description: 'This end point delete a user session' })
  @ApiNoContentResponse({ description: 'Session has been deleted' })
  deleteSession(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.sessionService.deleteSession(sessionId);
  }
}
