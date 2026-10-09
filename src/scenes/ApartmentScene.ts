import Phaser from 'phaser';
import { APARTMENT_ROOM_CONFIG, PLAYER_ON_FOOT_SPEED } from '../config/GameConfig';
import { OrderStatus } from '../types';
import { OrderManager } from '../managers/OrderManager';
import { CityScene } from './CityScene';

export class ApartmentScene extends Phaser.Scene {
  private city!: CityScene;
  private entrance!: { x: number; y: number };
  private actor!: Phaser.Physics.Arcade.Sprite;
  private keys!: Record<'W'|'A'|'S'|'D'|'E', Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private prompt!: Phaser.GameObjects.Text;
  private lastInteract = 0;
  private leaving = false;

  constructor() { super({ key: 'ApartmentScene' }); }

  init(data: { entrance: { x: number; y: number } }) {
    this.entrance = data.entrance;
    this.lastInteract = 0;
    this.leaving = false;
  }

  create() {
    this.city = this.scene.get('CityScene') as CityScene;
    const config = APARTMENT_ROOM_CONFIG;
    this.physics.world.setBounds(config.bounds.x, config.bounds.y + 76, config.bounds.width, config.bounds.height - 76);
    this.cameras.main.setRoundPixels(true).fadeIn(220, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x111b24).setDepth(-2);
    for (let y = config.bounds.y; y < config.bounds.y + config.bounds.height; y += 64) {
      for (let x = config.bounds.x; x < config.bounds.x + config.bounds.width; x += 64) {
        this.add.image(x + 32, y + 32, y < config.bounds.y + 64 ? 'room_wall' : 'room_floor').setDepth(0);
      }
    }
    this.add.rectangle(480, 226, 640, 5, 0x7cb6a0).setDepth(2);
    this.add.text(480, 174, 'CHUNG CƯ XANH • TẦNG 8', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', color: '#e6d6ad',
      backgroundColor: '#14222b', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(10);
    this.add.rectangle(480, 310, 192, 20, 0x765449).setDepth(2);
    this.add.rectangle(480, 292, 166, 16, 0xb87960).setDepth(3);
    this.add.text(480, 278, 'PHÒNG 802', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#fff0d4'
    }).setOrigin(0.5).setDepth(4);
    this.add.rectangle(300, 270, 92, 102, 0x536d73).setDepth(2);
    this.add.rectangle(300, 270, 80, 90, 0x9fc4c4).setDepth(3);
    this.add.rectangle(662, 270, 116, 116, 0x32434b).setDepth(2);
    this.add.text(662, 270, 'THANG\nMÁY', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#d5e5de', align: 'center'
    }).setOrigin(0.5).setDepth(3);
    this.add.image(config.exit.x, config.exit.y, 'room_door_exit').setDepth(1);
    this.actor = this.physics.add.sprite(config.spawn.x, config.spawn.y, 'player_up');
    this.actor.setSize(16, 12).setOffset(8, 26).setCollideWorldBounds(true).setDepth(480);
    const walls = this.physics.add.staticGroup();
    for (const x of [config.bounds.x + 12, config.bounds.x + config.bounds.width - 12]) {
      const wall = this.add.rectangle(x, 340, 20, 264); walls.add(wall);
    }
    this.physics.add.collider(this.actor, walls);
    this.prompt = this.add.text(480, 520, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', color: '#d7eadb',
      backgroundColor: '#14222b', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(10000);
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E') as typeof this.keys;
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.resetKeys();
  }

  public canDeliverToDoor(): boolean {
    const order = OrderManager.getInstance().getCurrentOrder();
    const targetMatches = order?.deliveryMode === 'apartment' &&
      Phaser.Math.Distance.Between(this.entrance.x, this.entrance.y, order.customerPos.x, order.customerPos.y) < 90;
    return targetMatches && order?.status === OrderStatus.PICKED_UP &&
      Phaser.Math.Distance.Between(this.actor.x, this.actor.y,
        APARTMENT_ROOM_CONFIG.deliveryDoor.x, APARTMENT_ROOM_CONFIG.deliveryDoor.y) <
        APARTMENT_ROOM_CONFIG.deliveryDoor.radius;
  }

  override update(time: number) {
    if (this.leaving || !this.actor?.body) return;
    const virtual = this.city.player.virtualInput;
    let dx = 0, dy = 0;
    if (this.keys.A.isDown || this.cursors.left.isDown || virtual.left) dx--;
    if (this.keys.D.isDown || this.cursors.right.isDown || virtual.right) dx++;
    if (this.keys.W.isDown || this.cursors.up.isDown || virtual.up) dy--;
    if (this.keys.S.isDown || this.cursors.down.isDown || virtual.down) dy++;
    const length = Math.hypot(dx, dy) || 1;
    this.actor.setVelocity(dx / length * PLAYER_ON_FOOT_SPEED, dy / length * PLAYER_ON_FOOT_SPEED);
    if (dx || dy) {
      const direction = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
      this.actor.anims.play('walk_' + direction, true);
    } else this.actor.anims.stop();
    this.actor.setDepth(this.actor.y + 20);
    const order = OrderManager.getInstance().getCurrentOrder();
    const atDeliveryDoor = this.canDeliverToDoor();
    const atExit = Phaser.Math.Distance.Between(this.actor.x, this.actor.y,
      APARTMENT_ROOM_CONFIG.exit.x, APARTMENT_ROOM_CONFIG.exit.y) < 42;
    this.prompt.setText(atDeliveryDoor ? '[E] GIAO ĐƠN TẬN CỬA PHÒNG 802' : atExit ? '[E] RA SẢNH CHUNG CƯ' :
      order?.deliveryMode === 'apartment' && this.entranceMatchesOrder(order)
        ? 'Đi tới cửa phòng 802 để giao hàng' : 'Sảnh chung cư • Đi tới cửa để ra ngoài');
    const keyboard = Phaser.Input.Keyboard.JustDown(this.keys.E);
    const touch = this.city.player.consumeVirtualInteract();
    if ((keyboard || touch) && time - this.lastInteract > 400) {
      this.lastInteract = time;
      if (atDeliveryDoor && order) OrderManager.getInstance().deliverOrder(order.customerName);
      else if (atExit) this.leaveApartment();
    }
  }

  private leaveApartment() {
    if (this.leaving) return;
    this.leaving = true;
    this.actor.setVelocity(0, 0);
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.city.exitApartment(this.entrance));
  }

  private entranceMatchesOrder(order: NonNullable<ReturnType<OrderManager['getCurrentOrder']>>) {
    return order.deliveryMode === 'apartment' &&
      Phaser.Math.Distance.Between(this.entrance.x, this.entrance.y, order.customerPos.x, order.customerPos.y) < 90;
  }
}
