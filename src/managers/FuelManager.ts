import Phaser from 'phaser';
import { FUEL_CONFIG } from '../config/GameConfig';
import { Player } from '../entities/Player';
import { SoundManager } from '../assets/SoundManager';

export interface RefuelResult {
  success: boolean;
  message: string;
  cost?: number;
  addedFuel?: number;
}

/**
 * FuelManager - Quản lý Nhiên liệu & Cây xăng (Task 1.4)
 * Điều phối bình xăng xe máy Wave Alpha, tiêu hao khi chạy,
 * kiểm tra cạn xăng và bơm xăng tại Cây Xăng Petrolimex.
 */
export class FuelManager {
  private static instance: FuelManager;
  private scene?: Phaser.Scene;

  private constructor() {}

  public static getInstance(): FuelManager {
    if (!FuelManager.instance) {
      FuelManager.instance = new FuelManager();
    }
    return FuelManager.instance;
  }

  public init(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Tiêu hao xăng khi xe nổ máy & lưu thông
   */
  public consumeFuel(delta: number, speed: number, player: Player) {
    if (!player || !player.stats) return;

    // Đảm bảo chỉ số fuel hợp lệ
    if (typeof player.stats.fuel !== 'number' || isNaN(player.stats.fuel)) {
      player.stats.fuel = 100;
    }

    if (player.stats.fuel <= 0) {
      player.stats.fuel = 0;
      return;
    }

    const dt = delta / 1000;
    let consumption = 0;

    if (speed < 10) {
      // Đứng yên nổ máy ga-răng-ti
      consumption = FUEL_CONFIG.idleConsumptionRate * dt;
    } else {
      // Đang chạy xe: tỉ lệ thuận với vận tốc
      consumption = (FUEL_CONFIG.idleConsumptionRate * 0.5 + speed * FUEL_CONFIG.speedConsumptionFactor) * dt;
    }

    player.stats.fuel = Math.max(0, player.stats.fuel - consumption);
  }

  /**
   * Kiểm tra xem xe có bị cạn kiệt xăng không
   */
  public isOutOfFuel(player: Player): boolean {
    if (!player || !player.stats) return false;
    return (player.stats.fuel ?? 100) <= 0.1;
  }

  /**
   * Bơm đầy bình xăng tại Cây Xăng Petrolimex (Task 1.4)
   */
  public refuel(player: Player): RefuelResult {
    if (!player || !player.stats) {
      return { success: false, message: 'Lỗi thông tin người chơi!' };
    }

    const currentFuel = player.stats.fuel ?? 100;
    const missing = 100 - currentFuel;

    if (missing < 2) {
      return {
        success: false,
        message: 'Bình xăng của bạn vẫn còn đầy ắp!'
      };
    }

    const totalCost = Math.round(missing * FUEL_CONFIG.costPerPercent);

    if (player.stats.wallet < totalCost) {
      // Thử bơm lượng xăng tương ứng với số tiền người chơi có
      const affordableFuel = Math.floor(player.stats.wallet / FUEL_CONFIG.costPerPercent);
      if (affordableFuel < 5) {
        return {
          success: false,
          message: `Không đủ tiền đổ xăng! Cần tối thiểu ${(5 * FUEL_CONFIG.costPerPercent).toLocaleString()}đ.`
        };
      }

      const actualCost = affordableFuel * FUEL_CONFIG.costPerPercent;
      player.stats.wallet -= actualCost;
      player.stats.fuel = Math.min(100, currentFuel + affordableFuel);

      SoundManager.getInstance().playGasRefuel();

      return {
        success: true,
        message: `Đã bơm +${affordableFuel}% xăng với ${actualCost.toLocaleString()}đ!`,
        cost: actualCost,
        addedFuel: affordableFuel
      };
    }

    // Đủ tiền bơm đầy bình 100%
    player.stats.wallet -= totalCost;
    player.stats.fuel = 100;

    SoundManager.getInstance().playGasRefuel();

    this.scene?.game.events.emit('fuel_refueled', {
      cost: totalCost,
      fuel: 100,
      message: `⛽ Đã bơm đầy bình xăng! (-${totalCost.toLocaleString()}đ)`
    });

    return {
      success: true,
      message: `Đã bơm đầy 100% bình xăng! (-${totalCost.toLocaleString()}đ)`,
      cost: totalCost,
      addedFuel: Math.round(missing)
    };
  }
}
