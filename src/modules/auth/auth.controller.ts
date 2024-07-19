import { Controller, Post, Body, UseGuards, Ip, Headers, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiHeaders,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { AuthService } from './services/auth.service';
import { CreateUserDto } from '../users/dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SwaggerTags } from 'src/config';
import { AuthResponseSchema } from './schemas/swagger.schema';
import { UserDto } from '../users/dto/user.dto';
import { ValidationErrorDto } from '../common/dto/validation-error.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { GoogleOauthGuard } from './guards';

@Controller('auth')
@ApiExtraModels(UserDto)
@ApiTags(SwaggerTags.Auth)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * LOGIN LOCAL USER
  // * ----------------------------------------------------------------------------------------------------------------
  @Post('local/signin')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'Login User',
    description: 'Public end point for get access token and user info',
  })
  @ApiBody({ type: LoginUserDto })
  @ApiHeaders([{ name: 'user-agent', required: false }])
  @ApiOkResponse({
    description: 'The user has been successfully login.',
    schema: AuthResponseSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Email or password invalid.' })
  async localLogin(@GetUser() user: User, @Ip() ip: string, @Headers('user-agent') userAgent: string) {
    return this.authService.signIn({ user, ip, userAgent });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * REGISTER LOCAL USER
  // * ----------------------------------------------------------------------------------------------------------------
  @Post('local/signup')
  @ApiOperation({
    summary: 'Register user',
    description: 'Public end point for create the user and return access token',
  })
  @ApiCreatedResponse({
    description: 'The user has been successfully created.',
    type: UserDto,
  })
  @ApiBadRequestResponse({
    description: 'Some of the submitted field have not passed primary validation',
    type: ValidationErrorDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Has not passed the validation for saving in the database',
    type: ValidationErrorDto,
  })
  localRegister(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GOOGLE OAUTH
  // * ----------------------------------------------------------------------------------------------------------------

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  @ApiOperation({
    summary: 'Google Oauth',
    description: 'Public end point for redirect to google login',
  })
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  @ApiOperation({
    summary: 'Google Oauth',
    description: 'Public end point for get access token and user info',
  })
  @ApiHeaders([{ name: 'user-agent', required: false }])
  @ApiQuery({ name: 'id_token', required: false })
  @ApiOkResponse({
    description: 'The user has been successfully login.',
    schema: AuthResponseSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Email or password invalid.' })
  async googleLogin(
    @GetUser() user: User,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
    @Query('id_token') id_token?: string,
  ) {
    if (user) return this.authService.signIn({ user, ip, userAgent });
    return this.authService.signInFromGoogleTokenId({ idToken: id_token, ip, userAgent });
  }
}
