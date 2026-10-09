import { PlayerStats, RelationshipProgress, RestaurantTemplate } from '../types';
import { SOCIAL_CONFIG } from '../config/GameConfig';
import { InventoryManager } from './InventoryManager';

export function sellerId(restaurant: RestaurantTemplate): string {
  return 'seller:' + (restaurant.textureKey ?? restaurant.name);
}

export function customerId(name: string): string {
  return 'customer:' + name;
}

export class SocialManager {
  private static readonly instance = new SocialManager();
  public static getInstance() { return this.instance; }

  public get(stats: PlayerStats, id: string): RelationshipProgress {
    stats.relationships ??= {};
    return stats.relationships[id] ??= { affection: 0, lastTalkDay: -1, purchases: 0, deliveries: 0 };
  }

  public label(affection: number): string {
    return affection >= 80 ? 'Thân thiết' : affection >= 60 ? 'Thân thiện' :
      affection >= 30 ? 'Quen mặt' : 'Mới gặp';
  }

  private gain(stats: PlayerStats, id: string, amount: number) {
    const relation = this.get(stats, id);
    relation.affection = Math.min(SOCIAL_CONFIG.maxAffection, relation.affection + amount);
    return relation;
  }

  public gainAffection(stats: PlayerStats, id: string, amount: number): void {
    this.gain(stats, id, amount);
  }

  public talk(stats: PlayerStats, id: string): { gained: boolean; message: string } {
    const relation = this.get(stats, id);
    if (relation.lastTalkDay === stats.day) {
      return { gained: false, message: 'Hôm nay mình đã trò chuyện rồi. Ngày mai ghé lại nhé!' };
    }
    relation.lastTalkDay = stats.day;
    this.gain(stats, id, SOCIAL_CONFIG.talkGain);
    return { gained: true, message: 'Rất vui được gặp bạn! Chúc bạn một ngày chạy xe bình an. +' + SOCIAL_CONFIG.talkGain + ' thiện cảm.' };
  }

  public collected(stats: PlayerStats, restaurant: RestaurantTemplate) {
    this.gain(stats, sellerId(restaurant), SOCIAL_CONFIG.pickupGain);
  }

  public delivered(stats: PlayerStats, name: string, integrity: number) {
    this.get(stats, customerId(name)).deliveries++;
    this.gain(stats, customerId(name), integrity >= 90 ? SOCIAL_CONFIG.goodDeliveryGain :
      integrity >= 70 ? SOCIAL_CONFIG.averageDeliveryGain : 1);
  }

  public discount(stats: PlayerStats, restaurant: RestaurantTemplate): number {
    const affection = this.get(stats, sellerId(restaurant)).affection;
    return affection >= SOCIAL_CONFIG.friendlyThreshold ? SOCIAL_CONFIG.friendlyDiscount :
      affection >= SOCIAL_CONFIG.familiarThreshold ? SOCIAL_CONFIG.familiarDiscount : 0;
  }

  public price(stats: PlayerStats, restaurant: RestaurantTemplate, dishIndex: number): number {
    const dish = restaurant.dishes[dishIndex];
    return dish ? Math.round(dish.price * (1 - this.discount(stats, restaurant))) : 0;
  }

  public buyMeal(stats: PlayerStats, restaurant: RestaurantTemplate, dishIndex: number) {
    const dish = restaurant.dishes[dishIndex];
    if (!dish) return { success: false, message: 'Món này không còn trong thực đơn.' };
    const price = this.price(stats, restaurant, dishIndex);
    if (stats.wallet < price) return { success: false, message: 'Bạn cần ' + price.toLocaleString('vi-VN') + 'đ để mua món này.' };
    const drink = restaurant.textureKey?.includes('milk_tea') || restaurant.textureKey?.includes('cafe') ||
      restaurant.textureKey?.includes('tea');
    stats.wallet -= price;
    const hungerGain = Math.min(100 - stats.hunger, drink ? 12 : SOCIAL_CONFIG.foodHungerRestore);
    const thirstGain = Math.min(100 - stats.thirst, drink ? SOCIAL_CONFIG.drinkThirstRestore : SOCIAL_CONFIG.foodThirstRestore);
    const energyGain = Math.min(100 - stats.energy, SOCIAL_CONFIG.mealEnergyRestore);
    stats.hunger += hungerGain;
    stats.thirst += thirstGain;
    stats.energy += energyGain;
    this.get(stats, sellerId(restaurant)).purchases++;
    this.gain(stats, sellerId(restaurant), SOCIAL_CONFIG.purchaseGain);
    return { success: true, message: `Đã dùng ${dish.name}: +${Math.round(hungerGain)} đói, +${Math.round(thirstGain)} khát, +${Math.round(energyGain)} sức. +${SOCIAL_CONFIG.purchaseGain} thiện cảm!` };
  }

  public buyTakeaway(stats: PlayerStats, restaurant: RestaurantTemplate, dishIndex: number) {
    const dish = restaurant.dishes[dishIndex];
    if (!dish) return { success: false, message: 'Món này không còn trong thực đơn.' };
    if (!InventoryManager.canFit(stats)) {
      return { success: false, message: 'Túi đã đầy. Hãy dùng món đang có trước nhé.' };
    }
    const price = this.price(stats, restaurant, dishIndex);
    if (stats.wallet < price) return { success: false, message: 'Bạn cần ' + price.toLocaleString('vi-VN') + 'đ để mua món này.' };
    const drink = restaurant.textureKey?.includes('milk_tea') || restaurant.textureKey?.includes('cafe') ||
      restaurant.textureKey?.includes('tea');
    const itemId = (restaurant.textureKey ?? restaurant.name) + ':' + dishIndex;
    const added = InventoryManager.add(stats, {
      id: itemId,
      name: dish.name,
      icon: drink ? '🥤' : '🍱',
      category: 'consumable',
      description: 'Món mua mang đi từ ' + restaurant.name,
      hunger: drink ? 12 : SOCIAL_CONFIG.foodHungerRestore,
      thirst: drink ? SOCIAL_CONFIG.drinkThirstRestore : SOCIAL_CONFIG.foodThirstRestore,
      energy: SOCIAL_CONFIG.mealEnergyRestore
    });
    if (!added) return { success: false, message: 'Túi đã đầy. Hãy dùng món đang có trước nhé.' };
    stats.wallet -= price;
    this.get(stats, sellerId(restaurant)).purchases++;
    this.gain(stats, sellerId(restaurant), SOCIAL_CONFIG.purchaseGain);
    return { success: true, message: 'Đã cất ' + dish.name + ' vào túi. Dùng món trong túi để hồi chỉ số. +' + SOCIAL_CONFIG.purchaseGain + ' thiện cảm.' };
  }

  public tipBonus(stats: PlayerStats, name: string, baseTip: number): number {
    const affection = this.get(stats, customerId(name)).affection;
    const bonus = affection >= SOCIAL_CONFIG.friendlyThreshold ? SOCIAL_CONFIG.friendlyTipBonus :
      affection >= SOCIAL_CONFIG.familiarThreshold ? SOCIAL_CONFIG.familiarTipBonus : 0;
    return Math.round(Math.max(0, baseTip) * bonus);
  }
}
