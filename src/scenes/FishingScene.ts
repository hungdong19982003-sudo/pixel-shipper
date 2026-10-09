import Phaser from 'phaser';
import { FISHING_CONFIG, GAME_HEIGHT, GAME_WIDTH, PLAYER_ON_FOOT_SPEED } from '../config/GameConfig';
import { InventoryManager } from '../managers/InventoryManager';
import type { InventoryItem, PlayerStats } from '../types';
import { CityScene } from './CityScene';

type FishingState = 'idle' | 'waiting' | 'bite' | 'cooldown';

const FISH_CATALOG: Omit<InventoryItem, 'quantity'>[] = [
  { id: 'fish_tilapia', name: 'Cá rô đồng', icon: '🐟', category: 'fish', description: 'Cá rô đồng béo khỏe ở hồ sen.' },
  { id: 'fish_carp', name: 'Cá chép', icon: '🐠', category: 'fish', description: 'Cá chép vàng bơi sát đám sen.' },
  { id: 'fish_catfish', name: 'Cá trê', icon: '🐟', category: 'fish', description: 'Cá trê trốn dưới bóng cầu gỗ.' },
  { id: 'fish_koi', name: 'Cá koi', icon: '🐡', category: 'fish', description: 'Cá koi hiếm, đỏ cam như nắng chiều.' }
];

export class FishingScene extends Phaser.Scene {
  private city!: CityScene;
  private stats!: PlayerStats;
  private actor!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private prompt!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private detailText!: Phaser.GameObjects.Text;
  private bagText!: Phaser.GameObjects.Text;
  private bobber?: Phaser.GameObjects.Container;
  private state: FishingState = 'idle';
  private stateUntil = 0;
  private lastInteract = 0;
  private feedbackUntil = 0;

  constructor() {
    super({ key: 'FishingScene' });
  }

  init(data: { playerStats?: PlayerStats }) {
    this.city = this.scene.get('CityScene') as CityScene;
    this.stats = data.playerStats ?? this.city.player.stats;
    this.state = 'idle';
    this.stateUntil = 0;
    this.lastInteract = 0;
    this.feedbackUntil = 0;
  }

  create() {
    const config = FISHING_CONFIG;
    this.physics.world.setBounds(0, 0, config.mapWidth, config.mapHeight);
    this.cameras.main.setBounds(0, 0, config.mapWidth, config.mapHeight)
      .setRoundPixels(true).fadeIn(320, 0, 0, 0);
    this.drawFishingMap();

    this.obstacles = this.physics.add.staticGroup();
    this.addWaterColliders();
    this.addTree(126, 180, 0);
    this.addTree(198, 360, 1);
    this.addTree(124, 690, 2);
    this.addTree(350, 760, 0);
    this.addTree(1120, 180, 1);
    this.addTree(1154, 730, 2);
    this.addTree(1008, 830, 0);
    this.addTree(448, 222, 2);
    this.addRock(488, 640);
    this.addRock(1060, 670);
    this.addRock(348, 302);
    this.addCabinObstacle();

    this.actor = this.physics.add.sprite(config.entrance.x, config.entrance.y, 'player_down')
      .setDepth(config.entrance.y + 20).setCollideWorldBounds(true);
    this.actor.setSize(16, 12).setOffset(8, 26);
    this.physics.add.collider(this.actor, this.obstacles);
    this.cameras.main.startFollow(this.actor, true, 0.08, 0.08);

    this.createFishingSpot();
    this.createSceneHud();
    this.ensureStarterRod();
    this.updateBagCount();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D') as typeof this.keys;
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.resetKeys();
    this.scene.bringToTop('UIScene');
  }

  private drawFishingMap() {
    const graphics = this.add.graphics().setDepth(-10);
    graphics.fillStyle(0x72945a, 1).fillRect(0, 0, 1280, 960);

    // Soft grass variation and flower pixels keep the clearing lively without visual noise.
    for (let row = 0; row < 30; row++) {
      for (let column = 0; column < 40; column++) {
        const seed = (column * 19 + row * 37) % 23;
        const x = column * 32 + ((row * 13) % 9);
        const y = row * 32 + ((column * 7) % 7);
        if (seed < 8) {
          graphics.fillStyle(seed < 3 ? 0x7e9e62 : 0x688750, 0.45)
            .fillRect(x, y, 8 + seed % 3 * 4, 4 + seed % 2 * 3);
        }
        if (seed === 4 || seed === 15) {
          graphics.fillStyle(seed === 4 ? 0xf3d889 : 0xe9c6d2, 1).fillRect(x + 14, y + 14, 4, 4);
          graphics.fillStyle(0x527a4c, 1).fillRect(x + 14, y + 18, 2, 4);
        }
      }
    }

    // A winding stone path leads from the boarding-house gate to the little pond.
    graphics.fillStyle(0xb9a477, 1);
    graphics.fillRect(600, 0, 80, 192);
    graphics.fillRect(528, 152, 152, 56);
    graphics.fillRect(456, 184, 224, 56);
    graphics.fillRect(408, 216, 272, 64);
    graphics.fillRect(376, 256, 304, 96);
    graphics.fillStyle(0xc9b487, 1);
    for (let index = 0; index < 15; index++) {
      const x = 392 + (index % 6) * 45;
      const y = 268 + Math.floor(index / 6) * 30 + (index % 2) * 4;
      graphics.fillRect(x, y, 27, 12);
    }

    // Stepped earth banks frame the pond in a soft, hand-painted pixel silhouette.
    graphics.fillStyle(0x705a3e, 1)
      .fillRect(632, 288, 336, 32).fillRect(584, 320, 432, 32)
      .fillRect(552, 352, 496, 224).fillRect(584, 576, 432, 64)
      .fillRect(632, 640, 336, 32);
    graphics.fillStyle(0xd0b477, 1)
      .fillRect(632, 304, 320, 24).fillRect(600, 328, 408, 24)
      .fillRect(568, 352, 464, 216).fillRect(600, 568, 408, 48)
      .fillRect(640, 616, 320, 24);
    graphics.fillStyle(0x367d83, 1)
      .fillRect(648, 328, 288, 24).fillRect(616, 352, 376, 24)
      .fillRect(584, 376, 432, 168).fillRect(616, 544, 376, 24)
      .fillRect(648, 568, 288, 24);
    graphics.fillStyle(0x4a9694, 0.75)
      .fillRect(656, 368, 132, 4).fillRect(840, 400, 120, 4)
      .fillRect(616, 488, 96, 4).fillRect(816, 520, 152, 4);

    const gate = this.add.graphics().setDepth(150);
    gate.fillStyle(0x6a4b34, 1).fillRect(606, 86, 12, 64).fillRect(662, 86, 12, 64);
    gate.fillStyle(0x9d6842, 1).fillRect(598, 78, 84, 12).fillRect(606, 68, 68, 10);
    gate.fillStyle(0xd4b77b, 1).fillRect(616, 96, 48, 25);
    this.add.text(640, 108, 'PHỐ', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '9px', color: '#314436'
    }).setOrigin(0.5).setDepth(151);

    // Wooden pier with individual planks and low posts.
    graphics.fillStyle(0x604834, 1).fillRect(360, 424, 420, 112);
    graphics.fillStyle(0x9a704b, 1).fillRect(372, 432, 390, 88);
    for (let y = 440; y < 520; y += 16) {
      graphics.fillStyle(y % 32 === 8 ? 0xb48759 : 0x856044, 1).fillRect(378, y, 378, 3);
    }
    graphics.fillStyle(0x5e4935, 1);
    for (const x of [374, 438, 502, 566, 630, 694, 758]) {
      graphics.fillRect(x, 420, 9, 14);
      graphics.fillRect(x, 520, 9, 14);
    }

    // Mossy shore stones, water lilies, and a few broad lily pads.
    graphics.fillStyle(0x798b59, 1);
    for (const [x, y] of [[617, 370], [635, 576], [952, 354], [988, 560], [768, 600], [548, 440]]) {
      graphics.fillRect(x, y, 14, 7);
      graphics.fillRect(x + 4, y - 4, 8, 5);
    }
    for (const [x, y, color] of [
      [842, 376, 0x78a95f], [912, 530, 0x79a75d], [662, 520, 0x6e9c59], [964, 430, 0x739e58]
    ]) {
      this.add.ellipse(x, y, 30, 12, color).setDepth(3);
      this.add.ellipse(x + 4, y - 2, 8, 5, 0xe8c2c8).setDepth(4);
    }

    this.drawCabin();
    this.drawCampAndBench();
  }

  private drawCabin() {
    const art = this.add.graphics().setDepth(300);
    art.fillStyle(0x4d6846, 0.35).fillEllipse(265, 286, 208, 34);
    art.fillStyle(0xa9754d, 1).fillRect(188, 228, 148, 68);
    art.fillStyle(0xe1c18b, 1).fillRect(200, 238, 124, 58);
    art.fillStyle(0x694936, 1).fillRect(246, 262, 34, 34);
    art.fillStyle(0x71909a, 1).fillRect(208, 248, 25, 20);
    art.fillStyle(0x42636b, 1).fillRect(220, 248, 3, 20).fillRect(208, 257, 25, 3);
    art.fillStyle(0x70463e, 1)
      .fillRect(172, 216, 180, 14).fillRect(188, 204, 148, 14).fillRect(208, 192, 108, 14);
    art.fillStyle(0xb75e49, 1).fillRect(218, 182, 88, 14);
    art.fillStyle(0xd78358, 1).fillRect(230, 170, 64, 14);
    this.add.text(262, 306, 'CHÒI CỦA BÁC TƯ', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '8px', color: '#f1d5a3'
    }).setOrigin(0.5).setDepth(301);
  }

  private drawCampAndBench() {
    const art = this.add.graphics().setDepth(260);
    art.fillStyle(0x536c45, 1).fillEllipse(1000, 754, 112, 22);
    art.fillStyle(0x79573e, 1).fillRect(950, 734, 100, 8).fillRect(960, 750, 8, 17).fillRect(1034, 750, 8, 17);
    art.fillStyle(0xb68757, 1).fillRect(954, 722, 92, 12);
    art.fillStyle(0xffcf75, 0.8).fillTriangle(1090, 740, 1098, 724, 1106, 740);
    art.fillStyle(0x8c5435, 1).fillRect(1092, 740, 12, 16);
    art.fillStyle(0x704833, 1).fillRect(1088, 756, 20, 4);
    art.fillStyle(0xe7b867, 0.8).fillCircle(1098, 728, 18);
  }

  private createFishingSpot() {
    const config = FISHING_CONFIG;
    const marker = this.add.graphics().setDepth(8);
    marker.lineStyle(2, 0xf6d98a, 0.8).strokeCircle(config.fishingSpot.x, config.fishingSpot.y, 24);
    this.tweens.add({ targets: marker, alpha: 0.35, yoyo: true, repeat: -1, duration: 900 });

    const ripples = this.add.graphics().setDepth(5);
    ripples.lineStyle(2, 0xc1e7d1, 0.7).strokeEllipse(config.bobber.x, config.bobber.y, 18, 7);
    this.tweens.add({
      targets: ripples, scaleX: 1.9, scaleY: 1.8, alpha: 0.15,
      yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.easeInOut'
    });
  }

  private createSceneHud() {
    this.add.rectangle(GAME_WIDTH / 2, 118, 380, 28, 0x17252b, 0.88)
      .setScrollFactor(0).setDepth(20000).setStrokeStyle(1, 0xa9bd8c, 0.75);
    this.titleText = this.add.text(GAME_WIDTH / 2, 118, '🌿 BẾN CÂU CUỐI NGÕ', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#f2e6c5'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);
    this.bagText = this.add.text(GAME_WIDTH / 2, 146, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '9px', color: '#f2e6c5',
      backgroundColor: '#17252b', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);
    this.detailText = this.add.text(GAME_WIDTH / 2, 176, 'Đi theo lối đá tới cầu gỗ để câu cá.', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '9px', color: '#e4edcf',
      backgroundColor: '#294334', padding: { x: 9, y: 5 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);

    const promptBg = this.add.graphics();
    promptBg.fillStyle(0x14242b, 0.94).fillRoundedRect(-174, -15, 348, 30, 6);
    promptBg.lineStyle(1, 0xe2c985, 0.9).strokeRoundedRect(-174, -15, 348, 30, 6);
    this.promptText = this.add.text(0, 0, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#fff1be',
      align: 'center'
    }).setOrigin(0.5);
    this.prompt = this.add.container(0, 0, [promptBg, this.promptText]).setDepth(20002).setVisible(false);
  }

  private ensureStarterRod() {
    const rod = FISHING_CONFIG.starterRod;
    if (this.stats.inventory.some((item) => item.id === rod.id)) return;
    InventoryManager.add(this.stats, rod);
  }

  private updateBagCount() {
    const fishCount = this.stats.inventory
      .filter((item) => item.category === 'fish')
      .reduce((total, item) => total + item.quantity, 0);
    const rod = this.stats.inventory.find((item) => item.category === 'fishing_gear');
    this.bagText?.setText(`🎒 ${fishCount} cá trong túi     ${rod ? `${rod.icon} ${rod.name}` : '🎣 Cần câu mượn ở bến'}`);
  }

  private addWaterColliders() {
    this.addSolid(800, 404, 432, 56);
    this.addSolid(800, 572, 432, 48);
    this.addSolid(900, 480, 232, 96);
    this.addSolid(800, 604, 368, 24);
    this.addSolid(800, 340, 320, 24);
  }

  private addSolid(x: number, y: number, width: number, height: number) {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.obstacles.add(zone);
  }

  private addTree(x: number, y: number, variant: number) {
    const art = this.add.graphics().setDepth(y + 16);
    art.fillStyle(0x3e5a3f, 0.36).fillEllipse(x, y + 10, 82, 24);
    art.fillStyle(0x79543a, 1).fillRect(x - 8, y - 5, 16, 34);
    const greens = [0x54794c, 0x648451, 0x476b49];
    art.fillStyle(greens[variant], 1)
      .fillRect(x - 34, y - 48, 68, 32)
      .fillRect(x - 24, y - 62, 48, 18)
      .fillRect(x - 46, y - 38, 20, 22)
      .fillRect(x + 26, y - 36, 20, 20);
    art.fillStyle(0x86a866, 1).fillRect(x - 21, y - 51, 18, 8).fillRect(x + 7, y - 37, 15, 7);
    this.addSolid(x, y + 9, 28, 22);
  }

  private addRock(x: number, y: number) {
    const art = this.add.graphics().setDepth(y + 10);
    art.fillStyle(0x766d5a, 1).fillRect(x - 18, y - 8, 34, 17);
    art.fillStyle(0xa49a7d, 1).fillRect(x - 10, y - 15, 18, 9);
    art.fillStyle(0x647447, 1).fillRect(x - 16, y + 5, 12, 4);
    this.addSolid(x, y, 30, 20);
  }

  private addCabinObstacle() {
    this.addSolid(262, 287, 124, 20);
  }

  private updateFishingPrompt(now: number, nearSpot: boolean, nearGate: boolean) {
    if (nearGate) {
      this.detailText.setText('Cổng gỗ phía bắc dẫn trở lại khu trọ.');
    } else if (nearSpot) {
      this.detailText.setText(this.state === 'waiting' ? 'Nhìn phao trên mặt hồ, cá sẽ cắn câu sau một lúc.' :
        this.state === 'bite' ? 'Phao đang rung — nhấn E để kéo cá lên.' :
        'Đã tới cầu gỗ. Nhấn E để thả cần câu.');
    } else {
      this.detailText.setText('Đi theo lối đá tới cầu gỗ để câu cá.');
    }
    if (now < this.feedbackUntil) return;
    if (nearGate) {
      this.promptText.setText('[E] Trở về Phố Cuối Ngày');
      this.prompt.setPosition(this.actor.x, this.actor.y + 48).setVisible(true);
    } else if (nearSpot) {
      const message = this.state === 'waiting' ? 'Phao đang trôi… chờ cá cắn câu' :
        this.state === 'bite' ? 'Phao rung rồi! Nhấn [E] kéo cá lên' :
        this.state === 'cooldown' ? 'Chờ mặt hồ yên lại một chút…' : '[E] Quăng cần câu';
      this.promptText.setText(message);
      this.prompt.setPosition(this.actor.x, this.actor.y - 48).setVisible(true);
    } else {
      this.prompt.setVisible(false);
    }
  }

  private handleFishingAction(now: number, nearSpot: boolean, nearGate: boolean) {
    if (now - this.lastInteract < 280) return;
    this.lastInteract = now;
    if (nearGate) {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.city.exitFishingMap());
      return;
    }
    if (!nearSpot) return;
    if (this.state === 'idle') {
      this.castLine(now);
    } else if (this.state === 'bite') {
      this.catchFish();
    } else if (this.state === 'waiting') {
      this.showFeedback('Phao chưa rung, chờ thêm chút nhé.', now + 1000);
    }
  }

  private castLine(now: number) {
    this.state = 'waiting';
    const { biteDelayMinMs, biteDelayMaxMs } = FISHING_CONFIG;
    this.stateUntil = now + Phaser.Math.Between(biteDelayMinMs, biteDelayMaxMs);
    const config = FISHING_CONFIG;
    const art = this.add.graphics();
    art.lineStyle(2, 0xf0e7d0, 0.85).lineBetween(0, 0,
      config.bobber.x - this.actor.x, config.bobber.y - this.actor.y);
    const float = this.add.ellipse(config.bobber.x, config.bobber.y, 12, 9, 0xe66d5d)
      .setDepth(config.bobber.y + 4).setStrokeStyle(2, 0xf3e5c5, 1);
    this.bobber = this.add.container(0, 0, [art, float]).setDepth(config.bobber.y + 4);
    this.showFeedback('Dây câu rơi xuống mặt hồ…', now + 900);
  }

  private catchFish() {
    const roll = Math.random();
    const fishIndex = roll > 0.94 ? 3 : roll > 0.72 ? 2 : roll > 0.38 ? 1 : 0;
    const fish = FISH_CATALOG[fishIndex];
    if (!InventoryManager.add(this.stats, fish)) {
      this.finishCast();
      this.showFeedback('Túi đồ đã đầy, hãy dọn chỗ trước khi câu tiếp.', this.time.now + 2200);
      return;
    }
    this.updateBagCount();
    this.finishCast();
    this.showFeedback(`${fish.icon} Câu được ${fish.name}! Đã cất vào túi đồ.`, this.time.now + 2200);
  }

  private finishCast() {
    this.bobber?.destroy();
    this.bobber = undefined;
    this.state = 'cooldown';
    this.stateUntil = this.time.now + 1400;
  }

  private showFeedback(message: string, until: number) {
    this.promptText.setText(message);
    this.prompt.setPosition(this.actor.x, this.actor.y - 48).setVisible(true);
    this.feedbackUntil = until;
  }

  override update(time: number, _delta: number) {
    if (!this.actor?.body) return;
    if (this.state === 'waiting' && time >= this.stateUntil) {
      this.state = 'bite';
      this.stateUntil = time + FISHING_CONFIG.biteWindowMs;
      this.bobber?.setScale(1.4).setAlpha(1);
      this.promptText.setText('Phao rung rồi! Nhấn [E] kéo cá lên');
      this.feedbackUntil = 0;
    } else if (this.state === 'bite' && time >= this.stateUntil) {
      this.finishCast();
      this.showFeedback('Cá ăn mồi rồi bơi mất. Thử quăng cần lần nữa nhé.', time + 2000);
    } else if (this.state === 'cooldown' && time >= this.stateUntil) {
      this.state = 'idle';
    }

    const virtual = this.city.player.virtualInput;
    const virtualInteract = this.city.player.consumeVirtualInteract();
    const nearSpot = Phaser.Math.Distance.Between(this.actor.x, this.actor.y,
      FISHING_CONFIG.fishingSpot.x, FISHING_CONFIG.fishingSpot.y) < FISHING_CONFIG.interactionRadius;
    const nearGate = Phaser.Math.Distance.Between(this.actor.x, this.actor.y,
      FISHING_CONFIG.returnGate.x, FISHING_CONFIG.returnGate.y) < FISHING_CONFIG.interactionRadius;
    if (virtualInteract && time - this.lastInteract >= 280) {
      this.handleFishingAction(time, nearSpot, nearGate);
    }
    this.updateFishingPrompt(time, nearSpot, nearGate);

    let dx = 0;
    let dy = 0;
    if (this.state !== 'waiting' && this.state !== 'bite') {
      if (this.keys.A.isDown || this.cursors.left.isDown || virtual.left) dx--;
      if (this.keys.D.isDown || this.cursors.right.isDown || virtual.right) dx++;
      if (this.keys.W.isDown || this.cursors.up.isDown || virtual.up) dy--;
      if (this.keys.S.isDown || this.cursors.down.isDown || virtual.down) dy++;
    }
    const length = Math.hypot(dx, dy) || 1;
    this.actor.setVelocity(dx / length * PLAYER_ON_FOOT_SPEED, dy / length * PLAYER_ON_FOOT_SPEED);
    if (dx || dy) {
      const direction = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
      this.actor.anims.play('walk_' + direction, true);
    } else this.actor.anims.stop();
    this.actor.setDepth(this.actor.y + 20);
  }
}
