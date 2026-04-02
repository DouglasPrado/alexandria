import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { readFile, unlink } from 'node:fs/promises';
import { MediaProcessor } from './media-processor';

/**
 * BullMQ Worker — consome jobs da fila "media-pipeline".
 * Fonte: docs/backend/06-services.md (FileService → BullMQ → Media Worker)
 *
 * Cada job contem:
 *   - { fileId, filePath } — arquivo em disco (disk storage, para arquivos grandes)
 *   - { fileId, buffer } — base64 em memoria (fallback para testes/compatibilidade)
 *
 * Worker le o arquivo e chama MediaProcessor.processFile().
 */
@Processor('media-pipeline')
export class MediaPipelineWorker extends WorkerHost {
  constructor(private readonly mediaProcessor: MediaProcessor) {
    super();
  }

  async process(job: Job<{ fileId: string; buffer?: string; filePath?: string }>): Promise<void> {
    const { fileId, buffer, filePath } = job.data;

    let fileBuffer: Buffer;
    if (filePath) {
      fileBuffer = await readFile(filePath);
      // Clean up temp file after reading
      await unlink(filePath).catch(() => {});
    } else if (buffer) {
      fileBuffer = Buffer.from(buffer, 'base64');
    } else {
      throw new Error(`Job ${job.id} has no buffer or filePath`);
    }

    await this.mediaProcessor.processFile(fileId, fileBuffer);
  }
}
