import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PLAYER_NAME } from '../config/GameConfig';
import { SaveManager } from '../managers/SaveManager';
import { OPENING_STORY, StorybookPanel } from './StorybookPanel';

export class TitleScene extends Phaser.Scene {
  private storybook!: StorybookPanel;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b1320');
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'story_first_ride')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.78);
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x08111d, 0x08111d, 0x08111d, 0x08111d, 0.82, 0.34, 0.82, 0.34);
    shade.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    shade.fillStyle(0x0c1722, 0.89).fillRoundedRect(506, 54, 405, 432, 18);
    shade.lineStyle(2, 0x547d6c, 0.9).strokeRoundedRect(506, 54, 405, 432, 18);

    this.add.text(56, 73, 'PIXEL SHIPPER', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px',
      fontStyle: 'bold', color: '#b6e3c7', letterSpacing: 2
    });
    this.add.text(54, 105, 'PHỐ CUỐI\nNGÀY', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '39px',
      fontStyle: 'bold', color: '#f4ddb0', lineSpacing: 7
    });
    this.add.text(58, 222, 'Một hành trình nhỏ giữa thành phố lớn.', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px', color: '#d3dfd9'
    });
    this.add.text(58, 249, 'Có những ngày, bắt đầu lại cũng là một công việc.', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#9db4ab'
    });
    this.add.text(545, 88, `HÀNH TRÌNH CỦA ${PLAYER_NAME.toLocaleUpperCase('vi-VN')}`, {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px',
      fontStyle: 'bold', color: '#93c8aa', letterSpacing: 1
    });
    this.add.text(545, 116, 'Sau hai tháng tìm việc,\ncuối tháng đã đến trước lời mời nhận việc.', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '16px',
      fontStyle: 'bold', color: '#f0d59a', lineSpacing: 7, wordWrap: { width: 330 }
    });
    this.add.text(545, 185, 'Chạy ship để giữ căn phòng trọ.\nTừng chuyến xe sẽ viết tiếp câu chuyện.', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px',
      color: '#c5d1cc', lineSpacing: 7
    });

    this.storybook = new StorybookPanel(this);
    const hasSave = SaveManager.getInstance().loadGame() !== null;
    this.createButton(546, 286, 322, 54, hasSave ? '▶  Chơi tiếp' : '▶  Chơi tiếp  •  Chưa có bản lưu',
      () => this.startCity(false), hasSave);
    this.createButton(546, 356, 322, 54, '✦  Chơi mới', () => {
      this.storybook.open(OPENING_STORY, () => this.startCity(true));
    }, true, true);
    this.add.text(547, 442, 'WASD / phím mũi tên để di chuyển  •  E tương tác  •  F lên xe', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '8px', color: '#8fa5a2',
      wordWrap: { width: 320 }
    });
  }

  private createButton(x: number, y: number, width: number, height: number, label: string,
    action: () => void, enabled: boolean, highlighted = false) {
    const background = this.add.graphics();
    const base = highlighted ? 0x2c7456 : 0x263846;
    const stroke = highlighted ? 0x68b88d : 0x4e6770;
    background.fillStyle(enabled ? base : 0x202a32, 0.98).fillRoundedRect(x, y, width, height, 10);
    background.lineStyle(1.5, enabled ? stroke : 0x35414a, 1).strokeRoundedRect(x, y, width, height, 10);
    const text = this.add.text(x + 18, y + height / 2, label, {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px',
      fontStyle: 'bold', color: enabled ? '#eff7f0' : '#73817f'
    }).setOrigin(0, 0.5);
    if (!enabled) return;
    this.add.zone(x + width / 2, y + height / 2, width, height)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        action();
      })
      .on('pointerover', () => { background.setAlpha(0.82); text.setX(x + 22); })
      .on('pointerout', () => { background.setAlpha(1); text.setX(x + 18); });
  }

  private startCity(newGame: boolean) {
    if (newGame) SaveManager.getInstance().clearSave();
    this.scene.start('CityScene', { newGame, startAtBoardingHouse: true });
    this.scene.launch('UIScene');
  }
}
