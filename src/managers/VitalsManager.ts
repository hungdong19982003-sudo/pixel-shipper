import Phaser from 'phaser';
import { VITALS_CONFIG } from '../config/GameConfig';
import { Player } from '../entities/Player';
import { SoundManager } from '../assets/SoundManager';

export interface VitalConsumeResult {
  success: boolean;
  message: string;
  cost?: number;
  restoredAmount?: number;
}

/**
 * VitalsManager - Quản lý Hệ sinh tồn nhẹ (Task 1.1)
 * Điều phối các chỉ số Đói (Hunger), Khát (Thirst), Năng lượng (Energy),
 * Xử lý tương tác Trà đá vỉa hè, Bánh mì Patê và Ngủ qua đêm tại phòng trọ.
 */
export class VitalsManager {
  private static instance: VitalsManager;
  private scene?: Phaser.Scene;

  private constructor() {}

  public static getInstance(): VitalsManager {
    if (!VitalsManager.instance) {
      VitalsManager.instance = new VitalsManager();
    }
    return VitalsManager.instance;
  }

  public init(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Cập nhật chỉ số hao mòn theo thời gian thực (delta ms)
   */
  public update(delta: number, player: Player, isMounted: boolean) {
    if (!player || !player.stats) return;

    const seconds = delta / 1000;

    // 1. Tiêu hao Đói (Hunger)
    player.stats.hunger = Math.max(0, player.stats.hunger - VITALS_CONFIG.hungerDecayRate * seconds);

    // 2. Tiêu hao Khát (Thirst)
    player.stats.thirst = Math.max(0, player.stats.thirst - VITALS_CONFIG.thirstDecayRate * seconds);

    // 3. Tiêu hao Năng lượng (Energy)
    const energyRate = isMounted
      ? VITALS_CONFIG.energyDecayRateMounted
      : VITALS_CONFIG.energyDecayRateOnFoot;
    player.stats.energy = Math.max(0, player.stats.energy - energyRate * seconds);
  }

  /**
   * Tính hệ số tốc độ di chuyển dựa trên thể lực (debuff khi đói/khát kiệt sức)
   */
  public getSpeedMultiplier(player: Player): number {
    if (!player || !player.stats) return 1.0;
    const isExhausted =
      player.stats.hunger < VITALS_CONFIG.lowVitalThreshold ||
      player.stats.thirst < VITALS_CONFIG.lowVitalThreshold ||
      player.stats.energy < VITALS_CONFIG.lowVitalThreshold;

    return isExhausted ? VITALS_CONFIG.speedDebuffFactor : 1.0;
  }

  /**
   * Kiểm tra xem có chỉ số nào đang ở mức báo động (< 20%) không
   */
  public getVitalWarnings(player: Player) {
    if (!player || !player.stats) {
      return { lowHunger: false, lowThirst: false, lowEnergy: false, hasAny: false };
    }
    const lowHunger = player.stats.hunger < VITALS_CONFIG.lowVitalThreshold;
    const lowThirst = player.stats.thirst < VITALS_CONFIG.lowVitalThreshold;
    const lowEnergy = player.stats.energy < VITALS_CONFIG.lowVitalThreshold;
    return {
      lowHunger,
      lowThirst,
      lowEnergy,
      hasAny: lowHunger || lowThirst || lowEnergy
    };
  }

  /**
   * Uống Trà Đá vỉa hè (3.000đ - Hồi +50 Khát, +10 Năng lượng)
   */
  public drinkTea(player: Player): VitalConsumeResult {
    const config = VITALS_CONFIG.teaStall;
    if (player.stats.wallet < config.cost) {
      return {
        success: false,
        message: 'Không đủ tiền! Cần 3.000đ để uống trà đá.'
      };
    }

    if (player.stats.thirst >= 98) {
      return {
        success: false,
        message: 'Bạn đang không khát nước!'
      };
    }

    player.stats.wallet -= config.cost;
    player.stats.thirst = Math.min(100, player.stats.thirst + config.thirstRestore);
    player.stats.energy = Math.min(100, player.stats.energy + config.energyRestore);

    SoundManager.getInstance().playDrinkSip();

    this.scene?.game.events.emit('vital_consumed', {
      type: 'thirst',
      amount: config.thirstRestore,
      message: `+${config.thirstRestore} Khát 💧 (-${config.cost.toLocaleString()}đ)`
    });


    return {
      success: true,
      message: `Đã uống cốc trà đá mát lạnh! (+${config.thirstRestore}% Khát)`,
      cost: config.cost,
      restoredAmount: config.thirstRestore
    };
  }

  /**
   * Mua Bánh Mì Patê giòn rụm (15.000đ - Hồi +45 Đói, +15 Năng lượng)
   */
  public eatBanhMi(player: Player): VitalConsumeResult {
    const config = VITALS_CONFIG.banhMiCart;
    if (player.stats.wallet < config.cost) {
      return {
        success: false,
        message: 'Không đủ tiền! Cần 15.000đ để mua bánh mì patê.'
      };
    }

    if (player.stats.hunger >= 98) {
      return {
        success: false,
        message: 'Bạn đang no bụng!'
      };
    }

    player.stats.wallet -= config.cost;
    player.stats.hunger = Math.min(100, player.stats.hunger + config.hungerRestore);
    player.stats.energy = Math.min(100, player.stats.energy + config.energyRestore);

    SoundManager.getInstance().playEatCrunch();

    this.scene?.game.events.emit('vital_consumed', {
      type: 'hunger',
      amount: config.hungerRestore,
      message: `+${config.hungerRestore} Đói 🥖 (-${config.cost.toLocaleString()}đ)`
    });


    return {
      success: true,
      message: `Đã ăn ổ bánh mì patê nóng giòn! (+${config.hungerRestore}% Đói)`,
      cost: config.cost,
      restoredAmount: config.hungerRestore
    };
  }

  /**
   * Ngủ qua đêm tại phòng trọ ấm cúng (Task 1.2)
   * Phục hồi 100% Năng lượng và chuyển sang ngày làm việc mới.
   */
  public sleepOvernight(player: Player): { success: boolean; newDay: number; message: string } {
    const config = VITALS_CONFIG.sleep;

    player.stats.energy = config.energyRestore; // 100%
    player.stats.hunger = Math.max(15, player.stats.hunger - config.hungerCost);
    player.stats.thirst = Math.max(15, player.stats.thirst - config.thirstCost);
    player.stats.day = (player.stats.day ?? 1) + 1;

    SoundManager.getInstance().playSleepChime();

    this.scene?.game.events.emit('day_advanced', {
      day: player.stats.day,
      message: `💤 Đã ngủ một giấc ngon lành! Bắt đầu Ngày ${player.stats.day}`
    });

    return {
      success: true,
      newDay: player.stats.day,
      message: `Bạn cảm thấy tràn đầy năng lượng cho Ngày ${player.stats.day}!`
    };
  }
}
