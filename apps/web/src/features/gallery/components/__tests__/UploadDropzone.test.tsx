import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UploadDropzone } from '../UploadDropzone';

describe('UploadDropzone', () => {
  it('should NOT render a hidden <input> with accept filter — uses programmatic picker instead', () => {
    render(<UploadDropzone onFiles={vi.fn()} />);

    // No hidden input with accept — file picker is created programmatically
    // so macOS Finder shows ALL files as selectable (no grayed out files)
    const inputs = document.querySelectorAll('input[type="file"]');
    expect(inputs.length).toBe(0);
  });

  it('should create a programmatic input without accept on click', () => {
    const onFiles = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement');

    render(<UploadDropzone onFiles={onFiles} />);

    const dropzone = screen.getByRole('button', { name: 'Selecionar arquivos para upload' });
    fireEvent.click(dropzone);

    // Should have created an input element
    const inputCall = createElementSpy.mock.results.find(
      (r) => r.type === 'return' && (r.value as HTMLElement).tagName === 'INPUT',
    );
    expect(inputCall).toBeDefined();

    const input = inputCall!.value as HTMLInputElement;
    expect(input.type).toBe('file');
    expect(input.multiple).toBe(true);
    // Must NOT have accept attribute — this is what blocks ZIP/DMG on macOS Finder
    expect(input.hasAttribute('accept')).toBe(false);

    createElementSpy.mockRestore();
  });

  it('should mention ZIP and DMG in the description', () => {
    render(<UploadDropzone onFiles={vi.fn()} />);

    expect(screen.getByText(/ZIP/)).toBeInTheDocument();
    expect(screen.getByText(/DMG/)).toBeInTheDocument();
  });

  it('should handle drag and drop', () => {
    const onFiles = vi.fn();
    render(<UploadDropzone onFiles={onFiles} />);

    const dropzone = screen.getByRole('button', { name: 'Selecionar arquivos para upload' });

    const file = new File(['content'], 'backup.zip', { type: 'application/zip' });
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it('should not open picker when disabled', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    render(<UploadDropzone onFiles={vi.fn()} disabled />);

    const dropzone = screen.getByRole('button', { name: 'Selecionar arquivos para upload' });
    fireEvent.click(dropzone);

    const inputCalls = createElementSpy.mock.results.filter(
      (r) => r.type === 'return' && (r.value as HTMLElement).tagName === 'INPUT',
    );
    expect(inputCalls.length).toBe(0);

    createElementSpy.mockRestore();
  });
});
