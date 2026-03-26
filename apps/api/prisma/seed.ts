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
import {
  randomUUID,
  createHash,
  randomBytes,
  pbkdf2Sync,
  hkdfSync,
  createPrivateKey,
  createPublicKey,
  createCipheriv,
} from 'node:crypto';

const prisma = new PrismaClient();

// --- Helpers crypto (inline para evitar dependencia de build do core-sdk) ---

const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_SALT = 'alexandria-mnemonic-to-master-key';
const KEYPAIR_HKDF_INFO = 'alexandria-ed25519-seed';

function deriveMasterKey(mnemonic: string): Buffer {
  return pbkdf2Sync(mnemonic, PBKDF2_SALT, PBKDF2_ITERATIONS, 32, 'sha256');
}

function generateKeypair(masterKey: Buffer): { publicKey: Buffer; privateKey: Buffer } {
  const ed25519Seed = Buffer.from(
    hkdfSync('sha256', masterKey, Buffer.alloc(0), KEYPAIR_HKDF_INFO, 32),
  );
  const privateKeyObject = createPrivateKey({
    key: Buffer.concat([
      Buffer.from('302e020100300506032b657004220420', 'hex'),
      ed25519Seed,
    ]),
    format: 'der',
    type: 'pkcs8',
  });
  const publicKeyObject = createPublicKey(privateKeyObject);
  const publicKeyDer = publicKeyObject.export({ type: 'spki', format: 'der' });
  const privateKeyDer = privateKeyObject.export({ type: 'pkcs8', format: 'der' });
  const publicKey = publicKeyDer.subarray(publicKeyDer.length - 32);
  return { publicKey: Buffer.from(publicKey), privateKey: Buffer.from(privateKeyDer) };
}

function hashPassword(password: string): string {
  // Seed usa SHA-256 simples — em producao usa Argon2 via AuthService
  return createHash('sha256').update(password).digest('hex');
}

// Seed phrase fixa para dev (NUNCA usar em producao)
const DEV_SEED_PHRASE =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Derivar identidade criptografica do cluster
  const masterKey = deriveMasterKey(DEV_SEED_PHRASE);
  const keypair = generateKeypair(masterKey);
  const clusterId = createHash('sha256').update(keypair.publicKey).digest('hex');

  // Encriptar private key com master key (AES-256-GCM)
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', masterKey, iv);
  const encryptedPk = Buffer.concat([
    iv,
    cipher.update(keypair.privateKey),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  // 2. Criar cluster
  const clusterUuid = randomUUID();
  const cluster = await prisma.cluster.create({
    data: {
      id: clusterUuid,
      clusterId,
      name: 'Família Prado (Dev)',
      publicKey: Uint8Array.from(keypair.publicKey),
      encryptedPrivateKey: Uint8Array.from(encryptedPk),
      status: 'active',
    },
  });
  console.log(`  ✓ Cluster: ${cluster.name} (${cluster.clusterId.slice(0, 12)}...)`);

  // 3. Criar admin
  const adminUuid = randomUUID();
  const admin = await prisma.member.create({
    data: {
      id: adminUuid,
      clusterId: cluster.id,
      name: 'Douglas Prado',
      email: 'douglas@alexandria.dev',
      passwordHash: hashPassword('dev-password-123'),
      role: 'admin',
    },
  });
  console.log(`  ✓ Admin: ${admin.name} <${admin.email}>`);

  // 4. Criar membro
  const memberUuid = randomUUID();
  const member = await prisma.member.create({
    data: {
      id: memberUuid,
      clusterId: cluster.id,
      name: 'Ana Prado',
      email: 'ana@alexandria.dev',
      passwordHash: hashPassword('dev-password-456'),
      role: 'member',
      invitedBy: admin.id,
    },
  });
  console.log(`  ✓ Member: ${member.name} <${member.email}>`);

  // 5. Criar vaults (admin e membro)
  const dummyVaultData = Buffer.from(JSON.stringify({ credentials: {}, nodeConfigs: [] }));
  await prisma.vault.createMany({
    data: [
      {
        id: randomUUID(),
        memberId: admin.id,
        vaultData: dummyVaultData,
        isAdminVault: true,
      },
      {
        id: randomUUID(),
        memberId: member.id,
        vaultData: dummyVaultData,
        isAdminVault: false,
      },
    ],
  });
  console.log('  ✓ Vaults: admin + member');

  // 6. Criar 3 nos de storage
  const GB = 1024n * 1024n * 1024n;
  const nodeConfigs = [
    {
      name: 'VPS Contabo (Local)',
      type: 'LOCAL',
      capacity: 500n * GB,
      endpoint: '/data/storage/node-1',
      tier: 'hot',
    },
    {
      name: 'Cloudflare R2',
      type: 'R2',
      capacity: 1000n * GB,
      endpoint: 'https://r2.alexandria.dev',
      tier: 'warm',
    },
    {
      name: 'Backblaze B2',
      type: 'B2',
      capacity: 2000n * GB,
      endpoint: 'https://b2.alexandria.dev',
      tier: 'cold',
    },
  ];

  for (const cfg of nodeConfigs) {
    const node = await prisma.node.create({
      data: {
        id: randomUUID(),
        clusterId: cluster.id,
        ownerId: admin.id,
        type: cfg.type,
        name: cfg.name,
        totalCapacity: cfg.capacity,
        usedCapacity: 0n,
        status: 'online',
        endpoint: cfg.endpoint,
        configEncrypted: Buffer.from('dev-placeholder-encrypted-config'),
        lastHeartbeat: new Date(),
        tier: cfg.tier,
      },
    });
    console.log(`  ✓ Node: ${node.name} (${cfg.type}, ${cfg.tier})`);
  }

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Dev credentials:');
  console.log(`   Seed phrase: ${DEV_SEED_PHRASE}`);
  console.log('   Admin: douglas@alexandria.dev / dev-password-123');
  console.log('   Member: ana@alexandria.dev / dev-password-456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
