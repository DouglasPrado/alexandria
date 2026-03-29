import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateClusterDto } from '../../src/modules/cluster/dto/create-cluster.dto';
import { CreateInviteDto } from '../../src/modules/member/dto/create-invite.dto';
import { AcceptInviteDto } from '../../src/modules/member/dto/accept-invite.dto';
import { RecoverClusterDto } from '../../src/modules/cluster/dto/recover-cluster.dto';

/**
 * Testes de validacao de DTOs.
 * Fonte: docs/backend/10-validation.md
 *
 * - Email: @IsEmail, @MaxLength(255), @Transform(lowercase + trim)
 * - Password: @MinLength(8), @Matches(1 maiuscula + 1 numero)
 * - SeedPhrase: exatamente 12 palavras
 * - Name: @Transform(trim)
 */

describe('DTO Validation', () => {
  describe('CreateClusterDto', () => {
    it('should transform admin.email to lowercase and trim', () => {
      const dto = plainToInstance(CreateClusterDto, {
        name: 'Familia Prado',
        admin: { name: 'Douglas', email: '  DOUGLAS@Email.COM  ', password: 'Senha123' },
      });
      expect(dto.admin.email).toBe('douglas@email.com');
    });

    it('should trim admin.name', () => {
      const dto = plainToInstance(CreateClusterDto, {
        name: '  Familia Prado  ',
        admin: { name: '  Douglas  ', email: 'test@email.com', password: 'Senha123' },
      });
      expect(dto.admin.name).toBe('Douglas');
    });

    it('should reject email longer than 255 chars', async () => {
      const longEmail = 'a'.repeat(250) + '@b.com';
      const dto = plainToInstance(CreateClusterDto, {
        name: 'Test',
        admin: { name: 'Test', email: longEmail, password: 'Senha123' },
      });
      const errors = await validate(dto);
      const emailErrors = errors
        .flatMap((e) => e.children || [])
        .filter((c) => c.property === 'email');
      expect(emailErrors.length).toBeGreaterThan(0);
    });

    it('should reject password without uppercase letter', async () => {
      const dto = plainToInstance(CreateClusterDto, {
        name: 'Test',
        admin: { name: 'Test', email: 'test@email.com', password: 'senha123' },
      });
      const errors = await validate(dto);
      const pwErrors = errors
        .flatMap((e) => e.children || [])
        .filter((c) => c.property === 'password');
      expect(pwErrors.length).toBeGreaterThan(0);
    });

    it('should reject password without number', async () => {
      const dto = plainToInstance(CreateClusterDto, {
        name: 'Test',
        admin: { name: 'Test', email: 'test@email.com', password: 'SenhaForte' },
      });
      const errors = await validate(dto);
      const pwErrors = errors
        .flatMap((e) => e.children || [])
        .filter((c) => c.property === 'password');
      expect(pwErrors.length).toBeGreaterThan(0);
    });

    it('should accept valid password with uppercase + number', async () => {
      const dto = plainToInstance(CreateClusterDto, {
        name: 'Test',
        admin: { name: 'Test', email: 'test@email.com', password: 'Senha123' },
      });
      const errors = await validate(dto);
      const pwErrors = errors
        .flatMap((e) => e.children || [])
        .filter((c) => c.property === 'password');
      expect(pwErrors.length).toBe(0);
    });
  });

  describe('CreateInviteDto', () => {
    it('should transform email to lowercase and trim', () => {
      const dto = plainToInstance(CreateInviteDto, {
        email: '  MARIA@Email.COM  ',
        role: 'member',
      });
      expect(dto.email).toBe('maria@email.com');
    });

    it('should reject email longer than 255 chars', async () => {
      const dto = plainToInstance(CreateInviteDto, {
        email: 'a'.repeat(250) + '@b.com',
        role: 'member',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });
  });

  describe('AcceptInviteDto', () => {
    it('should reject password without uppercase + number', async () => {
      const dto = plainToInstance(AcceptInviteDto, {
        name: 'Maria',
        password: 'senhafraca',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should accept valid password', async () => {
      const dto = plainToInstance(AcceptInviteDto, {
        name: 'Maria',
        password: 'Senha123',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(false);
    });

    it('should trim name', () => {
      const dto = plainToInstance(AcceptInviteDto, {
        name: '  Maria  ',
        password: 'Senha123',
      });
      expect(dto.name).toBe('Maria');
    });
  });

  describe('RecoverClusterDto', () => {
    it('should reject seed phrase with less than 12 words', async () => {
      const dto = plainToInstance(RecoverClusterDto, {
        seedPhrase: 'abandon abandon abandon',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'seedPhrase')).toBe(true);
    });

    it('should reject seed phrase with more than 12 words', async () => {
      const dto = plainToInstance(RecoverClusterDto, {
        seedPhrase: 'abandon '.repeat(15).trim(),
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'seedPhrase')).toBe(true);
    });

    it('should accept seed phrase with exactly 12 words', async () => {
      const dto = plainToInstance(RecoverClusterDto, {
        seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'seedPhrase')).toBe(false);
    });

    it('should trim seed phrase', () => {
      const dto = plainToInstance(RecoverClusterDto, {
        seedPhrase: '  abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about  ',
      });
      expect(dto.seedPhrase).not.toMatch(/^\s/);
    });
  });
});
