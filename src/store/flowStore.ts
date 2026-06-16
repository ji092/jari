import { create } from 'zustand';
import { WindowId, LayoutType, FilterType } from '../types';

interface FlowState {
  openWindows: WindowId[];
  activeWindow: WindowId | null;
  selectedLayout: LayoutType | null;
  selectedFrameId: string | null;
  capturedPhotos: string[];
  selectedOrder: number[];
  currentFilter: FilterType;
  
  // Actions
  openWindow: (id: WindowId) => void;
  closeWindow: (id: WindowId) => void;
  setLayout: (layout: LayoutType | null) => void;
  setFrameId: (id: string | null) => void;
  addPhoto: (dataUrl: string) => void;
  resetPhotos: () => void;
  togglePhotoSelect: (idx: number) => void;
  setFilter: (filter: FilterType) => void;
  resetAll: () => void;
}

export const useFlowStore = create<FlowState>((set) => ({
  openWindows: [],
  activeWindow: null,
  selectedLayout: null,
  selectedFrameId: null,
  capturedPhotos: [],
  selectedOrder: [],
  currentFilter: 'none',

  openWindow: (id) =>
    set((state) => {
      const nextOpen = state.openWindows.includes(id)
        ? state.openWindows
        : [...state.openWindows, id];
      return {
        openWindows: nextOpen,
        activeWindow: id,
      };
    }),

  closeWindow: (id) =>
    set((state) => {
      const nextOpen = state.openWindows.filter((win) => win !== id);
      const nextActive =
        state.activeWindow === id
          ? nextOpen.length > 0
            ? nextOpen[nextOpen.length - 1]
            : null
          : state.activeWindow;
      return {
        openWindows: nextOpen,
        activeWindow: nextActive,
      };
    }),

  setLayout: (layout) => set({ selectedLayout: layout }),
  setFrameId: (id) => set({ selectedFrameId: id }),
  
  addPhoto: (dataUrl) =>
    set((state) => {
      if (state.capturedPhotos.length >= 8) return {};
      return { capturedPhotos: [...state.capturedPhotos, dataUrl] };
    }),

  resetPhotos: () => set({ capturedPhotos: [], selectedOrder: [] }),

  togglePhotoSelect: (idx) =>
    set((state) => {
      const order = state.selectedOrder;
      if (order.includes(idx)) {
        return { selectedOrder: order.filter((i) => i !== idx) };
      }
      if (order.length < 4) {
        return { selectedOrder: [...order, idx] };
      }
      return {};
    }),

  setFilter: (filter) => set({ currentFilter: filter }),

  resetAll: () =>
    set({
      selectedLayout: null,
      selectedFrameId: null,
      capturedPhotos: [],
      selectedOrder: [],
      currentFilter: 'none',
    }),
}));
