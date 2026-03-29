/**
 * useFiles — testes de polling durante processamento.
 * Valida que a query faz polling enquanto houver arquivos com status='processing'.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useFiles } from '../useFiles';
import { filesApi } from '../../api/files-api';
import type { FilesResponse } from '../../types/file.types';

vi.mock('../../api/files-api');

const processingResponse: FilesResponse = {
  data: [
    {
      id: '1',
      name: 'foto.jpg',
      mimeType: 'image/jpeg',
      mediaType: 'photo',
      originalSize: 1024,
      optimizedSize: null,
      status: 'processing',
      previewUrl: '',
      metadata: null,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ],
  meta: { cursor: null, hasMore: false },
};

const readyResponse: FilesResponse = {
  data: [
    {
      id: '1',
      name: 'foto.jpg',
      mimeType: 'image/jpeg',
      mediaType: 'photo',
      originalSize: 1024,
      optimizedSize: 800,
      status: 'ready',
      previewUrl: 'https://cdn.test/thumb.webp',
      metadata: null,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ],
  meta: { cursor: null, hasMore: false },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useFiles — polling durante processamento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('faz polling quando há arquivos com status processing', async () => {
    const listMock = vi.mocked(filesApi.list);
    listMock.mockResolvedValue(processingResponse);

    const { result } = renderHook(() => useFiles(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listMock).toHaveBeenCalledTimes(1);

    // Polling deve disparar dentro de ~3s
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2), {
      timeout: 5_000,
    });
  });

  it('não faz polling quando todos os arquivos estão ready', async () => {
    const listMock = vi.mocked(filesApi.list);
    listMock.mockResolvedValue(readyResponse);

    const { result } = renderHook(() => useFiles(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listMock).toHaveBeenCalledTimes(1);

    // Espera um pouco e verifica que não houve polling
    await new Promise((r) => setTimeout(r, 4_000));
    expect(listMock).toHaveBeenCalledTimes(1);
  }, 10_000);

  it('para de fazer polling quando processing transiciona para ready', async () => {
    const listMock = vi.mocked(filesApi.list);
    listMock
      .mockResolvedValueOnce(processingResponse)
      .mockResolvedValue(readyResponse);

    const { result } = renderHook(() => useFiles(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Polling busca a versão ready
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2), {
      timeout: 5_000,
    });

    // Agora com ready, não deve mais fazer polling
    const countAfterReady = listMock.mock.calls.length;
    await new Promise((r) => setTimeout(r, 4_000));
    expect(listMock).toHaveBeenCalledTimes(countAfterReady);
  }, 15_000);
});
