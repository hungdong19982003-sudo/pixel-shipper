import Phaser from 'phaser';
import './style.css';
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { CityScene } from './scenes/CityScene';
import { RoomScene } from './scenes/RoomScene';
import { UIScene } from './scenes/UIScene';
import { RestaurantScene } from './scenes/RestaurantScene';
import { TitleScene } from './scenes/TitleScene';
import { ApartmentScene } from './scenes/ApartmentScene';
import { FishingScene } from './scenes/FishingScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, TitleScene, CityScene, RoomScene, RestaurantScene, ApartmentScene, FishingScene, UIScene]
};

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(config);
  if (import.meta.env.DEV) {
    (window as Window & { pixelShipper?: Phaser.Game }).pixelShipper = game;
  }
});
