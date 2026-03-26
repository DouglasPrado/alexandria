/**
 * GalleryGrid — testes de renderização de ícones por tipo de arquivo.
 * Fonte: docs/frontend/web/04-components.md (GalleryGrid)
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GalleryGrid } from '../GalleryGrid';
import type { FileDTO } from '../../types/file.types';

const base: Omit<FileDTO, 'mediaType' | 'mimeType' | 'name'> = {
  id: '1',
  originalSize: 1024,
  optimizedSize: null,
  status: 'ready',
  previewUrl: '',
  metadata: null,
  createdAt: '2026-01-01T00:00:00Z',
};

function makeFile(overrides: Partial<FileDTO>): FileDTO {
  return {
    ...base,
    name: 'arquivo.bin',
    mediaType: 'document',
    mimeType: 'application/octet-stream',
    ...overrides,
  } as FileDTO;
}

const defaultProps = {
  hasMore: false,
  isLoading: false,
  isFetchingNext: false,
  onLoadMore: vi.fn(),
  onFileClick: vi.fn(),
};

describe('GalleryGrid — file icons (sem preview)', () => {
  it('exibe imagem quando previewUrl está presente e status é ready', () => {
    const file = makeFile({ previewUrl: 'https://cdn.test/thumb.webp', mediaType: 'photo', mimeType: 'image/jpeg', name: 'foto.jpg' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByRole('img', { name: 'foto.jpg' })).toBeInTheDocument();
  });

  it('exibe spinner quando status é processing', () => {
    const file = makeFile({ status: 'processing', previewUrl: '' });
    const { container } = render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(container.querySelector('[data-testid="icon-processing"]')).toBeInTheDocument();
  });

  it('exibe label PDF para application/pdf sem previewUrl', () => {
    const file = makeFile({ mimeType: 'application/pdf', name: 'relatorio.pdf', mediaType: 'document' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('exibe preview de imagem para PDF quando previewUrl está presente', () => {
    const file = makeFile({
      mimeType: 'application/pdf',
      name: 'relatorio.pdf',
      mediaType: 'document',
      status: 'ready',
      previewUrl: 'https://cdn.test/pdf-thumb.webp',
    });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByRole('img', { name: 'relatorio.pdf' })).toBeInTheDocument();
  });

  it('exibe label DOC para application/msword', () => {
    const file = makeFile({ mimeType: 'application/msword', name: 'contrato.doc', mediaType: 'document' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('DOC')).toBeInTheDocument();
  });

  it('exibe label DOC para application/vnd.openxmlformats-officedocument.wordprocessingml.document', () => {
    const file = makeFile({ mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'contrato.docx', mediaType: 'document' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('DOC')).toBeInTheDocument();
  });

  it('exibe label XLS para application/vnd.ms-excel', () => {
    const file = makeFile({ mimeType: 'application/vnd.ms-excel', name: 'dados.xls', mediaType: 'document' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('XLS')).toBeInTheDocument();
  });

  it('exibe label XLS para text/csv', () => {
    const file = makeFile({ mimeType: 'text/csv', name: 'export.csv', mediaType: 'document' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('XLS')).toBeInTheDocument();
  });

  it('exibe label AUDIO para audio/mpeg', () => {
    const file = makeFile({ mimeType: 'audio/mpeg', name: 'musica.mp3', mediaType: 'document' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('AUDIO')).toBeInTheDocument();
  });

  it('exibe label ZIP para mediaType archive', () => {
    const file = makeFile({ mimeType: 'application/zip', name: 'backup.zip', mediaType: 'archive' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('ZIP')).toBeInTheDocument();
  });

  it('exibe ícone ZIP mesmo quando previewUrl está presente (archive nunca tem preview)', () => {
    const file = makeFile({
      mimeType: 'application/zip',
      name: 'backup.zip',
      mediaType: 'archive',
      status: 'ready',
      previewUrl: 'https://cdn.test/broken-thumb.webp',
    });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('ZIP')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('exibe label VIDEO para mediaType video', () => {
    const file = makeFile({ mimeType: 'video/mp4', name: 'filme.mp4', mediaType: 'video', previewUrl: '' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('VIDEO')).toBeInTheDocument();
  });

  it('exibe label IMG para mediaType photo sem previewUrl', () => {
    const file = makeFile({ mimeType: 'image/jpeg', name: 'foto.jpg', mediaType: 'photo', previewUrl: '' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('IMG')).toBeInTheDocument();
  });

  it('exibe extensão do arquivo para tipos não mapeados', () => {
    const file = makeFile({ mimeType: 'application/octet-stream', name: 'dump.bin', mediaType: 'document' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('BIN')).toBeInTheDocument();
  });

  it('exibe badge de erro quando status é error', () => {
    const file = makeFile({ status: 'error', previewUrl: '', mimeType: 'image/jpeg', mediaType: 'photo' });
    render(<GalleryGrid {...defaultProps} files={[file]} />);
    expect(screen.getByText('Erro')).toBeInTheDocument();
  });
});
