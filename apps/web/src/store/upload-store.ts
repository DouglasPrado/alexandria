import { create } from 'zustand';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface UploadState {
  items: UploadItem[];
  addFiles: (files: File[]) => void;
  updateItem: (id: string, update: Partial<UploadItem>) => void;
  removeItem: (id: string) => void;
  clearDone: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  items: [],
  addFiles: (files) =>
    set((state) => ({
      items: [
        ...state.items,
        ...files.map((file) => ({
          id: `${Date.now()}-${file.name}`,
          file,
          progress: 0,
          status: 'pending' as const,
        })),
      ],
    })),
  updateItem: (id, update) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...update } : item,
      ),
    })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  clearDone: () =>
    set((state) => ({ items: state.items.filter((item) => item.status !== 'done') })),
}));
