import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, REVIEW_COMMENTS, PET_CONFIG,
  WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE, CITY_LAYOUT, MAP_LOCATIONS, HUD_LAYOUT, PHONE_LAYOUT, GAS_STATIONS
} from '../config/GameConfig';
import { CITY_BLOCKS, CITY_BUILDINGS, getCityDistrictName } from '../config/CityMap';
import { IntegrityManager, IntegrityDamageEvent } from '../managers/IntegrityManager';
import { OrderManager } from '../managers/OrderManager';
import { NavigationManager } from '../managers/NavigationManager';
import { Order, OrderStatus, WeatherType, ConversationModel } from '../types';
import { SoundManager } from '../assets/SoundManager';
import { VitalsManager } from '../managers/VitalsManager';
import { TimeManager } from '../managers/TimeManager';
import { WeatherManager } from '../managers/WeatherManager';
import { PetManager } from '../managers/PetManager';
import { VehicleShopManager } from '../managers/VehicleShopManager';
import { CityScene } from './CityScene';
import { PhoneUI } from './PhoneUI';
import { ConversationUI } from './ConversationUI';
import { SocialManager } from '../managers/SocialManager';
import { UtilityUI, SettingsAction } from './UtilityUI';
import { InventoryManager } from '../managers/InventoryManager';
import { FishingEconomyManager } from '../managers/FishingEconomyManager';
import { FurnitureManager } from '../managers/FurnitureManager';
import { RoomScene } from './RoomScene';

/**
 * UIScene - Screen-space HUD, Ứng dụng Smartphone Driver & Bảng Quyết toán 5 Sao
 * Tích hợp toàn diện:
 * 1. Thanh trạng thái trên: Ví tiền, Đánh giá sao, Ngày làm việc, Tốc độ km/h, Nút Âm thanh & Nút Lưu Game
 * 2. Vitals HUD (Đói, Khát, Năng lượng - Task 1.1)
 * 3. Food Integrity Meter (Độ nguyên vẹn món ăn 100% -> 0% đổi màu xanh/vàng/đỏ)
 * 4. Compass HUD (Mũi tên la bàn xoay mượt mà & Khoảng cách số mét thời gian thực)
 * 5. Mini Order Widget khi đang lái xe trên đường
 * 6. Smartphone Driver App Modal (Bật/Tắt bằng phím TAB)
 * 7. Bảng Modal Quyết toán Đánh giá Sao (Sao rơi, tính tiền boa, đọc review khách & cộng tiền ví)
 * 8. Tích hợp Web Audio Synthesizer (Động cơ, ting-ting, xóc nảy, tiền rơi, lofi BGM)
 */
export class UIScene extends Phaser.Scene {
  private cityScene?: CityScene;

  // Thanh trạng thái Top HUD
  private dayText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private districtText!: Phaser.GameObjects.Text;
  private phoneLauncher!: Phaser.GameObjects.Container;

  // Vitals HUD (Đói, Khát, Năng lượng - Task 1.1)
  private vitalsContainer!: Phaser.GameObjects.Container;
  private hungerBarGfx!: Phaser.GameObjects.Graphics;
  private thirstBarGfx!: Phaser.GameObjects.Graphics;
  private energyBarGfx!: Phaser.GameObjects.Graphics;
  private hungerValText!: Phaser.GameObjects.Text;
  private thirstValText!: Phaser.GameObjects.Text;
  private energyValText!: Phaser.GameObjects.Text;
  private vitalWarningText!: Phaser.GameObjects.Text;

  // Food Integrity Meter
  private integrityContainer!: Phaser.GameObjects.Container;
  private integrityBarGfx!: Phaser.GameObjects.Graphics;
  private integrityText!: Phaser.GameObjects.Text;

  // Compass HUD
  private compassContainer!: Phaser.GameObjects.Container;
  private compassNeedle!: Phaser.GameObjects.Image;
  private compassDistText!: Phaser.GameObjects.Text;
  private compassTargetText!: Phaser.GameObjects.Text;

  // Mini Order Widget
  private miniOrderWidget!: Phaser.GameObjects.Container;
  private miniOrderStageText!: Phaser.GameObjects.Text;
  private miniOrderDishText!: Phaser.GameObjects.Text;

  // Smartphone Driver App Modal
  private phoneUI!: PhoneUI;
  private conversationUI!: ConversationUI;
  private utilityUI!: UtilityUI;
  private get isPhoneOpen(): boolean { return this.phoneUI?.isOpen ?? false; }
  private tabKey!: Phaser.Input.Keyboard.Key;
  private muteKey!: Phaser.Input.Keyboard.Key;
  private minimapKey!: Phaser.Input.Keyboard.Key;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private settingsKey!: Phaser.Input.Keyboard.Key;

  // Fuel HUD (Task 1.4)
  private fuelText!: Phaser.GameObjects.Text;
  private fuelBarGfx!: Phaser.GameObjects.Graphics;

  // Radar Minimap (Task 1.5)
  private minimapContainer!: Phaser.GameObjects.Container;
  private minimapGfx!: Phaser.GameObjects.Graphics;
  private isMinimapVisible: boolean = true;

  // Day/Night & Weather & Pet HUD (Task 2.1, 2.2, 2.3)
  private weatherKey!: Phaser.Input.Keyboard.Key;
  private clockText!: Phaser.GameObjects.Text;
  private luckyBuffBadge!: Phaser.GameObjects.Container;

  // Tabs cho ứng dụng điện thoại (Task 2.4 & 2.5)

  // Phím ảo cảm ứng (Virtual Touch Controls - Task 2.6)
  private touchKey!: Phaser.Input.Keyboard.Key;
  private isTouchControlsVisible: boolean = false;
  private touchControlsContainer!: Phaser.GameObjects.Container;

  // Bảng Modal Quyết toán Đánh giá Sao
  private settlementModalContainer!: Phaser.GameObjects.Container;
  private isSettlementOpen: boolean = false;

  // Toast thông báo nổi
  private toastContainer!: Phaser.GameObjects.Container;
  private toastText!: Phaser.GameObjects.Text;
  private toastBackground!: Phaser.GameObjects.Graphics;
  private toastTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.cityScene = this.scene.get('CityScene') as CityScene;
    this.cameras.main.setScroll(0, 0);

    // 1. TẠO THANH TRẠNG THÁI TOP HUD, NÚT ÂM THANH & NÚT LƯU GAME
    this.createTopHUD();

    // 1.1 TẠO THANH CHỈ SỐ SINH TỒN NHẸ (VITALS HUD - TASK 1.1)
    this.createVitalsHUD();

    // 1.2 TẠO RADAR MINIMAP GÓC DƯỚI BÊN TRÁI (TASK 1.5)
    this.createRadarMinimap();

    // 2. TẠO THANH ĐỘ NGUYÊN VẸN MÓN ĂN (FOOD INTEGRITY BAR)
    this.createFoodIntegrityHUD();

    // 3. TẠO MŨI TÊN LA BÀN ĐỊNH VỊ (COMPASS HUD)
    this.createCompassHUD();

    // 4. TẠO MINI ORDER WIDGET KHI ĐANG LÁI XE
    this.createMiniOrderWidget();

    // 5. TẠO SMARTPHONE DRIVER APP MODAL
    this.createSmartphoneApp();
    this.conversationUI=new ConversationUI(this);
    this.utilityUI = new UtilityUI(this, () => this.cityScene?.player,
      (action) => this.handleSettingsAction(action),
      (id) => this.consumeInventoryItem(id),
      (action) => this.getSettingsLabel(action));

    // 6. BẢNG MODAL QUYẾT TOÁN ĐÁNH GIÁ SAO (SETTLEMENT MODAL)
    this.createSettlementModal();

    // 7. TẠO KHUNG TOAST THÔNG BÁO TỔNG QUAN
    this.createToastNotification();

    // 7.1 TẠO PHÍM ẢO CẢM ỨNG D-PAD & ACTION (TASK 2.6)
    this.createTouchControls();

    // 8. ĐĂNG KÝ PHÍM BẤM
    if (this.input.keyboard) {
      this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
      this.muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
      this.minimapKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
      this.weatherKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
      this.touchKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      this.settingsKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
      this.input.keyboard.on('keydown-E', this.forwardFishingInteract, this);
      this.events.once('shutdown', () => this.input.keyboard?.off('keydown-E', this.forwardFishingInteract, this));
    }

    // 9. LẮNG NGHE SỰ KIỆN TƯƠNG TÁC ĐỂ KHỞI CHẠY NHẠC LO-FI BGM
    this.input.on('pointerdown', () => {
      SoundManager.getInstance().resumeContext();
      SoundManager.getInstance().startLofiBGM();
    });

    // 10. ĐĂNG KÝ LẮNG NGHE SỰ KIỆN TOÀN CỤC
    this.setupEventListeners();
  }

  /**
   * Tạo Top HUD hiển thị Ví tiền, Ngày làm việc, Đánh giá, Tốc độ km/h, Nút Âm thanh & Nút Lưu Game
   */
private drawHudPanel(rect: { x: number; y: number; width: number; height: number }) {
    const background = this.add.graphics();
    background.fillStyle(0x111d2b, 0.93);
    background.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 7);
    background.lineStyle(1, 0x3a4c5e, 0.8);
    background.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 7);
    return background;
  }

  private createHudButton(
    rect: { x: number; y: number; width: number; height: number },
    label: string, action: () => void, color: string
  ) {
    const text = this.add.text(rect.x + rect.width / 2, rect.y + rect.height / 2, label, {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color
    }).setOrigin(0.5);
    this.add.zone(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', action)
      .on('pointerover', () => text.setAlpha(1))
      .on('pointerout', () => text.setAlpha(0.82));
    text.setAlpha(0.82);
    return text;
  }

  private createTopHUD() {
    this.drawHudPanel(HUD_LAYOUT.header);
    this.drawHudPanel(HUD_LAYOUT.status);
    const separators = this.add.graphics();
    separators.lineStyle(1, 0x3a4c5e, 0.7);
    [120, 218, 476, 688, 808].forEach((x) => separators.lineBetween(x, 18, x, 44));
    [344, 492, 720].forEach((x) => separators.lineBetween(x, 64, x, 94));

    this.drawHudPanel(HUD_LAYOUT.vehicle);
    const day = HUD_LAYOUT.day;
    this.dayText = this.add.text(day.x + 12, day.y + 12, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#dfcc9b'
    });
    const clock = HUD_LAYOUT.clock;
    this.clockText = this.add.text(clock.x + 10, clock.y + 8, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#dfcc9b',
      wordWrap: { width: clock.width - 20 }, lineSpacing: 1
    });
    this.clockText.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.toggleWeather());
    const vehicle = HUD_LAYOUT.vehicle;
    this.speedText = this.add.text(vehicle.x + 10, vehicle.y + 17, '🛵 0 km/h', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#a8bacb'
    });
    this.fuelText = this.add.text(vehicle.x + 124, vehicle.y + 7, '⛽ 100%', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#9bd7ad'
    });
    this.fuelBarGfx = this.add.graphics();
    this.createHudButton(HUD_LAYOUT.inventory, '🎒 Túi đồ', () => this.openUtility('inventory'), '#b6e3c7');
    this.createHudButton(HUD_LAYOUT.settings, '⚙ Cài đặt', () => this.openUtility('settings'), '#dfcc9b');
    this.districtText = this.add.text(HUD_LAYOUT.district.x + 10, HUD_LAYOUT.district.y + 14, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#dfcc9b'
    });

    const launcher = HUD_LAYOUT.phoneButton;
    this.phoneLauncher = this.add.container(launcher.x, launcher.y);
    const label = this.add.text(launcher.width / 2, launcher.height / 2, '📱 Điện thoại', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', color: '#b6e3c7'
    }).setOrigin(0.5);
    const hit = this.add.zone(launcher.width / 2, launcher.height / 2, launcher.width, launcher.height)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePhoneApp())
      .on('pointerover', () => label.setAlpha(1))
      .on('pointerout', () => label.setAlpha(0.82));
    label.setAlpha(0.82);
    this.phoneLauncher.add([label, hit]);
  }

  private toggleSound() {
    const isMuted = SoundManager.getInstance().toggleMute();
    if (isMuted) {
      this.showToast('🔇 Đã tắt toàn bộ âm thanh');
    } else {
      this.showToast('🔊 Đã bật âm thanh & Lo-fi BGM');
    }
  }

  /**
   * Tạo Vitals HUD hiển thị 3 chỉ số Đói (Hunger), Khát (Thirst), Năng lượng (Energy) - Task 1.1
   */
private createVitalsHUD() {
    const layout = HUD_LAYOUT.vitals;
    this.vitalsContainer = this.add.container(layout.x, layout.y);
    const background = this.add.graphics();
    background.fillStyle(0x111d2b, 0.93);
    background.fillRoundedRect(0, 0, layout.width, layout.height, 7);
    background.lineStyle(1, 0x3a4c5e, 0.8);
    background.strokeRoundedRect(0, 0, layout.width, layout.height, 7);
    this.vitalsContainer.add(background);
    const makeVital = (x: number, icon: string, label: string, color: string) => {
      const image = this.add.image(x + 14, 16, icon).setDisplaySize(16, 16);
      const text = this.add.text(x + 27, 9, label, {
        fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color
      });
      const bar = this.add.graphics();
      this.vitalsContainer.add([image, text, bar]);
      return { text, bar };
    };
    const hunger = makeVital(0, 'icon_hunger', 'Đói 100%', '#deb187');
    const thirst = makeVital(158, 'icon_thirst', 'Khát 100%', '#9ad7e4');
    const energy = makeVital(316, 'icon_energy', 'Sức 100%', '#dfcc9b');
    this.hungerValText = hunger.text;
    this.hungerBarGfx = hunger.bar;
    this.thirstValText = thirst.text;
    this.thirstBarGfx = thirst.bar;
    this.energyValText = energy.text;
    this.energyBarGfx = energy.bar;
    this.vitalWarningText = this.add.text(HUD_LAYOUT.warning.x, HUD_LAYOUT.warning.y, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#f0a0a0',
      backgroundColor: '#111d2b', padding: { x: 8, y: 4 },
      wordWrap: { width: HUD_LAYOUT.warning.width - 16 }
    }).setVisible(false);

    const luck = HUD_LAYOUT.luck;
    this.luckyBuffBadge = this.add.container(luck.x, luck.y);
    const text = this.add.text(6, 14, '🐾 Mèo may mắn • Tăng tiền tip', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#b6e3c7'
    });
    this.luckyBuffBadge.add(text).setVisible(false);
  }

  private toggleWeather() {
    const next = WeatherManager.getInstance().toggleWeather();
    if (next === WeatherType.RAIN) {
      this.showToast('🌧️ Bắt đầu đổ mưa rào! Cẩn thận trơn trượt & nhận +50% cước mưa!');
    } else {
      this.showToast('☀️ Trời đã tạnh ráo, phố phường thoáng đãng!');
    }
    this.refreshUtilityIfOpen();
  }

  /**
   * Cập nhật hiển thị thanh Vitals mỗi frame
   */
private updateVitalsHUD() {
    const player = this.cityScene?.player;
    if (!player) return;
    const stats = player.stats;
    const h = Phaser.Math.Clamp(stats.hunger, 0, 100);
    const t = Phaser.Math.Clamp(stats.thirst, 0, 100);
    const e = Phaser.Math.Clamp(stats.energy, 0, 100);
    const drawBar = (bar: Phaser.GameObjects.Graphics, x: number, value: number, color: number) => {
      bar.clear().fillStyle(0x334555, 1).fillRoundedRect(x, 31, 132, 5, 2);
      if (value > 0) bar.fillStyle(value < 20 ? 0xd47c7c : color, 1)
        .fillRoundedRect(x, 31, 132 * value / 100, 5, 2);
    };
    drawBar(this.hungerBarGfx, 12, h, 0xd9a676);
    drawBar(this.thirstBarGfx, 170, t, 0x7ebbc8);
    drawBar(this.energyBarGfx, 328, e, 0xd1bd85);
    this.hungerValText.setText('Đói ' + Math.round(h) + '%');
    this.thirstValText.setText('Khát ' + Math.round(t) + '%');
    this.energyValText.setText('Sức ' + Math.round(e) + '%');
    const fuel = Phaser.Math.Clamp(stats.fuel ?? 100, 0, 100);
    this.fuelText.setText('⛽ ' + Math.round(fuel) + '%').setColor(fuel < 20 ? '#f0a0a0' : '#a8d2b5');
    const vehicle = HUD_LAYOUT.vehicle;
    this.fuelBarGfx.clear().fillStyle(0x334555, 1)
      .fillRoundedRect(vehicle.x + 124, vehicle.y + 28, 88, 5, 2);
    if (fuel > 0) this.fuelBarGfx.fillStyle(fuel < 20 ? 0xd47c7c : 0x81b497, 1)
      .fillRoundedRect(vehicle.x + 124, vehicle.y + 28, 88 * fuel / 100, 5, 2);
    const warnings = [];
    if (VitalsManager.getInstance().getVitalWarnings(player).hasAny) warnings.push('Thể lực thấp • Giảm 25% tốc độ');
    if (fuel < 20) warnings.push('Nhiên liệu sắp cạn • Ghé cây xăng');
    this.vitalWarningText.setText(warnings.join('   |   ')).setVisible(warnings.length > 0);
    this.dayText.setText('Ngày ' + (stats.day ?? 1));
  }

  /**
   * Tạo Radar Minimap thu nhỏ góc trên bên phải (Task 1.5)
   */
  private createRadarMinimap() {
    this.minimapContainer = this.add.container(12, GAME_HEIGHT - 124);

    const bg = this.add.graphics();
    bg.fillStyle(0x090d16, 0.92);
    bg.fillRoundedRect(0, 0, 140, 108, 8);
    bg.lineStyle(1.5, 0x0284c7, 0.85);
    bg.strokeRoundedRect(0, 0, 140, 108, 8);
    this.minimapContainer.add(bg);

    const title = this.add.text(8, 6, '🗺️ BẢN ĐỒ', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#38bdf8'
    });
    this.minimapContainer.add(title);

    this.createMinimapBase();
    this.minimapGfx = this.add.graphics();
    this.minimapContainer.add(this.minimapGfx);
  }

  private createMinimapBase() {
    const gfx = this.add.graphics();
    this.minimapContainer.add(gfx);
    const scale = Math.min(128 / WORLD_WIDTH, 80 / WORLD_HEIGHT);
    const x = 6 + (128 - WORLD_WIDTH * scale) / 2;
    const y = 22 + (80 - WORLD_HEIGHT * scale) / 2;
    gfx.fillStyle(0x6b776c, 1);
    gfx.fillRect(x, y, WORLD_WIDTH * scale, WORLD_HEIGHT * scale);
    CITY_BLOCKS.filter((block) => block.isPark).forEach((block) => {
      gfx.fillStyle(0x4c8a63, 1);
      gfx.fillRect(x + block.x * scale, y + block.y * scale, block.width * scale, block.height * scale);
    });
    gfx.fillStyle(0x293c4a, 1);
    CITY_LAYOUT.horizontalRoads.forEach((road) =>
      gfx.fillRect(x, y + road.tile * TILE_SIZE * scale, WORLD_WIDTH * scale, road.lanes * TILE_SIZE * scale));
    CITY_LAYOUT.verticalRoads.forEach((road) =>
      gfx.fillRect(x + road.tile * TILE_SIZE * scale, y, road.lanes * TILE_SIZE * scale, WORLD_HEIGHT * scale));
    CITY_BUILDINGS.forEach((building) => {
      gfx.fillStyle(building.kind === 'shop' ? 0xc9a77e : 0xa5b2a4, 0.8);
      gfx.fillRect(x + (building.x - building.footprintWidth / 2) * scale,
        y + (building.y - building.footprintHeight) * scale,
        building.footprintWidth * scale, building.footprintHeight * scale);
    });
  }

  private toggleMinimap() {
    this.isMinimapVisible = !this.isMinimapVisible;
    this.minimapContainer.setVisible(this.isMinimapVisible);
    SoundManager.getInstance().playClick();
    this.refreshUtilityIfOpen();
  }

  /**
   * Vẽ bản đồ thu nhỏ, mạng lưới đường phố và các thực thể thời gian thực (Task 1.5)
   */
  private updateRadarMinimap() {
    const fishingActive = this.scene.isActive('FishingScene');
    this.minimapContainer.setVisible(this.isMinimapVisible && !fishingActive);
    if (!this.isMinimapVisible || fishingActive || !this.cityScene || !this.cityScene.player) return;

    this.minimapGfx.clear();

    const miniW = 128;
    const miniH = 80;
    const scaleX = Math.min(miniW / WORLD_WIDTH, miniH / WORLD_HEIGHT);
    const scaleY = scaleX;
    const originX = 6 + (miniW - WORLD_WIDTH * scaleX) / 2;
    const originY = 22 + (miniH - WORLD_HEIGHT * scaleY) / 2;

    this.minimapGfx.fillStyle(0xf59e0b, 1);
    GAS_STATIONS.forEach((station) => this.minimapGfx.fillCircle(
      originX + station.x * scaleX, originY + station.y * scaleY, 3));

    // 3. Điểm Phòng trọ số 7 (Xanh ngọc)
    const hx = originX + MAP_LOCATIONS.BOARDING_HOUSE.x * scaleX;
    const hy = originY + MAP_LOCATIONS.BOARDING_HOUSE.y * scaleY;
    this.minimapGfx.fillStyle(0x14b8a6, 1);
    this.minimapGfx.fillCircle(hx, hy, 3);

    // 3.1 Điểm Tiệm Xe Máy & Nâng Cấp Gear (Cyan - Task 2.4)
    const sx = originX + MAP_LOCATIONS.MOTORBIKE_SHOP.x * scaleX;
    const sy = originY + MAP_LOCATIONS.MOTORBIKE_SHOP.y * scaleY;
    this.minimapGfx.fillStyle(0x06b6d4, 1);
    this.minimapGfx.fillCircle(sx, sy, 3);

    // 4. Mục tiêu đơn hàng hiện tại
    const orderManager = OrderManager.getInstance();
    const currentOrder = orderManager.getCurrentOrder();
    for (const order of orderManager.getActiveOrders()) {
      if (order.status === OrderStatus.ACCEPTED) {
        const rx = originX + order.restaurantPos.x * scaleX;
        const ry = originY + order.restaurantPos.y * scaleY;
        this.minimapGfx.fillStyle(0xef4444, 1);
        this.minimapGfx.fillCircle(rx, ry, order === currentOrder ? 4 : 2.5);
      } else if (order.status === OrderStatus.PICKED_UP) {
        const cx = originX + order.customerPos.x * scaleX;
        const cy = originY + order.customerPos.y * scaleY;
        this.minimapGfx.fillStyle(order === currentOrder ? 0x10b981 : 0x74d7ac, 1);
        this.minimapGfx.fillCircle(cx, cy, order === currentOrder ? 4 : 2.5);
      }
    }

    // 5. Vị trí Người chơi / Xe máy (Xanh cyan phát sáng)
    const px = originX + this.cityScene.player.x * scaleX;
    const py = originY + this.cityScene.player.y * scaleY;

    // Vòng quét radar mở rộng của Giá treo điện thoại (Task 2.4 Synergy)
    const radarBonus = VehicleShopManager.getInstance().getRadarBonus(this.cityScene.player);
    const radarRadius = Math.round(14 * radarBonus);
    this.minimapGfx.lineStyle(1, 0x38bdf8, 0.45);
    this.minimapGfx.strokeCircle(px, py, radarRadius);

    this.minimapGfx.fillStyle(0x38bdf8, 1);
    this.minimapGfx.fillCircle(px, py, 3);
    this.minimapGfx.fillStyle(0xffffff, 1);
    this.minimapGfx.fillCircle(px, py, 1.2);
  }

  /**
   * Tạo Thanh Độ Nguyên Vẹn Món Ăn (Food Integrity Bar)
   */
private createFoodIntegrityHUD() {
    const layout = HUD_LAYOUT.integrity;
    this.integrityContainer = this.add.container(layout.x, layout.y);
    this.integrityText = this.add.text(8, 5, 'Đồ ăn: chưa lấy', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#a8bacb'
    });
    this.integrityBarGfx = this.add.graphics();
    this.integrityContainer.add([this.integrityText, this.integrityBarGfx]);
  }

  private updateIntegrityBar(integrity: number) {
    this.integrityBarGfx.clear();

    const barWidth = HUD_LAYOUT.integrity.width - 16;
    const barHeight = 4;
    const barX = 8;
    const barY = 28;

    this.integrityBarGfx.fillStyle(0x1e293b, 1);
    this.integrityBarGfx.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

    let fillColor = 0x10b981; // Xanh (> 70%)
    if (integrity <= 40) {
      fillColor = 0xef4444; // Đỏ (< 40%)
    } else if (integrity <= 70) {
      fillColor = 0xfacc15; // Vàng (40 - 70%)
    }

    const currentWidth = Math.max(0, (integrity / 100) * barWidth);
    this.integrityBarGfx.fillStyle(fillColor, 1);
    this.integrityBarGfx.fillRoundedRect(barX, barY, currentWidth, barHeight, 4);

    this.integrityText.setText('Đồ ăn: ' + integrity + '%');
    if (integrity <= 40) {
      this.integrityText.setColor('#ef4444');
    } else if (integrity <= 70) {
      this.integrityText.setColor('#facc15');
    } else {
      this.integrityText.setColor('#10b981');
    }
  }

  /**
   * Tạo Mũi Tên La Bàn Định Vị (Compass HUD)
   */
private createCompassHUD() {
    const layout = HUD_LAYOUT.compass;
    this.compassContainer = this.add.container(layout.x, layout.y);
    this.compassNeedle = this.add.image(16, 20, 'fx_compass_needle').setDisplaySize(22, 22);
    this.compassDistText = this.add.text(34, 6, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#9ad7e4'
    });
    this.compassTargetText = this.add.text(34, 21, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '9px', color: '#a8bacb'
    });
    this.compassContainer.add([this.compassNeedle, this.compassDistText, this.compassTargetText]);
  }

private createMiniOrderWidget() {
    const layout = HUD_LAYOUT.order;
    this.miniOrderWidget = this.add.container(layout.x, layout.y);
    this.miniOrderStageText = this.add.text(10, 7, 'Chưa nhận đơn', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#dfcc9b'
    });
    this.miniOrderDishText = this.add.text(10, 24, 'Mở điện thoại để chọn đơn', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '9px', color: '#a8bacb'
    });
    this.miniOrderWidget.add([this.miniOrderStageText, this.miniOrderDishText]);
  }

private createSmartphoneApp() {
    this.phoneUI = new PhoneUI(this, () => this.cityScene?.player,
      (message) => this.showToast(message), () => this.updateMiniOrderWidget());
  }

  public openPhoneToTab(tab: 'ORDERS' | 'SHOP_BIKE' | 'SHOP_FURNITURE') {
    if(this.conversationUI.isOpen) return;
    this.phoneUI.openTo(tab);
  }

  private renderPhoneContent() {
    this.phoneUI?.render();
  }

  public togglePhoneApp(forceState?: boolean) {
    if (this.utilityUI?.isOpen) return;
    if(this.conversationUI?.isOpen) return;
    if(this.cityScene?.isTransitioning&&this.scene.isActive('CityScene')) return;
    SoundManager.getInstance().playClick();
    this.phoneUI.toggle(forceState);
  }

  public showConversation(model:ConversationModel) {
    if(this.isPhoneOpen || this.utilityUI?.isOpen) return;
    const virtual=this.cityScene?.player.virtualInput;
    if(virtual) {
      for(const key of Object.keys(virtual) as Array<keyof typeof virtual>) virtual[key]=false;
    }
    this.conversationUI.show(model);
  }

  public closeConversation() { this.conversationUI.close(); }

  private openUtility(type: 'inventory' | 'settings') {
    if (this.isPhoneOpen || this.conversationUI.isOpen || this.isSettlementOpen ||
        (this.cityScene?.isTransitioning && this.scene.isActive('CityScene'))) return;
    this.utilityUI.open(type);
  }

  private consumeInventoryItem(id: string) {
    const player = this.cityScene?.player;
    if (!player) return;
    const item = player.stats.inventory.find((entry) => entry.id === id);
    if (!item) return;
    if (item.category === 'furniture') {
      const roomIsOpen = this.scene.isActive('RoomScene') || this.scene.isPaused('RoomScene');
      const furnitureId = id.startsWith('furniture:') ? id.slice('furniture:'.length) : '';
      if (!roomIsOpen || !FurnitureManager.getInstance().getFurnitureById(furnitureId)) {
        this.showToast('Hãy vào phòng trọ rồi mở túi đồ để đặt nội thất.');
        return;
      }
      this.utilityUI.close();
      (this.scene.get('RoomScene') as RoomScene).beginFurniturePlacement(furnitureId);
      return;
    }
    if (item.category === 'fish') {
      if (!this.scene.isActive('RoomScene') && !this.scene.isPaused('RoomScene')) {
        this.showToast('Về phòng trọ để nấu cá. Quán ăn có thể mua cá trong túi.');
        return;
      }
      const result = FishingEconomyManager.cook(player.stats, id);
      this.showToast(result.message, 2500);
      this.utilityUI.open('inventory');
      return;
    }
    if (item.category !== 'consumable') {
      this.showToast(item.category === 'fishing_gear'
        ? 'Dụng cụ câu cá sẽ dùng được khi mở hệ thống câu cá.'
        : 'Vật phẩm này chưa thể dùng ở đây.');
      return;
    }
    const result = InventoryManager.use(player.stats, id);
    this.showToast(result.message, 2200);
    this.utilityUI.open('inventory');
  }

  private getSettingsLabel(action: SettingsAction): string {
    switch (action) {
      case 'sound': return SoundManager.getInstance().getIsMuted() ? 'Đang tắt' : 'Đang bật';
      case 'radar': return this.isMinimapVisible ? 'Đang hiện' : 'Đang ẩn';
      case 'weather': return WeatherManager.getInstance().isRaining() ? 'Đang mưa • Đổi trời' : 'Đang nắng • Đổi trời';
      case 'touch': return this.isTouchControlsVisible ? 'Đang bật' : 'Đang tắt';
    }
  }

  private handleSettingsAction(action: SettingsAction) {
    switch (action) {
      case 'sound': this.toggleSound(); break;
      case 'radar': this.toggleMinimap(); break;
      case 'weather': this.toggleWeather(); break;
      case 'touch': this.toggleTouchControls(); break;
    }
    this.refreshUtilityIfOpen();
  }

  private refreshUtilityIfOpen() {
    if (this.utilityUI?.isOpen) this.utilityUI.open('settings');
  }

  private createTouchControls() {
    this.touchControlsContainer = this.add.container(0, 0).setDepth(15000);
    this.touchControlsContainer.setVisible(this.isTouchControlsVisible);

    // 1. D-PAD ĐIỀU HƯỚNG 4 CHIỀU (GÓC DƯỚI BÊN TRÁI)
    const dpadCenterX = 85;
    const dpadCenterY = GAME_HEIGHT - 85;

    // Vòng tròn nền D-Pad
    const dpadBase = this.add.graphics();
    dpadBase.fillStyle(0x0f172a, 0.65);
    dpadBase.fillCircle(dpadCenterX, dpadCenterY, 68);
    dpadBase.lineStyle(2, 0x334155, 0.8);
    dpadBase.strokeCircle(dpadCenterX, dpadCenterY, 68);
    this.touchControlsContainer.add(dpadBase);

    const dpadButtons = [
      { dir: 'up' as const, x: 0, y: -44, icon: '▲' },
      { dir: 'down' as const, x: 0, y: 44, icon: '▼' },
      { dir: 'left' as const, x: -44, y: 0, icon: '◄' },
      { dir: 'right' as const, x: 44, y: 0, icon: '►' }
    ];

    dpadButtons.forEach((btn) => {
      const bx = dpadCenterX + btn.x;
      const by = dpadCenterY + btn.y;

      const bg = this.add.graphics();
      bg.fillStyle(0x1e293b, 0.85);
      bg.fillRoundedRect(bx - 18, by - 18, 36, 36, 8);
      bg.lineStyle(1.5, 0x38bdf8, 0.8);
      bg.strokeRoundedRect(bx - 18, by - 18, 36, 36, 8);

      const label = this.add.text(bx, by, btn.icon, {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: '14px',
        color: '#f8fafc'
      }).setOrigin(0.5);

      const hitZone = this.add.zone(bx, by, 44, 44).setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => {
        if (this.cityScene?.player) {
          this.cityScene.player.virtualInput[btn.dir] = true;
          bg.clear();
          bg.fillStyle(0x0284c7, 0.95);
          bg.fillRoundedRect(bx - 18, by - 18, 36, 36, 8);
        }
      });

      const release = () => {
        if (this.cityScene?.player) {
          this.cityScene.player.virtualInput[btn.dir] = false;
          bg.clear();
          bg.fillStyle(0x1e293b, 0.85);
          bg.fillRoundedRect(bx - 18, by - 18, 36, 36, 8);
          bg.lineStyle(1.5, 0x38bdf8, 0.8);
          bg.strokeRoundedRect(bx - 18, by - 18, 36, 36, 8);
        }
      };

      hitZone.on('pointerup', release);
      hitZone.on('pointerout', release);

      this.touchControlsContainer.add([bg, label, hitZone]);
    });

    // 2. CÁC NÚT HÀNH ĐỘNG ACTION (GÓC DƯỚI BÊN PHẢI)
    // Nút [E] Tương tác to nổi bật
    const eBtnX = GAME_WIDTH - 65;
    const eBtnY = GAME_HEIGHT - 65;

    const eBtnBg = this.add.graphics();
    eBtnBg.fillStyle(0xd97706, 0.9);
    eBtnBg.fillCircle(eBtnX, eBtnY, 28);
    eBtnBg.lineStyle(2, 0xfacc15, 1);
    eBtnBg.strokeCircle(eBtnX, eBtnY, 28);

    const eBtnText = this.add.text(eBtnX, eBtnY, '⚡ E', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const eZone = this.add.zone(eBtnX, eBtnY, 60, 60).setInteractive({ useHandCursor: true });
    eZone.on('pointerdown', () => {
      if (this.cityScene?.player) {
        this.cityScene.player.virtualInput.e = true;
      }
    });

    const fBtnX = GAME_WIDTH - 135;
    const fBtnY = GAME_HEIGHT - 125;
    const fBtnBg = this.add.graphics();
    fBtnBg.fillStyle(0x334155, 0.9);
    fBtnBg.fillCircle(fBtnX, fBtnY, 22);
    fBtnBg.lineStyle(1.5, 0x94a3b8, 1);
    fBtnBg.strokeCircle(fBtnX, fBtnY, 22);
    const fBtnText = this.add.text(fBtnX, fBtnY, '🛵 F', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#f8fafc'
    }).setOrigin(0.5);
    const fZone = this.add.zone(fBtnX, fBtnY, 48, 48).setInteractive({ useHandCursor: true });
    fZone.on('pointerdown', () => {
      if (this.cityScene?.player) this.cityScene.player.virtualInput.f = true;
    });

    // Nút mở Driver App trên màn hình cảm ứng
    const tabBtnX = GAME_WIDTH - 135;
    const tabBtnY = GAME_HEIGHT - 45;

    const tabBtnBg = this.add.graphics();
    tabBtnBg.fillStyle(0x059669, 0.9);
    tabBtnBg.fillCircle(tabBtnX, tabBtnY, 22);
    tabBtnBg.lineStyle(1.5, 0x34d399, 1);
    tabBtnBg.strokeCircle(tabBtnX, tabBtnY, 22);

    const tabBtnText = this.add.text(tabBtnX, tabBtnY, '📱 ĐT', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const tabZone = this.add.zone(tabBtnX, tabBtnY, 48, 48).setInteractive({ useHandCursor: true });
    tabZone.on('pointerdown', () => {
      this.togglePhoneApp();
    });

    // Nút [CÒI] Bấm Còi Bim Bim
    const hornBtnX = GAME_WIDTH - 52;
    const hornBtnY = GAME_HEIGHT - 132;

    const hornBtnBg = this.add.graphics();
    hornBtnBg.fillStyle(0x475569, 0.9);
    hornBtnBg.fillCircle(hornBtnX, hornBtnY, 22);
    hornBtnBg.lineStyle(1.5, 0x94a3b8, 1);
    hornBtnBg.strokeCircle(hornBtnX, hornBtnY, 22);

    const hornBtnText = this.add.text(hornBtnX, hornBtnY, '📢 CÒI', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5);

    const hornZone = this.add.zone(hornBtnX, hornBtnY, 48, 48).setInteractive({ useHandCursor: true });
    hornZone.on('pointerdown', () => {
      if (this.cityScene?.player) {
        this.cityScene.player.virtualInput.horn = true;
      }
    });

    this.touchControlsContainer.add([
      eBtnBg, eBtnText, eZone, fBtnBg, fBtnText, fZone,
      tabBtnBg, tabBtnText, tabZone,
      hornBtnBg, hornBtnText, hornZone
    ]);
  }

  /**
   * Bật/Tắt hiển thị Phím Ảo Cảm Ứng (Task 2.6)
   */
  public toggleTouchControls() {
    this.isTouchControlsVisible = !this.isTouchControlsVisible;
    this.minimapContainer.setY(this.isTouchControlsVisible ? GAME_HEIGHT - 292 : GAME_HEIGHT - 124);
    if (this.touchControlsContainer) {
      this.touchControlsContainer.setVisible(this.isTouchControlsVisible);
    }
    SoundManager.getInstance().playClick();
    this.showToast(this.isTouchControlsVisible ? '📱 Đã BẬT phím ảo cảm ứng (D-Pad & Action)' : '📱 Đã ẨN phím ảo cảm ứng');
    this.refreshUtilityIfOpen();
  }

private updateMiniOrderWidget() {
    const manager = OrderManager.getInstance();
    const order = manager.getCurrentOrder();
    if (!order) {
      this.miniOrderStageText.setText('Chưa nhận đơn').setColor('#dfcc9b');
      this.miniOrderDishText.setText('Mở điện thoại để chọn đơn');
      return;
    }
    const batch = manager.getActiveOrders().length;
    this.miniOrderStageText.setText((batch > 1 ? `${batch} đơn • ` : '') +
      (order.status === OrderStatus.ACCEPTED ? 'Vào quán lấy món'
      : order.status === OrderStatus.PICKED_UP ? 'Giao món cho khách' : 'Đã giao • Nhận thưởng'))
      .setColor(order.status === OrderStatus.ACCEPTED ? '#dfcc9b' : '#b6e3c7');
    const food = order.foodName.length > 36 ? order.foodName.slice(0, 35) + '…' : order.foodName;
    this.miniOrderDishText.setText(food);
  }

  private createSettlementModal() {
    this.settlementModalContainer = this.add.container(0, 0);
    this.settlementModalContainer.setDepth(20000);
    this.settlementModalContainer.setVisible(false);
  }

  /**
   * Mở Bảng Quyết toán Đánh giá Sao khi giao hàng thành công
   */
  public openSettlementModal(order: Order) {
    if (this.isSettlementOpen) return;
    this.isSettlementOpen = true;

    // Phát âm thanh hoàn thành giao hàng & tiền xu rơi
    SoundManager.getInstance().playCoinSound();
    SoundManager.getInstance().playOrderChime();

    this.settlementModalContainer.removeAll(true);
    this.settlementModalContainer.setVisible(true);

    const modalWidth = 440;
    const modalHeight = 400;
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // 1. Lớp phủ đen làm mờ phía sau (Backdrop Scrim)
    const scrim = this.add.graphics();
    scrim.fillStyle(0x000000, 0.78);
    scrim.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    scrim.setInteractive(new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);

    // 2. Thẻ Card Quyết toán chính
    const card = this.add.graphics();
    card.fillStyle(0x0f172a, 0.98);
    card.fillRoundedRect(centerX - modalWidth / 2, centerY - modalHeight / 2, modalWidth, modalHeight, 16);
    card.lineStyle(2, 0x10b981, 1);
    card.strokeRoundedRect(centerX - modalWidth / 2, centerY - modalHeight / 2, modalWidth, modalHeight, 16);

    // Tiêu đề chiến thắng
    const titleText = this.add.text(centerX, centerY - 165, '🎉 GIAO HÀNG THÀNH CÔNG!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#10b981'
    }).setOrigin(0.5);

    const subTitle = this.add.text(centerX, centerY - 140, `${order.foodName} ➔ ${order.customerAddress}`, {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '12px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Tính toán số sao dựa theo % độ nguyên vẹn thức ăn còn lại
    const finalIntegrity = order.currentIntegrity;
    let stars = 5;
    let tip = 15000;
    let reviewList = REVIEW_COMMENTS.fiveStar;

    if (finalIntegrity < 50) {
      stars = 1;
      tip = -10000; // Phạt bồi thường vỡ nát
      reviewList = REVIEW_COMMENTS.oneStar;
    } else if (finalIntegrity < 70) {
      stars = 3;
      tip = 0;
      reviewList = REVIEW_COMMENTS.threeStar;
    } else if (finalIntegrity < 90) {
      stars = 4;
      tip = 5000;
      reviewList = REVIEW_COMMENTS.fourStar;
    }

    // Buff Mèo May Mắn (Task 2.3: Pet System)
    const isLucky = PetManager.getInstance().isLuckyBuffActive();
    if (isLucky && tip > 0) {
      tip = Math.round(tip * PET_CONFIG.luckyTipValueMultiplier);
    }

    const friendshipTip=this.cityScene?.player
      ? SocialManager.getInstance().tipBonus(this.cityScene.player.stats,order.customerName,tip) : 0;
    tip+=friendshipTip;
    const reviewComment = reviewList[Math.floor(Math.random() * reviewList.length)];
    const serviceBonus = OrderManager.getInstance().getServiceBonus(order);
    const specialOrder = order.serviceType === 'express' || order.serviceType === 'careful';
    const totalEarnings = Math.max(0, order.deliveryFee + tip + serviceBonus.amount);

    // Hiển thị Sao Đánh giá (★★★★★)
    const starString = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    const starsText = this.add.text(centerX, centerY - 100, starString, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#facc15'
    }).setOrigin(0.5);

    // Hiệu ứng nảy sao lấp lánh
    this.tweens.add({
      targets: starsText,
      scale: 1.15,
      yoyo: true,
      duration: 350,
      ease: 'Back.easeOut'
    });

    // Thả hạt sao lấp lánh xung quanh
    for (let i = 0; i < 8; i++) {
      const spark = this.add.image(
        centerX + Phaser.Math.Between(-150, 150),
        centerY - 100 + Phaser.Math.Between(-20, 20),
        'fx_spark'
      );
      this.tweens.add({
        targets: spark,
        y: spark.y + Phaser.Math.Between(20, 60),
        alpha: 0,
        scale: 1.5,
        duration: 800 + i * 100,
        repeat: -1
      });
      this.settlementModalContainer.add(spark);
    }

    // Khung bình luận của khách hàng
    const reviewBox = this.add.graphics();
    reviewBox.fillStyle(0x1e293b, 0.85);
    reviewBox.fillRoundedRect(centerX - 180, centerY - 65, 360, 64, 8);

    const reviewQuote = this.add.text(centerX, centerY - 35, `"${reviewComment}"\n— ${order.customerName}`, {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '11px',
      color: '#f8fafc',
      fontStyle: 'italic',
      align: 'center',
      wordWrap: { width: 340 }
    }).setOrigin(0.5);

    // Bảng chi tiết cước & tiền thưởng
    const statY = centerY + 30;
    const feeRow = this.add.text(centerX - 160, statY, `Cước giao hàng:`, {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '12px',
      color: '#94a3b8'
    });
    const feeVal = this.add.text(centerX + 160, statY, `+${order.deliveryFee.toLocaleString()} VNĐ`, {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '12px',
      color: '#f8fafc'
    }).setOrigin(1, 0);

    const tipLabel = 'Tiền tip'+(isLucky&&tip>0?' • Mèo':'')+(friendshipTip>0?' • Khách quen':'');

    const tipRow = this.add.text(centerX - 160, statY + 24, tipLabel, {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '12px',
      color: isLucky && tip > 0 ? '#34d399' : '#94a3b8'
    });
    const tipVal = this.add.text(
      centerX + 160,
      statY + 24,
      `${tip >= 0 ? '+' : ''}${tip.toLocaleString()} VNĐ`,
      {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: '12px',
        color: tip >= 0 ? '#10b981' : '#ef4444'
      }
    ).setOrigin(1, 0);

    const bonusRow = this.add.text(centerX - 160, statY + 48, serviceBonus.label + ':', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', color: '#94a3b8'
    }).setVisible(specialOrder);
    const bonusVal = this.add.text(centerX + 160, statY + 48,
      `+${serviceBonus.amount.toLocaleString('vi-VN')} VNĐ`, {
        fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', color: '#f8fafc'
      }).setOrigin(1, 0).setVisible(specialOrder);

    const totalRow = this.add.text(centerX - 160, statY + (specialOrder ? 76 : 54), `TỔNG TIỀN VÀO VÍ:`, {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '14px',
      color: '#facc15',
      fontStyle: 'bold'
    });
    const totalVal = this.add.text(centerX + 160, statY + (specialOrder ? 76 : 54), `+${totalEarnings.toLocaleString()} VNĐ`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#10b981'
    }).setOrigin(1, 0);

    // Nút Bấm Nhận tiền & Đơn tiếp theo
    const confirmBtnBg = this.add.graphics();
    confirmBtnBg.fillStyle(0x059669, 1);
    confirmBtnBg.fillRoundedRect(centerX - 140, centerY + 130, 280, 42, 10);

    const confirmBtn = this.add.text(
      centerX,
      centerY + 151,
      '💰 NHẬN THƯỞNG & TIẾP TỤC',
      {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    confirmBtn.on('pointerdown', () => {
      confirmBtn.disableInteractive();
      SoundManager.getInstance().playCoinSound();
      SoundManager.getInstance().playClick();

      // Cộng tiền vào ví tài xế
      if (this.cityScene && this.cityScene.player) {
        this.cityScene.player.stats.wallet += totalEarnings;
        this.cityScene.player.stats.completedOrders += 1;
      }

      this.closeSettlementModal();
      this.showToast(`💵 +${totalEarnings.toLocaleString()} VNĐ đã cộng vào ví. Về bàn trong trọ để lưu.`);
    });

    this.settlementModalContainer.add([
      scrim,
      card,
      titleText,
      subTitle,
      starsText,
      reviewBox,
      reviewQuote,
      feeRow,
      feeVal,
      tipRow,
      tipVal,
      bonusRow,
      bonusVal,
      totalRow,
      totalVal,
      confirmBtnBg,
      confirmBtn
    ]);

    // Hiệu ứng mở modal trồi lên mượt mà
    this.settlementModalContainer.setScale(0.85);
    this.settlementModalContainer.setAlpha(0);
    this.tweens.add({
      targets: this.settlementModalContainer,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Đóng Bảng Quyết toán & Khởi động đơn mới
   */
  private closeSettlementModal() {
    this.tweens.add({
      targets: this.settlementModalContainer,
      scale: 0.9,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.settlementModalContainer.setVisible(false);
        this.isSettlementOpen = false;

        // Giải phóng đơn vừa giao và hẹn giờ tự động nổ đơn mới (Task 1.6)
        OrderManager.getInstance().completeSettlement();
        this.updateMiniOrderWidget();
        this.renderPhoneContent();
      }
    });
  }

private createToastNotification() {
    this.toastContainer = this.add.container(HUD_LAYOUT.toast.x, HUD_LAYOUT.toast.y).setDepth(30000).setAlpha(0);
    this.toastBackground = this.add.graphics();
    this.toastText = this.add.text(0, 0, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', color: '#e8edf4',
      wordWrap: { width: HUD_LAYOUT.toast.width - 24 }, align: 'center', lineSpacing: 3
    }).setOrigin(0.5);
    this.toastContainer.add([this.toastBackground, this.toastText]);
  }

  public showToast(message: string, durationMs: number = 2500) {
    if (this.isPhoneOpen) this.phoneUI.notify(message);
    this.toastTimer?.remove(false);
    this.tweens.killTweensOf(this.toastContainer);
    this.toastText.setText(message);
    const height = this.toastText.height + 20;
    this.toastBackground.clear().fillStyle(0x111d2b, 0.97);
    this.toastBackground.fillRoundedRect(-HUD_LAYOUT.toast.width / 2, -height / 2, HUD_LAYOUT.toast.width, height, 8);
    this.toastBackground.lineStyle(1, 0x648c78, 1);
    this.toastBackground.strokeRoundedRect(-HUD_LAYOUT.toast.width / 2, -height / 2, HUD_LAYOUT.toast.width, height, 8);
    this.toastContainer.setX(this.isPhoneOpen ? PHONE_LAYOUT.x / 2 : HUD_LAYOUT.toast.x).setAlpha(1);
    this.toastTimer = this.time.delayedCall(durationMs, () => {
      this.tweens.add({ targets: this.toastContainer, alpha: 0, duration: 220 });
    });
  }

  private setupEventListeners() {
    this.game.events.on('integrity_damage', (data: IntegrityDamageEvent) => {
      SoundManager.getInstance().playRattle();
      this.updateIntegrityBar(data.currentIntegrity);
      this.showToast(data.message, 2000);

      this.tweens.add({
        targets: this.integrityContainer,
        x: '+=6',
        yoyo: true,
        repeat: 3,
        duration: 40
      });
    });

    this.game.events.on('hazard_safe_pass', (data: { message: string }) => {
      this.showToast(data.message, 1500);
    });

    this.game.events.on('spin_out', (data: { message: string }) => {
      SoundManager.getInstance().playRattle();
      this.showToast(data.message, 2000);
    });

    this.game.events.on('order_accepted', () => {
      SoundManager.getInstance().playOrderChime();
      this.updateMiniOrderWidget();
    });

    this.game.events.on('order_picked_up', (data: { order: Order; count?: number }) => {
      SoundManager.getInstance().playOrderChime();
      this.updateMiniOrderWidget();
      this.updateIntegrityBar(100);
      this.showToast(data.count && data.count > 1 ?
        `🍲 Đã lấy ${data.count} món! Chọn điểm giao trên điện thoại.` :
        '🍲 Đã lấy ' + data.order.foodName + '! Bắt đầu giao hàng!');
    });

    // Sự kiện Giao hàng thành công -> Kích hoạt Bảng Quyết toán Đánh giá Sao!
    this.game.events.on('order_delivered', (data: { order: Order }) => {
      this.updateMiniOrderWidget();
      this.openSettlementModal(data.order);
    });

    // Sự kiện Tiêu thụ Vitals (Trà đá, Bánh mì)
    this.game.events.on('vital_consumed', (data: { message: string }) => {
      this.showToast(data.message, 2000);
    });

    // Sự kiện Ngày mới sau giấc ngủ
    this.game.events.on('day_advanced', (data: { day: number; message: string }) => {
      this.showToast(data.message, 3000);
      this.dayText.setText(`📅 Ngày ${data.day}`);
    });

    // Sự kiện Toast thông báo tổng quát
    this.game.events.on('toast_notification', (msg: string) => {
      this.showToast(msg, 2500);
    });

    // Sự kiện nổ đơn hàng mới (Task 1.6: Order Generator)
    this.game.events.on('new_order_ready', (data: { count: number }) => {
      this.showToast(`🔔 Có đơn hàng mới! Mở điện thoại để chọn (${data.count} đơn)`);
      this.renderPhoneContent();
    });
  }

  override update() {
    if (this.utilityUI?.isOpen) return;
    const fishingActive = this.scene.isActive('FishingScene');
    // 1. KIỂM TRA PHÍM TAB ĐỂ TOGGLE PHONE APP
    if (this.tabKey && Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      this.togglePhoneApp();
    }

    // 2. KIỂM TRA PHÍM M ĐỂ TOGGLE MUTE
    if (this.muteKey && Phaser.Input.Keyboard.JustDown(this.muteKey)) {
      this.toggleSound();
    }

    // 2.2 KIỂM TRA PHÍM N ĐỂ BẬT/TẮT RADAR MINIMAP (TASK 1.5)
    if (this.minimapKey && Phaser.Input.Keyboard.JustDown(this.minimapKey)) {
      this.toggleMinimap();
    }

    // 2.2.1 KIỂM TRA PHÍM K ĐỂ BẬT/TẮT THỜI TIẾT (TASK 2.2)
    if (this.weatherKey && Phaser.Input.Keyboard.JustDown(this.weatherKey)) {
      this.toggleWeather();
    }

    // 2.2.2 KIỂM TRA PHÍM P ĐỂ BẬT/TẮT PHÍM ẢO CẢM ỨNG (TASK 2.6)
    if (this.touchKey && Phaser.Input.Keyboard.JustDown(this.touchKey)) {
      this.toggleTouchControls();
    }
    if (this.inventoryKey && Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.openUtility('inventory');
    }
    if (this.settingsKey && Phaser.Input.Keyboard.JustDown(this.settingsKey)) {
      this.openUtility('settings');
    }

    // 2.3 CẬP NHẬT THANH CHỈ SỐ SINH TỒN NHẸ (VITALS - TASK 1.1)
    this.updateVitalsHUD();
    if (this.cityScene?.player) {
      const player = this.cityScene.player;
      const restaurantActive=this.scene.isActive('RestaurantScene')||this.scene.isPaused('RestaurantScene');
      const apartmentActive=this.scene.isActive('ApartmentScene')||this.scene.isPaused('ApartmentScene');
      const district = fishingActive ? 'Bến câu cuối ngõ' : apartmentActive ? 'Bên trong chung cư' : restaurantActive ? 'Bên trong cửa hàng' :
        this.scene.isActive('RoomScene') || this.scene.isPaused('RoomScene')
        ? 'Phòng Trọ Số 7' : getCityDistrictName(player.x, player.y);
      const shortDistrict = district.length > 25 ? `${district.slice(0, 23)}…` : district;
      this.districtText.setText('📍 ' + shortDistrict);
      const order = OrderManager.getInstance().getCurrentOrder();
      const hasFood = order?.status === OrderStatus.PICKED_UP || order?.status === OrderStatus.DELIVERED;
      if (hasFood) this.updateIntegrityBar(IntegrityManager.getInstance().getIntegrity());
      else this.integrityText.setText('Đồ ăn: chưa lấy').setColor('#a8bacb');
      this.integrityBarGfx.setVisible(hasFood);
    }

    // 2.3.1 CẬP NHẬT ĐỒNG HỒ THỜI GIAN NGÀY/ĐÊM & NÚT THỜI TIẾT & BUFF MÈO (TASK 2.1, 2.2, 2.3)
    const amb = TimeManager.getInstance().getAmbientData();
    this.clockText.setColor(amb.isRushHour ? '#f87171' : amb.isNight ? '#93c5fd' : '#fde047');

    const isRaining = WeatherManager.getInstance().isRaining();
    this.clockText.setText(`🕒 ${amb.timeString} ${amb.badgeText}  ${isRaining ? '🌧️ Mưa' : '☀️ Nắng'}`);

    this.luckyBuffBadge.setVisible(PetManager.getInstance().isLuckyBuffActive());

    // 2.4 CẬP NHẬT RADAR MINIMAP THỜI GIAN THỰC (TASK 1.5)
    this.updateRadarMinimap();

    // 3. CẬP NHẬT TỐC ĐỘ KM/H & VÍ TIỀN THỜI GIAN THỰC
    if (this.cityScene && this.cityScene.player) {
      const stats = this.cityScene.player.stats;

      const speedPx = this.cityScene.player.getCurrentSpeed();
      const kmh = Math.round((speedPx / 360) * 45);
      this.speedText.setText(fishingActive ? '🎣 Bờ câu' : '🛵 ' + kmh + ' km/h');

      // 4. CẬP NHẬT MŨI TÊN LA BÀN & SỐ MÉT THỜI GIAN THỰC
      const nav = NavigationManager.getInstance().getNavigationData(
        this.cityScene.player.x,
        this.cityScene.player.y
      );

      this.compassNeedle.setAngle(fishingActive ? 0 : nav.angleDeg + 90);
      this.compassDistText.setText(fishingActive ? '🎣' : `📍 ${nav.distanceMeters}m`);
      this.compassTargetText.setText(fishingActive ? 'Hồ Sen Cuối Ngõ' :
        nav.targetName.length > 27 ? nav.targetName.slice(0, 26) + '…' : nav.targetName);

      if (nav.distanceMeters <= 12) {
        this.compassDistText.setColor('#facc15');
        this.compassTargetText.setColor('#facc15');
      } else {
        this.compassDistText.setColor('#38bdf8');
        this.compassTargetText.setColor('#94a3b8');
      }
    }
  }

  private forwardFishingInteract(event: KeyboardEvent) {
    if (event.repeat || !this.scene.isActive('FishingScene') || this.isPhoneOpen ||
      this.utilityUI?.isOpen || this.conversationUI?.isOpen || !this.cityScene?.player) return;
    this.cityScene.player.virtualInput.e = true;
  }
}
