import { INVENTORY_CONFIG } from '../config/GameConfig';
import { InventoryItem, PlayerStats } from '../types';

export class InventoryManager {
  public static usedSlots(stats: PlayerStats): number {
    return (stats.inventory ?? []).reduce((total, item) => total + item.quantity, 0);
  }

  public static canFit(stats: PlayerStats): boolean {
    return this.usedSlots(stats) < INVENTORY_CONFIG.maxItems;
  }

  public static add(stats: PlayerStats, item: Omit<InventoryItem, 'quantity'>): boolean {
    if (!this.canFit(stats)) return false;
    stats.inventory ??= [];
    const stack = stats.inventory.find((entry) => entry.id === item.id);
    if (stack) stack.quantity++;
    else stats.inventory.push({ ...item, quantity: 1 });
    return true;
  }

  public static use(stats: PlayerStats, id: string): { success: boolean; message: string } {
    const index = stats.inventory?.findIndex((item) => item.id === id) ?? -1;
    if (index < 0) return { success: false, message: 'Món này không còn trong túi.' };
    const item = stats.inventory[index];
    if (item.category !== 'consumable') {
      return { success: false, message: 'Món này cần thao tác riêng trong khu vực phù hợp.' };
    }
    const restoredHunger = Math.min(100 - stats.hunger, item.hunger ?? 0);
    const restoredThirst = Math.min(100 - stats.thirst, item.thirst ?? 0);
    const restoredEnergy = Math.min(100 - stats.energy, item.energy ?? 0);
    if (restoredHunger + restoredThirst + restoredEnergy <= 0) {
      return { success: false, message: 'Các chỉ số đang đầy, để dành món này sau nhé.' };
    }
    stats.hunger += restoredHunger;
    stats.thirst += restoredThirst;
    stats.energy += restoredEnergy;
    item.quantity--;
    if (item.quantity <= 0) stats.inventory.splice(index, 1);
    return {
      success: true,
      message: `${item.icon} Đã dùng ${item.name}: +${Math.round(restoredHunger)} đói, +${Math.round(restoredThirst)} khát, +${Math.round(restoredEnergy)} sức.`
    };
  }
}
