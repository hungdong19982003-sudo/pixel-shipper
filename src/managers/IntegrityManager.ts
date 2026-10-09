import Phaser from 'phaser';
import { Order, OrderStatus } from '../types';
import { HAZARDS_CONFIG } from '../config/GameConfig';

export interface IntegrityDamageEvent {
  damage: number;
  currentIntegrity: number;
  type: 'pothole' | 'oil_slick' | 'crash';
  message: string;
}

/**
 * Trình quản lý Độ nguyên vẹn món ăn & Tác động của Chướng ngại vật
 */
export class IntegrityManager {
  private static instance: IntegrityManager;
  private currentIntegrity: number = 100;
  private activeOrder: Order | null = null;
  private activeOrders: Order[] = [];
  private scene?: Phaser.Scene;

  private constructor() {}

  public static getInstance(): IntegrityManager {
    if (!IntegrityManager.instance) {
      IntegrityManager.instance = new IntegrityManager();
    }
    return IntegrityManager.instance;
  }

  public init(scene: Phaser.Scene) {
    this.scene = scene;
    this.currentIntegrity = 100;
    this.activeOrders = [];
    this.activeOrder = null;
  }

  public setActiveOrder(order: Order | null) {
    this.setActiveOrders(order ? [order] : []);
  }

  public setActiveOrders(orders: readonly Order[]) {
    this.activeOrders = orders.filter((order) => order.status === OrderStatus.PICKED_UP);
    this.activeOrder = this.activeOrders[0] ?? null;
    this.currentIntegrity = this.activeOrders.length > 0 ?
      Math.min(...this.activeOrders.map((order) => order.currentIntegrity ?? 100)) : 100;
    this.emitUpdate();
  }

  public getActiveOrder(): Order | null {
    return this.activeOrder;
  }

  public getIntegrity(): number {
    return this.currentIntegrity;
  }

  public setIntegrity(value: number) {
    const next = Math.max(0, Math.min(100, Math.round(value)));
    const change = next - this.currentIntegrity;
    for (const order of this.activeOrders) {
      order.currentIntegrity = Math.max(0, Math.min(100, order.currentIntegrity + change));
    }
    this.currentIntegrity = this.activeOrders.length > 0 ?
      Math.min(...this.activeOrders.map((order) => order.currentIntegrity)) : next;
    this.emitUpdate();
  }

  /**
   * Xử lý va chạm với Ổ gà (Pothole)
   * - Nếu đi nhanh (> 140 px/s): Nảy xe, rung camera, trừ -10% đến -15% độ nguyên vẹn
   * - Nếu đi chậm (<= 140 px/s): An toàn, không trừ chất lượng
   */
  public applyPotholeHit(speed: number, cargoDamping: number = 0.25): boolean {
    const minSpeed = HAZARDS_CONFIG.pothole.minSpeedToDamage;

    if (speed <= minSpeed) {
      // Đi chậm an toàn qua ổ gà
      if (this.scene) {
        this.scene.events.emit('hazard_safe_pass', {
          message: '🛵 Đi chậm qua ổ gà an toàn!'
        });
      }
      return false;
    }

    // Tính toán sát thương
    const baseDamage = HAZARDS_CONFIG.pothole.baseDamage;
    const damage = Math.round(baseDamage *
      (this.activeOrders.length > 0 ? Math.max(...this.activeOrders.map((order) => order.fragility)) : 1) *
      (1 - cargoDamping));
    for (const order of this.activeOrders) {
      const itemDamage = Math.round(baseDamage * order.fragility * (1 - cargoDamping));
      order.currentIntegrity = Math.max(0, order.currentIntegrity - itemDamage);
    }
    this.currentIntegrity = this.activeOrders.length > 0 ?
      Math.min(...this.activeOrders.map((order) => order.currentIntegrity)) :
      Math.max(0, this.currentIntegrity - damage);

    // Rung camera
    if (this.scene) {
      this.scene.cameras.main.shake(
        HAZARDS_CONFIG.pothole.shakeDuration,
        HAZARDS_CONFIG.pothole.shakeIntensity
      );

      const eventData: IntegrityDamageEvent = {
        damage,
        currentIntegrity: this.currentIntegrity,
        type: 'pothole',
        message: `💥 Vấp ổ gà! -${damage}% Tô phở bị sóng sánh!`
      };

      this.scene.events.emit('integrity_damage', eventData);
      this.emitUpdate();
    }

    return true;
  }

  /**
   * Xử lý va chạm với Vũng dầu / Vũng nước trơn (Oil Slick)
   */
  public applyOilSlickHit() {
    if (!this.scene) return;

    this.scene.events.emit('spin_out', {
      durationMs: HAZARDS_CONFIG.oilSlick.spinDurationMs,
      message: '⚠️ Xe bị trượt vũng nước trơn! Mất lái tạm thời!'
    });
  }

  /**
   * Xử lý va chạm vào tường / lề đường khi đang mất lái
   */
  public applyCrashDamage() {
    const damage = 20;
    for (const order of this.activeOrders) {
      order.currentIntegrity = Math.max(0, order.currentIntegrity - damage);
    }
    this.currentIntegrity = this.activeOrders.length > 0 ?
      Math.min(...this.activeOrders.map((order) => order.currentIntegrity)) :
      Math.max(0, this.currentIntegrity - damage);

    if (this.scene) {
      this.scene.cameras.main.shake(200, 0.012);

      const eventData: IntegrityDamageEvent = {
        damage,
        currentIntegrity: this.currentIntegrity,
        type: 'crash',
        message: `💥 Tông vào lề đường! -${damage}% Hộp đồ ăn bị móp méo!`
      };

      this.scene.events.emit('integrity_damage', eventData);
      this.emitUpdate();
    }
  }

  private emitUpdate() {
    if (this.scene) {
      this.scene.events.emit('integrity_updated', {
        currentIntegrity: this.currentIntegrity,
        order: this.activeOrder
      });
    }
  }
}
