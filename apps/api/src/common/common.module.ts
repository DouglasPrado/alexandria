import { Global, Module } from '@nestjs/common';
import { SessionKeyService } from './services/session-key.service';

@Global()
@Module({
  providers: [SessionKeyService],
  exports: [SessionKeyService],
})
export class CommonModule {}
