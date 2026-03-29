import { randomUUID } from 'node:crypto';

/**
 * Test factories — builders para criar dados de teste consistentes.
 * Fonte: docs/backend/14-tests.md (test/factories/)
 *
 * Cada factory retorna um objeto valido com defaults.
 * Aceita overrides parciais via parametro.
 */

export function createTestCluster(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    clusterId: 'a'.repeat(64),
    name: 'Familia Test',
    publicKey: Buffer.alloc(32),
    encryptedPrivateKey: Buffer.alloc(64),
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestMember(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    clusterId: randomUUID(),
    name: 'Test Member',
    email: `test-${Date.now()}@example.com`,
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mock$hash',
    role: 'member',
    invitedBy: null,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestNode(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    clusterId: randomUUID(),
    ownerId: randomUUID(),
    type: 'local',
    name: 'Test Node',
    totalCapacity: BigInt(100e9),
    usedCapacity: BigInt(0),
    status: 'online',
    endpoint: '/tmp/test-chunks',
    configEncrypted: Buffer.alloc(32),
    lastHeartbeat: new Date(),
    tier: 'warm',
    nodeToken: randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, ''),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestFile(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    clusterId: randomUUID(),
    uploadedBy: randomUUID(),
    originalName: 'test-photo.jpg',
    mediaType: 'photo',
    mimeType: 'image/jpeg',
    originalSize: BigInt(1024 * 1024),
    optimizedSize: BigInt(512 * 1024),
    contentHash: 'b'.repeat(64),
    metadata: null,
    status: 'ready',
    errorMessage: null,
    versionOf: null,
    versionNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestChunk(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c'.repeat(64),
    size: 4 * 1024 * 1024,
    referenceCount: 1,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createTestAlert(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    clusterId: randomUUID(),
    type: 'node_offline',
    severity: 'warning',
    message: 'Test alert',
    relatedEntityId: null,
    resolved: false,
    createdAt: new Date(),
    resolvedAt: null,
    ...overrides,
  };
}

export function createTestInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    clusterId: randomUUID(),
    email: `invite-${Date.now()}@example.com`,
    role: 'member',
    token: randomUUID(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdBy: randomUUID(),
    acceptedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}
