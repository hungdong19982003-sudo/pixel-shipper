import Phaser from 'phaser';
import { PlayerState, PlayerStats } from '../types';
import {
  PLAYER_ON_FOOT_SPEED,
  DISMOUNT_MAX_SPEED,
  FUEL_CONFIG
} from '../config/GameConfig';
import { Vehicle } from './Vehicle';
import { SoundManager } from '../assets/SoundManager';
import { SaveManager } from '../managers/SaveManager';
import { VitalsManager } from '../managers/VitalsManager';
import { FuelManager } from '../managers/FuelManager';
import { TimeManager } from '../managers/TimeManager';
import { WeatherManager } from '../managers/WeatherManager';
import { VehicleShopManager } from '../managers/VehicleShopManager';

/**
 * Thực thể Người chơi (Player) & Máy trạng thái (State Machine)
 * Hỗ trợ 2 trạng thái: ON_FOOT (Đi bộ) và MOUNTED (Lái xe máy Wave Alpha)
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  public playerState: PlayerState = PlayerState.ON_FOOT;
  public currentDirection: 'down' | 'up' | 'left' | 'right' = 'down';
  public vehicle?: Vehicle;
  public stats: PlayerStats;
  public isSpinning: boolean = false;
  private headlightImage?: Phaser.GameObjects.Image;

  // Hỗ trợ nút điều khiển cảm ứng ảo (Virtual D-Pad & Touch Buttons - Task 2.6)
  public virtualInput = {
    left: false,
    right: false,
    up: false,
    down: false,
    e: false,
    f: false,
    horn: false
  };

  // Quản lý phím bấm
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private vehicleKeyF!: Phaser.Input.Keyboard.Key;
  private hornKey!: Phaser.Input.Keyboard.Key;

  // Bộ đệm tránh nhấn liên tục phím tương tác
  private lastInteractTime: number = 0;
  private lastSkidTime: number = 0;
  private lastSmokeTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, options: { newGame?: boolean } = {}) {
    super(scene, x, y, 'player_down');

    // Thêm vào Scene và kích hoạt Arcade Physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setOnFootHitbox();

    // Khởi tạo chỉ số ban đầu của Shipper (hoặc khôi phục từ SaveGame nếu có)
    const saved = options.newGame ? null : SaveManager.getInstance().loadGame();
    if (saved) {
      this.stats = {
        wallet: saved.wallet,
        rating: saved.rating,
        completedOrders: saved.completedOrders,
        day: saved.day,
        hunger: saved.hunger,
        thirst: saved.thirst,
        energy: saved.energy,
        fuel: saved.fuel ?? 100,
        catAffection: saved.catAffection ?? 30,
        hasPetToday: saved.hasPetToday ?? false,
        hasFedToday: saved.hasFedToday ?? false,
        luckyBuffActive: saved.luckyBuffActive ?? false,
        currentVehicleId: saved.currentVehicleId ?? 'wave_alpha',
        ownedVehicleIds: saved.ownedVehicleIds ?? ['wave_alpha'],
        thermalBagLevel: saved.thermalBagLevel ?? 1,
        phoneMountLevel: saved.phoneMountLevel ?? 1,
        ownedFurnitureIds: saved.ownedFurnitureIds ?? [],
        relationships: saved.relationships ?? {},
        inventory: saved.inventory ?? [],
        furniturePlacements: saved.furniturePlacements ?? [],
        trafficViolations: saved.trafficViolations ?? 0,
        fishRequestCompletedDay: saved.fishRequestCompletedDay ?? 0,
        storyProgress: saved.storyProgress ?? {
          introSeen: true,
          landladyVisitCount: 0,
          lastLandladyVisitDay: Math.max(-2, (saved.day ?? 1) - 2),
          lastRentDay: Math.max(0, Math.floor(((saved.day ?? 1) - 1) / 7) * 7),
          rentDebt: 0,
          lastStoryDay: saved.day ?? 1,
          dayStartOrders: saved.completedOrders,
          lastRewardedDay: 0,
          firstWeekCompleted: (saved.day ?? 1) > 7
        }
      };
    } else {
      this.stats = {
        wallet: options.newGame ? 35000 : 1500000,
        rating: 5.0,
        completedOrders: 0,
        day: 1,
        hunger: options.newGame ? 72 : 100,
        thirst: options.newGame ? 68 : 100,
        energy: options.newGame ? 85 : 100,
        fuel: 100,
        catAffection: 30,
        hasPetToday: false,
        hasFedToday: false,
        luckyBuffActive: false,
        currentVehicleId: 'wave_alpha',
        ownedVehicleIds: ['wave_alpha'],
        thermalBagLevel: 1,
        phoneMountLevel: 1,
        ownedFurnitureIds: [],
        relationships: {},
        inventory: [],
        furniturePlacements: [],
        trafficViolations: 0,
        fishRequestCompletedDay: 0,
        storyProgress: {
          introSeen: true, landladyVisitCount: 0, lastLandladyVisitDay: -2, lastRentDay: 0,
          rentDebt: 0, lastStoryDay: 0, dayStartOrders: 0, lastRewardedDay: 0,
          firstWeekCompleted: false
        }
      };
    }

    // Đèn pha xe máy ban đêm
    this.headlightImage = scene.add.image(x, y, 'fx_headlight');
    this.headlightImage.setOrigin(0.06, 0.5);
    this.headlightImage.setDepth(9990);
    this.headlightImage.setVisible(false);

    // Thiết lập phím điều khiển
    this.setupInput();
  }

  /**
   * Thiết lập phím bấm
   */
  private setupInput() {
    if (!this.scene.input.keyboard) return;

    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasdKeys = {
      W: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.vehicleKeyF = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.hornKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
  }

  /**
   * Gán hitbox khi đi bộ (nhỏ gọn ở chân)
   */
  private setOnFootHitbox() {
    this.setSize(16, 12);
    this.setOffset(8, 26);
  }

  /**
   * Gán hitbox khi lái xe máy (rộng hơn bao trùm khung xe)
   */
  private setMountedHitbox() {
    this.setSize(26, 20);
    this.setOffset(7, 18);
  }

  /**
   * Gán phương tiện xe máy cho người chơi
   */
  public setVehicle(vehicle: Vehicle) {
    this.vehicle = vehicle;
    if (this.stats?.currentVehicleId) {
      const cfg = VehicleShopManager.getInstance().getVehicleById(this.stats.currentVehicleId);
      if (cfg) {
        this.vehicle.config = cfg;
      }
    }
  }

  /**
   * Lấy vận tốc hiện tại (px/s)
   */
  public getCurrentSpeed(): number {
    return this.body ? this.body.velocity.length() : 0;
  }

  /**
   * Trèo lên xe máy
   */
  public mountVehicle() {
    if (!this.vehicle) return;

    this.playerState = PlayerState.MOUNTED;
    this.vehicle.mount();
    this.setMountedHitbox();

    // Khởi động âm thanh nổ máy xe Wave Alpha
    SoundManager.getInstance().startEngine();
    SoundManager.getInstance().playClick();

    // Chuyển texture sang Shipper lái xe
    this.anims.stop();
    this.setTexture(`player_bike_${this.currentDirection}`);

    // Hiệu ứng nhún xe khi trèo lên
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.9,
      yoyo: true,
      duration: 100,
      ease: 'Quad.easeInOut'
    });

    // Phát âm thanh hoặc phát sự kiện cho UI
    this.scene.events.emit('player_mounted');
  }

  /**
   * Xuống xe máy
   */
  public dismountVehicle() {
    if (!this.vehicle) return;

    this.playerState = PlayerState.ON_FOOT;
    this.setVelocity(0, 0);
    this.setOnFootHitbox();

    // Dừng âm thanh nổ máy xe
    SoundManager.getInstance().stopEngine();
    SoundManager.getInstance().playClick();

    // Đặt xe máy ngay cạnh người chơi theo hướng quay mặt
    let bikeOffsetX = 0;
    let bikeOffsetY = 0;
    if (this.currentDirection === 'down') bikeOffsetY = -20;
    else if (this.currentDirection === 'up') bikeOffsetY = 20;
    else if (this.currentDirection === 'left') bikeOffsetX = 22;
    else if (this.currentDirection === 'right') bikeOffsetX = -22;

    this.vehicle.dismount(this.x + bikeOffsetX, this.y + bikeOffsetY, this.currentDirection);

    // Tắt đèn pha khi xuống xe
    if (this.headlightImage) {
      this.headlightImage.setVisible(false);
    }

    // Chuyển lại texture shipper đi bộ
    this.anims.stop();
    this.setTexture(`player_${this.currentDirection}`);

    this.scene.events.emit('player_dismounted');
  }


  /**
   * Tiêu thụ một lần kích hoạt nút ảo tương tác [E]
   */
  public consumeVirtualInteract(): boolean {
    if (this.virtualInput.e) {
      this.virtualInput.e = false;
      return true;
    }
    return false;
  }

  public tryToggleVehicle(time: number): boolean {
    if (time - this.lastInteractTime <= 300) return false;
    if (this.playerState === PlayerState.ON_FOOT && this.vehicle?.canMount(this.x, this.y)) {
      this.lastInteractTime = time;
      this.mountVehicle();
      return true;
    }
    if (this.playerState === PlayerState.MOUNTED && this.getCurrentSpeed() <= DISMOUNT_MAX_SPEED) {
      this.lastInteractTime = time;
      this.dismountVehicle();
      return true;
    }
    return false;
  }

  /**
   * Vòng lặp cập nhật trạng thái người chơi mỗi frame
   */
  public update(time: number, delta: number) {
    if (!this.body) return;

    const dt = delta / 1000;

    // F controls mounting/dismounting; E remains dedicated to nearby interactions.
    const vehiclePressed = Phaser.Input.Keyboard.JustDown(this.vehicleKeyF) || this.virtualInput.f;
    this.virtualInput.f = false;
    if (vehiclePressed && this.tryToggleVehicle(time)) return;

    // 2. CẬP NHẬT GỢI Ý XE MÁY KHI ĐI BỘ
    if (this.vehicle) {
      this.vehicle.update(this.x, this.y, this.playerState === PlayerState.MOUNTED);
    }

    // 3. TIÊU HAO CHỈ SỐ SINH TỒN NHẸ (VITALS) THEO THỜI GIAN THỰC
    VitalsManager.getInstance().update(delta, this, this.playerState === PlayerState.MOUNTED);

    // 4. XỬ LÝ CHUYỂN ĐỘNG THEO TỪNG MÁY TRẠNG THÁI
    if (this.playerState === PlayerState.ON_FOOT) {
      this.updateOnFoot(dt);
    } else {
      this.updateMounted(time, dt);
    }

    // 5. LUÔN CẬP NHẬT DEPTH THEO TRỤC Y ĐỂ SORTING CHUẨN XÁC
    this.setDepth(this.y + 10);
  }

  /**
   * Cập nhật chuyển động khi ĐI BỘ (ON_FOOT)
   */
  private updateOnFoot(_dt: number) {
    const left = this.cursors?.left?.isDown || this.wasdKeys?.A?.isDown || this.virtualInput.left;
    const right = this.cursors?.right?.isDown || this.wasdKeys?.D?.isDown || this.virtualInput.right;
    const up = this.cursors?.up?.isDown || this.wasdKeys?.W?.isDown || this.virtualInput.up;
    const down = this.cursors?.down?.isDown || this.wasdKeys?.S?.isDown || this.virtualInput.down;

    const speedMult = VitalsManager.getInstance().getSpeedMultiplier(this);
    const speed = PLAYER_ON_FOOT_SPEED * speedMult;

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

    this.setVelocity(vx, vy);

    if (vx < 0) {
      this.currentDirection = 'left';
      this.anims.play('walk_left', true);
    } else if (vx > 0) {
      this.currentDirection = 'right';
      this.anims.play('walk_right', true);
    } else if (vy < 0) {
      this.currentDirection = 'up';
      this.anims.play('walk_up', true);
    } else if (vy > 0) {
      this.currentDirection = 'down';
      this.anims.play('walk_down', true);
    } else {
      this.anims.stop();
      this.setTexture(`player_${this.currentDirection}`);
    }
  }

  /**
   * Kích hoạt hiệu ứng mất lái trượt xoay tròn xe khi dính vũng dầu / nước trơn
   */
  public triggerSpinOut(durationMs: number = 1200) {
    if (this.isSpinning) return;
    this.isSpinning = true;

    // Hiệu ứng xoay tròn xe 720 độ
    this.scene.tweens.add({
      targets: this,
      angle: 720,
      duration: durationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.angle = 0;
        this.isSpinning = false;
      }
    });

    // Thả vệt lết bánh liên tục
    this.emitSkidMark();
  }

  /**
   * Cập nhật chuyển động khi LÁI XE MÁY (MOUNTED)
   * Tích hợp: Gia tốc tăng tốc, quán tính giảm tốc, trượt drift và tạo hiệu ứng vệt bánh xe / khói pô
   */
  private updateMounted(time: number, dt: number) {
    if (!this.vehicle || !this.body) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const config = this.vehicle.config;

    // Nếu đang bị mất lái trượt xoay tròn -> Giảm dần quán tính, vô hiệu hóa tay lái
    if (this.isSpinning) {
      body.velocity.x *= 0.96;
      body.velocity.y *= 0.96;
      if (time - this.lastSkidTime > 150) {
        this.lastSkidTime = time;
        this.emitSkidMark();
      }
      return;
    }

    const left = this.cursors?.left?.isDown || this.wasdKeys?.A?.isDown || this.virtualInput.left;
    const right = this.cursors?.right?.isDown || this.wasdKeys?.D?.isDown || this.virtualInput.right;
    const up = this.cursors?.up?.isDown || this.wasdKeys?.W?.isDown || this.virtualInput.up;
    const down = this.cursors?.down?.isDown || this.wasdKeys?.S?.isDown || this.virtualInput.down;

    // Vector điều hướng từ bàn phím hoặc touch dpad
    let inputX = 0;
    let inputY = 0;
    if (left) inputX -= 1;
    if (right) inputX += 1;
    if (up) inputY -= 1;
    if (down) inputY += 1;

    const hasInput = inputX !== 0 || inputY !== 0;
    // Bấm phím H hoặc nút còi ảo để bấm còi bim bim
    if ((this.hornKey && Phaser.Input.Keyboard.JustDown(this.hornKey)) || this.virtualInput.horn) {
      SoundManager.getInstance().playHorn();
      this.virtualInput.horn = false;
    }

    const currentVx = body.velocity.x;
    const currentVy = body.velocity.y;
    const currentSpeed = Math.sqrt(currentVx * currentVx + currentVy * currentVy);

    // Tiêu hao nhiên liệu (Fuel) theo thời gian thực (Task 1.4)
    FuelManager.getInstance().consumeFuel(dt * 1000, currentSpeed, this);
    const isOutOfFuel = FuelManager.getInstance().isOutOfFuel(this);

    // Điều chế tần số âm thanh động cơ theo tốc độ thực tế (nếu hết xăng thì nổ lụp bụp rất nhỏ)
    SoundManager.getInstance().updateEngineSpeed(isOutOfFuel ? 0.05 : currentSpeed / config.maxSpeed);

    if (hasInput) {
      // Chuẩn hóa vector điều hướng
      const inputLength = Math.sqrt(inputX * inputX + inputY * inputY);
      const normInputX = inputX / inputLength;
      const normInputY = inputY / inputLength;

      // Vận tốc mục tiêu tối đa (kèm hệ số suy nhược thể lực và hết xăng)
      const vitalsSpeedMult = VitalsManager.getInstance().getSpeedMultiplier(this);
      const effectiveMaxSpeed = isOutOfFuel
        ? FUEL_CONFIG.outOfFuelSpeed
        : config.maxSpeed * vitalsSpeedMult;

      const targetVx = normInputX * effectiveMaxSpeed;
      const targetVy = normInputY * effectiveMaxSpeed;

      // Độ bám đường mặt đường & văng đuôi trượt bánh khi trời mưa (Task 2.2)
      const traction = WeatherManager.getInstance().getTractionMultiplier();
      const driftMult = WeatherManager.getInstance().getDriftMultiplier();

      // Gia tốc mượt mà
      const accelRate = (isOutOfFuel ? config.acceleration * 0.3 : config.acceleration * traction) * dt;
      const newVx = Phaser.Math.Linear(currentVx, targetVx, Math.min(1, accelRate / effectiveMaxSpeed));
      const newVy = Phaser.Math.Linear(currentVy, targetVy, Math.min(1, accelRate / effectiveMaxSpeed));

      this.setVelocity(newVx, newVy);

      // Cập nhật hướng quay mặt theo hướng di chuyển chủ đạo
      if (Math.abs(newVx) > Math.abs(newVy)) {
        this.currentDirection = newVx > 0 ? 'right' : 'left';
      } else if (Math.abs(newVy) > 5) {
        this.currentDirection = newVy > 0 ? 'down' : 'up';
      }

      this.setTexture(`player_bike_${this.currentDirection}`);

      // CẬP NHẬT ĐÈN PHA XE MÁY BAN ĐÊM (TASK 2.1)
      const isNight = TimeManager.getInstance().getAmbientData().isNight;
      if (this.headlightImage) {
        if (isNight) {
          let offsetX = 0;
          let offsetY = 0;
          let angle = 0;
          if (this.currentDirection === 'right') {
            offsetX = 18;
            offsetY = 4;
            angle = 0;
          } else if (this.currentDirection === 'left') {
            offsetX = -18;
            offsetY = 4;
            angle = 180;
          } else if (this.currentDirection === 'down') {
            offsetX = 0;
            offsetY = 22;
            angle = 90;
          } else if (this.currentDirection === 'up') {
            offsetX = 0;
            offsetY = -22;
            angle = -90;
          }
          this.headlightImage.setPosition(this.x + offsetX, this.y + offsetY).setAngle(angle).setVisible(true);
        } else {
          this.headlightImage.setVisible(false);
        }
      }

      // HIỆU ỨNG KHÓI PÔ XE MÁY KHI TĂNG GA
      if (currentSpeed > 60 && time - this.lastSmokeTime > 150) {
        this.lastSmokeTime = time;
        this.emitExhaustSmoke();
      }

      // HIỆU ỨNG TRƯỢT PHANH / SKID MARK KHI PHANH HOẶC CUA GẤP Ở TỐC ĐỘ CAO (DỄ TRƯỢT HƠN KHI MƯA)
      const dotProduct = normInputX * currentVx + normInputY * currentVy;
      const skidThreshold = 220 * traction;
      const isHardBrakingOrTurning = dotProduct < -80 || (currentSpeed > skidThreshold && dotProduct < 0.4 * currentSpeed);

      if (isHardBrakingOrTurning && time - this.lastSkidTime > (120 / driftMult)) {
        this.lastSkidTime = time;
        this.emitSkidMark();
      }
    } else {
      // Khi nhả ga -> Quán tính giảm tốc mượt mà (trời mưa thì trượt dài hơn do ma sát giảm)
      const traction = WeatherManager.getInstance().getTractionMultiplier();
      const decelRate = config.deceleration * traction * dt;
      if (currentSpeed > 5) {
        const factor = Math.max(0, (currentSpeed - decelRate) / currentSpeed);
        this.setVelocity(currentVx * factor, currentVy * factor);
      } else {
        this.setVelocity(0, 0);
      }

      this.setTexture(`player_bike_${this.currentDirection}`);

      // Cập nhật vị trí đèn pha khi dừng xe
      const isNight = TimeManager.getInstance().getAmbientData().isNight;
      if (this.headlightImage) {
        if (isNight) {
          let offsetX = 0;
          let offsetY = 0;
          let angle = 0;
          if (this.currentDirection === 'right') {
            offsetX = 18;
            offsetY = 4;
            angle = 0;
          } else if (this.currentDirection === 'left') {
            offsetX = -18;
            offsetY = 4;
            angle = 180;
          } else if (this.currentDirection === 'down') {
            offsetX = 0;
            offsetY = 22;
            angle = 90;
          } else if (this.currentDirection === 'up') {
            offsetX = 0;
            offsetY = -22;
            angle = -90;
          }
          this.headlightImage.setPosition(this.x + offsetX, this.y + offsetY).setAngle(angle).setVisible(true);
        } else {
          this.headlightImage.setVisible(false);
        }
      }
    }
  }

  /**
   * Tạo hiệu ứng vệt bánh xe lết trên đường khi phanh gấp
   */
  private emitSkidMark() {
    const skid = this.scene.add.image(this.x, this.y + 12, 'fx_skid');
    skid.setDepth(1);
    skid.setAlpha(0.75);

    if (this.currentDirection === 'up' || this.currentDirection === 'down') {
      skid.setAngle(90);
    }

    // Vệt đen mờ dần sau 3 giây rồi biến mất
    this.scene.tweens.add({
      targets: skid,
      alpha: 0,
      duration: 3000,
      onComplete: () => skid.destroy()
    });
  }

  /**
   * Tạo hạt khói pô xe máy
   */
  private emitExhaustSmoke() {
    let smokeX = this.x;
    let smokeY = this.y + 14;

    if (this.currentDirection === 'right') smokeX -= 18;
    else if (this.currentDirection === 'left') smokeX += 18;
    else if (this.currentDirection === 'up') smokeY += 16;
    else if (this.currentDirection === 'down') smokeY -= 12;

    const smoke = this.scene.add.image(smokeX, smokeY, 'fx_smoke');
    smoke.setDepth(2);
    smoke.setScale(Phaser.Math.FloatBetween(0.6, 1.0));

    this.scene.tweens.add({
      targets: smoke,
      x: smokeX + Phaser.Math.Between(-8, 8),
      y: smokeY + Phaser.Math.Between(-8, 8),
      alpha: 0,
      scale: 1.4,
      duration: 400,
      onComplete: () => smoke.destroy()
    });
  }
}
