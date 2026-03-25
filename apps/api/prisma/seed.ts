/**
 * Prisma Seed — dados de exemplo para ambiente de desenvolvimento.
 * NUNCA executar em producao.
 *
 * Uso: pnpm --filter @alexandria/api db:seed
 * Ou automaticamente via: prisma migrate reset
 *
 * Cria: 1 cluster, 2 membros (admin + membro), 3 nos de storage.
 * Fonte: docs/blueprint/05-data-model.md (volumes estimados)
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Cluster ---
  const cluster = await prisma.cluster.create({
    data: {
      id: randomUUID(),
      clusterId: 'a'.repeat(64), // Placeholder SHA-256
      name: 'Familia Prado (Dev)',
      publicKey: Buffer.from('dev-public-key-placeholder'),
      encryptedPrivateKey: Buffer.from('dev-encrypted-private-key-placeholder'),
      status: 'active',
    },
  });
  console.log(`  ✓ Cluster: ${cluster.name} (${cluster.id})`);

  // --- Admin Member ---
  const admin = await prisma.member.create({
    data: {
      id: randomUUID(),
      clusterId: cluster.id,
      name: 'Douglas Prado',
      email: 'douglas@dev.local',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$placeholder', // Placeholder — not a real hash
      role: 'admin',
      invitedBy: null,
    },
  });
  console.log(`  ✓ Admin: ${admin.name} (${admin.email})`);

  // --- Regular Member ---
  const member = await prisma.member.create({
    data: {
      id: randomUUID(),
      clusterId: cluster.id,
      name: 'Maria Prado',
      email: 'maria@dev.local',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$placeholder',
      role: 'member',
      invitedBy: admin.id,
    },
  });
  console.log(`  ✓ Member: ${member.name} (${member.email})`);

  // --- Admin Vault ---
  await prisma.vault.create({
    data: {
      id: randomUUID(),
      memberId: admin.id,
      vaultData: Buffer.from('dev-vault-data-placeholder'),
      encryptionAlgorithm: 'AES-256-GCM',
      replicatedTo: [],
      isAdminVault: true,
    },
  });
  console.log('  ✓ Admin vault created');

  // --- Member Vault ---
  await prisma.vault.create({
    data: {
      id: randomUUID(),
      memberId: member.id,
      vaultData: Buffer.from('dev-vault-data-placeholder'),
      encryptionAlgorithm: 'AES-256-GCM',
      replicatedTo: [],
      isAdminVault: false,
    },
  });
  console.log('  ✓ Member vault created');

  // --- Storage Nodes ---
  const nodeTypes = [
    { name: 'NAS Escritorio', type: 'local', endpoint: '/mnt/alexandria/chunks' },
    { name: 'AWS S3 Bucket', type: 's3', endpoint: 'https://s3.us-east-1.amazonaws.com' },
    { name: 'Cloudflare R2', type: 'r2', endpoint: 'https://r2.cloudflarestorage.com' },
  ];

  for (const nodeData of nodeTypes) {
    const node = await prisma.node.create({
      data: {
        id: randomUUID(),
        clusterId: cluster.id,
        ownerId: admin.id,
        type: nodeData.type,
        name: nodeData.name,
        totalCapacity: BigInt(100 * 1024 * 1024 * 1024), // 100GB
        usedCapacity: BigInt(0),
        status: 'online',
        endpoint: nodeData.endpoint,
        configEncrypted: Buffer.from('dev-config-placeholder'),
        lastHeartbeat: new Date(),
        tier: 'warm',
      },
    });
    console.log(`  ✓ Node: ${node.name} (${node.type})`);
  }

  console.log('\n✅ Seed complete!');
  console.log('   1 cluster, 2 members, 2 vaults, 3 nodes');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
