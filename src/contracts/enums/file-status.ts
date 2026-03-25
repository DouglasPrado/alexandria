/**
 * Status do pipeline de processamento do arquivo.
 * Transicoes: processing → ready | error; ready → corrupted (via scrubbing)
 */
export enum FileStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
  CORRUPTED = 'corrupted',
}
