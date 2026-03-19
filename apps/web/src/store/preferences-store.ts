import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  sidebarCollapsed: boolean;
  galleryLayout: "grid" | "list";
  toggleSidebar: () => void;
  setGalleryLayout: (layout: "grid" | "list") => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      galleryLayout: "grid",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setGalleryLayout: (layout) => set({ galleryLayout: layout }),
    }),
    { name: "alexandria-preferences" },
  ),
);
