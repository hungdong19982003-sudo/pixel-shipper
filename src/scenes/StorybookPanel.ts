import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PLAYER_NAME } from '../config/GameConfig';

export interface StoryPage {
  title: string;
  body: string;
  art: string;
  caption: string;
}

export const OPENING_STORY: StoryPage[] = [
  {
    title: 'Tấm bằng mới, một khởi đầu mới',
    body: `${PLAYER_NAME} vừa tốt nghiệp ngành Công nghệ thông tin. Cậu mang tấm bằng về phòng trọ, tin rằng chỉ cần cố gắng thêm một chút là sẽ tìm được công việc đầu tiên.`,
    art: 'story_graduate',
    caption: 'Ngày nhận bằng • Hai tháng trước'
  },
  {
    title: 'Hai tháng đi tìm việc',
    body: 'Hồ sơ gửi đi, những buổi phỏng vấn nối nhau. Câu trả lời vẫn là “bên anh sẽ liên hệ”. Tiền tiết kiệm cạn dần, tiền trọ thì đã đến hạn.',
    art: 'story_job_search',
    caption: 'Một căn phòng nhỏ, rất nhiều email chưa hồi âm'
  },
  {
    title: 'Chuyến giao hàng đầu tiên',
    body: `${PLAYER_NAME} gấp laptop lại, đội chiếc mũ bảo hiểm và đăng ký chạy giao hàng. Trong ví chỉ còn 35.000đ. Thành phố ngoài kia đang chờ chuyến xe đầu tiên của cậu.`,
    art: 'story_first_ride',
    caption: 'Phố Cuối Ngày • Ngày đầu chạy ship'
  }
];

export class StorybookPanel {
  private readonly panel: Phaser.GameObjects.Container;
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly art: Phaser.GameObjects.Image;
  private readonly title: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly caption: Phaser.GameObjects.Text;
  private readonly pageCount: Phaser.GameObjects.Text;
  private readonly buttonLabel: Phaser.GameObjects.Text;
  private readonly buttonBg: Phaser.GameObjects.Graphics;
  private pages: StoryPage[] = [];
  private pageIndex = 0;
  private onDone?: () => void;
  public isOpen = false;

  private readonly advanceKey = (event: KeyboardEvent) => {
    if (!this.isOpen || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    this.next();
  };

  constructor(private readonly scene: Phaser.Scene) {
    this.panel = scene.add.container(0, 0).setDepth(50000).setScrollFactor(0).setVisible(false);
    this.backdrop = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080d16, 0.88)
      .setInteractive();
    const card = scene.add.graphics();
    card.fillStyle(0x121e2a, 0.99).fillRoundedRect(70, 40, 820, 460, 16);
    card.lineStyle(2, 0x7da58f, 0.9).strokeRoundedRect(70, 40, 820, 460, 16);
    card.fillStyle(0x20352f, 1).fillRoundedRect(92, 91, 346, 220, 10);
    card.lineStyle(1, 0x658774, 0.85).strokeRoundedRect(92, 91, 346, 220, 10);
    this.art = scene.add.image(265, 201, 'story_graduate').setDisplaySize(336, 184);
    this.caption = scene.add.text(102, 286, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '9px', color: '#e9d7ab',
      backgroundColor: '#101923dd', padding: { x: 7, y: 5 }
    });
    const kicker = scene.add.text(98, 61, 'PIXEL SHIPPER  •  PHỐ CUỐI NGÀY', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px',
      fontStyle: 'bold', color: '#94cdb0', letterSpacing: 1
    });
    this.title = scene.add.text(470, 112, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '20px',
      fontStyle: 'bold', color: '#f0d59a', wordWrap: { width: 370 }, lineSpacing: 5
    });
    this.body = scene.add.text(472, 174, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px',
      color: '#d7e0dc', wordWrap: { width: 365 }, lineSpacing: 8
    });
    const divider = scene.add.graphics();
    divider.lineStyle(1, 0x40564d, 0.8).lineBetween(470, 366, 850, 366);
    this.pageCount = scene.add.text(474, 406, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', color: '#9db2b0'
    });
    this.buttonBg = scene.add.graphics();
    this.buttonLabel = scene.add.text(754, 438, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px',
      fontStyle: 'bold', color: '#f2fff6'
    }).setOrigin(0.5);
    const buttonHit = scene.add.zone(754, 438, 190, 46)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.next());
    const hint = scene.add.text(265, 337, 'Một câu chuyện về những ngày chật vật và lòng tốt bất ngờ.', {
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px',
      color: '#aabdb4', wordWrap: { width: 330 }, align: 'center'
    }).setOrigin(0.5);
    this.panel.add([this.backdrop, card, kicker, this.art, this.caption, this.title, this.body,
      divider, this.pageCount, this.buttonBg, this.buttonLabel, buttonHit, hint]);
    this.backdrop.on('pointerdown', () => this.next());
    scene.input.keyboard?.on('keydown', this.advanceKey);
    scene.events.once('shutdown', () => {
      scene.input.keyboard?.off('keydown', this.advanceKey);
      this.panel.destroy(true);
    });
  }

  public open(pages: StoryPage[], onDone: () => void) {
    this.pages = pages;
    this.pageIndex = 0;
    this.onDone = onDone;
    this.isOpen = true;
    this.panel.setVisible(true);
    this.render();
  }

  private render() {
    const page = this.pages[this.pageIndex];
    if (!page) return;
    this.art.setTexture(page.art);
    this.caption.setText(page.caption);
    this.title.setText(page.title);
    this.body.setText(page.body);
    this.pageCount.setText(`CÂU CHUYỆN  ${this.pageIndex + 1} / ${this.pages.length}`);
    this.buttonLabel.setText(this.pageIndex === this.pages.length - 1 ? 'Bắt đầu chơi  →' : 'Tiếp tục  →');
    this.buttonBg.clear().fillStyle(0x287456, 1).fillRoundedRect(660, 414, 188, 48, 9);
    this.buttonBg.lineStyle(1, 0x69b58a, 1).strokeRoundedRect(660, 414, 188, 48, 9);
  }

  private next() {
    if (!this.isOpen) return;
    if (this.pageIndex < this.pages.length - 1) {
      this.pageIndex++;
      this.render();
      return;
    }
    this.isOpen = false;
    this.panel.setVisible(false);
    const done = this.onDone;
    this.onDone = undefined;
    done?.();
  }
}
