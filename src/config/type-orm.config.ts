import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvironmentVariables } from './app-config';

export const typeOrmConfig = (configService: ConfigService<EnvironmentVariables>): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('database.host', { infer: true }),
  port: configService.get<number>('database.port', { infer: true }),
  username: configService.get('database.user', { infer: true }),
  password: configService.get('database.password', { infer: true }),
  database: configService.get('database.name', { infer: true }),
  synchronize: configService.get('database.synchronize', { infer: true }),
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  migrationsRun: true,
  autoLoadEntities: true,
});
