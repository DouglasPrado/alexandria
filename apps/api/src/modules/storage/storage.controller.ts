import { Controller, Get } from '@nestjs/common';
import { StorageService } from './storage.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /** GET /api/storage/stats — Estatísticas de deduplicação (JWT+admin) */
  @Get('stats')
  @Roles('admin')
  async stats() {
    return this.storageService.getDedupStats();
  }
}
