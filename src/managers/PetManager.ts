import Phaser from 'phaser';
import { PET_CONFIG } from '../config/GameConfig';
import { PlayerStats } from '../types';
import { SoundManager } from '../assets/SoundManager';

/**
 * Trình quản lý Hệ thống Nuôi mèo tại Phòng trọ (Task 2.3: Pet System)
 */
export class PetManager {
  private static instance: PetManager;
  private scene?: Phaser.Scene;
  private affection: number = 30; // Mặc định 30/100
  private hasPetToday: boolean = false;
  private hasFedToday: boolean = false;
  private luckyBuffActive: boolean = false;

  private constructor() {}

  public static getInstance(): PetManager {
    if (!PetManager.instance) {
      PetManager.instance = new PetManager();
    }
    return PetManager.instance;
  }

  public init(scene: Phaser.Scene, stats?: PlayerStats) {
    this.scene = scene;
    if (stats) {
      this.affection = stats.catAffection ?? 30;
      this.hasPetToday = stats.hasPetToday ?? false;
      this.hasFedToday = stats.hasFedToday ?? false;
      this.luckyBuffActive = stats.luckyBuffActive ?? false;
    }
  }

  /**
   * Vuốt ve bé mèo tại phòng trọ
   */
  public petCat(player?: any): { success: boolean; message: string; buffActivated: boolean } {
    SoundManager.getInstance().playCatMeow();
    SoundManager.getInstance().playCatPurr();

    this.affection = Math.min(PET_CONFIG.maxAffection, this.affection + PET_CONFIG.petAffectionGain);

    let buffActivated = false;
    let message = '';

    if (!this.hasPetToday) {
      this.hasPetToday = true;
      this.luckyBuffActive = true;
      buffActivated = true;
      message = `🐱 Bé mèo kêu rừ rừ và dụi đầu vào tay bạn! Nhận Buff Mèo May Mắn: Khách tip nhiều hơn trong ngày! (+${PET_CONFIG.petAffectionGain} Thân thiết)`;
    } else {
      message = `🐱 Bé mèo thích thú cuộn tròn bên bạn, lim dim ngủ ngoan! (+${PET_CONFIG.petAffectionGain} Thân thiết)`;
    }

    if (player && player.stats) {
      player.stats.catAffection = this.affection;
      player.stats.hasPetToday = this.hasPetToday;
      player.stats.luckyBuffActive = this.luckyBuffActive;
    }

    this.emitEvent('cat_petted', {
      affection: this.affection,
      luckyBuffActive: this.luckyBuffActive,
      message
    });

    return { success: true, message, buffActivated };
  }

  /**
   * Cho bé mèo ăn pate cá ngừ
   */
  public feedCat(player?: any): { success: boolean; message: string } {
    if (player && player.stats) {
      if (player.stats.wallet < PET_CONFIG.feedCost) {
        return {
          success: false,
          message: `Ví không đủ ${PET_CONFIG.feedCost.toLocaleString()}đ để mua hộp pate cá ngừ!`
        };
      }

      player.stats.wallet -= PET_CONFIG.feedCost;
      this.hasFedToday = true;
      this.affection = Math.min(PET_CONFIG.maxAffection, this.affection + PET_CONFIG.feedAffectionGain);

      player.stats.catAffection = this.affection;
      player.stats.hasFedToday = this.hasFedToday;
    }

    SoundManager.getInstance().playCatEat();
    SoundManager.getInstance().playCatMeow();

    const message = `🐟 Đã cho bé mèo ăn hộp pate cá ngừ (-${PET_CONFIG.feedCost.toLocaleString()}đ)! Bé mèo ăn cháp cháp ngon lành (+${PET_CONFIG.feedAffectionGain} Thân thiết)!`;

    this.emitEvent('cat_fed', {
      affection: this.affection,
      message
    });

    return { success: true, message };
  }

  /**
   * Khởi động ngày mới: Reset trạng thái vuốt ve để nhận buff buổi sáng
   */
  public onNewDay(player?: any) {
    this.hasPetToday = false;
    this.hasFedToday = false;
    this.luckyBuffActive = false;

    if (player && player.stats) {
      player.stats.hasPetToday = false;
      player.stats.hasFedToday = false;
      player.stats.luckyBuffActive = false;
    }
  }

  public getAffection(): number {
    return this.affection;
  }

  public getAffectionLevelName(): string {
    if (this.affection < 25) return 'Mèo làm quen';
    if (this.affection < 50) return 'Mèo quý mến';
    if (this.affection < 75) return 'Mèo thân thiết';
    return 'Mèo cưng quấn quýt';
  }

  public isLuckyBuffActive(): boolean {
    return this.luckyBuffActive;
  }

  public getHasPetToday(): boolean {
    return this.hasPetToday;
  }

  public getHasFedToday(): boolean {
    return this.hasFedToday;
  }

  private emitEvent(eventName: string, data: any) {
    if (this.scene) {
      this.scene.events.emit(eventName, data);
      this.scene.game.events.emit(eventName, data);
    }
  }
}
