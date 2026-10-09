import Phaser from 'phaser';
import { OrderManager } from './OrderManager';
import { OrderStatus } from '../types';
import { MAP_LOCATIONS } from '../config/GameConfig';

export interface NavigationData {
  hasTarget: boolean;
  targetName: string;
  targetX: number;
  targetY: number;
  distanceMeters: number;
  angleRad: number;
  angleDeg: number;
}

/**
 * Trình tính toán Định vị La bàn & Khoảng cách thời gian thực (NavigationManager)
 */
export class NavigationManager {
  private static instance: NavigationManager;

  private constructor() {}

  public static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  /**
   * Tính toán góc quay la bàn và khoảng cách mét ảo từ người chơi tới mục tiêu hiện tại
   */
  public getNavigationData(playerX: number, playerY: number): NavigationData {
    const order = OrderManager.getInstance().getCurrentOrder();

    let targetX = MAP_LOCATIONS.PHO_RESTAURANT.x;
    let targetY = MAP_LOCATIONS.PHO_RESTAURANT.y;
    let targetName = 'Quán Phở Bò Gia Truyền';
    let hasTarget = false;

    if (order) {
      if (order.status === OrderStatus.ACCEPTED) {
        // Giai đoạn 1: Đi tới quán lấy món
        targetX = order.restaurantPos.x;
        targetY = order.restaurantPos.y;
        targetName = order.restaurantName;
        hasTarget = true;
      } else if (order.status === OrderStatus.PICKED_UP) {
        // Giai đoạn 2: Đi tới nhà khách giao đồ
        targetX = order.customerPos.x;
        targetY = order.customerPos.y;
        targetName = order.customerAddress;
        hasTarget = true;
      }
    }

    const dx = targetX - playerX;
    const dy = targetY - playerY;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = Phaser.Math.RadToDeg(angleRad);
    const pixelDist = Math.sqrt(dx * dx + dy * dy);

    // Quy đổi khoảng cách: 1 ô 64px tương đương ~10 mét ảo
    const distanceMeters = Math.max(0, Math.round(pixelDist / 6.4));

    return {
      hasTarget,
      targetName,
      targetX,
      targetY,
      distanceMeters,
      angleRad,
      angleDeg
    };
  }
}
