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
  .addTag(SwaggerTags.Places, 'Route for places administration')
  .addTag(SwaggerTags.Lodgings, 'Route for lodgings administration')
  .addTag(SwaggerTags.Experiences, 'Route for experiences administration')
  .addTag(SwaggerTags.Restaurants, 'Route for restaurants administration')
  .addTag(SwaggerTags.Reviews, 'Route for reviews administration')
  .addTag(SwaggerTags.PublicReviews, 'Route for public reviews administration')
  .addTag(SwaggerTags.Seeds, 'Route for seeds administration')
  .addTag(SwaggerTags.ImageResources, 'Route for image resources administration')
  .addTag(SwaggerTags.Transport, 'Route for transport administration')
  .addTag(SwaggerTags.Commerce, 'Route for commerce administration')
  .addTag(SwaggerTags.Languages, 'Route for languages administration')
  .addTag(SwaggerTags.Guides, 'Route for guides administration')
  .addTag(SwaggerTags.GooglePlaces, 'Route for google places administration')
  .addBearerAuth()
  .build();
