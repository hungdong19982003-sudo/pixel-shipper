import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, INVENTORY_CONFIG } from '../config/GameConfig';
import { InventoryItem } from '../types';
import { Player } from '../entities/Player';
import { SoundManager } from '../assets/SoundManager';

export type UtilityPanel = 'inventory' | 'settings';
export type SettingsAction = 'sound' | 'radar' | 'weather' | 'touch';

/** Small native overlay for the player's bag and gameplay settings. */
export class UtilityUI {
  public isOpen = false;
  private readonly layer = document.createElement('div');
  private readonly backdrop = document.createElement('div');
  private readonly panel = document.createElement('section');
  private readonly content = document.createElement('div');
  private readonly title = document.createElement('h2');
  private readonly closeButton: HTMLButtonElement;
  private readonly pausedScenes = new Set<string>();
  private closeTimer?: Phaser.Time.TimerEvent;
  private previousFocus?: HTMLElement;
  private panelType: UtilityPanel = 'inventory';
  private readonly handleWindowKey = (event: KeyboardEvent) => {
    if (!this.isOpen || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.close();
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly getPlayer: () => Player | undefined,
    private readonly onAction: (action: SettingsAction) => void,
    private readonly onConsume: (id: string) => void,
    private readonly getSettingLabel: (action: SettingsAction) => string
  ) {
    this.layer.className = 'utility-layer';
    this.layer.hidden = true;
    this.backdrop.className = 'utility-backdrop';
    this.panel.className = 'utility-panel';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'true');
    this.panel.append(this.title);
    this.closeButton = this.button('Đóng', () => this.close(), 'utility-close');
    this.panel.append(this.closeButton, this.content);
    this.content.className = 'utility-content';
    this.layer.append(this.backdrop, this.panel);
    document.getElementById('ui-overlay')!.append(this.layer);
    this.backdrop.addEventListener('click', () => this.close());
    this.layer.addEventListener('keydown', (event) => event.stopPropagation());
    for (const eventName of ['pointerdown', 'pointerup', 'wheel']) {
      this.layer.addEventListener(eventName, (event) => event.stopPropagation());
    }
    window.addEventListener('keydown', this.handleWindowKey, true);
    this.scene.scale.on('resize', this.syncLayout, this);
    this.scene.events.once('shutdown', this.destroy, this);
    this.syncLayout();
  }

  private button(label: string, action: () => void, className = 'utility-action'): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', () => {
      SoundManager.getInstance().playClick();
      action();
    });
    return button;
  }

  public syncLayout() {
    const canvas = this.scene.game.canvas.getBoundingClientRect();
    const overlay = this.layer.parentElement!.getBoundingClientRect();
    const scale = canvas.width / GAME_WIDTH;
    const width = INVENTORY_CONFIG.overlayWidth;
    const height = INVENTORY_CONFIG.overlayHeight;
    this.panel.style.width = width + 'px';
    this.panel.style.height = height + 'px';
    this.panel.style.left = canvas.left - overlay.left + (GAME_WIDTH - width) * scale / 2 + 'px';
    this.panel.style.top = canvas.top - overlay.top + (GAME_HEIGHT - height) * scale / 2 + 'px';
    this.panel.style.transform = 'scale(' + scale + ')';
    Object.assign(this.backdrop.style, {
      left: canvas.left - overlay.left + 'px',
      top: canvas.top - overlay.top + 'px',
      width: canvas.width + 'px',
      height: canvas.height + 'px'
    });
  }

  public open(type: UtilityPanel) {
    if (this.isOpen) {
      this.panelType = type;
      this.render();
      return;
    }
    this.isOpen = true;
    this.panelType = type;
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    const player = this.getPlayer();
    if (player) {
      for (const key of Object.keys(player.virtualInput) as Array<keyof Player['virtualInput']>) {
        player.virtualInput[key] = false;
      }
    }
    for (const key of ['CityScene', 'RoomScene', 'RestaurantScene', 'ApartmentScene', 'FishingScene']) {
      if (!this.scene.scene.isActive(key)) continue;
      this.pausedScenes.add(key);
      this.scene.scene.pause(key);
    }
    this.layer.hidden = false;
    this.closeTimer?.remove(false);
    this.syncLayout();
    this.render();
    this.closeButton.focus({ preventScroll: true });
  }

  public close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.layer.hidden = true;
    for (const key of this.pausedScenes) {
      this.scene.scene.get(key).input.keyboard?.resetKeys();
      this.scene.scene.resume(key);
    }
    this.pausedScenes.clear();
    this.scene.input.keyboard?.resetKeys();
    this.previousFocus?.focus({ preventScroll: true });
  }

  private render() {
    this.content.replaceChildren();
    this.title.textContent = this.panelType === 'inventory' ? 'Túi đồ' : 'Cài đặt';
    const player = this.getPlayer();
    if (!player) return;
    if (this.panelType === 'inventory') this.renderInventory(player.stats.inventory ?? []);
    else this.renderSettings();
  }

  private renderInventory(items: InventoryItem[]) {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const summary = document.createElement('p');
    summary.className = 'utility-summary';
    summary.textContent = `${count} / ${INVENTORY_CONFIG.maxItems} món • Dùng đồ ăn, nấu cá ở trọ, đặt nội thất trong phòng`;
    this.content.append(summary);
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'utility-empty';
      empty.textContent = 'Túi đang trống. Mua món mang đi tại quán hoặc nội thất trong cửa hàng rồi dùng tại đây.';
      this.content.append(empty);
      return;
    }
    for (const item of items) {
      const card = document.createElement('article');
      card.className = 'utility-card';
      const detail = document.createElement('div');
      detail.className = 'utility-card-detail';
      const name = document.createElement('strong');
      name.textContent = `${item.icon} ${item.name} × ${item.quantity}`;
      const stats = document.createElement('small');
      stats.textContent = item.category === 'consumable'
        ? `Đói +${item.hunger ?? 0}  •  Khát +${item.thirst ?? 0}  •  Sức +${item.energy ?? 0}`
        : item.description ?? this.categoryDescription(item.category);
      detail.append(name, stats);
      const useLabel = item.category === 'furniture' ? 'Đặt' :
        item.category === 'fishing_gear' ? 'Trang bị' : item.category === 'fish' ? 'Nấu' : 'Dùng';
      const use = this.button(useLabel, () => this.onConsume(item.id));
      card.append(detail, use);
      this.content.append(card);
    }
  }

  private categoryDescription(category: InventoryItem['category']): string {
    switch (category) {
      case 'furniture': return 'Nội thất • Có thể đặt trong phòng trọ';
      case 'fishing_gear': return 'Dụng cụ câu cá';
      case 'fish': return 'Cá đã câu được';
      case 'misc': return 'Vật phẩm';
      case 'consumable': return 'Vật phẩm tiêu hao';
    }
  }

  private renderSettings() {
    const actions: SettingsAction[] = ['sound', 'radar', 'weather', 'touch'];
    const labels: Record<SettingsAction, string> = {
      sound: 'Âm thanh', radar: 'Bản đồ thu nhỏ', weather: 'Thời tiết', touch: 'Phím cảm ứng'
    };
    for (const action of actions) {
      const row = document.createElement('div');
      row.className = 'utility-card';
      const label = document.createElement('strong');
      label.textContent = labels[action];
      row.append(label, this.button(this.getSettingLabel(action), () => {
        this.onAction(action);
        this.render();
      }));
      this.content.append(row);
    }
    const shortcuts = document.createElement('section');
    shortcuts.className = 'utility-shortcuts';
    const heading = document.createElement('h3');
    heading.textContent = 'Phím tắt';
    const list = document.createElement('p');
    list.textContent = 'WASD / mũi tên: Di chuyển  •  E: Tương tác  •  F: Lên/xuống xe  •  Tab: Điện thoại\nB: Túi đồ  •  O: Cài đặt  •  M: Âm thanh\nN: Bản đồ  •  K: Thời tiết  •  P: Phím cảm ứng';
    shortcuts.append(heading, list);
    this.content.append(shortcuts);
  }

  public destroy() {
    this.closeTimer?.remove(false);
    this.scene.scale.off('resize', this.syncLayout, this);
    window.removeEventListener('keydown', this.handleWindowKey, true);
    this.layer.remove();
  }
}
