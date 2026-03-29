/**
 * Value Objects — objetos imutaveis que encapsulam validacao.
 * Fonte: docs/backend/03-domain.md (8 value objects)
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SHA256_REGEX = /^[0-9a-f]{64}$/i;
const BIP39_WORD_COUNT = 12;

export class Email {
  readonly value: string;
  constructor(raw: string) {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) throw new Error('Email invalido');
    if (normalized.length > 255) throw new Error('Email excede 255 caracteres');
    this.value = normalized;
  }
}

export class ChunkId {
  readonly value: string;
  constructor(hash: string) {
    if (!SHA256_REGEX.test(hash)) throw new Error('ChunkId deve ser SHA-256 hex de 64 chars');
    this.value = hash;
  }
}

export class ContentHash {
  readonly value: string;
  constructor(hash: string) {
    if (!SHA256_REGEX.test(hash)) throw new Error('ContentHash deve ser SHA-256 hex de 64 chars');
    this.value = hash;
  }
}

export class SeedPhrase {
  readonly words: string[];
  constructor(phrase: string) {
    const words = phrase.trim().split(/\s+/);
    if (words.length !== BIP39_WORD_COUNT) {
      throw new Error(`Seed phrase deve ter exatamente ${BIP39_WORD_COUNT} palavras`);
    }
    this.words = words;
  }
  toString(): string {
    return this.words.join(' ');
  }
}

export class Capacity {
  constructor(
    readonly total: bigint,
    readonly used: bigint,
  ) {
    if (total < BigInt(0)) throw new Error('Capacidade total nao pode ser negativa');
    if (used < BigInt(0)) throw new Error('Capacidade usada nao pode ser negativa');
    if (used > total) throw new Error('Capacidade usada nao pode exceder total');
  }
  get free(): bigint {
    return this.total - this.used;
  }
  get usagePercent(): number {
    if (this.total === BigInt(0)) return 0;
    return Number((this.used * BigInt(100)) / this.total);
  }
}
