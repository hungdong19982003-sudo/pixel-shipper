import { VEHICLES_CATALOG, GEAR_CATALOG } from '../config/GameConfig';
import { VehicleConfig } from '../types';
import { SoundManager } from '../assets/SoundManager';

/**
 * Trình quản lý Mua sắm & Nâng cấp Phương tiện / Trang bị (Task 2.4: Vehicle Shop)
 */
export class VehicleShopManager {
  private static instance: VehicleShopManager;

  private constructor() {}

  public static getInstance(): VehicleShopManager {
    if (!VehicleShopManager.instance) {
      VehicleShopManager.instance = new VehicleShopManager();
    }
    return VehicleShopManager.instance;
  }

  public getVehiclesCatalog(): VehicleConfig[] {
    return VEHICLES_CATALOG;
  }

  public getVehicleById(id: string): VehicleConfig | undefined {
    return VEHICLES_CATALOG.find((v) => v.id === id);
  }

  /**
   * Mua xe máy mới
   */
  public buyVehicle(player: any, vehicleId: string): { success: boolean; message: string } {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) {
      return { success: false, message: 'Không tìm thấy mẫu xe này!' };
    }

    if (player.stats.ownedVehicleIds?.includes(vehicleId)) {
      return { success: false, message: `Bạn đã sở hữu chiếc ${vehicle.name} rồi!` };
    }

    const price = vehicle.price ?? 0;
    if (player.stats.wallet < price) {
      return {
        success: false,
        message: `Ví không đủ ${price.toLocaleString()}đ để mua ${vehicle.name}!`
      };
    }

    player.stats.wallet -= price;
    if (!player.stats.ownedVehicleIds) {
      player.stats.ownedVehicleIds = ['wave_alpha'];
    }
    player.stats.ownedVehicleIds.push(vehicleId);

    // Tự động trang bị xe mới
    this.equipVehicle(player, vehicleId);

    SoundManager.getInstance().playSaveSuccess();

    return {
      success: true,
      message: `🎉 Chúc mừng bạn đã tậu xe mới: ${vehicle.name}! Xe đã được giao ngay lập tức!`
    };
  }

  /**
   * Đổi sang chiếc xe đã sở hữu
   */
  public equipVehicle(player: any, vehicleId: string): boolean {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle || !player.stats.ownedVehicleIds?.includes(vehicleId)) return false;

    player.stats.currentVehicleId = vehicleId;
    if (player.vehicle) {
      player.vehicle.config = vehicle;
    }

    return true;
  }

  /**
   * Nâng cấp Balo giữ nhiệt
   */
  public upgradeThermalBag(player: any): { success: boolean; message: string } {
    const currentLv = player.stats.thermalBagLevel ?? 1;
    const nextLv = currentLv + 1;
    const nextGear = GEAR_CATALOG.thermalBag.find((g) => g.level === nextLv);

    if (!nextGear) {
      return { success: false, message: 'Balo của bạn đã đạt cấp độ tối đa (Pro Foam)!' };
    }

    if (player.stats.wallet < nextGear.price) {
      return {
        success: false,
        message: `Ví không đủ ${nextGear.price.toLocaleString()}đ để nâng cấp ${nextGear.name}!`
      };
    }

    player.stats.wallet -= nextGear.price;
    player.stats.thermalBagLevel = nextLv;

    SoundManager.getInstance().playSaveSuccess();

    return {
      success: true,
      message: `🎒 Đã nâng cấp lên: ${nextGear.name} (${nextGear.desc})!`
    };
  }

  /**
   * Nâng cấp Giá treo điện thoại
   */
  public upgradePhoneMount(player: any): { success: boolean; message: string } {
    const currentLv = player.stats.phoneMountLevel ?? 1;
    const nextLv = currentLv + 1;
    const nextGear = GEAR_CATALOG.phoneMount.find((g) => g.level === nextLv);

    if (!nextGear) {
      return { success: false, message: 'Giá treo điện thoại đã đạt cấp độ tối đa (MagSafe)!' };
    }

    if (player.stats.wallet < nextGear.price) {
      return {
        success: false,
        message: `Ví không đủ ${nextGear.price.toLocaleString()}đ để nâng cấp ${nextGear.name}!`
      };
    }

    player.stats.wallet -= nextGear.price;
    player.stats.phoneMountLevel = nextLv;

    SoundManager.getInstance().playSaveSuccess();

    return {
      success: true,
      message: `📱 Đã nâng cấp lên: ${nextGear.name} (${nextGear.desc})!`
    };
  }

  /**
   * Tổng hợp hệ số giảm chấn động bảo vệ món ăn (Xe + Balo giữ nhiệt)
   */
  public getTotalCargoDamping(player: any): number {
    const vehicleDamping = player?.vehicle?.config?.cargoDamping ?? 0.25;
    const bagLv = player?.stats?.thermalBagLevel ?? 1;
    const bagGear = GEAR_CATALOG.thermalBag.find((g) => g.level === bagLv);
    const bagBonus = bagGear?.dampingBonus ?? 0;

    return Math.min(0.95, vehicleDamping + bagBonus);
  }

  /**
   * Tầm xa mở rộng của Radar Minimap nhờ Giá treo điện thoại
   */
  public getRadarBonus(player: any): number {
    const mountLv = player?.stats?.phoneMountLevel ?? 1;
    const mountGear = GEAR_CATALOG.phoneMount.find((g) => g.level === mountLv);
    return mountGear?.radarBonus ?? 0;
  }
}
