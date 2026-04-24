import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities';

import { TermsDocument, TermsAcceptance } from './entities';
import { TermsService } from './services';
import { TermsController } from './controllers';

@Module({
  imports: [TypeOrmModule.forFeature([TermsDocument, TermsAcceptance, User])],
  controllers: [TermsController],
  providers: [TermsService],
  exports: [TermsService],
})
export class TermsModule {}
