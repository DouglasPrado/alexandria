import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FileRepository } from './file.repository';
import { MediaProcessor } from '../../workers/media-processor';
import { MediaPipelineWorker } from '../../workers/media-pipeline.worker';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'media-pipeline' }),
  ],
  controllers: [FileController],
  providers: [FileService, MediaProcessor, MediaPipelineWorker, FileRepository],
  exports: [FileService, FileRepository],
})
export class FileModule {}
