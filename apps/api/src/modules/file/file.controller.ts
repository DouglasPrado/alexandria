import {
  Controller,
  Post,
  Get,
  Delete,
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

  /** GET /api/files — Listar arquivos com cursor pagination e busca (JWT, UC-010) */
  @Get()
  async list(
    @CurrentMember() member: CurrentMemberPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('mediaType') mediaType?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.fileService.list(member.clusterId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
      mediaType,
      status,
      search,
      from,
      to,
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

  /** DELETE /api/files/:id — Deletar arquivo (JWT, admin/member) */
  @Delete(':id')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.fileService.remove(id, member.clusterId);
  }

  /** GET /api/files/:id/versions — Lista versoes do arquivo (JWT) */
  @Get(':id/versions')
  async listVersions(
    @Param('id') id: string,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.fileService.listVersions(id, member.clusterId);
  }

  /** POST /api/files/:id/versions — Cria nova versao (JWT, admin/member) */
  @Post(':id/versions')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  async createVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.fileService.createVersion(id, member.clusterId, member.memberId, file);
  }

  /** GET /api/files/:id/download — Download arquivo reassemblado (JWT, UC-005) */
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const file = await this.fileService.download(id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.data.length);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    res.end(file.data);
  }
}
