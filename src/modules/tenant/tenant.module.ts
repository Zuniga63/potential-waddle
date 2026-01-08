import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Town } from '../towns/entities/town.entity';
import { TenantService } from './tenant.service';
import { TenantInterceptor } from './tenant.interceptor';
import { TenantAccessGuard } from './tenant-access.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Town])],
  providers: [TenantService, TenantInterceptor, TenantAccessGuard],
  exports: [TenantService, TenantInterceptor, TenantAccessGuard],
})
export class TenantModule {}
