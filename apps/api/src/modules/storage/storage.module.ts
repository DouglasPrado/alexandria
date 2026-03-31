import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { ChunkRepository, ChunkReplicaRepository, ManifestRepository } from './chunk.repository';
import { MemberModule } from '../member/member.module';

@Global()
@Module({
  imports: [MemberModule],
  controllers: [StorageController],
  providers: [StorageService, ChunkRepository, ChunkReplicaRepository, ManifestRepository],
  exports: [StorageService, ChunkRepository, ChunkReplicaRepository, ManifestRepository],
})
export class StorageModule {}
