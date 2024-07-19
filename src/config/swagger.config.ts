import { DocumentBuilder } from '@nestjs/swagger';
import { SwaggerTags } from './swagger-tags.enum';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Nest Auth Template')
  .setDescription('This is an API for managment the auth users')
  .setVersion('1.0')
  .addTag(SwaggerTags.Auth, 'End point for register and login')
  .addTag(SwaggerTags.Profile, 'Route for user profile')
  .addTag(SwaggerTags.Cloudinary, 'Route for cloudinary administration')
  .addTag(SwaggerTags.Users, 'Route for user administration')
  .addTag(SwaggerTags.Roles, 'Route for role administration')
  .addBearerAuth()
  .build();
