import Phaser from 'phaser';
import { AssetGenerator } from '../assets/AssetGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Hiển thị text loading phong cách pixel
    const { width, height } = this.cameras.main;
    const loadingText = this.add.text(width / 2, height / 2 - 20, 'PIXEL SHIPPER: CITY TALES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#2ecc71'
    }).setOrigin(0.5);

    const subText = this.add.text(width / 2, height / 2 + 25, 'Đang chuẩn bị thành phố & vẽ textures...', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '16px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [loadingText, subText],
      alpha: 0.5,
      yoyo: true,
      repeat: -1,
      duration: 500
    });
  }

  create() {
    // Sinh toàn bộ Procedural Pixel Art Textures
    AssetGenerator.generateAll(this);

    // Chuyển tới màn hình tiêu đề trước khi vào thành phố.
    this.time.delayedCall(300, () => {
      this.scene.start('TitleScene');
    });
  }
}
