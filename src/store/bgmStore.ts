import { create } from 'zustand';

interface BgmState {
  trackIndex: number;
  isPlaying: boolean;
  progress: number; // 0 ~ 100
  isOpen: boolean;
  
  // Actions
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  setTrack: (idx: number) => void;
  setProgress: (n: number) => void;
  toggleOpen: () => void;
}

const TRACK_COUNT = 6;

export const useBgmStore = create<BgmState>((set) => ({
  trackIndex: 0,
  isPlaying: false,
  progress: 0,
  isOpen: true,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  
  next: () =>
    set((state) => ({
      trackIndex: (state.trackIndex + 1) % TRACK_COUNT,
      progress: 0,
      isPlaying: true, // Auto-play on skip
    })),

  prev: () =>
    set((state) => ({
      trackIndex: (state.trackIndex - 1 + TRACK_COUNT) % TRACK_COUNT,
      progress: 0,
      isPlaying: true, // Auto-play on skip
    })),

  setTrack: (idx) =>
    set({
      trackIndex: idx,
      progress: 0,
      isPlaying: true,
    }),

  setProgress: (n) => set({ progress: n }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
