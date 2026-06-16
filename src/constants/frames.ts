import { FrameConfig, FrameSlot } from '../types';

// Per-frame custom slot overrides (fractions × canvas size = pixels)
// Use the HTML test tool to find the right fractions for each PNG, then fill in here.
// Format: [left, top, width, height] as 0~1 fractions of canvas size
type SlotFractions = [number, number, number, number];

interface FrameSlotConfig {
  '1x4'?: SlotFractions[];
  '2x2'?: SlotFractions[];
}

const FRAME_SLOTS: Record<string, FrameSlotConfig> = {
  white_basic: {
    '1x4': [
      [0.04, 0.015, 0.92, 0.215],
      [0.04, 0.235, 0.92, 0.215],
      [0.04, 0.455, 0.92, 0.235],
      [0.04, 0.695, 0.92, 0.22 ],
    ],
    '2x2': [
      [0.0635, 0.0635, 0.4092, 0.3857],
      [0.5264, 0.0635, 0.4092, 0.3857],
      [0.0635, 0.502,  0.4092, 0.3896],
      [0.5264, 0.502,  0.4092, 0.3896],
    ],
  },

  susa: {
    '1x4': [
      [0.05, 0.09,  0.9, 0.2  ],
      [0.05, 0.305, 0.9, 0.205],
      [0.05, 0.52,  0.9, 0.205],
      [0.05, 0.735, 0.9, 0.2  ],
    ],
    '2x2': [
      [0.0742, 0.1514, 0.3945, 0.3193],
      [0.5303, 0.1514, 0.3955, 0.3193],
      [0.0742, 0.5449, 0.3945, 0.3193],
      [0.5303, 0.5449, 0.3955, 0.3203],
    ],
  },

  black_basic: {
    '1x4': [
      [0.06, 0.02,  0.88, 0.215],
      [0.06, 0.25,  0.88, 0.225],
      [0.06, 0.49,  0.88, 0.23 ],
      [0.06, 0.735, 0.88, 0.215],
    ],
    '2x2': [
      [0.0342, 0.0342, 0.4443, 0.4346],
      [0.5225, 0.0342, 0.4443, 0.4346],
      [0.0342, 0.498,  0.4443, 0.4395],
      [0.5225, 0.498,  0.4443, 0.4395],
    ],
  },

  gray_basic: {
    '1x4': [
      [0.07, 0.015, 0.86, 0.2  ],
      [0.06, 0.225, 0.88, 0.215],
      [0.06, 0.45,  0.88, 0.235],
      [0.06, 0.695, 0.88, 0.215],
    ],
    '2x2': [
      [0.0635, 0.1445, 0.4092, 0.3066],
      [0.5264, 0.1445, 0.4092, 0.3066],
      [0.0635, 0.502,  0.4092, 0.3936],
      [0.5264, 0.502,  0.4092, 0.3936],
    ],
  },

  blue_bear: {
    '1x4': [
      [0.07, 0.065, 0.86, 0.195],
      [0.05, 0.285, 0.91, 0.2  ],
      [0.05, 0.505, 0.91, 0.2  ],
      [0.05, 0.715, 0.91, 0.19 ],
    ],
    '2x2': [
      [0.1055, 0.168,  0.3779, 0.3467],
      [0.5156, 0.1689, 0.3779, 0.3457],
      [0.0869, 0.5469, 0.3965, 0.3311],
      [0.5156, 0.5469, 0.3994, 0.3467],
    ],
  },

  nineties: {
    '1x4': [
      [0.07, 0.145, 0.86, 0.17 ],
      [0.06, 0.33,  0.88, 0.175],
      [0.06, 0.515, 0.88, 0.175],
      [0.06, 0.7,   0.88, 0.18 ],
    ],
    '2x2': [
      [0.0684, 0.1367, 0.4102, 0.332 ],
      [0.5225, 0.1367, 0.4102, 0.332 ],
      [0.0684, 0.5225, 0.4102, 0.3369],
      [0.5225, 0.5225, 0.4102, 0.3369],
    ],
  },
};

// Canvas dimensions per layout
const CANVAS = {
  '1x4': { w: 591,  h: 1890 },
  '2x2': { w: 800,  h: 800  },
};

function fractionsToSlots(fractions: SlotFractions[], layout: '2x2' | '1x4'): FrameSlot[] {
  const { w, h } = CANVAS[layout];
  return fractions.map(([lf, tf, wf, hf]) => ({
    x: Math.round(lf * w),
    y: Math.round(tf * h),
    w: Math.round(wf * w),
    h: Math.round(hf * h),
  }));
}

// Default slots (used when no per-frame override exists)
const DEFAULT_SLOTS: Record<'1x4' | '2x2', FrameSlot[]> = {
  '1x4': [
    { x: 59,  y: 120,  w: 473, h: 390 },
    { x: 59,  y: 540,  w: 473, h: 390 },
    { x: 59,  y: 960,  w: 473, h: 390 },
    { x: 59,  y: 1380, w: 473, h: 390 },
  ],
  '2x2': [
    { x: 40,  y: 40,  w: 355, h: 345 },
    { x: 405, y: 40,  w: 355, h: 345 },
    { x: 40,  y: 395, w: 355, h: 345 },
    { x: 405, y: 395, w: 355, h: 345 },
  ],
};

const DEFAULT_LOGO_Y: Record<'1x4' | '2x2', number> = {
  '1x4': 1820,
  '2x2': 770,
};

export const FRAMES_CONFIG: FrameConfig[] = [
  {
    id: 'white_basic',
    name: '흰색 기본',
    bgColor: '#ffffff',
    borderColor: '#dfdfdf',
    accentColor: '#000000',
    textColor: '#000000',
    slots: [],
  },
  {
    id: 'gray_basic',
    name: '회색 기본',
    bgColor: '#c0c0c0',
    borderColor: '#808080',
    accentColor: '#ffffff',
    textColor: '#333333',
    slots: [],
  },
  {
    id: 'black_basic',
    name: '검정 기본',
    bgColor: '#000000',
    borderColor: '#333333',
    accentColor: '#ffffff',
    textColor: '#ffffff',
    slots: [],
  },
  {
    id: 'susa',
    name: '추억의스사',
    bgColor: '#fff0f5',
    borderColor: '#ffb6c1',
    accentColor: '#ff69b4',
    textColor: '#d63384',
    slots: [],
  },
  {
    id: 'blue_bear',
    name: '파란곰',
    bgColor: '#ddeeff',
    borderColor: '#88bbdd',
    accentColor: '#3366cc',
    textColor: '#003399',
    slots: [],
  },
  {
    id: 'nineties',
    name: "90's",
    bgColor: '#1a1a2e',
    borderColor: '#e94560',
    accentColor: '#0f3460',
    textColor: '#e94560',
    slots: [],
  },
];

export const getFrameConfig = (id: string, layout: '2x2' | '1x4'): FrameConfig => {
  const base = FRAMES_CONFIG.find(f => f.id === id) || FRAMES_CONFIG[0];
  const override = FRAME_SLOTS[id]?.[layout];

  const slots = override
    ? fractionsToSlots(override, layout)
    : DEFAULT_SLOTS[layout];

  return {
    ...base,
    slots,
    logoArea: { y: DEFAULT_LOGO_Y[layout], text: '★  자리네컷  ★' },
  };
};
