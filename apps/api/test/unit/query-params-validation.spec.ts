import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ListFilesQueryDto } from '../../src/modules/file/dto/list-files-query.dto';

/**
 * Testes de validacao de query params.
 * Fonte: docs/backend/10-validation.md (limit min 1 max 100 default 20, mediaType enum)
 */

describe('ListFilesQueryDto', () => {
  it('should accept valid query with all params', async () => {
    const dto = plainToInstance(ListFilesQueryDto, {
      limit: '20',
      mediaType: 'photo',
      search: 'vacation',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject limit > 100', async () => {
    const dto = plainToInstance(ListFilesQueryDto, { limit: '200' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('should reject limit < 1', async () => {
    const dto = plainToInstance(ListFilesQueryDto, { limit: '0' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('should accept valid mediaType values', async () => {
    for (const type of ['photo', 'video', 'document', 'archive']) {
      const dto = plainToInstance(ListFilesQueryDto, { mediaType: type });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'mediaType')).toBe(false);
    }
  });

  it('should reject invalid mediaType', async () => {
    const dto = plainToInstance(ListFilesQueryDto, { mediaType: 'music' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'mediaType')).toBe(true);
  });

  it('should transform limit string to number', () => {
    const dto = plainToInstance(ListFilesQueryDto, { limit: '50' });
    expect(dto.limit).toBe(50);
  });

  it('should accept empty query (all optional)', async () => {
    const dto = plainToInstance(ListFilesQueryDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
