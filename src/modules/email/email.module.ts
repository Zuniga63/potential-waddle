import { Global, Module } from '@nestjs/common';
import { ResendService } from './services/resend.service';

@Global()
@Module({
  providers: [ResendService],
  exports: [ResendService],
})
export class EmailModule {}
