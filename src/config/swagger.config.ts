import { DocumentBuilder } from '@nestjs/swagger';
import { SwaggerTags } from './swagger-tags.enum';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Binntu')
  .setDescription('This is an API for managment the auth users')
  .setVersion('1.0')
  .addTag(SwaggerTags.Auth, 'End point for register and login')
  .addTag(SwaggerTags.Profile, 'Route for user profile')
  .addTag(SwaggerTags.Cloudinary, 'Route for cloudinary administration')
  .addTag(SwaggerTags.Users, 'Route for user administration')
  .addTag(SwaggerTags.Roles, 'Route for role administration')
  .addTag(SwaggerTags.Municipality, 'Route for municipality administration')
  .addTag(SwaggerTags.Town, 'Route for town administration')
  .addTag(SwaggerTags.Models, 'Route for model administration')
  .addTag(SwaggerTags.Facilities, 'Route for facilities administration')
  .addTag(SwaggerTags.Categories, 'Route for categories administration')
  .addTag(SwaggerTags.Images, 'Route for images administration')
  .addTag(SwaggerTags.Seeds, 'Route for seeds administration')
  .addBearerAuth()
  .build();
