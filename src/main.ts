import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './modules/common/filters';
import { appConfig, swaggerConfig, validationPipeConfig } from './config';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const { http } = appConfig();

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Set global validation pipe
  app.useGlobalPipes(new ValidationPipe(validationPipeConfig));

  // Set global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  // Set Swagger
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { docExpansion: 'none' } });

  await app.listen(http.port);
  logger.log(`Application listening on ${http.host}:${http.port}`);
}
bootstrap();
