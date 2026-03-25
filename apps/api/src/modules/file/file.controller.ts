import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentMember, type CurrentMemberPayload } from '../../common/decorators/current-member.decorator';

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

  /** GET /api/files/:id/preview — Preview/thumbnail (JWT) */
  @Get(':id/preview')
  async preview(@Param('id') id: string) {
    // Placeholder — will serve preview binary in media pipeline feature
    await this.fileService.findById(id); // validates file exists
    return { message: 'Preview endpoint — pipeline not yet implemented' };
  }

  /** GET /api/files/:id/download — Download arquivo (JWT, UC-005) */
  @Get(':id/download')
  async download(@Param('id') id: string) {
    // Placeholder — will stream reassembled chunks in storage integration feature
    await this.fileService.findById(id); // validates file exists
    return { message: 'Download endpoint — storage integration not yet implemented' };
  }
}
