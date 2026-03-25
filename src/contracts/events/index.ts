/**
 * Domain Events — eventos emitidos pelo sistema.
 * Usados via Redis pub/sub e BullMQ workers.
 * Nomenclatura: PascalCase, passado, ingles.
 */

// --- Cluster ---
export interface ClusterCreatedEvent {
  type: 'ClusterCreated';
  clusterId: string;
  adminMemberId: string;
  timestamp: Date;
}

export interface ClusterRecoveredEvent {
  type: 'ClusterRecovered';
  clusterId: string;
  recoveredVaults: number;
  recoveredManifests: number;
  timestamp: Date;
}

// --- Member ---
export interface MemberJoinedEvent {
  type: 'MemberJoined';
  clusterId: string;
  memberId: string;
  role: string;
  timestamp: Date;
}

export interface MemberRemovedEvent {
  type: 'MemberRemoved';
  clusterId: string;
  memberId: string;
  timestamp: Date;
}

// --- Node ---
export interface NodeRegisteredEvent {
  type: 'NodeRegistered';
  clusterId: string;
  nodeId: string;
  nodeType: string;
  timestamp: Date;
}

export interface NodeSuspectEvent {
  type: 'NodeSuspect';
  clusterId: string;
  nodeId: string;
  lastHeartbeat: Date;
  timestamp: Date;
}

export interface NodeLostEvent {
  type: 'NodeLost';
  clusterId: string;
  nodeId: string;
  chunksAffected: number;
  timestamp: Date;
}

export interface NodeDrainedEvent {
  type: 'NodeDrained';
  clusterId: string;
  nodeId: string;
  chunksMigrated: number;
  timestamp: Date;
}

// --- File ---
export interface FileUploadedEvent {
  type: 'FileUploaded';
  clusterId: string;
  fileId: string;
  memberId: string;
  mediaType: string;
  originalSize: number;
  timestamp: Date;
}

export interface FileProcessedEvent {
  type: 'FileProcessed';
  clusterId: string;
  fileId: string;
  optimizedSize: number;
  chunksCount: number;
  timestamp: Date;
}

export interface FileCorruptedEvent {
  type: 'FileCorrupted';
  clusterId: string;
  fileId: string;
  corruptedChunks: number;
  timestamp: Date;
}

// --- Preview ---
export interface PreviewGeneratedEvent {
  type: 'PreviewGenerated';
  fileId: string;
  previewId: string;
  timestamp: Date;
}

// --- Manifest ---
export interface ManifestCreatedEvent {
  type: 'ManifestCreated';
  fileId: string;
  manifestId: string;
  chunksCount: number;
  timestamp: Date;
}

export interface ManifestReplicatedEvent {
  type: 'ManifestReplicated';
  manifestId: string;
  nodeId: string;
  timestamp: Date;
}

// --- Chunk ---
export interface ChunkCreatedEvent {
  type: 'ChunkCreated';
  chunkId: string;
  size: number;
  timestamp: Date;
}

export interface ChunkReplicatedEvent {
  type: 'ChunkReplicated';
  chunkId: string;
  nodeId: string;
  replicaCount: number;
  timestamp: Date;
}

export interface ChunkCorruptedEvent {
  type: 'ChunkCorrupted';
  chunkId: string;
  nodeId: string;
  timestamp: Date;
}

export interface ChunkRepairedEvent {
  type: 'ChunkRepaired';
  chunkId: string;
  sourceNodeId: string;
  targetNodeId: string;
  timestamp: Date;
}

export interface ChunkOrphanedEvent {
  type: 'ChunkOrphaned';
  chunkId: string;
  timestamp: Date;
}

// --- Vault ---
export interface VaultCreatedEvent {
  type: 'VaultCreated';
  memberId: string;
  isAdminVault: boolean;
  timestamp: Date;
}

export interface VaultReplicatedEvent {
  type: 'VaultReplicated';
  memberId: string;
  nodeId: string;
  timestamp: Date;
}

// --- Alert ---
export interface AlertCreatedEvent {
  type: 'AlertCreated';
  clusterId: string;
  alertId: string;
  alertType: string;
  severity: string;
  timestamp: Date;
}

export interface AlertResolvedEvent {
  type: 'AlertResolved';
  clusterId: string;
  alertId: string;
  timestamp: Date;
}

// --- Invite ---
export interface InviteCreatedEvent {
  type: 'InviteCreated';
  clusterId: string;
  inviteId: string;
  email: string;
  timestamp: Date;
}

export interface InviteAcceptedEvent {
  type: 'InviteAccepted';
  clusterId: string;
  inviteId: string;
  memberId: string;
  timestamp: Date;
}

/** Union type de todos os domain events */
export type DomainEvent =
  | ClusterCreatedEvent
  | ClusterRecoveredEvent
  | MemberJoinedEvent
  | MemberRemovedEvent
  | NodeRegisteredEvent
  | NodeSuspectEvent
  | NodeLostEvent
  | NodeDrainedEvent
  | FileUploadedEvent
  | FileProcessedEvent
  | FileCorruptedEvent
  | PreviewGeneratedEvent
  | ManifestCreatedEvent
  | ManifestReplicatedEvent
  | ChunkCreatedEvent
  | ChunkReplicatedEvent
  | ChunkCorruptedEvent
  | ChunkRepairedEvent
  | ChunkOrphanedEvent
  | VaultCreatedEvent
  | VaultReplicatedEvent
  | AlertCreatedEvent
  | AlertResolvedEvent
  | InviteCreatedEvent
  | InviteAcceptedEvent;
