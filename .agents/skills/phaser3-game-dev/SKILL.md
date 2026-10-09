---
name: phaser3-game-dev
description: >-
  Comprehensive guide and best practices for developing 2D games with Phaser 3, TypeScript, and Vite.
  Use this skill whenever creating scenes, physics interactions, camera controls, player movement,
  tilemaps, sprite animations, or UI overlays in Phaser 3.
---

# Phaser 3 Game Development Skill

This skill provides architecture patterns and reference implementations for building robust 2D games using Phaser 3.

## 1. Scene Architecture Pattern

Separate game logic across focused scenes:
- **`BootScene`**: Generate procedural textures, preload assets, configure audio context, transition to CityScene.
- **`CityScene`**: World simulation, physics world, tilemaps, entities (Player, Vehicle, Hazards), camera following.
- **`UIScene`**: Screen-space HUD, Smartphone driver app overlay, compass needle, food integrity meter, popups.

```typescript
// Always run UIScene in parallel with CityScene
this.scene.launch('UIScene');
```

## 2. Arcade Physics & Responsive Movement

### Top-Down Acceleration & Inertia (Cozy Bike Feel)
```typescript
// In Vehicle update loop:
const accel = 800; // px/s^2
const maxSpeed = 350;
const drag = 0.95; // smooth friction

if (cursors.left.isDown) body.setAccelerationX(-accel);
else if (cursors.right.isDown) body.setAccelerationX(accel);
else body.setAccelerationX(0);

// Cap max velocity
body.setMaxVelocity(maxSpeed, maxSpeed);
// Smooth rotation towards movement angle
if (body.velocity.length() > 10) {
  const targetAngle = Phaser.Math.RadToDeg(body.velocity.angle());
  sprite.angle = Phaser.Math.Angle.RotateTo(sprite.angle, targetAngle, 8);
}
```

## 3. Pixel-Perfect Camera Follow
```typescript
camera.startFollow(player, true, 0.08, 0.08); // smooth lerp
camera.setBounds(0, 0, mapWidth, mapHeight);
camera.setRoundPixels(true); // Prevents sub-pixel jitter in pixel art
```

## 4. UI Layering & Input Propagation
- Place all UI containers in `UIScene` with `setScrollFactor(0)` so they remain fixed on screen.
- Use Phaser Events (`this.scene.get('CityScene').events.emit(...)`) to communicate cleanly between Game World and UI.
