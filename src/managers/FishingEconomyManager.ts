import { FISH_MARKET_CONFIG, WEEK_CONFIG } from '../config/GameConfig';
import { FishRequest, PlayerStats } from '../types';
import { SocialManager } from './SocialManager';

export class FishingEconomyManager {
  public static dailyRequest(day: number): FishRequest {
    const index = Math.max(0, Math.floor(day) - 1);
    const fish = FISH_MARKET_CONFIG.requestedFish[index % FISH_MARKET_CONFIG.requestedFish.length];
    return {
      fishId: fish.id,
      fishName: fish.name,
      restaurantName: FISH_MARKET_CONFIG.buyerNames[index % FISH_MARKET_CONFIG.buyerNames.length],
      bonus: FISH_MARKET_CONFIG.bonus
    };
  }

  public static isDailyRequest(stats: PlayerStats, fishId: string, restaurantName: string): boolean {
    const request = this.dailyRequest(stats.day);
    return stats.fishRequestCompletedDay !== stats.day && request.fishId === fishId &&
      request.restaurantName === restaurantName;
  }

  public static salePrice(stats: PlayerStats, fishId: string, restaurantName: string): number {
    return (WEEK_CONFIG.fishPrices[fishId] ?? 0) +
      (this.isDailyRequest(stats, fishId, restaurantName) ? FISH_MARKET_CONFIG.bonus : 0);
  }

  public static fishInBag(stats: PlayerStats) {
    return (stats.inventory ?? []).filter((item) => item.category === 'fish' && item.quantity > 0);
  }

  private static takeOne(stats: PlayerStats, id: string): string | null {
    const index = stats.inventory.findIndex((item) => item.id === id && item.category === 'fish' && item.quantity > 0);
    if (index < 0) return null;
    const fish = stats.inventory[index];
    fish.quantity--;
    if (fish.quantity === 0) stats.inventory.splice(index, 1);
    return fish.name;
  }

  public static cook(stats: PlayerStats, id: string) {
    if (stats.hunger >= 100 && stats.energy >= 100) {
      return { success: false, message: 'Minh đang no và khỏe; hãy để dành cá cho bữa khác.' };
    }
    const name = this.takeOne(stats, id);
    if (!name) return { success: false, message: 'Con cá này không còn trong túi.' };
    stats.hunger = Math.min(100, stats.hunger + WEEK_CONFIG.fishMealHunger);
    stats.energy = Math.min(100, stats.energy + WEEK_CONFIG.fishMealEnergy);
    return { success: true, message: `🍲 Minh nấu ${name} trong phòng trọ. Đói +${WEEK_CONFIG.fishMealHunger}, sức +${WEEK_CONFIG.fishMealEnergy}.` };
  }

  public static sell(stats: PlayerStats, id: string, sellerId: string, restaurantName?: string) {
    const price = WEEK_CONFIG.fishPrices[id];
    if (!price) return { success: false, message: 'Quán chưa mua loại cá này.' };
    const name = this.takeOne(stats, id);
    if (!name) return { success: false, message: 'Con cá này không còn trong túi.' };
    const requestMatched = restaurantName ? this.isDailyRequest(stats, id, restaurantName) : false;
    const earned = price + (requestMatched ? FISH_MARKET_CONFIG.bonus : 0);
    stats.wallet += earned;
    SocialManager.getInstance().gainAffection(stats, sellerId, WEEK_CONFIG.fishSaleAffection);
    if (requestMatched) {
      stats.fishRequestCompletedDay = stats.day;
      SocialManager.getInstance().gainAffection(stats, sellerId, FISH_MARKET_CONFIG.bonusAffection);
    }
    return { success: true, message: requestMatched
      ? `🐟 Giao đúng đơn cá tươi! Bán ${name} được ${earned.toLocaleString('vi-VN')}đ (thưởng ${FISH_MARKET_CONFIG.bonus.toLocaleString('vi-VN')}đ). Chủ quán thêm quý Minh.`
      : `🐟 Đã bán ${name} được ${price.toLocaleString('vi-VN')}đ. Chủ quán vui vì có cá tươi.` };
  }

  public static gift(stats: PlayerStats, id: string, recipientId: string) {
    const name = this.takeOne(stats, id);
    if (!name) return { success: false, message: 'Con cá này không còn trong túi.' };
    SocialManager.getInstance().gainAffection(stats, recipientId, WEEK_CONFIG.fishGiftAffection);
    return { success: true, message: `🐟 Minh tặng ${name}. Thiện cảm +${WEEK_CONFIG.fishGiftAffection}.` };
  }
}
