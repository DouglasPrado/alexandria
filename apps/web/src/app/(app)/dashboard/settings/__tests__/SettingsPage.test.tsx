/**
 * SettingsPage — testes de perfil e troca de senha.
 * Fonte: docs/frontend/web/04-components.md (SettingsPage)
 * Fonte: docs/backend/05-api-contracts.md (PATCH /api/members/me)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPage from '../page';

vi.mock('@/store/auth-store', () => ({
  useAuthStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      member: { id: 'm1', name: 'Douglas', email: 'douglas@familia.com', role: 'admin', clusterId: 'c1' },
      setMember: vi.fn(),
    }),
  ),
}));

vi.mock('@/features/settings', () => ({
  useUpdateProfile: vi.fn(),
}));

import { useUpdateProfile } from '@/features/settings';

describe('SettingsPage', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUpdateProfile).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  it('renderiza o formulario de perfil com nome pre-preenchido', () => {
    render(<SettingsPage />);
    const input = screen.getByDisplayValue('Douglas');
    expect(input).toBeInTheDocument();
  });

  it('renderiza os campos de troca de senha', () => {
    render(<SettingsPage />);
    expect(screen.getByPlaceholderText('Senha atual')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nova senha')).toBeInTheDocument();
  });

  it('submete o formulario de perfil com o nome atualizado', async () => {
    render(<SettingsPage />);
    const input = screen.getByDisplayValue('Douglas');
    fireEvent.change(input, { target: { value: 'Douglas Prado' } });
    fireEvent.click(screen.getByTestId('save-profile'));
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Douglas Prado' }),
        expect.anything(),
      );
    });
  });

  it('submete o formulario de senha com currentPassword e newPassword', async () => {
    render(<SettingsPage />);
    fireEvent.change(screen.getByPlaceholderText('Senha atual'), { target: { value: 'SenhaAtual123' } });
    fireEvent.change(screen.getByPlaceholderText('Nova senha'), { target: { value: 'NovaSenha456' } });
    fireEvent.click(screen.getByTestId('save-password'));
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ currentPassword: 'SenhaAtual123', newPassword: 'NovaSenha456' }),
        expect.anything(),
      );
    });
  });

  it('exibe spinner enquanto isPending=true', () => {
    vi.mocked(useUpdateProfile).mockReturnValue({ mutate: mockMutate, isPending: true } as any);
    render(<SettingsPage />);
    expect(screen.getByTestId('settings-saving')).toBeInTheDocument();
  });
});
