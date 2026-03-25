import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentMember,
  type CurrentMemberPayload,
} from '../../common/decorators/current-member.decorator';
import type { Response } from 'express';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /** POST /api/files/upload — Upload multipart (JWT, admin/member, UC-004) */
  @Post('upload')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.fileService.upload(member.clusterId, member.memberId, file);
  }

  /** GET /api/files — Listar arquivos com cursor pagination (JWT, UC-010) */
  @Get()
  async list(
    @CurrentMember() member: CurrentMemberPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('mediaType') mediaType?: string,
    @Query('status') status?: string,
  ) {
    return this.fileService.list(member.clusterId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
      mediaType,
      status,
    });
  }

  /** GET /api/files/:id — Detalhes do arquivo (JWT, UC-005) */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.fileService.findById(id);
  }

  /** GET /api/files/:id/preview — Serve preview binary from storage node (JWT) */
  @Get(':id/preview')
  async preview(@Param('id') id: string, @Res() res: Response) {
    const preview = await this.fileService.getPreview(id);

    const mimeTypes: Record<string, string> = {
      webp: 'image/webp',
      mp4: 'video/mp4',
      png: 'image/png',
    };

    res.setHeader('Content-Type', mimeTypes[preview.format] || 'application/octet-stream');
    res.setHeader('Content-Length', preview.data.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(preview.data);
  }

  /** GET /api/files/:id/download — Download arquivo (JWT, UC-005) */
  @Get(':id/download')
  async download(@Param('id') id: string) {
    await this.fileService.findById(id);
    return { message: 'Download endpoint — full reassembly not yet implemented' };
  }
}
