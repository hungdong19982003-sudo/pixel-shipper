import Phaser from 'phaser';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  TILE_SIZE,
  MAP_LOCATIONS,
  CITY_LAYOUT, GAS_STATIONS, RESTAURANT_CATALOG, DISMOUNT_MAX_SPEED
} from '../config/GameConfig';
import {
  CITY_BLOCKS, CITY_BUILDINGS, CITY_DECORATIONS, CITY_SHOP_STYLES,
  isCityRoadTile
} from '../config/CityMap';
import { Player } from '../entities/Player';
import { Vehicle } from '../entities/Vehicle';
import { Hazard } from '../entities/Hazard';
import { HazardType, PlayerState, OrderStatus } from '../types';
import { IntegrityManager } from '../managers/IntegrityManager';
import { OrderManager } from '../managers/OrderManager';
import { VitalsManager } from '../managers/VitalsManager';
import { FuelManager } from '../managers/FuelManager';
import { TimeManager } from '../managers/TimeManager';
import { WeatherManager } from '../managers/WeatherManager';
import { VehicleShopManager } from '../managers/VehicleShopManager';
import { PopulationManager } from '../managers/PopulationManager';
import { SocialManager } from '../managers/SocialManager';
import { Npc } from '../entities/Npc';
import { UIScene } from './UIScene';
import { ConversationAction,RestaurantTemplate } from '../types';
import { SoundManager } from '../assets/SoundManager';

/**
 * CityScene - Mô phỏng Thế giới Phố phường Á Đông đương đại
 * Quản lý:
 * - Hệ thống Bản đồ đa lớp (Lòng đường nhựa vs Vỉa hè gạch đỏ vs Công viên cây xanh)
 * - Layer lòng đường cho phép xe máy chạy tốc độ cao, phân chia với vỉa hè đi bộ
 * - Hệ thống chướng ngại vật (HazardSystem: Ổ gà, Vũng nước trơn) & Độ nguyên vẹn món ăn
 * - Tương tác Nhận/Giao đơn hàng tại Quán phở và Chung cư xanh
 * - Tương tác Sinh tồn nhẹ: Trà đá vỉa hè, Xe bánh mì Patê & Căn phòng trọ (Task 1.1 & 1.2)
 * - Tương tác Nhiên liệu: Cây xăng Petrolimex (Task 1.4)
 * - Tương tác Mua sắm xe & nâng cấp phụ tùng (Task 2.4)
 * - Camera cuộn mượt mà theo nhân vật & điều chỉnh tầm nhìn linh hoạt
 */
export class CityScene extends Phaser.Scene {
  public player!: Player;
  public vehicle!: Vehicle;
  public population!:PopulationManager;
  public isTransitioning=false;

  // Nhóm va chạm vật lý
  public obstacles!: Phaser.Physics.Arcade.StaticGroup;
  public hazardsGroup!: Phaser.Physics.Arcade.StaticGroup;

  // Lưới ma trận phân định lòng đường (true = lòng đường, false = vỉa hè/nhà)
  private roadMatrix: boolean[][] = [];

  // Banner tương tác nổi
  private phoPromptContainer!: Phaser.GameObjects.Container;
  private phoPromptText!: Phaser.GameObjects.Text;
  private aptPromptContainer!: Phaser.GameObjects.Container;
  private aptPromptText!: Phaser.GameObjects.Text;
  private teaPromptContainer!: Phaser.GameObjects.Container;
  private banhMiPromptContainer!: Phaser.GameObjects.Container;
  private roomPromptContainer!: Phaser.GameObjects.Container;
  private gasPromptContainer!: Phaser.GameObjects.Container;
  private shopPromptContainer!: Phaser.GameObjects.Container;
  private fishingPromptContainer!: Phaser.GameObjects.Container;
  private targetRing!: Phaser.GameObjects.Image;

  // Day/Night & Weather Effects (Task 2.1 & 2.2)
  private ambientLightGfx!: Phaser.GameObjects.Graphics;
  private lampGlows: Phaser.GameObjects.Image[] = [];
  private rainDropsContainer!: Phaser.GameObjects.Container;
  private rainDrops: Phaser.GameObjects.Image[] = [];

  private interactKeyE!: Phaser.Input.Keyboard.Key;
  private lastInteractTime: number = 0;
  private startingNewGame = false;
  private startAtBoardingHouse = false;

  constructor() {
    super({ key: 'CityScene' });
  }

  init(data: { newGame?: boolean; startAtBoardingHouse?: boolean } = {}) {
    this.startingNewGame = Boolean(data.newGame);
    this.startAtBoardingHouse = Boolean(data.startAtBoardingHouse);
  }

  create() {
    this.isTransitioning=false;
    // 1. THIẾT LẬP GIỚI HẠN THẾ GIỚI & PHYSICS
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setRoundPixels(true);

    // 2. KHỞI TẠO MANAGERS LÕI
    IntegrityManager.getInstance().init(this);
    VitalsManager.getInstance().init(this);
    FuelManager.getInstance().init(this);
    TimeManager.getInstance().init(this);
    WeatherManager.getInstance().init(this);

    // 3. TẠO ANIMATIONS BƯỚC ĐI CHO SHIPPER
    this.createPlayerAnimations();

    // 4. KHỞI TẠO STATIC GROUP VA CHẠM & CHƯỚNG NGẠI VẬT
    this.obstacles = this.physics.add.staticGroup();
    this.hazardsGroup = this.physics.add.staticGroup();

    // 5. DỰNG BẢN ĐỒ THÀNH PHỐ Á ĐÔNG ĐA LỚP
    this.generateCityMap();

    // 6. ĐẶT CÁC CÔNG TRÌNH, NGÕ PHỐ, BIỂN BÁO & VẬT CẢN
    this.placeBuildingsAndProps();
    this.createFishingEntrance();

    // 7. TẠO NHÂN VẬT SHIPPER & XE MÁY ĐỖ
    this.spawnEntities(this.startAtBoardingHouse, this.startingNewGame);
    OrderManager.getInstance().init(this);
    this.population=new PopulationManager(this,this.player,this.obstacles);

    // 8. THIẾT LẬP CAMERA BÁM THEO NHÂN VẬT MƯỢT MÀ
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 9. TẠO PROMPT TƯƠNG TÁC TẠI QUÁN PHỞ & CHUNG CƯ
    this.createInteractionPrompts();

    // 10.1 KHỞI TẠO LỚP ÁNH SÁNG MÔI TRƯỜNG & HIỆU ỨNG THỜI TIẾT (TASK 2.1 & 2.2)
    this.createAmbientAndWeatherEffects();

    // 11. ĐĂNG KÝ PHÍM E
    if (this.input.keyboard) {
      this.interactKeyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    // 12. LẮNG NGHE SỰ KIỆN LÊN / XUỐNG XE ĐỂ ĐIỀU CHỈNH GÓC NHÌN
    this.events.on('player_mounted', () => {
      this.cameras.main.zoomTo(1.0, 400); // Tầm nhìn bao quát khi lái xe
    });

    this.events.on('player_dismounted', () => {
      this.cameras.main.zoomTo(1.1, 400); // Thu phóng ấm cúng khi đi bộ
    });

    // Rào chắn bảo vệ 4 mép thế giới
    this.addWorldPerimeterColliders();

    if (this.startAtBoardingHouse) {
      this.cameras.main.fadeOut(1, 0, 0, 0);
      this.time.delayedCall(0, () => {
        this.scene.sleep('CityScene');
        this.scene.launch('RoomScene', { playerStats: this.player.stats });
      });
    }
  }

  /**
   * Tạo các hoạt ảnh bước đi 4 hướng cho Shipper
   */
  private createPlayerAnimations() {
    if (this.anims.exists('walk_down')) return;

    this.anims.create({
      key: 'walk_down',
      frames: [
        { key: 'player_down_walk1' },
        { key: 'player_down' },
        { key: 'player_down_walk2' },
        { key: 'player_down' }
      ],
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'walk_up',
      frames: [
        { key: 'player_up_walk1' },
        { key: 'player_up' },
        { key: 'player_up_walk2' },
        { key: 'player_up' }
      ],
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'walk_right',
      frames: [
        { key: 'player_right_walk1' },
        { key: 'player_right' },
        { key: 'player_right_walk2' },
        { key: 'player_right' }
      ],
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'walk_left',
      frames: [
        { key: 'player_left_walk1' },
        { key: 'player_left' },
        { key: 'player_left_walk2' },
        { key: 'player_left' }
      ],
      frameRate: 8,
      repeat: -1
    });
  }

  /**
   * Sinh bản đồ thành phố Á Đông với sự phân tách:
   * - Lớp lòng đường (Road Layer): xe máy lưu thông tốc độ cao
   * - Lớp vỉa hè (Sidewalk Layer): lát gạch đỏ hoa văn, bó vỉa xám
   * - Lớp công viên (Park Zone): bãi cỏ xanh thư thái
   */
private generateCityMap() {
    const columns = WORLD_WIDTH / TILE_SIZE;
    const rows = WORLD_HEIGHT / TILE_SIZE;
    const data: number[][] = [];
    this.roadMatrix = [];
    for (let row = 0; row < rows; row++) {
      const tiles: number[] = [];
      const roadFlags: boolean[] = [];
      for (let column = 0; column < columns; column++) {
        const horizontal = CITY_LAYOUT.horizontalRoads.find((road) =>
          row >= road.tile && row < road.tile + road.lanes);
        const vertical = CITY_LAYOUT.verticalRoads.find((road) =>
          column >= road.tile && column < road.tile + road.lanes);
        roadFlags.push(Boolean(horizontal || vertical));
        let tile = 0;
        if (horizontal && vertical) tile = 1;
        else if (horizontal) {
          const crossing = CITY_LAYOUT.verticalRoads.some((road) =>
            column === road.tile - 1 || column === road.tile + road.lanes);
          tile = crossing ? 6 : row === horizontal.tile + Math.floor((horizontal.lanes - 1) / 2)
            ? horizontal.lanes === 2 ? 2 : 13 : 1;
        } else if (vertical) {
          const crossing = CITY_LAYOUT.horizontalRoads.some((road) =>
            row === road.tile - 1 || row === road.tile + road.lanes);
          tile = crossing ? 7 : column === vertical.tile + Math.floor((vertical.lanes - 1) / 2)
            ? vertical.lanes === 2 ? 3 : 14 : 1;
        } else {
          const x = column * TILE_SIZE + TILE_SIZE / 2;
          const y = row * TILE_SIZE + TILE_SIZE / 2;
          const park = CITY_BLOCKS.find((block) => block.isPark && x >= block.x &&
            x < block.x + block.width && y >= block.y && y < block.y + block.height);
          if (park) {
            const onPath = Math.abs(x - park.x - park.width / 2) <= TILE_SIZE / 2 ||
              Math.abs(y - park.y - park.height / 2) <= TILE_SIZE / 2;
            tile = onPath ? 12 : 4;
          } else if (isCityRoadTile(column, row + 1)) tile = 8;
          else if (isCityRoadTile(column, row - 1)) tile = 9;
          else if (isCityRoadTile(column + 1, row)) tile = 10;
          else if (isCityRoadTile(column - 1, row)) tile = 11;
          else tile = 5;
        }
        tiles.push(tile);
      }
      data.push(tiles);
      this.roadMatrix.push(roadFlags);
    }
    // A culled tile layer replaces thousands of individual ground images.
    const map = this.make.tilemap({ data, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = map.addTilesetImage('urban_tiles', 'urban_tiles', TILE_SIZE, TILE_SIZE, 0, 0);
    if (!tileset) throw new Error('Missing urban ground tileset');
    map.createLayer(0, tileset, 0, 0)!.setDepth(0);

    CITY_LAYOUT.horizontalRoads.forEach((road, roadIndex) => {
      for (let x = CITY_LAYOUT.hazardSpacing; x < WORLD_WIDTH - TILE_SIZE; x += CITY_LAYOUT.hazardSpacing) {
        const y = (road.tile + road.lanes / 2) * TILE_SIZE + (roadIndex % 2 ? 16 : -16);
        if (CITY_LAYOUT.verticalRoads.some((vertical) =>
          x >= (vertical.tile - 1) * TILE_SIZE && x <= (vertical.tile + vertical.lanes + 1) * TILE_SIZE)) continue;
        const type = (roadIndex + x / CITY_LAYOUT.hazardSpacing) % 3 === 0
          ? HazardType.OIL_SLICK : HazardType.POTHOLE;
        this.hazardsGroup.add(new Hazard(this, x, y, type));
      }
    });
  }

  private placeBuildingsAndProps() {
    this.lampGlows = [];
    CITY_BUILDINGS.forEach((building) => {
      const sprite = this.add.image(building.x, building.y, building.texture)
        .setOrigin(0.5, 1).setScale(building.scale).setDepth(building.y);
      this.addObstacle(building.x, building.y - building.footprintHeight / 2 - 8,
        building.footprintWidth, building.footprintHeight);
      if (building.label) {
        this.createLocationBadge(building.x, building.y - sprite.displayHeight - 14,
          building.label, building.color ?? '#d4c6a5');
      }
    });
    CITY_DECORATIONS.forEach((prop) => {
      this.add.image(prop.x, prop.y, prop.texture)
        .setOrigin(0.5, 1).setScale(prop.scale).setDepth(prop.y + 1);
      if (prop.solid) {
        this.addObstacle(prop.x, prop.y - prop.footprintHeight / 2,
          prop.footprintWidth, prop.footprintHeight);
      }
      if (prop.texture === 'urban_lamp') {
        const glow = this.add.image(prop.x, prop.y - 80, 'fx_lamp_glow')
          .setDepth(prop.y + 2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
        this.lampGlows.push(glow);
      }
    });

    this.targetRing = this.add.image(0, 0, 'fx_target_ring').setDepth(1).setVisible(false);
    this.tweens.add({
      targets: this.targetRing, scale: 1.15, alpha: 0.65,
      yoyo: true, repeat: -1, duration: 800
    });
  }

  /**
   * Tạo rào chắn vô hình ngăn người chơi đi ra ngoài mép bản đồ
   */
  private addWorldPerimeterColliders() {
    this.addObstacle(WORLD_WIDTH / 2, 4, WORLD_WIDTH, 8);
    this.addObstacle(WORLD_WIDTH / 2, WORLD_HEIGHT - 4, WORLD_WIDTH, 8);
    this.addObstacle(4, WORLD_HEIGHT / 2, 8, WORLD_HEIGHT);
    this.addObstacle(WORLD_WIDTH - 4, WORLD_HEIGHT / 2, 8, WORLD_HEIGHT);
  }

  /**
   * Tạo badge nhãn địa danh nổi phía trên toà nhà
   */
  private createLocationBadge(x: number, y: number, text: string, color: string) {
    const width = Math.max(110, text.length * 6 + 16);
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.85);
    bg.fillRoundedRect(x - width / 2, y - 10, width, 20, 6);
    bg.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.9);
    bg.strokeRoundedRect(x - width / 2, y - 10, width, 20, 6);
    bg.setDepth(9999);

    const txt = this.add.text(x, y, text, {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '10px',
      color: color
    }).setOrigin(0.5).setDepth(10000);

    this.tweens.add({
      targets: [bg, txt],
      y: '-=3',
      yoyo: true,
      repeat: -1,
      duration: 1200,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Tạo các Banner tương tác bấm [E] tại Quán Phở và Chung Cư
   */
  private createInteractionPrompts() {
    // 1. Banner tại Quán Phở Bò
    const phoPos = MAP_LOCATIONS.PHO_RESTAURANT;
    this.phoPromptContainer = this.add.container(phoPos.x, phoPos.y + 40);
    this.phoPromptContainer.setDepth(9999);

    const phoPromptBg = this.add.graphics();
    phoPromptBg.fillStyle(0x0f172a, 0.95);
    phoPromptBg.fillRoundedRect(-110, -14, 220, 28, 6);
    phoPromptBg.lineStyle(1.5, 0xef4444, 1);
    phoPromptBg.strokeRoundedRect(-110, -14, 220, 28, 6);

    this.phoPromptText = this.add.text(0, 0, '🍜 [E] LẤY MÓN ĂN', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '11px',
      color: '#facc15'
    }).setOrigin(0.5);

    this.phoPromptContainer.add([phoPromptBg, this.phoPromptText]);
    this.phoPromptContainer.setVisible(false);

    // 2. Banner tại Điểm giao khách
    const aptPos = MAP_LOCATIONS.APARTMENT;
    this.aptPromptContainer = this.add.container(aptPos.x, aptPos.y + 40);
    this.aptPromptContainer.setDepth(9999);

    const aptPromptBg = this.add.graphics();
    aptPromptBg.fillStyle(0x0f172a, 0.95);
    aptPromptBg.fillRoundedRect(-115, -14, 230, 28, 6);
    aptPromptBg.lineStyle(1.5, 0x10b981, 1);
    aptPromptBg.strokeRoundedRect(-115, -14, 230, 28, 6);

    this.aptPromptText = this.add.text(0, 0, '🏢 [E] BÀN GIAO CHO KHÁCH HÀNG', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '11px',
      color: '#34d399'
    }).setOrigin(0.5);

    this.aptPromptContainer.add([aptPromptBg, this.aptPromptText]);
    this.aptPromptContainer.setVisible(false);

    // 3. Banner tại Quán Trà Đá Vỉa Hè
    const teaPos = MAP_LOCATIONS.TEA_STALL;
    this.teaPromptContainer = this.add.container(teaPos.x, teaPos.y + 40);
    this.teaPromptContainer.setDepth(9999);

    const teaPromptBg = this.add.graphics();
    teaPromptBg.fillStyle(0x0f172a, 0.95);
    teaPromptBg.fillRoundedRect(-125, -14, 250, 28, 6);
    teaPromptBg.lineStyle(1.5, 0x0284c7, 1);
    teaPromptBg.strokeRoundedRect(-125, -14, 250, 28, 6);

    const teaPromptText = this.add.text(0, 0, '☕ [E] UỐNG TRÀ ĐÁ (3.000đ - +50 KHÁT)', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '11px',
      color: '#38bdf8'
    }).setOrigin(0.5);

    this.teaPromptContainer.add([teaPromptBg, teaPromptText]);
    this.teaPromptContainer.setVisible(false);

    // 4. Banner tại Xe Bánh Mì Patê
    const bmPos = MAP_LOCATIONS.BANH_MI_CART;
    this.banhMiPromptContainer = this.add.container(bmPos.x, bmPos.y + 40);
    this.banhMiPromptContainer.setDepth(9999);

    const bmPromptBg = this.add.graphics();
    bmPromptBg.fillStyle(0x0f172a, 0.95);
    bmPromptBg.fillRoundedRect(-125, -14, 250, 28, 6);
    bmPromptBg.lineStyle(1.5, 0xf97316, 1);
    bmPromptBg.strokeRoundedRect(-125, -14, 250, 28, 6);

    const bmPromptText = this.add.text(0, 0, '🥖 [E] BÁNH MÌ PATÊ (15.000đ - +45 ĐÓI)', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '11px',
      color: '#fed7aa'
    }).setOrigin(0.5);

    this.banhMiPromptContainer.add([bmPromptBg, bmPromptText]);
    this.banhMiPromptContainer.setVisible(false);

    // 5. Banner tại Cổng Phòng Trọ Số 7
    const roomPos = MAP_LOCATIONS.BOARDING_HOUSE;
    this.roomPromptContainer = this.add.container(roomPos.x, roomPos.y + 40);
    this.roomPromptContainer.setDepth(9999);

    const roomPromptBg = this.add.graphics();
    roomPromptBg.fillStyle(0x0f172a, 0.95);
    roomPromptBg.fillRoundedRect(-125, -14, 250, 28, 6);
    roomPromptBg.lineStyle(1.5, 0xeab308, 1);
    roomPromptBg.strokeRoundedRect(-125, -14, 250, 28, 6);

    const roomPromptText = this.add.text(0, 0, '🏠 [E] VÀO PHÒNG TRỌ (NGỦ & LƯU GAME)', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '11px',
      color: '#fde047'
    }).setOrigin(0.5);

    this.roomPromptContainer.add([roomPromptBg, roomPromptText]);
    this.roomPromptContainer.setVisible(false);

    // 6. Banner tại Cây Xăng Petrolimex (Task 1.4)
    const gasPos = MAP_LOCATIONS.GAS_STATION;
    this.gasPromptContainer = this.add.container(gasPos.x, gasPos.y + 40);
    this.gasPromptContainer.setDepth(9999);

    const gasPromptBg = this.add.graphics();
    gasPromptBg.fillStyle(0x0f172a, 0.95);
    gasPromptBg.fillRoundedRect(-125, -14, 250, 28, 6);
    gasPromptBg.lineStyle(1.5, 0x10b981, 1);
    gasPromptBg.strokeRoundedRect(-125, -14, 250, 28, 6);

    const gasPromptText = this.add.text(0, 0, '⛽ [E] BƠM ĐẦY BÌNH XĂNG (350đ/%)', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '11px',
      color: '#34d399'
    }).setOrigin(0.5);

    this.gasPromptContainer.add([gasPromptBg, gasPromptText]);
    this.gasPromptContainer.setVisible(false);

    // 7. Banner tại Cửa Hàng Xe Máy & Phụ Tùng (Task 2.4: Vehicle Shop)
    const shopPos = MAP_LOCATIONS.MOTORBIKE_SHOP;
    this.shopPromptContainer = this.add.container(shopPos.x, shopPos.y + 40);
    this.shopPromptContainer.setDepth(9999);

    const shopPromptBg = this.add.graphics();
    shopPromptBg.fillStyle(0x0f172a, 0.95);
    shopPromptBg.fillRoundedRect(-135, -14, 270, 28, 6);
    shopPromptBg.lineStyle(1.5, 0x06b6d4, 1);
    shopPromptBg.strokeRoundedRect(-135, -14, 270, 28, 6);

    const shopPromptText = this.add.text(0, 0, '🛵 [E] MUA XE MÁY & NÂNG CẤP GEAR', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '11px',
      color: '#67e8f9'
    }).setOrigin(0.5);

    this.shopPromptContainer.add([shopPromptBg, shopPromptText]);
    this.shopPromptContainer.setVisible(false);

    const fishingGate = MAP_LOCATIONS.FISHING_GATE;
    this.fishingPromptContainer = this.add.container(fishingGate.x, fishingGate.y - 42).setDepth(9999);
    const fishingPromptBg = this.add.graphics();
    fishingPromptBg.fillStyle(0x172821, 0.96).fillRoundedRect(-130, -15, 260, 30, 6);
    fishingPromptBg.lineStyle(1.5, 0x82c784, 1).strokeRoundedRect(-130, -15, 260, 30, 6);
    const fishingPromptText = this.add.text(0, 0, '🎣 [E] XUỐNG BẾN CÂU', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', color: '#d9f99d'
    }).setOrigin(0.5);
    this.fishingPromptContainer.add([fishingPromptBg, fishingPromptText]).setVisible(false);

    this.tweens.add({
      targets: [
        this.phoPromptContainer,
        this.aptPromptContainer,
        this.teaPromptContainer,
        this.banhMiPromptContainer,
        this.roomPromptContainer,
        this.gasPromptContainer,
        this.shopPromptContainer,
        this.fishingPromptContainer
      ],
      y: '-=4',
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Thêm một hình hộp chướng ngại vật va chạm tĩnh
   */
  public addObstacle(x: number, y: number, width: number, height: number) {
    const obstacle = this.add.zone(x, y, width, height);
    this.physics.add.existing(obstacle, true); // true = static body
    this.obstacles.add(obstacle);
  }

  /**
   * Kiểm tra tọa độ thế giới (x, y) có nằm trên lòng đường hay không
   */
  public isRoad(worldX: number, worldY: number): boolean {
    const col = Math.floor(worldX / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);
    if (row < 0 || row >= this.roadMatrix.length || col < 0 || col >= this.roadMatrix[0].length) {
      return false;
    }
    return this.roadMatrix[row][col];
  }

  /**
   * Spawn Shipper và Xe Máy Wave Alpha
   */
  private spawnEntities(startAtBoardingHouse = false, newGame = false) {
    // 1. KHỞI TẠO XE MÁY WAVE ALPHA TẠI VỊ TRÍ ĐỖ
    const bikePos = startAtBoardingHouse
      ? { x: MAP_LOCATIONS.BOARDING_HOUSE.x + 80, y: MAP_LOCATIONS.BOARDING_HOUSE.y + 32 }
      : MAP_LOCATIONS.BIKE_SPAWN;
    this.vehicle = new Vehicle(this, bikePos.x, bikePos.y);

    // 2. KHỞI TẠO NHÂN VẬT SHIPPER (MÁY TRẠNG THÁI ON_FOOT & MOUNTED)
    const spawnPos = startAtBoardingHouse
      ? MAP_LOCATIONS.BOARDING_HOUSE
      : MAP_LOCATIONS.SPAWN_POINT;
    this.player = new Player(this, spawnPos.x, spawnPos.y, { newGame });
    this.player.setVehicle(this.vehicle);

    // 3. KÍCH HOẠT VA CHẠM ARCADE VỚI CHƯỚNG NGẠI VẬT TĨNH
    this.physics.add.collider(this.player, this.obstacles, () => {
      // Nếu đang bị mất lái trượt xoay tròn mà đâm vào lề -> trừ 20% độ nguyên vẹn
      if (this.player.isSpinning) {
        IntegrityManager.getInstance().applyCrashDamage();
      }
    });

    // 4. KÍCH HOẠT VA CHẠM OVERLAP VỚI HAZARDS (Ổ GÀ & VŨNG NƯỚC TRƠN)
    this.physics.add.overlap(
      this.player,
      this.hazardsGroup,
      (_player, hazardObj) => {
        const hazard = hazardObj as Hazard;
        const now = this.time.now;

        if (hazard && hazard.canTrigger(now)) {
          hazard.trigger(now);

          if (hazard.hazardType === HazardType.POTHOLE) {
            const speed = this.player.getCurrentSpeed();
            const damping = VehicleShopManager.getInstance().getTotalCargoDamping(this.player);
            IntegrityManager.getInstance().applyPotholeHit(speed, damping);
          } else if (hazard.hazardType === HazardType.OIL_SLICK) {
            IntegrityManager.getInstance().applyOilSlickHit();
            this.player.triggerSpinOut();
          }
        }
      }
    );
  }

  override update(time: number, delta: number) {
    if (!this.player) return;
    if(this.isTransitioning) {this.player.setVelocity(0,0);return;}
    this.population.update(time);

    // Cập nhật chu kỳ ngày/đêm & thời tiết (Task 2.1 & 2.2)
    TimeManager.getInstance().update(delta);
    OrderManager.getInstance().update(delta);
    WeatherManager.getInstance().update(delta);

    // Cập nhật hiệu ứng ánh sáng Ngày/Đêm & Đèn đường phố & Mưa rơi
    this.updateAmbientAndWeather(delta);

    // Cập nhật di chuyển & máy trạng thái nhân vật
    this.player.update(time, delta);
    this.population.checkPlayerTrafficSignal(time);

    // XỬ LÝ PHÂN CHIA LAYER LÒNG ĐƯỜNG VS VỈA HÈ:
    // Khi đang lái xe máy (MOUNTED):
    // - Trên lòng đường: Lướt êm ái tốc độ cao (max 360 px/s)
    // - Trèo lên vỉa hè: Giảm tốc độ còn 35% do gờ bó vỉa và người đi bộ
    if (this.player.playerState === PlayerState.MOUNTED) {
      const onRoad = this.isRoad(this.player.x, this.player.y);
      if (!onRoad) {
        const currentSpeed = this.player.getCurrentSpeed();
        if (currentSpeed > 130) {
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          if (body) {
            body.velocity.x *= 0.94;
            body.velocity.y *= 0.94;
          }
        }
      }
    }

    // KIỂM TRA PHÍM E ĐỂ LẤY MÓN, GIAO HÀNG, UỐNG TRÀ ĐÁ, ĂN BÁNH MÌ HOẶC VÀO PHÒNG TRỌ / TIỆM XE
    const px = this.player.x;
    const py = this.player.y;

    const currentOrder = OrderManager.getInstance().getCurrentOrder();
    if (currentOrder) {
      if (currentOrder.status === OrderStatus.ACCEPTED) {
        this.phoPromptContainer.setPosition(currentOrder.restaurantPos.x, currentOrder.restaurantPos.y + 40);
        this.phoPromptText.setText(`🍜 [E] LẤY ${currentOrder.foodName.toUpperCase()}`);
        if (this.targetRing) {
          this.targetRing.setPosition(currentOrder.restaurantPos.x, currentOrder.restaurantPos.y + 20).setVisible(true);
        }
      } else if (currentOrder.status === OrderStatus.PICKED_UP) {
        this.aptPromptContainer.setPosition(currentOrder.customerPos.x, currentOrder.customerPos.y + 40);
        this.aptPromptText.setText(`🏢 [E] GIAO CHO ${currentOrder.customerName.toUpperCase()}`);
        if (this.targetRing) {
          this.targetRing.setPosition(currentOrder.customerPos.x, currentOrder.customerPos.y + 20).setVisible(true);
        }
      } else {
        if (this.targetRing) this.targetRing.setVisible(false);
      }
    } else {
      if (this.targetRing) this.targetRing.setVisible(false);
    }

    const nearbyShop=CITY_BUILDINGS.find(building=>building.kind==='shop'&&
      Phaser.Math.Distance.Between(px,py,building.x,building.y+CITY_LAYOUT.doorOffset)<75);
    const nearbyRestaurant=nearbyShop?this.getShopTemplate(nearbyShop):undefined;
    const nearbyNpc=this.population.nearbyNpc();
    const canPickup=Boolean(nearbyRestaurant);
    if(nearbyRestaurant) {
      this.phoPromptContainer.setPosition(nearbyRestaurant.pos.x,nearbyRestaurant.pos.y+40);
      this.phoPromptText.setText('[E] VÀO '+nearbyRestaurant.name.toUpperCase());
    }
    const canDeliver = OrderManager.getInstance().canDeliver(px, py);
    const nearbyApartment=CITY_BUILDINGS.find(building=>building.texture==='urban_apartment'&&
      Phaser.Math.Distance.Between(px,py,building.x,building.y+CITY_LAYOUT.doorOffset)<75);
    const apartmentDeliveryReady=Boolean(nearbyApartment&&currentOrder?.status===OrderStatus.PICKED_UP&&
      currentOrder.deliveryMode==='apartment'&&Phaser.Math.Distance.Between(
        nearbyApartment.x,nearbyApartment.y+CITY_LAYOUT.doorOffset,
        currentOrder.customerPos.x,currentOrder.customerPos.y)<90);
    const canDrinkTea = Phaser.Math.Distance.Between(px, py, MAP_LOCATIONS.TEA_STALL.x, MAP_LOCATIONS.TEA_STALL.y) < 65;
    const canEatBanhMi = Phaser.Math.Distance.Between(px, py, MAP_LOCATIONS.BANH_MI_CART.x, MAP_LOCATIONS.BANH_MI_CART.y) < 65;
    const canEnterRoom = Phaser.Math.Distance.Between(px, py, MAP_LOCATIONS.BOARDING_HOUSE.x, MAP_LOCATIONS.BOARDING_HOUSE.y) < 65;
    const nearbyGasStation = GAS_STATIONS.find((station) =>
      Phaser.Math.Distance.Between(px, py, station.x, station.y) < 75);
    const canRefuel = Boolean(nearbyGasStation);
    if (nearbyGasStation) this.gasPromptContainer.setPosition(nearbyGasStation.x, nearbyGasStation.y + 40);
    const canOpenShop = Phaser.Math.Distance.Between(px, py, MAP_LOCATIONS.MOTORBIKE_SHOP.x, MAP_LOCATIONS.MOTORBIKE_SHOP.y) < 70;
    const canEnterFishing = Phaser.Math.Distance.Between(px, py,
      MAP_LOCATIONS.FISHING_GATE.x, MAP_LOCATIONS.FISHING_GATE.y) < 76;

    this.phoPromptContainer.setVisible(canPickup);
    this.aptPromptContainer.setVisible(canDeliver||Boolean(nearbyApartment));
    if(nearbyApartment) {
      this.aptPromptContainer.setPosition(nearbyApartment.x,nearbyApartment.y+CITY_LAYOUT.doorOffset+40);
      this.aptPromptText.setText(apartmentDeliveryReady?'[E] VÀO CHUNG CƯ • GIAO TẬN CỬA':'[E] VÀO CHUNG CƯ');
    } else if(canDeliver&&currentOrder) {
      this.aptPromptContainer.setPosition(currentOrder.customerPos.x,currentOrder.customerPos.y+40);
      this.aptPromptText.setText(`[E] GIAO CHO ${currentOrder.customerName.toUpperCase()}`);
    }
    this.teaPromptContainer.setVisible(canDrinkTea);
    this.banhMiPromptContainer.setVisible(canEatBanhMi);
    this.roomPromptContainer.setVisible(canEnterRoom);
    this.gasPromptContainer.setVisible(canRefuel);
    this.shopPromptContainer.setVisible(canOpenShop);
    this.fishingPromptContainer.setVisible(canEnterFishing);

    const keyboardInteract = this.interactKeyE && Phaser.Input.Keyboard.JustDown(this.interactKeyE);
    const virtualInteract = this.player.consumeVirtualInteract();
    const isInteracting = keyboardInteract || virtualInteract;

    if (isInteracting) {
      if (time - this.lastInteractTime > 400) {
        this.lastInteractTime = time;

        if (canEnterFishing) {
          this.enterFishingMap();
        } else if (canOpenShop) {
          this.openVehicleShop();
        } else if (nearbyApartment) {
          this.enterApartment(nearbyApartment);
        } else if (nearbyRestaurant) {
          this.enterRestaurant(nearbyRestaurant);
        } else if (canDrinkTea) {
          const res = VitalsManager.getInstance().drinkTea(this.player);
          this.showFloatingText(
            MAP_LOCATIONS.TEA_STALL.x,
            MAP_LOCATIONS.TEA_STALL.y - 20,
            res.message,
            res.success ? '#38bdf8' : '#ef4444'
          );
        } else if (canEatBanhMi) {
          const res = VitalsManager.getInstance().eatBanhMi(this.player);
          this.showFloatingText(
            MAP_LOCATIONS.BANH_MI_CART.x,
            MAP_LOCATIONS.BANH_MI_CART.y - 20,
            res.message,
            res.success ? '#f97316' : '#ef4444'
          );
        } else if (canEnterRoom) {
          this.enterBoardingHouse();
        } else if (canRefuel) {
          const res = FuelManager.getInstance().refuel(this.player);
          this.showFloatingText(
            nearbyGasStation!.x,
            nearbyGasStation!.y - 20,
            res.message,
            res.success ? '#10b981' : '#ef4444'
          );
        } else if (nearbyNpc) {
          this.openNpcConversation(nearbyNpc);
        }
      }
    }
  }

  /**
   * Mở giao diện Cửa Hàng Xe Máy & Nâng Cấp Phụ Tùng (Task 2.4)
   */
  public openVehicleShop() {
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene && typeof uiScene.openPhoneToTab === 'function') {
      uiScene.openPhoneToTab('SHOP_BIKE');
    }
  }

  public enterRestaurant(restaurant:RestaurantTemplate) {
    if(this.isTransitioning) return;
    if(this.player.playerState===PlayerState.MOUNTED) {
      if(this.player.getCurrentSpeed()>DISMOUNT_MAX_SPEED) {
        this.game.events.emit('toast_notification','Giảm tốc rồi xuống xe để vào quán nhé.');
        return;
      }
      this.player.dismountVehicle();
    }
    this.isTransitioning=true;
    this.player.setVelocity(0,0);
    this.cameras.main.fadeOut(240,0,0,0);
    this.cameras.main.once('camerafadeoutcomplete',()=>{
      this.scene.sleep('CityScene');
      this.scene.launch('RestaurantScene',{restaurant});
    });
  }

  private createFishingEntrance() {
    const gate = MAP_LOCATIONS.FISHING_GATE;
    const path = this.add.graphics().setDepth(gate.y - 2);
    path.fillStyle(0xb79a67, 1);
    for (let index = 0; index < 7; index++) {
      const stepY = gate.y - 78 + index * 22;
      const stepX = gate.x + (index % 2 === 0 ? -4 : 4);
      path.fillRect(stepX - 18, stepY, 36, 12);
      path.fillStyle(index % 2 === 0 ? 0xc7aa75 : 0xa98c5d, 1);
    }
    const sign = this.add.graphics().setDepth(gate.y + 4);
    sign.fillStyle(0x72513a, 1).fillRect(gate.x + 48, gate.y - 28, 5, 42);
    sign.fillStyle(0x315c46, 1).fillRoundedRect(gate.x + 24, gate.y - 48, 54, 27, 3);
    sign.lineStyle(2, 0xd7c28a, 1).strokeRoundedRect(gate.x + 24, gate.y - 48, 54, 27, 3);
    this.add.text(gate.x + 51, gate.y - 35, 'BẾN CÂU ↓', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '8px', color: '#f2e7c4'
    }).setOrigin(0.5).setDepth(gate.y + 5);
  }

  private enterFishingMap() {
    if (this.isTransitioning) return;
    if (this.player.playerState === PlayerState.MOUNTED) {
      if (this.player.getCurrentSpeed() > DISMOUNT_MAX_SPEED) {
        this.game.events.emit('toast_notification', 'Dừng xe rồi hãy xuống bến câu nhé.');
        return;
      }
      this.player.dismountVehicle();
    }
    this.isTransitioning = true;
    this.player.setVelocity(0, 0);
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.sleep('CityScene');
      this.scene.launch('FishingScene', { playerStats: this.player.stats });
    });
  }

  public exitFishingMap() {
    this.scene.stop('FishingScene');
    this.scene.wake('CityScene');
    this.player.body!.reset(MAP_LOCATIONS.FISHING_GATE.x, MAP_LOCATIONS.FISHING_GATE.y - 34);
    this.player.setVelocity(0, 0);
    this.player.currentDirection = 'up';
    this.player.setTexture('player_up');
    this.isTransitioning = false;
    this.input.keyboard?.resetKeys();
    this.cameras.main.fadeIn(260, 0, 0, 0);
  }

  private getShopTemplate(building:typeof CITY_BUILDINGS[number]):RestaurantTemplate {
    const matched=RESTAURANT_CATALOG.find((restaurant)=>restaurant.textureKey===building.texture);
    const fallback=matched??RESTAURANT_CATALOG[CITY_BUILDINGS.indexOf(building)%RESTAURANT_CATALOG.length];
    const style=CITY_SHOP_STYLES.find((item)=>building.texture==='urban_shop_'+item.id);
    const shopName=building.label??(style?style.sign+' • Cửa hàng phố':'Cửa hàng phố');
    return {...fallback,name:shopName,textureKey:building.texture,
      pos:{x:building.x,y:building.y+CITY_LAYOUT.doorOffset}};
  }

  private enterApartment(building:typeof CITY_BUILDINGS[number]) {
    if(this.isTransitioning) return;
    if(this.player.playerState===PlayerState.MOUNTED) {
      if(this.player.getCurrentSpeed()>DISMOUNT_MAX_SPEED) {
        this.game.events.emit('toast_notification','Dừng xe trước khi vào chung cư nhé.');
        return;
      }
      this.player.dismountVehicle();
    }
    const entrance={x:building.x,y:building.y+CITY_LAYOUT.doorOffset};
    this.isTransitioning=true;
    this.player.setVelocity(0,0);
    this.cameras.main.fadeOut(240,0,0,0);
    this.cameras.main.once('camerafadeoutcomplete',()=>{
      this.scene.sleep('CityScene');
      this.scene.launch('ApartmentScene',{entrance});
    });
  }

  public exitApartment(entrance:{x:number;y:number}) {
    this.scene.stop('ApartmentScene');
    this.scene.wake('CityScene');
    this.player.body!.reset(entrance.x,entrance.y);
    this.player.anims.stop();this.player.setTexture('player_down');
    this.player.currentDirection='down';
    this.input.keyboard?.resetKeys();
    this.isTransitioning=false;
    this.cameras.main.fadeIn(220,0,0,0);
  }

  public openNpcConversation(npc:Npc,message?:string) {
    const order=OrderManager.getInstance().getCurrentOrder();
    if(npc.definition.role==='customer'&&order?.status===OrderStatus.PICKED_UP&&
      npc.definition.name===order.customerName&&!npc.ready) {
      this.game.events.emit('toast_notification','Khách đang xuống lấy món. Chờ một chút nhé!');
      return;
    }
    if(this.player.playerState===PlayerState.MOUNTED) {
      if(this.player.getCurrentSpeed()>DISMOUNT_MAX_SPEED) {
        this.game.events.emit('toast_notification','Dừng xe trước khi nói chuyện nhé.');return;
      }
      this.player.dismountVehicle();
    }
    const ui=this.scene.get('UIScene') as UIScene;
    const social=SocialManager.getInstance();
    const dog=npc.definition.role==='dog';
    const actions:ConversationAction[]=[{
      id:'talk',label:dog?'Vuốt ve '+npc.definition.name:'Hỏi thăm '+npc.definition.name,run:()=>{
        const result=social.talk(this.player.stats,npc.definition.id);
        if(dog) SoundManager.getInstance().playDogBark();
        this.openNpcConversation(npc,dog
          ? result.gained?npc.definition.name+' vẫy đuôi, dụi vào chân bạn. +4 thiện cảm!':
            npc.definition.name+' đang rất vui vì bạn đã ghé hôm nay.'
          :result.message);
      }
    }];
    if(npc.definition.role==='customer'&&order?.status===OrderStatus.PICKED_UP&&order.customerName===npc.definition.name) {
      actions.push({id:'deliver',label:'Giao '+order.foodName,disabled:!npc.ready,run:()=>{
        ui.closeConversation();
        OrderManager.getInstance().deliverOrder(npc.definition.name);
      }});
    }
    ui.showConversation({
      name:npc.definition.name,role:dog?'Chó trong khu phố':npc.definition.role==='customer'?'Khách nhận hàng':'Người dân trong phố',
      texture:npc.texture.key,affection:social.get(this.player.stats,npc.definition.id).affection,
      message:message??(dog?'Một người bạn bốn chân đang tò mò nhìn bạn.':
        npc.definition.role==='customer'&&order?.status===OrderStatus.PICKED_UP&&order.customerName===npc.definition.name
          ?'Cảm ơn bạn đã mang món tới. Mình xuống lấy rồi, bạn giao cho mình nhé!':
          'Chào bạn! Phố hôm nay đông vui quá. Chạy xe nhớ để ý người qua đường nhé.'),
      actions
    });
  }

  /**
   * Hiệu ứng chữ nổi bay lên rồi tan mờ (Floating Text)
   */
  public showFloatingText(x: number, y: number, text: string, color: string = '#ffffff') {
    const floatText = this.add.text(x, y, text, {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: color,
      stroke: '#0f172a',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(10000);

    this.tweens.add({
      targets: floatText,
      y: y - 38,
      alpha: 0,
      duration: 1400,
      ease: 'Quad.easeOut',
      onComplete: () => floatText.destroy()
    });
  }

  /**
   * Khởi tạo lớp phủ ánh sáng môi trường và hệ thống hạt mưa rơi (Task 2.1 & Task 2.2)
   */
  private createAmbientAndWeatherEffects() {
    // 1. Lớp phủ ánh sáng Ngày / Hoàng hôn / Đêm
    this.ambientLightGfx = this.add.graphics().setScrollFactor(0).setDepth(9995);

    // 2. Hệ thống hạt mưa pixel (Rain Overlay)
    this.rainDropsContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(9996);
    this.rainDrops = [];
    for (let i = 0; i < 70; i++) {
      const drop = this.add.image(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        'fx_raindrop'
      );
      drop.setVisible(false);
      this.rainDropsContainer.add(drop);
      this.rainDrops.push(drop);
    }
  }

  /**
   * Cập nhật màu sắc ánh sáng môi trường Ngày/Đêm, đèn đường & chuyển động hạt mưa
   */
  private updateAmbientAndWeather(delta: number) {
    const amb = TimeManager.getInstance().getAmbientData();

    // 1. Vẽ ambient tint theo chu kỳ ngày đêm
    this.ambientLightGfx.clear();
    if (amb.alpha > 0) {
      this.ambientLightGfx.fillStyle(amb.color, amb.alpha);
      this.ambientLightGfx.fillRect(0, 0, this.scale.width, this.scale.height);
    }

    // 2. Bật đèn đường khi hoàng hôn hoặc đêm phố thị
    const targetLampAlpha = amb.isNight ? 0.85 : amb.period === 'SUNSET' ? 0.45 : 0;
    this.lampGlows.forEach((glow) => {
      glow.setAlpha(targetLampAlpha);
    });

    // 3. Hiệu ứng hạt mưa rơi chéo màn hình khi trời mưa
    const isRaining = WeatherManager.getInstance().isRaining();
    if (isRaining) {
      const dt = delta / 1000;
      this.rainDrops.forEach((drop) => {
        drop.setVisible(true);
        drop.y += 580 * dt;
        drop.x -= 120 * dt;
        if (drop.y > this.scale.height) {
          drop.y = -10;
          drop.x = Phaser.Math.Between(0, this.scale.width + 120);
        }
      });
    } else {
      this.rainDrops.forEach((drop) => drop.setVisible(false));
    }
  }

  /**
   * Chuyển cảnh vào Căn phòng trọ ấm cúng (Task 1.2)
   */
  private enterBoardingHouse() {
    if (this.player.playerState === PlayerState.MOUNTED) {
      this.player.dismountVehicle();
    }
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.sleep('CityScene');
      this.scene.launch('RoomScene', { playerStats: this.player.stats });
    });
  }
}
