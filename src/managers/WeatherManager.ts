import Phaser from 'phaser';
import { WeatherType } from '../types';
import { WEATHER_CONFIG } from '../config/GameConfig';
import { SoundManager } from '../assets/SoundManager';

/**
 * Trình quản lý Hệ thống Thời tiết Mưa rơi & Mặt đường trơn trượt (Task 2.2: Weather System)
 */
export class WeatherManager {
  private static instance: WeatherManager;
  private scene?: Phaser.Scene;
  private currentWeather: WeatherType = WeatherType.CLEAR;
  private naturalCycleTimeSec: number = 0;

  private constructor() {}

  public static getInstance(): WeatherManager {
    if (!WeatherManager.instance) {
      WeatherManager.instance = new WeatherManager();
    }
    return WeatherManager.instance;
  }

  public init(scene: Phaser.Scene) {
    this.scene = scene;
    this.currentWeather = WeatherType.CLEAR;
    this.naturalCycleTimeSec = 0;
  }

  /**
   * Cập nhật chu kỳ thời tiết tự nhiên
   */
  public update(deltaMs: number) {
    this.naturalCycleTimeSec += deltaMs / 1000;

    // Chu kỳ tự nhiên kiểm tra đổi thời tiết
    if (this.naturalCycleTimeSec >= WEATHER_CONFIG.naturalWeatherIntervalSec) {
      this.naturalCycleTimeSec = 0;

      // 30% xác suất chuyển thời tiết
      if (Math.random() < 0.35) {
        const nextWeather = this.currentWeather === WeatherType.CLEAR ? WeatherType.RAIN : WeatherType.CLEAR;
        this.setWeather(nextWeather);
      }
    }
  }

  /**
   * Chuyển đổi trạng thái thời tiết chủ động
   */
  public setWeather(weather: WeatherType) {
    if (this.currentWeather === weather) return;

    this.currentWeather = weather;

    if (weather === WeatherType.RAIN) {
      SoundManager.getInstance().startRainAmbience();
      SoundManager.getInstance().playThunder();
    } else {
      SoundManager.getInstance().stopRainAmbience();
    }

    if (this.scene) {
      this.scene.events.emit('weather_changed', { weather });
      this.scene.game.events.emit('weather_changed', { weather });
    }
  }

  /**
   * Đảo trạng thái giữa Mưa và Tạnh (hỗ trợ nút toggle trên UI)
   */
  public toggleWeather(): WeatherType {
    const next = this.currentWeather === WeatherType.CLEAR ? WeatherType.RAIN : WeatherType.CLEAR;
    this.setWeather(next);
    return this.currentWeather;
  }

  public isRaining(): boolean {
    return this.currentWeather === WeatherType.RAIN;
  }

  public getWeather(): WeatherType {
    return this.currentWeather;
  }

  /**
   * Hệ số phụ phí cước thời tiết xấu (+50% khi mưa)
   */
  public getSurchargeMultiplier(): number {
    return this.isRaining() ? WEATHER_CONFIG.rainSurchargeMultiplier : 1.0;
  }

  /**
   * Hệ số bám đường mặt đường (-35% ma sát khi trời mưa gây trơn trượt)
   */
  public getTractionMultiplier(): number {
    return this.isRaining() ? WEATHER_CONFIG.rainFrictionMultiplier : 1.0;
  }

  /**
   * Hệ số văng đuôi drift khi vào cua lúc mưa
   */
  public getDriftMultiplier(): number {
    return this.isRaining() ? WEATHER_CONFIG.rainDriftFactor : 1.0;
  }
}
