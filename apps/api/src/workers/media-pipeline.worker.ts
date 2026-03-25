import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MediaProcessor } from './media-processor';

/**
 * BullMQ Worker — consome jobs da fila "media-pipeline".
 * Fonte: docs/backend/06-services.md (FileService → BullMQ → Media Worker)
 *
 * Cada job contem: { fileId: string, buffer: string (base64) }
 * Worker decodifica buffer e chama MediaProcessor.processFile().
 */
@Processor('media-pipeline')
export class MediaPipelineWorker extends WorkerHost {
  constructor(private readonly mediaProcessor: MediaProcessor) {
    super();
  }

  async process(job: Job<{ fileId: string; buffer: string }>): Promise<void> {
    const { fileId, buffer } = job.data;
    const fileBuffer = Buffer.from(buffer, 'base64');
    await this.mediaProcessor.processFile(fileId, fileBuffer);
  }
}
