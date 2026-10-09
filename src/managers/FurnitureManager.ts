import { FURNITURE_CATALOG } from '../config/GameConfig';
import { FurnitureItem } from '../types';
import { SoundManager } from '../assets/SoundManager';
import { InventoryManager } from './InventoryManager';
import { FurniturePlacement, PlayerStats } from '../types';

/**
 * Trình quản lý Mua sắm & Tương tác Nội thất Phòng trọ (Task 2.5: Furniture System)
 */
export class FurnitureManager {
  private static instance: FurnitureManager;

  private constructor() {}

  public static getInstance(): FurnitureManager {
    if (!FurnitureManager.instance) {
      FurnitureManager.instance = new FurnitureManager();
    }
    return FurnitureManager.instance;
  }

  public getCatalog(): FurnitureItem[] {
    return FURNITURE_CATALOG;
  }

  public getFurnitureById(id: string): FurnitureItem | undefined {
    return FURNITURE_CATALOG.find((f) => f.id === id);
  }

  public hasFurniture(player: { stats: PlayerStats } | PlayerStats, id: string): boolean {
    const stats = 'stats' in player ? player.stats : player;
    return stats.ownedFurnitureIds?.includes(id) ?? false;
  }

  public bagQuantity(stats: PlayerStats, id: string): number {
    return stats.inventory?.find((item) => item.id === 'furniture:' + id)?.quantity ?? 0;
  }

  /**
   * Mua đồ nội thất trang trí phòng
   */
  public buyFurniture(player: { stats: PlayerStats }, id: string): { success: boolean; message: string } {
    const item = this.getFurnitureById(id);
    if (!item) {
      return { success: false, message: 'Không tìm thấy món đồ này!' };
    }

    if (player.stats.wallet < item.price) {
      return {
        success: false,
        message: `Ví không đủ ${item.price.toLocaleString()}đ để mua ${item.name}!`
      };
    }

    if (!InventoryManager.canFit(player.stats)) {
      return { success: false, message: 'Túi đồ đã đầy. Hãy đặt bớt nội thất trước nhé.' };
    }
    player.stats.wallet -= item.price;
    InventoryManager.add(player.stats, {
      id: 'furniture:' + item.id,
      name: item.name,
      icon: item.icon,
      category: 'furniture',
      description: item.description
    });

    SoundManager.getInstance().playSaveSuccess();

    return {
      success: true,
      message: `🎉 Đã mua ${item.name}! Món đồ đang ở trong túi. Vào phòng trọ để chọn nơi đặt.`
    };
  }

  public placeFurniture(stats: PlayerStats, id: string, x: number, y: number):
    { success: boolean; message: string; placement?: FurniturePlacement } {
    const item = this.getFurnitureById(id);
    const stackIndex = stats.inventory.findIndex((entry) => entry.id === 'furniture:' + id && entry.quantity > 0);
    if (!item || stackIndex < 0) return { success: false, message: 'Món nội thất này không còn trong túi.' };
    const stack = stats.inventory[stackIndex];
    stack.quantity--;
    if (stack.quantity <= 0) stats.inventory.splice(stackIndex, 1);
    stats.ownedFurnitureIds ??= [];
    if (!stats.ownedFurnitureIds.includes(id)) stats.ownedFurnitureIds.push(id);
    const placement = { itemId: id, x, y };
    stats.furniturePlacements ??= [];
    stats.furniturePlacements.push(placement);
    return { success: true, message: `Đã đặt ${item.name}.`, placement };
  }

  /**
   * Bấm máy pha cà phê uống tách espresso miễn phí (hồi phục năng lượng & khát)
   */
  public drinkCoffee(player: any): { success: boolean; message: string } {
    if (!this.hasFurniture(player, 'coffee_maker')) {
      return { success: false, message: 'Bạn chưa mua Máy pha cà phê mini!' };
    }

    player.stats.energy = Math.min(100, player.stats.energy + 40);
    player.stats.thirst = Math.min(100, player.stats.thirst + 25);

    SoundManager.getInstance().playDrinkSound();

    return {
      success: true,
      message: '☕ Đã pha một ly Espresso thơm lừng! +40 Năng lượng ⚡ & +25 Giải khát!'
    };
  }
}
