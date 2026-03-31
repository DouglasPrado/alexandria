import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddNodeDialog } from '../AddNodeDialog';

const startOAuthMock = vi.fn();

vi.mock('../../hooks/useNodeMutations', () => ({
  useRegisterNode: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    reset: vi.fn(),
  }),
  useStartNodeOAuth: () => ({
    mutateAsync: startOAuthMock,
    isPending: false,
    reset: vi.fn(),
  }),
}));

describe('AddNodeDialog', () => {
  beforeEach(() => {
    startOAuthMock.mockReset();
    vi.stubGlobal(
      'open',
      vi.fn(() => ({ closed: false, close: vi.fn() })),
    );
  });

  it('should start Google Drive OAuth after selecting provider and filling node name', async () => {
    startOAuthMock.mockResolvedValue({
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    });

    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AddNodeDialog open onClose={vi.fn()} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Google Drive/i }));
    fireEvent.change(screen.getByLabelText(/Nome do no/i), {
      target: { value: 'Drive da Familia' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Conectar conta/i }));

    await waitFor(() => {
      expect(startOAuthMock).toHaveBeenCalledWith({
        provider: 'google_drive',
        nodeName: 'Drive da Familia',
      });
    });
    expect(window.open).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/v2/auth',
      'oauth-node-provider',
      expect.stringContaining('width=560'),
    );
  });
});
