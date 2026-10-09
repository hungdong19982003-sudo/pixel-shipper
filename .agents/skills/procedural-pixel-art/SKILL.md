---
name: procedural-pixel-art
description: >-
  Techniques and recipes for procedurally generating crisp 16-bit / 32-bit pixel art textures
  directly onto HTML5 canvas and registering them in Phaser 3. Use when designing character
  spritesheets, vehicles, urban Asian tilesets, obstacles, or retro icons without external image files.
---

# Procedural Pixel Art Generator Skill

This skill guides the procedural creation of pixel art textures via code, guaranteeing zero 404 network errors, crisp rendering, and fast loading.

## 1. Pixel Art Canvas Guidelines

- **Resolution:** Work with integer scales: 16x16, 24x24, 32x32, or 48x48.
- **Pixel Grid:** Always disable anti-aliasing when rendering onto canvas:
  ```typescript
  ctx.imageSmoothingEnabled = false;
  ```
- **Cozy Asian Urban Palette:**
  - Asphalt Road: `#2C3038`, `#383E4A`, `#484F5E`
  - Road Markings: `#E8EDF5`, `#F4D03F` (yellow dashed lines)
  - Sidewalk Red Tile: `#C0392B`, `#D98880`, `#922B21`
  - Delivery Brand Green/Blue: `#16A085`, `#1ABC9C`, `#2980B9`
  - Brick House / Pho Shop: `#E67E22`, `#F39C12`, `#C0392B`
  - Night Lights & Neon: `#F1C40F`, `#E74C3C`, `#3498DB`

## 2. Drawing Sprites via Pixel Matrix
```typescript
export function drawPixelMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: string[],
  colorMap: Record<string, string>,
  pixelSize = 2,
  offsetX = 0,
  offsetY = 0
) {
  for (let y = 0; y < matrix.length; y++) {
    const row = matrix[y];
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      if (char !== ' ' && colorMap[char]) {
        ctx.fillStyle = colorMap[char];
        ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}
```

## 3. Registering with Phaser
```typescript
const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext('2d')!;
// ... draw pixel art ...
scene.textures.addCanvas('player_idle', canvas);
```
