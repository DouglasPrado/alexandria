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
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { FileService } from './file.service';

const uploadStorage = diskStorage({
  destination: join(tmpdir(), 'alexandria-uploads'),
  filename: (_req, _file, cb) => cb(null, `upload-${randomBytes(16).toString('hex')}`),
});

const UPLOAD_LIMIT = 10 * 1024 * 1024 * 1024; // 10GB
import { ListFilesQueryDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  CurrentMember,
  type CurrentMemberPayload,
} from '../../common/decorators/current-member.decorator';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';

@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly jwtService: JwtService,
  ) {}

  /** POST /api/files/upload — Upload multipart (JWT, admin/member, UC-004) */
  @Post('upload')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage, limits: { fileSize: UPLOAD_LIMIT } }))
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
    @Query() query: ListFilesQueryDto,
  ) {
    return this.fileService.list(member.clusterId, {
      cursor: query.cursor,
      limit: query.limit,
      mediaType: query.mediaType,
      status: query.status,
      search: query.search,
      from: query.from,
      to: query.to,
    });
  }

  /** GET /api/files/:id — Detalhes do arquivo (JWT, UC-005) */
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.fileService.findById(id);
  }

  /** GET /api/files/:id/preview — Serve preview binary from storage node (JWT) */
  @Get(':id/preview')
  async preview(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
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
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.fileService.remove(id, member.clusterId);
  }

  /** GET /api/files/:id/versions — Lista versoes do arquivo (JWT) */
  @Get(':id/versions')
  async listVersions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.fileService.listVersions(id, member.clusterId);
  }

  /** POST /api/files/:id/versions — Cria nova versao (JWT, admin/member) */
  @Post(':id/versions')
  @Roles('admin', 'member')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage, limits: { fileSize: UPLOAD_LIMIT } }))
  async createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.fileService.createVersion(id, member.clusterId, member.memberId, file);
  }

  /** POST /api/files/:id/download-token — Gera token temporario para download direto */
  @Post(':id/download-token')
  @HttpCode(HttpStatus.OK)
  async createDownloadToken(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    const token = this.jwtService.sign(
      { fileId: id, sub: member.memberId, purpose: 'download' },
      { expiresIn: '10m' },
    );
    const apiBase = process.env.API_BASE_URL ?? 'http://localhost:3333/api';
    return { downloadUrl: `${apiBase}/files/${id}/download?token=${token}` };
  }

  /** GET /api/files/:id/download — Download arquivo reassemblado (JWT cookie ou token query param, UC-005) */
  @Public()
  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ) {
    // Verify auth: query param token OR cookie
    const authToken = token || (res.req as any)?.cookies?.access_token;
    if (!authToken) {
      res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Token necessario' } });
      return;
    }
    try {
      this.jwtService.verify(authToken);
    } catch {
      res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Token invalido' } });
      return;
    }

    const file = await this.fileService.download(id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.data.length);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    res.end(file.data);
  }
}
