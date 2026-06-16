# Frames Directory

This folder manages theme-specific physical overlay PNG frames.

## Directory Structure:
```text
/public/frames/
└── {frameId}/
    ├── frame.png  # Transparent PNG image overlays (e.g. logos, characters)
    └── thumb.png  # Tiny thumbnail graphics
```

*Note: If frame.png or frame.json fetch is omitted, the canvas engine automatically renders geometric retro borders defined in `src/constants/frames.ts`.*
