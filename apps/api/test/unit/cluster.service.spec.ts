import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClusterService } from '../../src/modules/cluster/cluster.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as coreSdk from '@alexandria/core-sdk';

/**
 * Testes do ClusterService — criacao de cluster familiar com identidade criptografica.
 * Fonte: docs/backend/06-services.md (ClusterService.create — fluxo detalhado)
 * Fonte: docs/blueprint/04-domain-model.md (RN-C1, RN-C2)
 * Fonte: docs/backend/05-api-contracts.md (POST /api/clusters, GET /api/clusters/:id)
 *
 * - RN-C1: cluster_id = SHA-256(public_key) — imutavel
 * - RN-C2: seed phrase BIP-39 gera master key deterministicamente
 */

// Mock Prisma
const mockPrisma = {
  cluster: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  member: {
    create: jest.fn(),
    count: jest.fn(),
  },
  vault: {
    create: jest.fn(),
  },
  node: {
    count: jest.fn(),
  },
  file: {
    count: jest.fn(),
  },
  $transaction: jest.fn((fn: Function) => fn(mockPrisma)),
};

describe('ClusterService', () => {
  let clusterService: ClusterService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        ClusterService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    clusterService = module.get<ClusterService>(ClusterService);
  });

  describe('create()', () => {
    it('should create cluster with cryptographic identity and return seed phrase', async () => {
      mockPrisma.cluster.create.mockResolvedValue({
        id: 'uuid-1',
        clusterId: 'a'.repeat(64),
        name: 'Familia Prado',
        status: 'active',
        createdAt: new Date(),
      });

      mockPrisma.member.create.mockResolvedValue({
        id: 'member-1',
        name: 'Douglas Prado',
        email: 'douglas@familia.com',
        role: 'admin',
      });

      mockPrisma.vault.create.mockResolvedValue({ id: 'vault-1' });

      const result = await clusterService.create({
        name: 'Familia Prado',
        admin: {
          name: 'Douglas Prado',
          email: 'douglas@familia.com',
          password: 'SenhaSegura123',
        },
      });

      expect(result.cluster).toBeDefined();
      expect(result.cluster.name).toBe('Familia Prado');
      expect(result.member).toBeDefined();
      expect(result.member.name).toBe('Douglas Prado');
      expect(result.member.role).toBe('admin');
      expect(result.seedPhrase).toBeDefined();
      expect(result.seedPhrase.split(' ')).toHaveLength(12);
    });

    it('should generate valid BIP-39 seed phrase (RN-C2)', async () => {
      mockPrisma.cluster.create.mockResolvedValue({
        id: 'uuid-1',
        clusterId: 'a'.repeat(64),
        name: 'Test',
        status: 'active',
        createdAt: new Date(),
      });
      mockPrisma.member.create.mockResolvedValue({
        id: 'member-1',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'admin',
      });
      mockPrisma.vault.create.mockResolvedValue({ id: 'vault-1' });

      const result = await clusterService.create({
        name: 'Test',
        admin: { name: 'Admin', email: 'admin@test.com', password: 'TestPass123' },
      });

      expect(coreSdk.validateMnemonic(result.seedPhrase)).toBe(true);
    });

    it('should derive cluster_id from public key SHA-256 (RN-C1)', async () => {
      let capturedClusterId = '';
      mockPrisma.cluster.create.mockImplementation((args: any) => {
        capturedClusterId = args.data.clusterId;
        return {
          id: 'uuid-1',
          clusterId: capturedClusterId,
          name: args.data.name,
          status: 'active',
          createdAt: new Date(),
        };
      });
      mockPrisma.member.create.mockResolvedValue({
        id: 'member-1',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'admin',
      });
      mockPrisma.vault.create.mockResolvedValue({ id: 'vault-1' });

      await clusterService.create({
        name: 'Test',
        admin: { name: 'Admin', email: 'admin@test.com', password: 'TestPass123' },
      });

      // cluster_id should be 64-char hex (SHA-256)
      expect(capturedClusterId).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should hash admin password with Argon2id', async () => {
      let capturedPasswordHash = '';
      mockPrisma.cluster.create.mockResolvedValue({
        id: 'uuid-1',
        clusterId: 'a'.repeat(64),
        name: 'Test',
        status: 'active',
        createdAt: new Date(),
      });
      mockPrisma.member.create.mockImplementation((args: any) => {
        capturedPasswordHash = args.data.passwordHash;
        return {
          id: 'member-1',
          name: args.data.name,
          email: args.data.email,
          role: 'admin',
        };
      });
      mockPrisma.vault.create.mockResolvedValue({ id: 'vault-1' });

      await clusterService.create({
        name: 'Test',
        admin: { name: 'Admin', email: 'admin@test.com', password: 'MyPassword123' },
      });

      // Argon2id hashes start with $argon2id$
      expect(capturedPasswordHash).toMatch(/^\$argon2id\$/);
    });

    it('should create admin vault with isAdminVault=true', async () => {
      mockPrisma.cluster.create.mockResolvedValue({
        id: 'uuid-1',
        clusterId: 'a'.repeat(64),
        name: 'Test',
        status: 'active',
        createdAt: new Date(),
      });
      mockPrisma.member.create.mockResolvedValue({
        id: 'member-1',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'admin',
      });
      mockPrisma.vault.create.mockResolvedValue({ id: 'vault-1' });

      await clusterService.create({
        name: 'Test',
        admin: { name: 'Admin', email: 'admin@test.com', password: 'TestPass123' },
      });

      expect(mockPrisma.vault.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isAdminVault: true,
          }),
        }),
      );
    });

    it('should execute within a transaction', async () => {
      mockPrisma.cluster.create.mockResolvedValue({
        id: 'uuid-1',
        clusterId: 'a'.repeat(64),
        name: 'Test',
        status: 'active',
        createdAt: new Date(),
      });
      mockPrisma.member.create.mockResolvedValue({
        id: 'member-1',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'admin',
      });
      mockPrisma.vault.create.mockResolvedValue({ id: 'vault-1' });

      await clusterService.create({
        name: 'Test',
        admin: { name: 'Admin', email: 'admin@test.com', password: 'TestPass123' },
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findById()', () => {
    it('should return cluster details with counters', async () => {
      mockPrisma.cluster.findUnique.mockResolvedValue({
        id: 'uuid-1',
        clusterId: 'a'.repeat(64),
        name: 'Familia Prado',
        status: 'active',
        createdAt: new Date('2026-01-01'),
      });
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.file.count.mockResolvedValue(100);

      const result = await clusterService.findById('uuid-1');

      expect(result.name).toBe('Familia Prado');
      expect(result.status).toBe('active');
      expect(result.totalNodes).toBe(3);
      expect(result.totalFiles).toBe(100);
    });

    it('should throw NotFoundException for non-existent cluster', async () => {
      mockPrisma.cluster.findUnique.mockResolvedValue(null);

      await expect(clusterService.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
