import { Controller, Post, Body, UseGuards, Ip, Headers, Get, Query, UnauthorizedException } from '@nestjs/common';
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
import { PasswordResetService } from './services/password-reset.service';
import { CreateUserDto } from '../users/dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SwaggerTags } from 'src/config';
import { AuthResponseSchema } from './schemas/swagger.schema';
import { UserDto } from '../users/dto/user.dto';
import { ValidationErrorDto } from '../common/dto/validation-error.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { GoogleOauthGuard } from './guards';
import { Auth } from './decorators';

@Controller('auth')
@ApiExtraModels(UserDto)
@ApiTags(SwaggerTags.Auth)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

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
  @ApiQuery({ name: 'signInType', required: false })
  @ApiOkResponse({
    description: 'The user has been successfully login.',
    schema: AuthResponseSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Email or password invalid.' })
  async localLogin(
    @GetUser() user: User,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Query('signInType') signInType?: string,
  ) {
    return this.authService.signIn({ user, ip, userAgent, signInType });
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
    if (id_token) return this.authService.signInFromGoogleTokenId({ idToken: id_token, ip, userAgent });
    throw new UnauthorizedException('Invalid Google ID Token');
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * VERIFY TOKEN
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('verify-token')
  @Auth()
  @ApiOperation({
    summary: 'Verify Token',
    description: 'Public end point for verify the token',
  })
  @ApiOkResponse({
    description: 'The token has been successfully verified.',
    schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
  })
  @ApiBadRequestResponse({ description: 'Invalid token.' })
  async verifyToken() {
    return { ok: true };
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * FORGOT PASSWORD
  // * ----------------------------------------------------------------------------------------------------------------
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Forgot Password',
    description: 'Request a password reset link. An email will be sent if the account exists.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({
    description: 'Password reset email has been sent (if account exists).',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
    type: ValidationErrorDto,
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.passwordResetService.createPasswordResetToken(forgotPasswordDto.email);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * RESET PASSWORD
  // * ----------------------------------------------------------------------------------------------------------------
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset Password',
    description: 'Reset the password using a valid reset token.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({
    description: 'Password has been reset successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired token, or password validation failed',
    type: ValidationErrorDto,
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }
}
