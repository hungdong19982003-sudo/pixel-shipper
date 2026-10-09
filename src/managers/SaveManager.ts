import { PlayerStats, SaveData } from '../types';

const SAVE_KEY = 'pixel_shipper_save_data_v1';

/**
 * SaveManager - Quản lý Lưu & Tải tiến trình chơi game (Task 1.3)
 * Lưu trữ trạng thái tài xế (Ví tiền, Đánh giá, Số đơn hoàn thành, Ngày làm việc, Vitals)
 * vào LocalStorage an toàn với error handling dự phòng.
 */
export class SaveManager {
  private static instance: SaveManager;

  private constructor() {}

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  /**
   * Lưu dữ liệu người chơi vào LocalStorage
   */
  public saveAtDesk(stats: PlayerStats): boolean {
    try {
      const data: SaveData = {
        wallet: Math.round(stats.wallet),
        rating: Number(stats.rating.toFixed(1)),
        completedOrders: stats.completedOrders,
        day: stats.day ?? 1,
        hunger: Math.round(stats.hunger),
        thirst: Math.round(stats.thirst),
        energy: Math.round(stats.energy),
        fuel: Math.round(stats.fuel ?? 100),
        catAffection: Math.round(stats.catAffection ?? 30),
        hasPetToday: stats.hasPetToday ?? false,
        hasFedToday: stats.hasFedToday ?? false,
        luckyBuffActive: stats.luckyBuffActive ?? false,
        currentVehicleId: stats.currentVehicleId,
        ownedVehicleIds: stats.ownedVehicleIds.slice(),
        thermalBagLevel: stats.thermalBagLevel,
        phoneMountLevel: stats.phoneMountLevel,
        ownedFurnitureIds: stats.ownedFurnitureIds.slice(),
        furniturePlacements: (stats.furniturePlacements ?? []).map((placement) => ({ ...placement })),
        trafficViolations: Math.max(0, Math.floor(stats.trafficViolations ?? 0)),
        fishRequestCompletedDay: Math.max(0, Math.floor(stats.fishRequestCompletedDay ?? 0)),
        relationships: stats.relationships ?? {},
        inventory: (stats.inventory ?? []).map((item) => ({ ...item })),
        storyProgress: stats.storyProgress ?? {
          introSeen: true,
          landladyVisitCount: 0,
          lastLandladyVisitDay: -2,
          lastRentDay: 0,
          rentDebt: 0,
          lastStoryDay: 0,
          dayStartOrders: stats.completedOrders,
          lastRewardedDay: 0,
          firstWeekCompleted: false
        },
        version: 6,
        savedAt: Date.now()
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      console.log('[SaveManager] Tiến trình đã được lưu an toàn:', data);
      return true;
    } catch (e) {
      console.error('[SaveManager] Lỗi khi lưu vào LocalStorage:', e);
      return false;
    }
  }

  /**
   * Tải dữ liệu tiến trình từ LocalStorage
   */
  public loadGame(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as SaveData;
      if (typeof parsed.wallet === 'number' && typeof parsed.rating === 'number') {
        const relationships: NonNullable<SaveData['relationships']> = {};
        if (parsed.relationships && typeof parsed.relationships === 'object') {
          for (const [key, value] of Object.entries(parsed.relationships)) {
            if (!value || !Number.isFinite(value.affection)) continue;
            relationships[key] = {
              affection: Math.max(0, Math.min(100, value.affection)),
              lastTalkDay: Number.isFinite(value.lastTalkDay) ? value.lastTalkDay : -1,
              purchases: Number.isFinite(value.purchases) ? Math.max(0, value.purchases) : 0,
              deliveries: Number.isFinite(value.deliveries) ? Math.max(0, value.deliveries) : 0
            };
          }
        }
        parsed.relationships = relationships;
        parsed.inventory = Array.isArray(parsed.inventory)
          ? parsed.inventory.filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string' &&
            Number.isFinite(item.quantity) && item.quantity > 0)
            .map((item) => ({
              id: item.id,
              name: item.name,
              icon: typeof item.icon === 'string' ? item.icon : '🍱',
              quantity: Math.floor(item.quantity),
              category: item.category ?? 'consumable',
              description: typeof item.description === 'string' ? item.description : undefined,
              hunger: Number.isFinite(item.hunger) ? item.hunger : undefined,
              thirst: Number.isFinite(item.thirst) ? item.thirst : undefined,
              energy: Number.isFinite(item.energy) ? item.energy : undefined,
              metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : undefined
            }))
          : [];
        parsed.furniturePlacements = Array.isArray(parsed.furniturePlacements)
          ? parsed.furniturePlacements.filter((placement) => placement && typeof placement.itemId === 'string' &&
            Number.isFinite(placement.x) && Number.isFinite(placement.y))
            .map((placement) => ({ itemId: placement.itemId, x: placement.x, y: placement.y }))
          : [];
        parsed.trafficViolations = Number.isFinite(parsed.trafficViolations)
          ? Math.max(0, Math.floor(parsed.trafficViolations ?? 0)) : 0;
        parsed.fishRequestCompletedDay = Number.isFinite(parsed.fishRequestCompletedDay)
          ? Math.max(0, Math.floor(parsed.fishRequestCompletedDay ?? 0)) : 0;
        parsed.storyProgress = parsed.storyProgress && typeof parsed.storyProgress === 'object'
          ? {
            introSeen: Boolean(parsed.storyProgress.introSeen),
            landladyVisitCount: Number.isFinite(parsed.storyProgress.landladyVisitCount)
              ? Math.max(0, Math.floor(parsed.storyProgress.landladyVisitCount)) : 0,
            lastLandladyVisitDay: Number.isFinite(parsed.storyProgress.lastLandladyVisitDay)
              ? Math.floor(parsed.storyProgress.lastLandladyVisitDay)
              : Math.max(-2, (Number.isFinite(parsed.day) ? parsed.day : 1) - 2),
            lastRentDay: Number.isFinite(parsed.storyProgress.lastRentDay)
              ? Math.max(0, Math.floor(parsed.storyProgress.lastRentDay))
              : Math.max(0, Math.floor(((Number.isFinite(parsed.day) ? parsed.day : 1) - 1) / 7) * 7),
            rentDebt: Number.isFinite(parsed.storyProgress.rentDebt)
              ? Math.max(0, Math.floor(parsed.storyProgress.rentDebt)) : 0,
            lastStoryDay: Number.isFinite(parsed.storyProgress.lastStoryDay)
              ? Math.max(0, Math.floor(parsed.storyProgress.lastStoryDay)) : (parsed.day ?? 1),
            dayStartOrders: Number.isFinite(parsed.storyProgress.dayStartOrders)
              ? Math.max(0, Math.floor(parsed.storyProgress.dayStartOrders)) : parsed.completedOrders,
            lastRewardedDay: Number.isFinite(parsed.storyProgress.lastRewardedDay)
              ? Math.max(0, Math.floor(parsed.storyProgress.lastRewardedDay)) : 0,
            firstWeekCompleted: Boolean(parsed.storyProgress.firstWeekCompleted || (parsed.day ?? 1) > 7)
          }
            : {
              introSeen: true,
              landladyVisitCount: 0,
              lastLandladyVisitDay: Math.max(-2, (Number.isFinite(parsed.day) ? parsed.day : 1) - 2),
              lastRentDay: Math.max(0, Math.floor(((Number.isFinite(parsed.day) ? parsed.day : 1) - 1) / 7) * 7),
              rentDebt: 0,
              lastStoryDay: parsed.day ?? 1,
              dayStartOrders: parsed.completedOrders,
              lastRewardedDay: 0,
              firstWeekCompleted: (parsed.day ?? 1) > 7
            };
        console.log('[SaveManager] Đã tải tiến trình đã lưu:', parsed);
        return parsed;
      }
      return null;
    } catch (e) {
      console.warn('[SaveManager] Lỗi đọc save data từ LocalStorage:', e);
      return null;
    }
  }

  /**
   * Kiểm tra xem người chơi đã có file lưu hay chưa
   */
  public hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Xóa file lưu để bắt đầu trò chơi mới hoàn toàn
   */
  public clearSave(): void {
    localStorage.removeItem(SAVE_KEY);
    console.log('[SaveManager] Đã xóa dữ liệu lưu game.');
  }
}
