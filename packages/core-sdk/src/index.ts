// Alexandria Core SDK — Public API

// Hashing — SHA-256 content-addressable (RN-CH2)
export { hash, hashStream } from './hashing';

// Chunking — divisao em blocos ~4MB e reassembly (RN-CH1)
export { split, reassemble, DEFAULT_CHUNK_SIZE, type ChunkData } from './chunking';

// Modulos a implementar nas proximas features:
// export * from './crypto';
// export * from './consistent-hash';
// export * from './manifest';
// export * from './vault';
// export * from './storage-provider';
