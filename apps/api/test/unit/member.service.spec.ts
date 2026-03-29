import { Test } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  GoneException,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MemberService } from '../../src/modules/member/member.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotificationService } from '../../src/modules/notification/notification.service';

/**
 * Testes do MemberService — convites, aceite, listagem, remocao.
 * Fonte: docs/backend/06-services.md (MemberService, acceptInvite fluxo detalhado)
 * Fonte: docs/blueprint/04-domain-model.md (RN-M1..M4, RN-I1..I4, RN-C3)
 *
 * - RN-M1: Email unico dentro do cluster (409)
 * - RN-M2: Pelo menos 1 admin por cluster
 * - RN-C3: Max 10 membros por cluster
 * - RN-I1: Token expira 7 dias
 * - RN-I2: Uso unico
 */

const mockPrisma = {
  member: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  invite: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  vault: {
    create: jest.fn(),
    delete: jest.fn(),
  },
  cluster: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((fn: Function) => fn(mockPrisma)),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

const mockNotifications = {
  sendInviteEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendNodeLostAlert: jest.fn().mockResolvedValue(undefined),
  sendFileErrorEmail: jest.fn().mockResolvedValue(undefined),
};

describe('MemberService', () => {
  let memberService: MemberService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: NotificationService, useValue: mockNotifications },
      ],
    }).compile();

    memberService = module.get<MemberService>(MemberService);
  });

  describe('invite()', () => {
    it('should create invite with token and 7-day expiration (RN-I1)', async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null); // no existing member
      mockPrisma.invite.findFirst.mockResolvedValue(null); // no pending invite
      mockPrisma.member.count.mockResolvedValue(3); // under limit
      mockPrisma.invite.create.mockImplementation((args: any) => ({
        id: 'invite-1',
        token: args.data.token,
        email: args.data.email,
        role: args.data.role,
        expiresAt: args.data.expiresAt,
        clusterId: args.data.clusterId,
      }));

      const result = await memberService.invite('cluster-1', 'admin-1', {
        email: 'maria@familia.com',
        role: 'member',
      });

      expect(result.id).toBe('invite-1');
      expect(result.token).toBeDefined();
      expect(result.token.length).toBeGreaterThan(0);
      // Expires in ~7 days
      const expiresAt = new Date(result.expiresAt);
      const now = new Date();
      const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6.9);
      expect(diffDays).toBeLessThan(7.1);
    });

    it('should throw ConflictException if email already exists in cluster (RN-M1)', async () => {
      mockPrisma.member.findFirst.mockResolvedValue({ id: 'existing-member' });

      await expect(
        memberService.invite('cluster-1', 'admin-1', { email: 'existing@familia.com', role: 'member' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw UnprocessableEntityException if cluster has 10 members (RN-C3)', async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null);
      mockPrisma.invite.findFirst.mockResolvedValue(null);
      mockPrisma.member.count.mockResolvedValue(10);

      await expect(
        memberService.invite('cluster-1', 'admin-1', { email: 'new@familia.com', role: 'member' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('acceptInvite()', () => {
    const validInvite = {
      id: 'invite-1',
      clusterId: 'cluster-1',
      email: 'maria@familia.com',
      role: 'member',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      acceptedAt: null,
      createdBy: 'admin-1',
    };

    it('should create member and vault on valid invite accept', async () => {
      mockPrisma.invite.findFirst.mockResolvedValue(validInvite);
      mockPrisma.member.findFirst.mockResolvedValue(null); // no existing member
      mockPrisma.member.count.mockResolvedValue(3);
      mockPrisma.member.create.mockResolvedValue({
        id: 'member-2',
        clusterId: 'cluster-1',
        name: 'Maria Prado',
        email: 'maria@familia.com',
        role: 'member',
        joinedAt: new Date(),
      });
      mockPrisma.vault.create.mockResolvedValue({ id: 'vault-2' });
      mockPrisma.invite.update.mockResolvedValue({});

      const result = await memberService.acceptInvite('valid-token', {
        name: 'Maria Prado',
        password: 'SenhaSegura456',
      });

      expect(result.member.name).toBe('Maria Prado');
      expect(result.member.email).toBe('maria@familia.com');
      expect(result.member.role).toBe('member');
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('should throw NotFoundException if token not found', async () => {
      mockPrisma.invite.findFirst.mockResolvedValue(null);

      await expect(
        memberService.acceptInvite('invalid-token', { name: 'Test', password: 'TestPass123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw GoneException if invite expired (RN-I1)', async () => {
      mockPrisma.invite.findFirst.mockResolvedValue({
        ...validInvite,
        expiresAt: new Date(Date.now() - 1000), // expired
      });

      await expect(
        memberService.acceptInvite('expired-token', { name: 'Test', password: 'TestPass123' }),
      ).rejects.toThrow(GoneException);
    });

    it('should throw ConflictException if invite already accepted (RN-I2)', async () => {
      mockPrisma.invite.findFirst.mockResolvedValue({
        ...validInvite,
        acceptedAt: new Date(), // already accepted
      });

      await expect(
        memberService.acceptInvite('used-token', { name: 'Test', password: 'TestPass123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password with Argon2id', async () => {
      let capturedHash = '';
      mockPrisma.invite.findFirst.mockResolvedValue(validInvite);
      mockPrisma.member.findFirst.mockResolvedValue(null);
      mockPrisma.member.count.mockResolvedValue(3);
      mockPrisma.member.create.mockImplementation((args: any) => {
        capturedHash = args.data.passwordHash;
        return {
          id: 'member-2',
          clusterId: 'cluster-1',
          name: args.data.name,
          email: validInvite.email,
          role: validInvite.role,
          joinedAt: new Date(),
        };
      });
      mockPrisma.vault.create.mockResolvedValue({ id: 'vault-2' });
      mockPrisma.invite.update.mockResolvedValue({});

      await memberService.acceptInvite('valid-token', {
        name: 'Maria',
        password: 'SenhaSegura456',
      });

      expect(capturedHash).toMatch(/^\$argon2id\$/);
    });

    it('should execute within a transaction', async () => {
      mockPrisma.invite.findFirst.mockResolvedValue(validInvite);
      mockPrisma.member.findFirst.mockResolvedValue(null);
      mockPrisma.member.count.mockResolvedValue(3);
      mockPrisma.member.create.mockResolvedValue({
        id: 'member-2',
        clusterId: 'cluster-1',
        name: 'Maria',
        email: 'maria@familia.com',
        role: 'member',
        joinedAt: new Date(),
      });
      mockPrisma.vault.create.mockResolvedValue({ id: 'vault-2' });
      mockPrisma.invite.update.mockResolvedValue({});

      await memberService.acceptInvite('valid-token', { name: 'Maria', password: 'TestPass123' });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('listByCluster()', () => {
    it('should return list of members for a cluster', async () => {
      mockPrisma.member.findMany.mockResolvedValue([
        { id: 'm1', name: 'Douglas', email: 'douglas@f.com', role: 'admin', clusterId: 'c1', joinedAt: new Date() },
        { id: 'm2', name: 'Maria', email: 'maria@f.com', role: 'member', clusterId: 'c1', joinedAt: new Date() },
      ]);

      const result = await memberService.listByCluster('c1');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Douglas');
      expect(result.data[1].name).toBe('Maria');
    });
  });

  /**
   * setQuota() — define quota de armazenamento por membro (admin-only).
   * Fonte: docs/blueprint/14-scalability.md (Quotas por usuário)
   */
  describe('setQuota()', () => {
    it('define quota em bytes para o membro', async () => {
      const MB = 1024 * 1024;
      mockPrisma.member.findFirst.mockResolvedValue({ id: 'm1', clusterId: 'c1' });
      mockPrisma.member.update.mockResolvedValue({ id: 'm1', storageQuotaBytes: BigInt(500 * MB) });

      const result = await memberService.setQuota('m1', 'c1', 500 * MB);

      expect(mockPrisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'm1' },
          data: { storageQuotaBytes: BigInt(500 * MB) },
        }),
      );
      expect(result.storageQuotaBytes).toBeDefined();
    });

    it('remove quota (null = ilimitado) quando bytes é undefined', async () => {
      mockPrisma.member.findFirst.mockResolvedValue({ id: 'm1', clusterId: 'c1' });
      mockPrisma.member.update.mockResolvedValue({ id: 'm1', storageQuotaBytes: null });

      await memberService.setQuota('m1', 'c1', undefined);

      expect(mockPrisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { storageQuotaBytes: null } }),
      );
    });

    it('lança NotFoundException quando membro não existe no cluster', async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null);

      await expect(memberService.setQuota('nao-existe', 'c1', 100)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * updateProfile() — atualiza nome e/ou senha do membro autenticado.
   * Fonte: docs/backend/06-services.md (MemberService.updateProfile)
   */
  describe('updateProfile()', () => {
    const existingMember = {
      id: 'member-1',
      name: 'Douglas',
      email: 'douglas@familia.com',
      passwordHash: '$argon2id$placeholder',
      role: 'admin',
      clusterId: 'cluster-1',
    };

    it('atualiza o nome com sucesso', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(existingMember);
      mockPrisma.member.update.mockResolvedValue({ ...existingMember, name: 'Douglas Prado' });

      const result = await memberService.updateProfile('member-1', { name: 'Douglas Prado' });

      expect(mockPrisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'member-1' }, data: expect.objectContaining({ name: 'Douglas Prado' }) }),
      );
      expect(result.name).toBe('Douglas Prado');
    });

    it('altera a senha com a senha atual correta', async () => {
      const argon2 = await import('argon2');
      const realHash = await argon2.hash('SenhaAtual123');
      mockPrisma.member.findUnique.mockResolvedValue({ ...existingMember, passwordHash: realHash });
      mockPrisma.member.update.mockResolvedValue(existingMember);

      await expect(
        memberService.updateProfile('member-1', {
          currentPassword: 'SenhaAtual123',
          newPassword: 'NovaSenha456',
        }),
      ).resolves.toBeDefined();

      expect(mockPrisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passwordHash: expect.stringMatching(/^\$argon2id\$/) }),
        }),
      );
    });

    it('lanca UnauthorizedException quando senha atual esta errada', async () => {
      const argon2 = await import('argon2');
      const realHash = await argon2.hash('SenhaAtual123');
      mockPrisma.member.findUnique.mockResolvedValue({ ...existingMember, passwordHash: realHash });

      await expect(
        memberService.updateProfile('member-1', {
          currentPassword: 'SenhaErrada',
          newPassword: 'NovaSenha456',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('permite atualizar nome sem alterar senha', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(existingMember);
      mockPrisma.member.update.mockResolvedValue({ ...existingMember, name: 'Novo Nome' });

      const result = await memberService.updateProfile('member-1', { name: 'Novo Nome' });

      expect(mockPrisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ passwordHash: expect.anything() }),
        }),
      );
      expect(result.name).toBe('Novo Nome');
    });

    it('lanca NotFoundException quando membro nao existe', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      await expect(
        memberService.updateProfile('non-existent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('should remove a member', async () => {
      mockPrisma.member.findFirst.mockResolvedValue({
        id: 'member-2',
        role: 'member',
        clusterId: 'cluster-1',
      });
      mockPrisma.member.count.mockResolvedValue(2); // 2 members total
      mockPrisma.member.delete.mockResolvedValue({});
      mockPrisma.vault.delete.mockResolvedValue({});

      await expect(memberService.remove('member-2', 'cluster-1')).resolves.toBeUndefined();
      expect(mockPrisma.member.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent member', async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null);

      await expect(memberService.remove('non-existent', 'cluster-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when removing last admin (RN-M2)', async () => {
      mockPrisma.member.findFirst.mockResolvedValue({
        id: 'admin-1',
        role: 'admin',
        clusterId: 'cluster-1',
      });
      // Only 1 admin in cluster
      mockPrisma.member.count.mockResolvedValue(1);

      await expect(memberService.remove('admin-1', 'cluster-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
