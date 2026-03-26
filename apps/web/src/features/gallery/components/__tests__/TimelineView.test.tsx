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
