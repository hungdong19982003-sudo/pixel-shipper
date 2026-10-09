import Phaser from 'phaser';
import { VehicleConfig } from '../types';
import { DEFAULT_MOTORBIKE, MOUNT_INTERACTION_RADIUS } from '../config/GameConfig';

/**
 * Thực thể Xe Máy (Vehicle)
 * Quản lý trạng thái đỗ xe, tương tác lên/xuống xe và thông số kỹ thuật xe máy Wave Alpha
 */
export class Vehicle {
  public scene: Phaser.Scene;
  public sprite: Phaser.GameObjects.Image;
  public config: VehicleConfig;
  public isMounted: boolean = false;
  public currentDirection: 'down' | 'up' | 'left' | 'right' = 'down';

  private hintContainer: Phaser.GameObjects.Container;
  private hintText: Phaser.GameObjects.Text;
  private hintBg: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: VehicleConfig = DEFAULT_MOTORBIKE
  ) {
    this.scene = scene;
    this.config = config;

    // Sprite xe máy khi đỗ trên đường
    this.sprite = this.scene.add.image(x, y, `bike_${this.currentDirection}`);
    this.sprite.setDepth(y);

    // Giao diện gợi ý bấm phím F lên xe
    this.hintContainer = this.scene.add.container(x, y - 32);
    this.hintContainer.setDepth(9999);

    this.hintBg = this.scene.add.graphics();
    this.hintBg.fillStyle(0x0f172a, 0.9);
    this.hintBg.fillRoundedRect(-60, -12, 120, 24, 6);
    this.hintBg.lineStyle(1, 0xfacc15, 0.9);
    this.hintBg.strokeRoundedRect(-60, -12, 120, 24, 6);

    this.hintText = this.scene.add.text(0, 0, '🛵 [F] LÊN XE WAVE', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '11px',
      color: '#facc15'
    }).setOrigin(0.5);

    this.hintContainer.add([this.hintBg, this.hintText]);
    this.hintContainer.setVisible(false);

    // Hiệu ứng nhấp nháy / nảy nhẹ hint
    this.scene.tweens.add({
      targets: this.hintContainer,
      y: '-=3',
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Tính khoảng cách Euclidean từ người chơi đến xe máy
   */
  public getDistanceTo(playerX: number, playerY: number): number {
    return Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);
  }

  /**
   * Kiểm tra người chơi có đang đứng trong phạm vi lên xe không (< 48px)
   */
  public canMount(playerX: number, playerY: number): boolean {
    if (this.isMounted) return false;
    return this.getDistanceTo(playerX, playerY) <= MOUNT_INTERACTION_RADIUS;
  }

  /**
   * Người chơi trèo lên xe máy
   */
  public mount() {
    this.isMounted = true;
    this.sprite.setVisible(false);
    this.hintContainer.setVisible(false);
  }

  /**
   * Người chơi xuống xe máy tại vị trí chỉ định
   */
  public dismount(x: number, y: number, direction: 'down' | 'up' | 'left' | 'right') {
    this.isMounted = false;
    this.currentDirection = direction;
    this.sprite.setPosition(x, y);
    this.sprite.setTexture(`bike_${direction}`);
    this.sprite.setDepth(y);
    this.sprite.setVisible(true);

    this.hintContainer.setPosition(x, y - 32);

    // Hiệu ứng nảy nhẹ khi dựng chân chống xe
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 0.9,
      yoyo: true,
      duration: 120,
      ease: 'Quad.easeInOut'
    });
  }

  /**
   * Cập nhật trạng thái hiển thị hint lên xe
   */
  public update(playerX: number, playerY: number, playerMounted: boolean) {
    if (playerMounted || this.isMounted) {
      this.hintContainer.setVisible(false);
      return;
    }

    const inRange = this.canMount(playerX, playerY);
    this.hintContainer.setVisible(inRange);
  }

  public destroy() {
    this.sprite.destroy();
    this.hintContainer.destroy();
  }
}
