/**
 * SearchBar — testes de busca com filtros de tipo e período.
 * Fonte: docs/frontend/web/04-components.md (SearchBar, FilterChips)
 * Fonte: docs/blueprint/08-use_cases.md (UC-010 — Buscar e Navegar pelo Acervo)
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchBar } from '../SearchBar';

const defaultProps = {
  query: '',
  mediaType: undefined,
  from: undefined,
  to: undefined,
  onQueryChange: vi.fn(),
  onMediaTypeChange: vi.fn(),
  onFromChange: vi.fn(),
  onToChange: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

describe('SearchBar', () => {
  it('renderiza o input de busca por nome', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Buscar por nome...')).toBeInTheDocument();
  });

  it('renderiza os filter chips de tipo de mídia', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByText('Fotos')).toBeInTheDocument();
    expect(screen.getByText('Vídeos')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
    expect(screen.getByText('Arquivos')).toBeInTheDocument();
  });

  it('renderiza os inputs de período (de e até) — UC-010 RF-064', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByLabelText('De')).toBeInTheDocument();
    expect(screen.getByLabelText('Até')).toBeInTheDocument();
  });

  it('chama onFromChange ao selecionar data inicial', () => {
    render(<SearchBar {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2025-01-01' } });
    expect(defaultProps.onFromChange).toHaveBeenCalledWith('2025-01-01T00:00:00.000Z');
  });

  it('chama onToChange ao selecionar data final', () => {
    render(<SearchBar {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2025-12-31' } });
    expect(defaultProps.onToChange).toHaveBeenCalledWith('2025-12-31T23:59:59.999Z');
  });

  it('exibe valores de data nos inputs quando from/to estão preenchidos', () => {
    render(
      <SearchBar
        {...defaultProps}
        from="2025-01-01T00:00:00.000Z"
        to="2025-12-31T23:59:59.999Z"
      />,
    );
    expect((screen.getByLabelText('De') as HTMLInputElement).value).toBe('2025-01-01');
    expect((screen.getByLabelText('Até') as HTMLInputElement).value).toBe('2025-12-31');
  });

  it('debounce 300ms no input de busca por nome', async () => {
    render(<SearchBar {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('Buscar por nome...'), {
      target: { value: 'natal' },
    });
    expect(defaultProps.onQueryChange).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(defaultProps.onQueryChange).toHaveBeenCalledWith('natal');
  });

  it('botão "Limpar filtros" aparece quando from está preenchido', () => {
    render(<SearchBar {...defaultProps} from="2025-01-01T00:00:00.000Z" />);
    expect(screen.getByText('Limpar filtros')).toBeInTheDocument();
  });

  it('"Limpar filtros" limpa query, tipo e datas', () => {
    render(
      <SearchBar
        {...defaultProps}
        query="natal"
        mediaType="photo"
        from="2025-01-01T00:00:00.000Z"
        to="2025-12-31T23:59:59.999Z"
      />,
    );
    fireEvent.click(screen.getByText('Limpar filtros'));
    expect(defaultProps.onQueryChange).toHaveBeenCalledWith('');
    expect(defaultProps.onMediaTypeChange).toHaveBeenCalledWith(undefined);
    expect(defaultProps.onFromChange).toHaveBeenCalledWith(undefined);
    expect(defaultProps.onToChange).toHaveBeenCalledWith(undefined);
  });

  it('toggle de mediaType: clica photo → ativa; clica novamente → desativa', () => {
    const { rerender } = render(<SearchBar {...defaultProps} />);
    fireEvent.click(screen.getByText('Fotos'));
    expect(defaultProps.onMediaTypeChange).toHaveBeenCalledWith('photo');

    rerender(<SearchBar {...defaultProps} mediaType="photo" />);
    fireEvent.click(screen.getByText('Fotos'));
    expect(defaultProps.onMediaTypeChange).toHaveBeenCalledWith(undefined);
  });
});
