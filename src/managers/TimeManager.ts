import Phaser from 'phaser';
import { DAY_NIGHT_CONFIG } from '../config/GameConfig';
import { TimePeriod } from '../types';

export interface AmbientData {
  color: number;
  alpha: number;
  period: TimePeriod;
  periodName: string;
  badgeText: string;
  timeString: string;
  bonusMultiplier: number;
  isNight: boolean;
  isRushHour: boolean;
}

/**
 * Trình quản lý Chu kỳ Thời gian Ngày & Đêm (Task 2.1: Day/Night Simulation)
 */
export class TimeManager {
  private static instance: TimeManager;
  private scene?: Phaser.Scene;
  private currentHour: number = 7.0; // 07:00 sáng
  private currentPeriod: TimePeriod = TimePeriod.MORNING;

  private constructor() {}

  public static getInstance(): TimeManager {
    if (!TimeManager.instance) {
      TimeManager.instance = new TimeManager();
    }
    return TimeManager.instance;
  }

  public init(scene: Phaser.Scene, startHour = DAY_NIGHT_CONFIG.startHour, startMinute = DAY_NIGHT_CONFIG.startMinute) {
    this.scene = scene;
    this.currentHour = startHour + startMinute / 60;
    this.currentPeriod = this.calculatePeriod(this.currentHour);
  }

  /**
   * Cập nhật đồng hồ thời gian mỗi frame
   */
  public update(deltaMs: number) {
    const dtSec = deltaMs / 1000;
    const hoursElapsed = dtSec / DAY_NIGHT_CONFIG.secondsPerGameHour;
    const previousHour = this.currentHour;
    this.currentHour = (this.currentHour + hoursElapsed) % 24;

    // Kiểm tra chuyển giao ngày khi qua 0h đêm
    if (previousHour > 23 && this.currentHour < 1 && this.scene) {
      this.scene.game.events.emit('midnight_passed');
    }

    const newPeriod = this.calculatePeriod(this.currentHour);
    if (newPeriod !== this.currentPeriod) {
      const prev = this.currentPeriod;
      this.currentPeriod = newPeriod;

      if (this.scene) {
        this.scene.events.emit('time_period_changed', { previous: prev, current: newPeriod });
        this.scene.game.events.emit('time_period_changed', { previous: prev, current: newPeriod });

        if (this.isRushHour()) {
          this.scene.game.events.emit('rush_hour_active', {
            period: newPeriod,
            bonus: this.getRushHourBonusMultiplier()
          });
        }
      }
    }
  }

  public calculatePeriod(hour: number): TimePeriod {
    const p = DAY_NIGHT_CONFIG.periods;
    if (hour >= p.MORNING.startHour && hour < p.MORNING.endHour) {
      return TimePeriod.MORNING;
    } else if (hour >= p.NOON_RUSH.startHour && hour < p.NOON_RUSH.endHour) {
      return TimePeriod.NOON_RUSH;
    } else if (hour >= p.AFTERNOON.startHour && hour < p.AFTERNOON.endHour) {
      return TimePeriod.AFTERNOON;
    } else if (hour >= p.SUNSET.startHour && hour < p.SUNSET.endHour) {
      return TimePeriod.SUNSET;
    } else if (hour >= p.EVENING_RUSH.startHour && hour < p.EVENING_RUSH.endHour) {
      return TimePeriod.EVENING_RUSH;
    } else {
      return TimePeriod.NIGHT;
    }
  }

  /**
   * Lấy thông số ánh sáng môi trường tương ứng thời gian trong ngày
   */
  public getAmbientData(): AmbientData {
    const periodConfig = DAY_NIGHT_CONFIG.periods[this.currentPeriod];
    const isNight = this.currentPeriod === TimePeriod.NIGHT || this.currentPeriod === TimePeriod.EVENING_RUSH;
    const isRushHour = this.currentPeriod === TimePeriod.NOON_RUSH || this.currentPeriod === TimePeriod.EVENING_RUSH;

    return {
      color: periodConfig.ambientColor,
      alpha: periodConfig.ambientAlpha,
      period: this.currentPeriod,
      periodName: periodConfig.name,
      badgeText: periodConfig.badgeText,
      timeString: this.getTimeString(),
      bonusMultiplier: periodConfig.orderBonusMultiplier,
      isNight,
      isRushHour
    };
  }

  public isRushHour(): boolean {
    return this.currentPeriod === TimePeriod.NOON_RUSH || this.currentPeriod === TimePeriod.EVENING_RUSH;
  }

  public getRushHourBonusMultiplier(): number {
    return DAY_NIGHT_CONFIG.periods[this.currentPeriod].orderBonusMultiplier;
  }

  public getTimeString(): string {
    const totalMinutes = Math.floor(this.currentHour * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  public getCurrentHour(): number {
    return this.currentHour;
  }

  public setTime(hour: number, minute: number = 0) {
    this.currentHour = (hour + minute / 60) % 24;
    this.currentPeriod = this.calculatePeriod(this.currentHour);
  }

  /**
   * Đặt lại thời gian về 06:30 sáng sau giấc ngủ đêm
   */
  public onSleepWakeup(wakeHour = 6, wakeMinute = 30) {
    this.setTime(wakeHour, wakeMinute);
  }
}
