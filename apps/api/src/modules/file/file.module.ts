import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FileRepository } from './file.repository';
import { MediaProcessor } from '../../workers/media-processor';
import { MediaPipelineWorker } from '../../workers/media-pipeline.worker';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'media-pipeline' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [FileController],
  providers: [FileService, MediaProcessor, MediaPipelineWorker, FileRepository],
  exports: [FileService, FileRepository],
})
export class FileModule {}
