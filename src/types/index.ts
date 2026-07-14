export type WindowId = 'write' | 'guestbook' | 'frame' | 'camera' | 'select' | 'result' | 'pc' | 'trash';

export type LayoutType = '2x2' | '1x4';

export type FilterType =
  | 'none'
  | 'bw'
  | 'soft'
  | 'sepia'
  | 'neon'
  | 'vignette'
  | 'citypop'
  | 'vhs';

export interface FrameSlot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FrameConfig {
  id: string;
  name: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  textColor: string;
  slots: FrameSlot[];
  logoArea?: {
    y: number;
    text: string;
  };
}

export interface GuestbookEntry {
  id: string;
  nickname: string;
  message: string;
  createdAt: string;
}
