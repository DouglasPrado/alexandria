/**
 * TimelineView — testes de agrupamento cronológico.
 * Fonte: docs/blueprint/08-use_cases.md (UC-010 — Buscar e Navegar pelo Acervo)
 * Fonte: docs/frontend/web/04-components.md (TimelineView)
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimelineView } from '../TimelineView';
import type { FileDTO } from '../../types/file.types';

function makeFile(overrides: Partial<FileDTO> & { id: string }): FileDTO {
  return {
    name: 'foto.jpg',
    mimeType: 'image/jpeg',
    mediaType: 'photo',
    originalSize: 1024,
    optimizedSize: null,
    status: 'ready',
    previewUrl: '',
    metadata: null,
    createdAt: '2025-01-15T10:00:00Z',
    ...overrides,
  };
}

const defaultProps = {
  hasMore: false,
  isLoading: false,
  isFetchingNext: false,
  onLoadMore: vi.fn(),
  onFileClick: vi.fn(),
};

describe('TimelineView', () => {
  it('renderiza cabeçalho de mês em português (Janeiro 2025)', () => {
    const files = [makeFile({ id: '1', createdAt: '2025-01-15T10:00:00Z' })];
    render(<TimelineView {...defaultProps} files={files} />);
    expect(screen.getByText(/janeiro.*2025/i)).toBeInTheDocument();
  });

  it('agrupa arquivos do mesmo mês sob um único cabeçalho', () => {
    const files = [
      makeFile({ id: '1', createdAt: '2025-03-01T00:00:00Z' }),
      makeFile({ id: '2', createdAt: '2025-03-20T00:00:00Z' }),
    ];
    render(<TimelineView {...defaultProps} files={files} />);
    expect(screen.getAllByText(/março.*2025/i)).toHaveLength(1);
  });

  it('cria cabeçalhos separados para meses diferentes', () => {
    const files = [
      makeFile({ id: '1', createdAt: '2025-01-10T00:00:00Z' }),
      makeFile({ id: '2', createdAt: '2025-06-10T00:00:00Z' }),
    ];
    render(<TimelineView {...defaultProps} files={files} />);
    expect(screen.getByText(/janeiro.*2025/i)).toBeInTheDocument();
    expect(screen.getByText(/junho.*2025/i)).toBeInTheDocument();
  });

  it('usa metadata.takenAt (EXIF) quando disponível em vez de createdAt', () => {
    const files = [
      makeFile({
        id: '1',
        createdAt: '2025-12-01T00:00:00Z',          // upload em dezembro
        metadata: { takenAt: '2024-07-04T12:00:00Z' }, // tirada em julho/2024
      }),
    ];
    render(<TimelineView {...defaultProps} files={files} />);
    expect(screen.getByText(/julho.*2024/i)).toBeInTheDocument();
    expect(screen.queryByText(/dezembro.*2025/i)).not.toBeInTheDocument();
  });

  it('chama onFileClick ao clicar em um arquivo', () => {
    const onFileClick = vi.fn();
    const file = makeFile({ id: '1', name: 'natal.jpg', createdAt: '2025-12-25T00:00:00Z' });
    render(<TimelineView {...defaultProps} files={[file]} onFileClick={onFileClick} />);
    fireEvent.click(screen.getByLabelText(/natal\.jpg/i));
    expect(onFileClick).toHaveBeenCalledWith(file);
  });

  it('exibe estado vazio quando files é []', () => {
    render(<TimelineView {...defaultProps} files={[]} />);
    expect(screen.getByText(/nenhum arquivo/i)).toBeInTheDocument();
  });
});

describe('TimelineView — file icons devem ser idênticos ao GalleryGrid', () => {
  it('exibe label PDF para application/pdf sem previewUrl', () => {
    const file = makeFile({ id: '1', mimeType: 'application/pdf', name: 'relatorio.pdf', mediaType: 'document' });
    render(<TimelineView {...defaultProps} files={[file]} />);
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('exibe label DOC para application/msword', () => {
    const file = makeFile({ id: '1', mimeType: 'application/msword', name: 'contrato.doc', mediaType: 'document' });
    render(<TimelineView {...defaultProps} files={[file]} />);
    expect(screen.getByText('DOC')).toBeInTheDocument();
  });

  it('exibe label XLS para text/csv', () => {
    const file = makeFile({ id: '1', mimeType: 'text/csv', name: 'export.csv', mediaType: 'document' });
    render(<TimelineView {...defaultProps} files={[file]} />);
    expect(screen.getByText('XLS')).toBeInTheDocument();
  });

  it('exibe label AUDIO para audio/mpeg', () => {
    const file = makeFile({ id: '1', mimeType: 'audio/mpeg', name: 'musica.mp3', mediaType: 'document' });
    render(<TimelineView {...defaultProps} files={[file]} />);
    expect(screen.getByText('AUDIO')).toBeInTheDocument();
  });

  it('exibe label ZIP para mediaType archive', () => {
    const file = makeFile({ id: '1', mimeType: 'application/zip', name: 'backup.zip', mediaType: 'archive' });
    render(<TimelineView {...defaultProps} files={[file]} />);
    expect(screen.getByText('ZIP')).toBeInTheDocument();
  });

  it('exibe ícone ZIP mesmo quando previewUrl está presente (archive nunca tem preview)', () => {
    const file = makeFile({
      id: '1',
      mimeType: 'application/zip',
      name: 'backup.zip',
      mediaType: 'archive',
      status: 'ready',
      previewUrl: 'https://cdn.test/broken-thumb.webp',
    });
    render(<TimelineView {...defaultProps} files={[file]} />);
    expect(screen.getByText('ZIP')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('exibe label VIDEO para mediaType video sem previewUrl', () => {
    const file = makeFile({ id: '1', mimeType: 'video/mp4', name: 'filme.mp4', mediaType: 'video', previewUrl: '' });
    render(<TimelineView {...defaultProps} files={[file]} />);
    expect(screen.getByText('VIDEO')).toBeInTheDocument();
  });

  it('exibe label IMG para mediaType photo sem previewUrl', () => {
    const file = makeFile({ id: '1', mimeType: 'image/jpeg', name: 'foto.jpg', mediaType: 'photo', previewUrl: '' });
    render(<TimelineView {...defaultProps} files={[file]} />);
    expect(screen.getByText('IMG')).toBeInTheDocument();
  });

  it('exibe extensão do arquivo para tipos não mapeados', () => {
    const file = makeFile({ id: '1', mimeType: 'application/octet-stream', name: 'dump.bin', mediaType: 'document' });
    render(<TimelineView {...defaultProps} files={[file]} />);
    expect(screen.getByText('BIN')).toBeInTheDocument();
  });
});
