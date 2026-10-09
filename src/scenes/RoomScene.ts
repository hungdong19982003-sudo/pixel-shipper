import Phaser from 'phaser';
import { ROOM_CONFIG, MAP_LOCATIONS, GAME_WIDTH, PLAYER_NAME, WEEK_CONFIG } from '../config/GameConfig';
import { ConversationModel, FurniturePlacement, PlayerStats } from '../types';
import { VitalsManager } from '../managers/VitalsManager';
import { SaveManager } from '../managers/SaveManager';
import { SoundManager } from '../assets/SoundManager';
import { PetManager } from '../managers/PetManager';
import { TimeManager } from '../managers/TimeManager';
import { FurnitureManager } from '../managers/FurnitureManager';
import { InventoryManager } from '../managers/InventoryManager';
import { SocialManager } from '../managers/SocialManager';
import { WeekManager } from '../managers/WeekManager';
import { FishingEconomyManager } from '../managers/FishingEconomyManager';
import { CityScene } from './CityScene';
import type { UIScene } from './UIScene';

/**
 * RoomScene - Căn phòng trọ ấm cúng của Shipper (Task 1.2: Home Base)
 * Tính năng:
 * - Nội thất phòng trọ pixel art: Giường ngủ, bàn học/laptop, cửa sổ nhìn ra phố, thảm len, tủ đồ, chú mèo ngủ
 * - Tùy biến trang trí phòng trọ (Task 2.5): Giường Luxury, Thảm Mandala, Cây Bonsai, Máy pha Espresso, Loa đĩa than Lofi
 * - Đi ngủ qua đêm tại Giường: Hồi phục 100% Năng lượng, chuyển sang ngày mới (Task 1.2)
 * - Chỉ lưu tiến trình thủ công tại Bàn làm việc (Task 1.3)
 * - Vuốt ve chú mèo mướp ngủ ngoan (Task 2.3)
 * - Cửa ra vào dẫn trở lại Phố Cuối Ngày
 */
export class RoomScene extends Phaser.Scene {
  private playerSprite!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private interactKeyE!: Phaser.Input.Keyboard.Key;

  private playerStats!: PlayerStats;
  private currentDirection: 'down' | 'up' | 'left' | 'right' = 'down';

  // Badges tương tác nổi
  private bedPrompt!: Phaser.GameObjects.Container;
  private deskPrompt!: Phaser.GameObjects.Container;
  private doorPrompt!: Phaser.GameObjects.Container;
  private catPrompt!: Phaser.GameObjects.Container;
  private bowlPrompt!: Phaser.GameObjects.Container;
  private coffeePrompt!: Phaser.GameObjects.Container;
  private catAffectionText!: Phaser.GameObjects.Text;
  private hasCoffeeMaker: boolean = false;
  private coffeeMakerPosition = { x: ROOM_CONFIG.deskPos.x + 22, y: ROOM_CONFIG.deskPos.y - 12 };
  private placedFurnitureColliders!: Phaser.Physics.Arcade.StaticGroup;
  private placementGhost?: Phaser.GameObjects.Image;
  private placementHint?: Phaser.GameObjects.Text;
  private placementFurnitureId?: string;
  private placementValid = false;
  private cancelPlacementKey?: Phaser.Input.Keyboard.Key;

  // Lớp phủ thông báo ngày mới / ngủ
  private isSleeping: boolean = false;
  private sleepOverlay!: Phaser.GameObjects.Graphics;
  private dayText!: Phaser.GameObjects.Text;
  private sleepSubText!: Phaser.GameObjects.Text;

  private lastInteractTime: number = 0;

  constructor() {
    super({ key: 'RoomScene' });
  }

  init(data: { playerStats?: PlayerStats }) {
    if (data && data.playerStats) {
      this.playerStats = data.playerStats;
    } else {
      const city = this.scene.get('CityScene') as CityScene;
      this.playerStats = city?.player?.stats ?? {
        wallet: 150000,
        rating: 5.0,
        completedOrders: 0,
        day: 1,
        hunger: 100,
        thirst: 100,
        energy: 100
      };
    }
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Create the physics sprite before the environment registers its colliders.
    this.createRoomPlayer();
    this.buildRoomEnvironment();

    // 3. TẠO CÁC PROMPT TƯƠNG TÁC (GIƯỜNG, BÀN, CỬA, MÈO)
    this.createInteractionBadges();

    // 4. LỚP PHỦ ANIMATION NGỦ QUA ĐÊM
    this.createSleepOverlay();

    // 5. THIẾT LẬP PHÍM BẤM
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
      this.interactKeyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.cancelPlacementKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    // 5.1 KHỞI TẠO HỆ THỐNG MÈO PHÒNG TRỌ (TASK 2.3)
    PetManager.getInstance().init(this, this.playerStats);

    // 6. HIỂN THỊ BANNER CHÀO MỪNG VỀ NHÀ
    this.showRoomBanner();
    this.time.delayedCall(750, () => {
      if (!this.maybeShowDayStory()) this.maybeLandladyVisit();
    });
    this.input.on('pointerdown', this.handleFurniturePlacementClick, this);
    this.events.once('shutdown', () => this.input.off('pointerdown', this.handleFurniturePlacementClick, this));
  }

  /**
   * Xây dựng nội thất căn phòng trọ ấm cúng
   */
  private buildRoomEnvironment() {
    const { roomBounds } = ROOM_CONFIG;

    // Nền tối xung quanh phòng tạo hiệu ứng tập trung ấm áp
    const bg = this.add.graphics();
    bg.fillStyle(0x080c14, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    // 1. Tường phòng trọ (Top section)
    const wallHeight = 120;
    for (let x = roomBounds.x; x < roomBounds.x + roomBounds.width; x += 64) {
      for (let y = roomBounds.y; y < roomBounds.y + wallHeight; y += 64) {
        this.add.image(x + 32, y + 32, 'room_wall').setDepth(0);
      }
    }

    // 2. Sàn gỗ Parquet ấm (Floor section)
    for (let x = roomBounds.x; x < roomBounds.x + roomBounds.width; x += 64) {
      for (let y = roomBounds.y + wallHeight; y < roomBounds.y + roomBounds.height; y += 64) {
        this.add.image(x + 32, y + 32, 'room_floor').setDepth(1);
      }
    }

    // 3. Viền chân tường gỗ ngăn cách tường và sàn
    const baseboard = this.add.graphics().setDepth(2);
    baseboard.fillStyle(0x78350f, 1);
    baseboard.fillRect(roomBounds.x, roomBounds.y + wallHeight - 4, roomBounds.width, 8);

    // 4. Đặt Cửa sổ nhìn ra trời đêm (Room Window)
    this.add.image(roomBounds.x + 280, roomBounds.y + 50, 'room_window').setDepth(3);

    // 4.1 Cây Bonsai Kim Ngân / Cây Tài Lộc (Task 2.5: Furniture)
    if (this.isLegacyFurniture('bonsai_tree')) {
      this.add.image(roomBounds.x + 360, roomBounds.y + 70, 'room_bonsai').setDepth(roomBounds.y + 70);
    }

    // 5. Đặt Giường ngủ (Giường cơ bản hoặc Giường Luxury - Task 2.5)
    const hasLuxuryBed = this.isLegacyFurniture('bed_luxury');
    const bedTexture = hasLuxuryBed ? 'room_bed_luxury' : 'room_bed';
    this.add.image(ROOM_CONFIG.bedPos.x, ROOM_CONFIG.bedPos.y, bedTexture).setDepth(ROOM_CONFIG.bedPos.y);

    // 6. Đặt Bàn làm việc có laptop & đèn bàn (Room Desk)
    this.add.image(ROOM_CONFIG.deskPos.x, ROOM_CONFIG.deskPos.y, 'room_desk').setDepth(ROOM_CONFIG.deskPos.y);

    // 6.1 Máy Pha Cà Phê Mini Espresso trên bàn (Task 2.5: Furniture)
    this.hasCoffeeMaker = FurnitureManager.getInstance().hasFurniture(this.playerStats, 'coffee_maker');
    const coffeePlacement = this.getFurniturePlacement('coffee_maker');
    if (coffeePlacement) {
      this.coffeeMakerPosition = { x: coffeePlacement.x, y: coffeePlacement.y };
    } else if (this.isLegacyFurniture('coffee_maker')) {
      this.add.image(ROOM_CONFIG.deskPos.x + 22, ROOM_CONFIG.deskPos.y - 12, 'room_coffee_maker').setDepth(ROOM_CONFIG.deskPos.y + 2);
    }

    // 7. Đặt Tủ quần áo (Room Wardrobe)
    this.add.image(roomBounds.x + 40, roomBounds.y + 160, 'room_wardrobe').setDepth(roomBounds.y + 160);

    // 7.1 Loa Đĩa Than Cổ Điển Lofi (Task 2.5: Furniture)
    if (this.isLegacyFurniture('lofi_speaker')) {
      this.add.image(roomBounds.x + 65, roomBounds.y + 260, 'room_lofi_speaker').setDepth(roomBounds.y + 260);
      const note = this.add.text(roomBounds.x + 65, roomBounds.y + 242, '🎵', { fontSize: '11px' }).setDepth(roomBounds.y + 270);
      this.tweens.add({
        targets: note,
        y: roomBounds.y + 230,
        alpha: 0.3,
        yoyo: true,
        repeat: -1,
        duration: 1500,
        ease: 'Sine.easeInOut'
      });
    }

    // 8. Đặt Thảm trải sàn (Thảm len Boho hoặc Thảm thổ cẩm Mandala Luxury - Task 2.5)
    const hasWarmRug = this.isLegacyFurniture('warm_rug');
    const carpetTexture = hasWarmRug ? 'room_carpet_luxury' : 'room_carpet';
    this.add.image(roomBounds.x + 280, roomBounds.y + 240, carpetTexture).setDepth(2);

    // 9. Đặt Chú mèo mướp ngủ ngoan trên thảm
    const cat = this.add.image(ROOM_CONFIG.catPos.x, ROOM_CONFIG.catPos.y, 'room_cat').setDepth(ROOM_CONFIG.catPos.y);
    // Animation mèo thở nhịp nhàng khi ngủ
    this.tweens.add({
      targets: cat,
      scaleY: 1.08,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 9.1 Đặt Bát ăn cho mèo có cá/pate (Task 2.3)
    this.add.image(ROOM_CONFIG.bowlPos.x, ROOM_CONFIG.bowlPos.y, 'room_cat_bowl').setDepth(ROOM_CONFIG.bowlPos.y);

    // 10. Đặt Cửa ra phố (Room Door Exit)
    this.add.image(ROOM_CONFIG.doorPos.x, ROOM_CONFIG.doorPos.y + 10, 'room_door_exit').setDepth(ROOM_CONFIG.doorPos.y + 10);

    // 11. Ánh sáng vàng dịu từ đèn bàn
    const lampLight = this.add.graphics().setDepth(ROOM_CONFIG.deskPos.y + 2);
    lampLight.fillStyle(0xfde047, 0.12);
    lampLight.fillCircle(ROOM_CONFIG.deskPos.x - 10, ROOM_CONFIG.deskPos.y + 20, 70);

    // 12. Rào chắn biên phòng trọ
    const wallsGroup = this.physics.add.staticGroup();
    this.placedFurnitureColliders = this.physics.add.staticGroup();
    for (const placement of this.playerStats.furniturePlacements ?? []) {
      this.renderFurniturePlacement(placement, true);
    }
    // Tường trên
    const topWall = this.add.rectangle(roomBounds.x + roomBounds.width / 2, roomBounds.y + wallHeight + 10, roomBounds.width, 20);
    wallsGroup.add(topWall);
    // Tường dưới
    const bottomWall = this.add.rectangle(roomBounds.x + roomBounds.width / 2, roomBounds.y + roomBounds.height + 10, roomBounds.width, 20);
    wallsGroup.add(bottomWall);
    // Tường trái
    const leftWall = this.add.rectangle(roomBounds.x - 10, roomBounds.y + roomBounds.height / 2, 20, roomBounds.height);
    wallsGroup.add(leftWall);
    // Tường phải
    const rightWall = this.add.rectangle(roomBounds.x + roomBounds.width + 10, roomBounds.y + roomBounds.height / 2, 20, roomBounds.height);
    wallsGroup.add(rightWall);

    // Va chạm với đồ đạc lớn
    const bedBox = this.add.rectangle(ROOM_CONFIG.bedPos.x, ROOM_CONFIG.bedPos.y + 10, 56, 50);
    wallsGroup.add(bedBox);
    const deskBox = this.add.rectangle(ROOM_CONFIG.deskPos.x, ROOM_CONFIG.deskPos.y + 10, 56, 30);
    wallsGroup.add(deskBox);

    this.physics.add.collider(this.playerSprite, wallsGroup);
    this.physics.add.collider(this.playerSprite, this.placedFurnitureColliders);
  }

  private getFurniturePlacement(itemId: string): FurniturePlacement | undefined {
    return this.playerStats.furniturePlacements?.find((placement) => placement.itemId === itemId);
  }

  private isLegacyFurniture(itemId: string): boolean {
    return FurnitureManager.getInstance().hasFurniture(this.playerStats, itemId) &&
      !this.getFurniturePlacement(itemId);
  }

  private furnitureTexture(itemId: string): string | undefined {
    const textures: Record<string, string> = {
      bed_luxury: 'room_bed_luxury',
      bonsai_tree: 'room_bonsai',
      coffee_maker: 'room_coffee_maker',
      lofi_speaker: 'room_lofi_speaker',
      warm_rug: 'room_carpet_luxury'
    };
    return textures[itemId];
  }

  private renderFurniturePlacement(placement: FurniturePlacement, addCollision: boolean) {
    const texture = this.furnitureTexture(placement.itemId);
    if (!texture) return;
    const image = this.add.image(placement.x, placement.y, texture).setDepth(placement.y + 4);
    if (placement.itemId === 'warm_rug') image.setDepth(placement.y - 5);
    if (addCollision && placement.itemId !== 'warm_rug') {
      const box = this.add.rectangle(placement.x, placement.y + 10, 36, 28).setVisible(false);
      this.placedFurnitureColliders.add(box);
    }
  }

  public beginFurniturePlacement(itemId: string) {
    const furniture = FurnitureManager.getInstance().getFurnitureById(itemId);
    if (!furniture || FurnitureManager.getInstance().bagQuantity(this.playerStats, itemId) <= 0) return;
    this.cancelFurniturePlacement();
    this.placementFurnitureId = itemId;
    const texture = this.furnitureTexture(itemId);
    if (!texture) return;
    this.placementGhost = this.add.image(this.playerSprite.x, this.playerSprite.y, texture)
      .setAlpha(0.62).setDepth(20000);
    this.placementHint = this.add.text(GAME_WIDTH / 2, 34,
      `Đặt ${furniture.name}: di chuyển chuột, nhấn E hoặc bấm để đặt • Esc hủy`, {
        fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', color: '#ffffff',
        backgroundColor: '#111d2b', padding: { x: 10, y: 6 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);
    this.updateFurnitureGhost();
  }

  private updateFurnitureGhost() {
    if (!this.placementGhost || !this.placementFurnitureId) return;
    const pointer = this.input.activePointer;
    const grid = 32;
    const x = Math.round(pointer.worldX / grid) * grid;
    const y = Math.round(pointer.worldY / grid) * grid;
    this.placementGhost.setPosition(x, y);
    this.placementValid = this.isFurniturePlacementValid(this.placementFurnitureId, x, y);
    this.placementGhost.setTint(this.placementValid ? 0x9be7ad : 0xf28b82);
  }

  private isFurniturePlacementValid(itemId: string, x: number, y: number): boolean {
    const bounds = ROOM_CONFIG.roomBounds;
    const halfWidth = itemId === 'bed_luxury' || itemId === 'warm_rug' ? 36 : 20;
    const halfHeight = itemId === 'bed_luxury' ? 42 : itemId === 'warm_rug' ? 28 : 20;
    if (x < bounds.x + halfWidth + 12 || x > bounds.x + bounds.width - halfWidth - 12 ||
        y < bounds.y + 145 + halfHeight || y > bounds.y + bounds.height - halfHeight - 12) return false;

    const fixedObstacles = [
      { x: ROOM_CONFIG.bedPos.x, y: ROOM_CONFIG.bedPos.y, radius: 62 },
      { x: ROOM_CONFIG.deskPos.x, y: ROOM_CONFIG.deskPos.y, radius: 50 },
      { x: ROOM_CONFIG.catPos.x, y: ROOM_CONFIG.catPos.y, radius: 38 },
      { x: ROOM_CONFIG.bowlPos.x, y: ROOM_CONFIG.bowlPos.y, radius: 32 },
      { x: ROOM_CONFIG.doorPos.x, y: ROOM_CONFIG.doorPos.y, radius: 42 },
      { x: bounds.x + 40, y: bounds.y + 160, radius: 34 }
    ];
    if (fixedObstacles.some((obstacle) => Phaser.Math.Distance.Between(x, y, obstacle.x, obstacle.y) < obstacle.radius)) {
      return false;
    }
    return !(this.playerStats.furniturePlacements ?? []).some((placement) => {
      const otherRadius = placement.itemId === 'bed_luxury' || placement.itemId === 'warm_rug' ? 48 : 38;
      return Phaser.Math.Distance.Between(x, y, placement.x, placement.y) < otherRadius;
    });
  }

  private placeFurnitureAtGhost() {
    const itemId = this.placementFurnitureId;
    const ghost = this.placementGhost;
    if (!itemId || !ghost || !this.placementValid) {
      this.game.events.emit('toast_notification', 'Chỗ này bị chắn. Hãy chọn một khoảng trống trên sàn.');
      return;
    }
    const result = FurnitureManager.getInstance().placeFurniture(this.playerStats, itemId, ghost.x, ghost.y);
    if (!result.success || !result.placement) {
      this.game.events.emit('toast_notification', result.message);
      return;
    }
    this.renderFurniturePlacement(result.placement, true);
    this.game.events.emit('toast_notification', result.message);
    if (FurnitureManager.getInstance().bagQuantity(this.playerStats, itemId) <= 0) {
      this.cancelFurniturePlacement();
      return;
    }
    this.updateFurnitureGhost();
  }

  private handleFurniturePlacementClick(pointer: Phaser.Input.Pointer) {
    if (!this.placementFurnitureId || pointer.button !== 0) return;
    this.updateFurnitureGhost();
    this.placeFurnitureAtGhost();
  }

  public cancelFurniturePlacement() {
    this.placementFurnitureId = undefined;
    this.placementValid = false;
    this.placementGhost?.destroy();
    this.placementGhost = undefined;
    this.placementHint?.destroy();
    this.placementHint = undefined;
  }

  /**
   * Tạo nhân vật Shipper trong phòng trọ
   */
  private createRoomPlayer() {
    this.playerSprite = this.physics.add.sprite(
      ROOM_CONFIG.doorPos.x,
      ROOM_CONFIG.doorPos.y - 40,
      'player_up'
    );
    this.playerSprite.setCollideWorldBounds(true);
    this.playerSprite.setSize(24, 18);
    this.playerSprite.setOffset(12, 38);
    this.playerSprite.setDepth(100);
  }

  private maybeShowDayStory(): boolean {
    const progress = WeekManager.progress(this.playerStats);
    const day = this.playerStats.day;
    const message = WeekManager.storyForDay(day);
    if (!message || progress.lastStoryDay >= day) return false;
    progress.lastStoryDay = day;
    const ui = this.scene.get('UIScene') as UIScene;
    ui.showConversation({
      name: PLAYER_NAME,
      role: `Nhật ký • Ngày ${day} / ${WEEK_CONFIG.rentPeriodDays}`,
      texture: 'player_down',
      affection: Math.min(100, Math.round(day / WEEK_CONFIG.rentPeriodDays * 100)),
      showAffection: false,
      message,
      actions: [{ id: 'start-day', label: 'Bắt đầu ngày mới', run: () => ui.closeConversation() }],
      onClose: () => this.time.delayedCall(100, () => this.maybeLandladyVisit())
    });
    return true;
  }

  private showFirstWeekEnding(): void {
    const ui = this.scene.get('UIScene') as UIScene;
    ui.showConversation({
      name: PLAYER_NAME,
      role: 'Kết thúc tuần đầu • Một khởi đầu mới',
      texture: 'player_down',
      affection: 100,
      showAffection: false,
      message: 'Tiền trọ tuần đầu đã trả xong. Minh vẫn chưa tìm được việc đúng ngành, nhưng thành phố đã có những con đường quen, vài người chờ Minh ghé quán và một căn phòng để trở về. Ngày mai, Minh lại tiếp tục.',
      actions: [{ id: 'continue-journey', label: 'Tiếp tục hành trình', run: () => ui.closeConversation() }]
    });
  }

  private maybeLandladyVisit() {
    const progress = WeekManager.progress(this.playerStats);
    const day = this.playerStats.day ?? 1;
    const rentDue = WeekManager.chargeDueRent(this.playerStats) > 0;
    if (progress.lastLandladyVisitDay === day) return;
    if (!rentDue && day - progress.lastLandladyVisitDay < 2) return;

    const visitNumber = progress.landladyVisitCount;

    const landladyX = ROOM_CONFIG.doorPos.x - 72;
    const landladyY = ROOM_CONFIG.doorPos.y - 38;
    const visitor = this.add.image(landladyX, landladyY, 'npc_landlady')
      .setDepth(landladyY + 2).setDisplaySize(42, 56);
    this.tweens.add({ targets: visitor, y: landladyY - 2, yoyo: true, repeat: -1, duration: 650 });

    const ui = this.scene.get('UIScene') as UIScene;
    const relation = SocialManager.getInstance().get(this.playerStats, 'landlady:co-hanh');
    const closeWithToast = (message: string) => {
      ui.closeConversation();
      this.game.events.emit('toast_notification', message);
    };
    const rememberVisit = () => {
      progress.landladyVisitCount++;
      progress.lastLandladyVisitDay = day;
      relation.lastTalkDay = day;
      relation.affection = Math.min(100, relation.affection + 2);
    };

    let conversation: ConversationModel;
    if (rentDue) {
      const rent = progress.rentDebt;
      const canPay = this.playerStats.wallet >= rent;
      conversation = {
        name: 'Cô Hạnh', role: 'Bà chủ trọ • Ghé nhắc tiền phòng', texture: 'npc_landlady',
        affection: relation.affection,
        message: canPay
          ? `${PLAYER_NAME} à, tiền trọ đến hạn rồi: ${rent.toLocaleString('vi-VN')}đ. Cô biết cháu mới đi làm, thu xếp được thì gửi cô hôm nay.`
          : `${PLAYER_NAME} à, tiền trọ còn thiếu ${rent.toLocaleString('vi-VN')}đ. Cô biết cháu mới chạy ship. Khi nào kiếm đủ thì đưa cô nhé.`,
        actions: [
          { id: 'pay-rent', label: canPay ? 'Gửi cô ' + rent.toLocaleString('vi-VN') + 'đ tiền trọ' : 'Trả tiền trọ • Còn thiếu ' + (rent - this.playerStats.wallet).toLocaleString('vi-VN') + 'đ', disabled: !canPay, run: () => {
            const firstCompletion = !progress.firstWeekCompleted && day >= WEEK_CONFIG.rentPeriodDays;
            if (!WeekManager.payRent(this.playerStats)) return;
            rememberVisit();
            closeWithToast(`🏠 Đã gửi cô Hạnh ${rent.toLocaleString('vi-VN')}đ tiền trọ.`);
            if (firstCompletion) this.time.delayedCall(150, () => this.showFirstWeekEnding());
          } },
          { id: 'ask-time', label: 'Cô cho cháu khất vài hôm nhé', run: () => {
            rememberVisit();
            closeWithToast(`Cô Hạnh thở dài, nhưng đồng ý cho ${PLAYER_NAME} khất thêm vài hôm.`);
          } }
        ]
      };
    } else if (visitNumber % 2 === 0) {
      conversation = {
        name: 'Cô Hạnh', role: 'Bà chủ trọ • Hơi khó tính', texture: 'npc_landlady',
        affection: relation.affection,
        message: 'Cả đêm lại nghe tiếng xe ngoài ngõ. Chạy xe nhớ cẩn thận nghe chưa, với lại đừng để phòng bừa bộn quá. Cô càu nhàu vậy thôi chứ cũng lo cho cháu.',
        actions: [
          { id: 'promise', label: 'Dạ, cháu biết rồi. Cô đừng lo ạ.', run: () => {
            rememberVisit();
            closeWithToast('Cô Hạnh lắc đầu rồi quay về phòng mình.');
          } },
          { id: 'thank', label: 'Cảm ơn cô đã nhắc cháu', run: () => {
            rememberVisit();
            closeWithToast('Cô Hạnh dịu giọng: “Ừ, đi đường cẩn thận là được.”');
          } }
        ]
      };
    } else {
      conversation = {
        name: 'Cô Hạnh', role: 'Bà chủ trọ • Hôm nay mang đồ ăn sang', texture: 'npc_landlady',
        affection: relation.affection,
        message: 'Cô nấu dư hộp xôi đậu phộng. Cháu cầm lấy mà ăn, chạy ngoài đường cả ngày đừng để bụng đói. Cô để đây nhé.',
        actions: [{ id: 'accept-food', label: 'Nhận hộp xôi • Cảm ơn cô', run: () => {
            rememberVisit();
            const added = InventoryManager.add(this.playerStats, {
              id: 'landlady_peanut_sticky_rice', name: 'Xôi đậu phộng cô Hạnh cho', icon: '🍱',
              category: 'consumable', description: 'Hộp xôi ấm cô Hạnh mang sang.', hunger: 38, thirst: 5, energy: 8
            });
            if (added) closeWithToast('🍱 Đã nhận hộp xôi và cất vào túi đồ.');
            else {
              this.playerStats.hunger = Math.min(100, this.playerStats.hunger + 38);
              this.playerStats.thirst = Math.min(100, this.playerStats.thirst + 5);
              this.playerStats.energy = Math.min(100, this.playerStats.energy + 8);
              closeWithToast(`🍱 Túi đã đầy, ${PLAYER_NAME} ăn hộp xôi luôn và thấy khỏe hơn.`);
            }
          } }]
      };
    }
    const fish = FishingEconomyManager.fishInBag(this.playerStats)[0];
    if (fish) conversation.actions.push({
      id: 'gift-fish', label: `Tặng cô ${fish.name}`,
      run: () => {
        const result = FishingEconomyManager.gift(this.playerStats, fish.id, 'landlady:co-hanh');
        closeWithToast(result.message);
      }
    });
    ui.showConversation(conversation);
  }

  /**
   * Tạo các badge gợi ý tương tác
   */
  private createInteractionBadges() {
    // 1. Badge Giường ngủ
    this.bedPrompt = this.createBadge(
      ROOM_CONFIG.bedPos.x,
      ROOM_CONFIG.bedPos.y - 50,
      '🛏️ [E] Đi Ngủ Qua Đêm (Hồi 100% Năng Lượng)',
      '#f59e0b'
    );

    // 2. Badge Bàn làm việc
    this.deskPrompt = this.createBadge(
      ROOM_CONFIG.deskPos.x,
      ROOM_CONFIG.deskPos.y - 36,
      '💻 [E] Bàn Làm Việc (Lưu Game)',
      '#38bdf8'
    );

    // 3. Badge Cửa ra phố
    this.doorPrompt = this.createBadge(
      ROOM_CONFIG.doorPos.x,
      ROOM_CONFIG.doorPos.y - 30,
      '🚪 [E] Ra Phố Giao Hàng',
      '#10b981'
    );

    // 4. Badge Vuốt ve mèo (Task 2.3)
    this.catPrompt = this.createBadge(
      ROOM_CONFIG.catPos.x,
      ROOM_CONFIG.catPos.y - 24,
      '🐱 [E] Vuốt Ve Mèo (Buff May Mắn)',
      '#fb923c'
    );

    // 5. Badge Bát ăn cho mèo (Task 2.3)
    this.bowlPrompt = this.createBadge(
      ROOM_CONFIG.bowlPos.x,
      ROOM_CONFIG.bowlPos.y - 24,
      '🐟 [E] Cho Mèo Ăn Pate (10.000đ)',
      '#38bdf8'
    );

    // 6. Badge Máy pha cà phê mini (Task 2.5: Furniture)
    this.coffeePrompt = this.createBadge(
      this.coffeeMakerPosition.x,
      this.coffeeMakerPosition.y - 24,
      '☕ [E] Pha Espresso (+40 Năng lượng, +25 Khát)',
      '#a855f7'
    );

    // Hiển thị độ thân mật của Mèo
    const aff = PetManager.getInstance().getAffection();
    const affLevel = PetManager.getInstance().getAffectionLevelName();
    this.catAffectionText = this.add.text(
      ROOM_CONFIG.catPos.x + 15,
      ROOM_CONFIG.catPos.y - 36,
      `🐾 Mèo Mướp: ${aff}/100 (${affLevel})`,
      {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: '10px',
        color: '#facc15'
      }
    ).setOrigin(0.5).setDepth(200);
  }

  private createBadge(x: number, y: number, text: string, color: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(9999).setVisible(false);

    const txt = this.add.text(0, 0, text, {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const bg = this.add.graphics();
    const w = txt.width + 16;
    const h = 22;
    bg.fillStyle(0x0f172a, 0.92);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(color).color, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    container.add([bg, txt]);
    return container;
  }

  /**
   * Màn che hiệu ứng khi ngủ qua đêm
   */
  private createSleepOverlay() {
    this.sleepOverlay = this.add.graphics().setDepth(100000).setVisible(false);
    this.sleepOverlay.fillStyle(0x05070d, 1);
    this.sleepOverlay.fillRect(0, 0, this.scale.width, this.scale.height);

    this.dayText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5).setDepth(100001).setVisible(false);

    this.sleepSubText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '14px',
      color: '#e2e8f0'
    }).setOrigin(0.5).setDepth(100001).setVisible(false);
  }

  /**
   * Banner chào mừng vào phòng trọ
   */
  private showRoomBanner() {
    const banner = this.add.container(this.scale.width / 2, 45).setDepth(9000);
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.88);
    bg.fillRoundedRect(-140, -16, 280, 32, 8);
    bg.lineStyle(1, 0x334155, 1);
    bg.strokeRoundedRect(-140, -16, 280, 32, 8);

    const txt = this.add.text(0, 0, '🏠 Căn Phòng Trọ Ấm Cúng (Số 7)', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '12px',
      color: '#38bdf8'
    }).setOrigin(0.5);

    banner.add([bg, txt]);
  }

  override update(time: number, _delta: number) {
    if (this.isSleeping || !this.playerSprite.body) return;

    if (this.placementFurnitureId) {
      this.playerSprite.setVelocity(0, 0);
      this.playerSprite.anims.stop();
      this.playerSprite.setTexture(`player_${this.currentDirection}`);
      this.updateFurnitureGhost();
      if (this.cancelPlacementKey && Phaser.Input.Keyboard.JustDown(this.cancelPlacementKey)) {
        this.cancelFurniturePlacement();
        return;
      }
      if (this.interactKeyE && Phaser.Input.Keyboard.JustDown(this.interactKeyE)) {
        this.placeFurnitureAtGhost();
      }
      return;
    }

    // 1. DI CHUYỂN TRONG PHÒNG TRỌ
    const left = this.cursors?.left?.isDown || this.wasdKeys?.A?.isDown;
    const right = this.cursors?.right?.isDown || this.wasdKeys?.D?.isDown;
    const up = this.cursors?.up?.isDown || this.wasdKeys?.W?.isDown;
    const down = this.cursors?.down?.isDown || this.wasdKeys?.S?.isDown;

    const speed = 120;
    let vx = 0;
    let vy = 0;

    if (left) vx -= speed;
    if (right) vx += speed;
    if (up) vy -= speed;
    if (down) vy += speed;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.playerSprite.setVelocity(vx, vy);

    if (vx < 0) {
      this.currentDirection = 'left';
      this.playerSprite.anims.play('walk_left', true);
    } else if (vx > 0) {
      this.currentDirection = 'right';
      this.playerSprite.anims.play('walk_right', true);
    } else if (vy < 0) {
      this.currentDirection = 'up';
      this.playerSprite.anims.play('walk_up', true);
    } else if (vy > 0) {
      this.currentDirection = 'down';
      this.playerSprite.anims.play('walk_down', true);
    } else {
      this.playerSprite.anims.stop();
      this.playerSprite.setTexture(`player_${this.currentDirection}`);
    }

    this.playerSprite.setDepth(this.playerSprite.y + 10);

    // 2. KIỂM TRA BÁN KÍNH TƯƠNG TÁC
    const px = this.playerSprite.x;
    const py = this.playerSprite.y;

    const nearBed = Phaser.Math.Distance.Between(px, py, ROOM_CONFIG.bedPos.x, ROOM_CONFIG.bedPos.y) < 55;
    const nearDesk = Phaser.Math.Distance.Between(px, py, ROOM_CONFIG.deskPos.x, ROOM_CONFIG.deskPos.y) < 50;
    const nearDoor = Phaser.Math.Distance.Between(px, py, ROOM_CONFIG.doorPos.x, ROOM_CONFIG.doorPos.y) < 50;
    const nearCat = Phaser.Math.Distance.Between(px, py, ROOM_CONFIG.catPos.x, ROOM_CONFIG.catPos.y) < 46;
    const nearBowl = Phaser.Math.Distance.Between(px, py, ROOM_CONFIG.bowlPos.x, ROOM_CONFIG.bowlPos.y) < 46;
    const nearCoffee = this.hasCoffeeMaker && Phaser.Math.Distance.Between(px, py,
      this.coffeeMakerPosition.x, this.coffeeMakerPosition.y) < 46;

    this.bedPrompt.setVisible(nearBed);
    this.deskPrompt.setVisible(nearDesk && !nearCoffee);
    this.doorPrompt.setVisible(nearDoor);
    this.catPrompt.setVisible(nearCat);
    this.bowlPrompt.setVisible(nearBowl);
    this.coffeePrompt.setVisible(nearCoffee);

    // 3. XỬ LÝ PHÍM E TƯƠNG TÁC
    if (this.interactKeyE && Phaser.Input.Keyboard.JustDown(this.interactKeyE)) {
      if (time - this.lastInteractTime > 400) {
        this.lastInteractTime = time;

        if (nearCoffee) {
          this.executeDrinkCoffee();
        } else if (nearBed) {
          this.executeSleep();
        } else if (nearDesk) {
          this.executeSaveDesk();
        } else if (nearCat) {
          this.executePetCat();
        } else if (nearBowl) {
          this.executeFeedCat();
        } else if (nearDoor) {
          this.exitToStreet();
        }
      }
    }

  }

  /**
   * Ngủ qua đêm (Task 1.2 & Task 1.3)
   */
  private executeSleep() {
    this.isSleeping = true;
    this.playerSprite.setVelocity(0, 0);
    this.playerSprite.anims.stop();

    // Màn đen dần
    this.sleepOverlay.setVisible(true).setAlpha(0);
    this.tweens.add({
      targets: this.sleepOverlay,
      alpha: 1,
      duration: 700,
      onComplete: () => {
        const goalBonus = WeekManager.finishDay(this.playerStats);
        // Gọi VitalsManager để hồi năng lượng và sang ngày mới
        const city = this.scene.get('CityScene') as CityScene;
        const result = VitalsManager.getInstance().sleepOvernight(city.player);
        WeekManager.beginDay(this.playerStats);

        // Khởi động lại trạng thái vuốt ve mèo & chu kỳ giờ sáng 06:30 (Task 2.1 & 2.3)
        PetManager.getInstance().onNewDay(city.player);
        TimeManager.getInstance().onSleepWakeup(6, 30);

        this.dayText.setText(`🌅 NGÀY MỚI BẮT ĐẦU: NGÀY ${result.newDay}`).setVisible(true);
        this.sleepSubText.setText(goalBonus > 0
          ? `Đã giao đủ đơn hôm qua: thưởng ${goalBonus.toLocaleString('vi-VN')}đ. Nghỉ ngơi và bắt đầu ngày mới!`
          : 'Đã ngủ một giấc thật ngon! 100% Năng lượng ⚡ - Nhớ vuốt ve bé mèo để lấy may mắn 🐾').setVisible(true);

        this.time.delayedCall(2200, () => {
          this.dayText.setVisible(false);
          this.sleepSubText.setVisible(false);

          this.tweens.add({
            targets: this.sleepOverlay,
            alpha: 0,
            duration: 800,
            onComplete: () => {
              this.sleepOverlay.setVisible(false);
              this.isSleeping = false;
              if (!this.maybeShowDayStory()) this.maybeLandladyVisit();
            }
          });
        });
      }
    });
  }

  /**
   * Lưu game tại bàn làm việc (Task 1.3)
   */
  private executeSaveDesk() {
    const city = this.scene.get('CityScene') as CityScene;
    const ok = SaveManager.getInstance().saveAtDesk(city.player.stats);
    if (ok) {
      SoundManager.getInstance().playSaveSuccess();
      this.game.events.emit('toast_notification', '💾 Đã lưu tiến trình vào LocalStorage thành công!');
    }
  }

  /**
   * Vuốt ve chú mèo mướp (Task 2.3: Pet System)
   */
  private executePetCat() {
    const city = this.scene.get('CityScene') as CityScene;
    const res = PetManager.getInstance().petCat(city.player);

    // Cập nhật text độ thân mật
    const aff = PetManager.getInstance().getAffection();
    const affLevel = PetManager.getInstance().getAffectionLevelName();
    this.catAffectionText.setText(`🐾 Mèo Mướp: ${aff}/100 (${affLevel})`);

    // Thả icon trái tim & sao lấp lánh bay lên
    const heart = this.add.text(ROOM_CONFIG.catPos.x, ROOM_CONFIG.catPos.y - 10, res.buffActivated ? '💖✨' : '💖', {
      fontSize: '20px'
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: heart,
      y: ROOM_CONFIG.catPos.y - 48,
      alpha: 0,
      duration: 1100,
      ease: 'Quad.easeOut',
      onComplete: () => heart.destroy()
    });

    this.game.events.emit('toast_notification', res.message);
  }

  /**
   * Cho mèo ăn pate cá ngừ (Task 2.3: Pet System)
   */
  private executeFeedCat() {
    const city = this.scene.get('CityScene') as CityScene;
    const res = PetManager.getInstance().feedCat(city.player);

    if (res.success) {
      const aff = PetManager.getInstance().getAffection();
      const affLevel = PetManager.getInstance().getAffectionLevelName();
      this.catAffectionText.setText(`🐾 Mèo Mướp: ${aff}/100 (${affLevel})`);

      // Thả icon cá & trái tim bay lên
      const fish = this.add.text(ROOM_CONFIG.bowlPos.x, ROOM_CONFIG.bowlPos.y - 8, '🐟💕', {
        fontSize: '18px'
      }).setOrigin(0.5).setDepth(200);

      this.tweens.add({
        targets: fish,
        y: ROOM_CONFIG.bowlPos.y - 45,
        alpha: 0,
        duration: 1200,
        ease: 'Quad.easeOut',
        onComplete: () => fish.destroy()
      });
    }

    this.game.events.emit('toast_notification', res.message);
  }

  /**
   * Pha và uống cà phê espresso tại máy pha cà phê mini (Task 2.5: Furniture)
   */
  private executeDrinkCoffee() {
    const city = this.scene.get('CityScene') as CityScene;
    const targetPlayer = city?.player ?? { stats: this.playerStats };
    const res = FurnitureManager.getInstance().drinkCoffee(targetPlayer);

    if (res.success) {
      // Hiệu ứng hơi nước & khói cafe bốc lên
      const steam = this.add.text(
        this.coffeeMakerPosition.x,
        this.coffeeMakerPosition.y - 8,
        '☕💨✨',
        { fontSize: '18px' }
      ).setOrigin(0.5).setDepth(200);

      this.tweens.add({
        targets: steam,
        y: ROOM_CONFIG.deskPos.y - 55,
        alpha: 0,
        duration: 1300,
        ease: 'Quad.easeOut',
        onComplete: () => steam.destroy()
      });
    }

    this.game.events.emit('toast_notification', res.message);
  }

  /**
   * Trở lại phố lớn tiếp tục ca giao hàng
   */
  private exitToStreet() {
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('RoomScene');
      const city = this.scene.get('CityScene') as CityScene;
      this.scene.wake('CityScene');
      city.cameras.main.fadeIn(400, 0, 0, 0);
      // Đặt vị trí shipper ở trước cổng khu trọ
      if (city.player) {
        city.player.setPosition(MAP_LOCATIONS.BOARDING_HOUSE.x, MAP_LOCATIONS.BOARDING_HOUSE.y + 32);
        city.player.currentDirection = 'down';
        city.player.setTexture('player_down');
      }
    });
  }
}
