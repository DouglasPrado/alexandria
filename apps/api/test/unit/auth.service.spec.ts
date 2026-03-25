import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as argon2 from 'argon2';

/**
 * Testes do AuthService — login, refresh, JWT.
 * Fonte: docs/backend/05-api-contracts.md (POST /api/auth/login, POST /api/auth/refresh)
 * Fonte: docs/backend/08-middlewares.md (JwtAuthGuard)
 * Fonte: docs/backend/11-permissions.md (RBAC, JWT claims)
 */

// Mock do PrismaService
const mockPrisma = {
  member: {
    findFirst: jest.fn(),
  },
};

// Mock do JwtService
const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('login()', () => {
    const validPassword = 'SenhaSegura123';
    let validHash: string;

    beforeAll(async () => {
      validHash = await argon2.hash(validPassword);
    });

    it('should return member data and accessToken on valid credentials', async () => {
      mockPrisma.member.findFirst.mockResolvedValue({
        id: 'member-1',
        clusterId: 'cluster-1',
        name: 'Douglas Prado',
        email: 'douglas@familia.com',
        passwordHash: validHash,
        role: 'admin',
      });

      const result = await authService.login({
        email: 'douglas@familia.com',
        password: validPassword,
      });

      expect(result.member.id).toBe('member-1');
      expect(result.member.name).toBe('Douglas Prado');
      expect(result.member.email).toBe('douglas@familia.com');
      expect(result.member.role).toBe('admin');
      expect(result.member.clusterId).toBe('cluster-1');
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('should sign JWT with memberId, clusterId, and role', async () => {
      mockPrisma.member.findFirst.mockResolvedValue({
        id: 'member-1',
        clusterId: 'cluster-1',
        name: 'Douglas',
        email: 'douglas@familia.com',
        passwordHash: validHash,
        role: 'admin',
      });

      await authService.login({ email: 'douglas@familia.com', password: validPassword });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'member-1',
        clusterId: 'cluster-1',
        role: 'admin',
      });
    });

    it('should throw UnauthorizedException on non-existent email', async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@familia.com', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      mockPrisma.member.findFirst.mockResolvedValue({
        id: 'member-1',
        clusterId: 'cluster-1',
        name: 'Douglas',
        email: 'douglas@familia.com',
        passwordHash: validHash,
        role: 'admin',
      });

      await expect(
        authService.login({ email: 'douglas@familia.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh()', () => {
    it('should return new accessToken for valid token payload', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'member-1',
        clusterId: 'cluster-1',
        role: 'admin',
      });

      mockPrisma.member.findFirst.mockResolvedValue({
        id: 'member-1',
        clusterId: 'cluster-1',
        role: 'admin',
      });

      const result = await authService.refresh('valid-token');
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException on invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(authService.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if member no longer exists', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'deleted-member',
        clusterId: 'cluster-1',
        role: 'admin',
      });

      mockPrisma.member.findFirst.mockResolvedValue(null);

      await expect(authService.refresh('valid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateMember()', () => {
    it('should return member payload for valid JWT claims', async () => {
      mockPrisma.member.findFirst.mockResolvedValue({
        id: 'member-1',
        clusterId: 'cluster-1',
        name: 'Douglas',
        email: 'douglas@familia.com',
        role: 'admin',
      });

      const result = await authService.validateMember('member-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('member-1');
    });

    it('should return null for non-existent member', async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null);

      const result = await authService.validateMember('non-existent');
      expect(result).toBeNull();
    });
  });
});
