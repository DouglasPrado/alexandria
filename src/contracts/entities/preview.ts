import type { PreviewType } from '../enums/preview-type';
import type { PreviewFormat } from '../enums/preview-format';

/**
 * Preview — Representacao leve de um arquivo para exibicao no cliente.
 * Somente para visualizacao — nao oferece download do conteudo original (RN-P1).
 * Tamanho alvo: foto ~50KB WebP, video 480p ~5MB MP4, PDF ~100KB PNG (RN-P2).
 */
export interface Preview {
  id: string;
  fileId: string;
  type: PreviewType;
  size: bigint;
  format: PreviewFormat;
  contentHash: string;
  storagePath: string;
  createdAt: Date;
}
