import Phaser from 'phaser';
import { HazardType } from '../types';

/**
 * Thực thể Chướng ngại vật trên mặt đường (Ổ gà, Vũng nước trơn)
 */
export class Hazard extends Phaser.Physics.Arcade.Sprite {
  public hazardType: HazardType;
  public lastTriggeredTime: number = 0;
  public triggerCooldownMs: number = 1500; // Khoảng thời gian giãn cách giữa 2 lần dính bẫy

  constructor(scene: Phaser.Scene, x: number, y: number, hazardType: HazardType) {
    const textureKey = hazardType === HazardType.POTHOLE ? 'hazard_pothole' : 'hazard_oil_slick';
    super(scene, x, y, textureKey);

    this.hazardType = hazardType;

    // Thêm vào scene và cấu hình physics body
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body

    this.setDepth(2);

    // Cấu hình hitbox tròn ở tâm
    if (hazardType === HazardType.POTHOLE) {
      this.setSize(28, 20);
      this.setOffset(6, 10);
    } else {
      this.setSize(32, 22);
      this.setOffset(6, 11);
    }
  }

  /**
   * Kiểm tra xem chướng ngại vật đã sẵn sàng kích hoạt lại hay chưa
   */
  public canTrigger(currentTime: number): boolean {
    return currentTime - this.lastTriggeredTime > this.triggerCooldownMs;
  }

  /**
   * Đánh dấu thời điểm kích hoạt
   */
  public trigger(currentTime: number) {
    this.lastTriggeredTime = currentTime;

    // Hiệu ứng phản hồi xúc giác nhẹ tại chướng ngại vật
    this.scene.tweens.add({
      targets: this,
      scale: 1.15,
      yoyo: true,
      duration: 120,
      ease: 'Quad.easeInOut'
    });
  }
}
