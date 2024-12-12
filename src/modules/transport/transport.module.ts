import { Module } from '@nestjs/common';
import { TransportService } from './transport.service';
import { TransportController } from './transport.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transport } from './entities';

@Module({
  controllers: [TransportController],
  providers: [TransportService],
  imports: [TypeOrmModule.forFeature([Transport])],
})
export class TransportModule {}
