import Phaser from 'phaser';
import {
  PHONE_LAYOUT, GAME_WIDTH, GEAR_CATALOG, PLAYER_NAME, WEEK_CONFIG,
  DELIVERY_CONFIG, DEFAULT_MOTORBIKE, SOCIAL_CONFIG
} from '../config/GameConfig';
import { Player } from '../entities/Player';
import { Order, OrderStatus } from '../types';
import { OrderManager } from '../managers/OrderManager';
import { VehicleShopManager } from '../managers/VehicleShopManager';
import { FurnitureManager } from '../managers/FurnitureManager';
import { SoundManager } from '../assets/SoundManager';
import { WeekManager } from '../managers/WeekManager';
import { DeliveryPlanner } from '../managers/DeliveryPlanner';
import { FishingEconomyManager } from '../managers/FishingEconomyManager';
import { customerId } from '../managers/SocialManager';

type PhoneTab = 'ORDERS' | 'SHOP_BIKE' | 'SHOP_FURNITURE';

/**
 * A native scroll viewport keeps text, pointer hit areas and clipping in sync.
 * Its coordinates follow the Phaser canvas; gameplay stays paused while open.
 */
export class PhoneUI {
  public isOpen = false;
  private activeTab: PhoneTab = 'ORDERS';
  private readonly layer = document.createElement('div');
  private readonly backdrop = document.createElement('div');
  private readonly phone = document.createElement('section');
  private readonly shell = document.createElement('div');
  private readonly profile = document.createElement('p');
  private readonly tabs = document.createElement('nav');
  private readonly viewport = document.createElement('div');
  private readonly footer = document.createElement('p');
  private readonly closeButton: HTMLButtonElement;
  private readonly positions: Record<PhoneTab, number> = { ORDERS: 0, SHOP_BIKE: 0, SHOP_FURNITURE: 0 };
  private readonly pausedScenes = new Set<string>();
  private closeTimer?: Phaser.Time.TimerEvent;
  private feedbackTimer?: Phaser.Time.TimerEvent;
  private dragged = false;
  private dragPointer = -1;
  private dragStart = { x: 0, y: 0, scroll: 0 };
  private previousFocus?: HTMLElement;
  private readonly handleWindowKey = (event: KeyboardEvent) => {
    if (!this.isOpen || (event.key !== 'Tab' && event.key !== 'Escape')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.toggle(false);
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly getPlayer: () => Player | undefined,
    private readonly showToast: (message: string) => void,
    private readonly onOrderAccepted: () => void
  ) {
    this.layer.className = 'driver-phone-layer';
    this.layer.hidden = true;
    this.backdrop.className = 'driver-phone-backdrop';
    this.phone.className = 'driver-phone';
    this.phone.setAttribute('role', 'dialog');
    this.phone.setAttribute('aria-modal', 'true');
    this.phone.setAttribute('aria-label', 'Điện thoại tài xế');
    this.phone.style.width = PHONE_LAYOUT.width + 'px';
    this.phone.style.height = PHONE_LAYOUT.height + 'px';
    this.shell.className = 'driver-phone-shell';

    const header = this.element('header', 'phone-header');
    const status = this.element('div', 'phone-status', 'PIXEL MOBILE  •  4G');
    this.closeButton = this.button('✕', () => this.toggle(false), 'phone-close');
    this.closeButton.setAttribute('aria-label', 'Đóng điện thoại');
    const title = this.element('h2', 'phone-brand', 'Driver App');
    const profileCard = this.element('div', 'phone-profile');
    profileCard.append(this.element('strong', '', PLAYER_NAME + ' • Tài xế'), this.profile);
    this.profile.className = 'phone-profile-detail';
    header.append(status, this.closeButton, title, profileCard);
    this.tabs.className = 'phone-tabs';
    this.tabs.setAttribute('aria-label', 'Các mục trong điện thoại');
    this.viewport.className = 'phone-viewport';
    this.viewport.tabIndex = 0;
    this.viewport.setAttribute('aria-label', 'Danh sách có thể cuộn');
    this.footer.className = 'phone-footer';
    this.shell.append(header, this.tabs, this.viewport, this.footer, this.element('div', 'phone-home-indicator'));
    this.phone.append(this.shell);
    this.layer.append(this.backdrop, this.phone);
    document.getElementById('ui-overlay')!.append(this.layer);
    window.addEventListener('keydown', this.handleWindowKey, true);

    this.backdrop.addEventListener('click', () => this.toggle(false));
    this.layer.addEventListener('keydown', (event) => {
      if (event.key === 'Tab' || event.key === 'Escape') {
        event.preventDefault();
        this.toggle(false);
      }
      event.stopPropagation();
    });
    for (const eventName of ['pointerdown', 'pointerup', 'wheel']) {
      this.layer.addEventListener(eventName, (event) => event.stopPropagation());
    }
    this.viewport.addEventListener('scroll', () => {
      if (!this.isOpen) return;
      this.positions[this.activeTab] = this.viewport.scrollTop;
      this.updateFooter();
    });
    this.viewport.addEventListener('pointerdown', (event) => {
      this.dragged = false;
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      this.dragPointer = event.pointerId;
      this.dragStart = { x: event.clientX, y: event.clientY, scroll: this.viewport.scrollTop };
    });
    this.viewport.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.dragPointer) return;
      const distance = Math.hypot(event.clientX - this.dragStart.x, event.clientY - this.dragStart.y);
      if (!this.dragged && distance < PHONE_LAYOUT.dragThreshold) return;
      this.dragged = true;
      this.viewport.setPointerCapture(event.pointerId);
      const scale = this.scene.game.canvas.getBoundingClientRect().width / GAME_WIDTH;
      this.viewport.scrollTop = this.dragStart.scroll + (this.dragStart.y - event.clientY) / scale;
      event.preventDefault();
    });
    const finishDrag = (event: PointerEvent) => {
      if (event.pointerId !== this.dragPointer) return;
      this.dragPointer = -1;
      if (this.viewport.hasPointerCapture(event.pointerId)) this.viewport.releasePointerCapture(event.pointerId);
    };
    this.viewport.addEventListener('pointerup', finishDrag);
    this.viewport.addEventListener('pointercancel', finishDrag);
    this.viewport.addEventListener('click', (event) => {
      if (!this.dragged) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    this.scene.scale.on('resize', this.syncLayout, this);
    this.scene.events.once('shutdown', this.destroy, this);
    this.syncLayout();
    this.render();
  }

  private element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  private button(label: string, action: () => void, className = 'phone-action'): HTMLButtonElement {
    const button = this.element('button', className, label);
    button.type = 'button';
    button.addEventListener('click', () => {
      SoundManager.getInstance().playClick();
      action();
    });
    return button;
  }

  private card(title: string, detail: string, badge?: string) {
    const card = this.element('article', 'phone-card');
    card.append(this.element('h3', 'phone-card-title', title));
    if (detail) card.append(this.element('p', 'phone-card-detail', detail));
    if (badge) card.append(this.element('span', 'phone-badge', badge));
    this.viewport.append(card);
    return card;
  }

  public syncLayout() {
    const canvas = this.scene.game.canvas.getBoundingClientRect();
    const overlay = this.layer.parentElement!.getBoundingClientRect();
    const scale = canvas.width / GAME_WIDTH;
    this.phone.style.left = canvas.left - overlay.left + PHONE_LAYOUT.x * scale + 'px';
    this.phone.style.top = canvas.top - overlay.top + PHONE_LAYOUT.y * scale + 'px';
    this.phone.style.transform = 'scale(' + scale + ')';
    Object.assign(this.backdrop.style, {
      left: canvas.left - overlay.left + 'px',
      top: canvas.top - overlay.top + 'px',
      width: canvas.width + 'px',
      height: canvas.height + 'px'
    });
  }

  public toggle(force?: boolean) {
    const next = force ?? !this.isOpen;
    if (next === this.isOpen) return;
    this.isOpen = next;
    this.closeTimer?.remove(false);
    if (next) {
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
      this.layer.classList.remove('is-closing');
      this.syncLayout();
      this.render();
      this.closeButton.focus({ preventScroll: true });
    } else {
      this.layer.classList.add('is-closing');
      this.closeTimer = this.scene.time.delayedCall(PHONE_LAYOUT.closeDurationMs, () => {
        this.layer.hidden = true;
        for (const key of this.pausedScenes) {
          this.scene.scene.get(key).input.keyboard?.resetKeys();
          this.scene.scene.resume(key);
        }
        this.pausedScenes.clear();
        this.scene.input.keyboard?.resetKeys();
        this.previousFocus?.focus({ preventScroll: true });
      });
    }
  }

  public openTo(tab: PhoneTab) {
    this.activeTab = tab;
    this.toggle(true);
    this.render();
  }

  public render() {
    const player = this.getPlayer();
    if (!player) return;
    const vehicle = VehicleShopManager.getInstance().getVehicleById(player.stats.currentVehicleId);
    this.profile.textContent = '💰 ' + player.stats.wallet.toLocaleString('vi-VN') + 'đ  •  ★ ' +
      player.stats.rating.toFixed(1) + '\n' + (vehicle?.name ?? 'Wave Alpha') + ' • ' +
      player.stats.completedOrders + ' đơn đã giao';
    const previousScroll = this.positions[this.activeTab];
    this.tabs.replaceChildren();
    const tabs: { id: PhoneTab; label: string }[] = [
      { id: 'ORDERS', label: 'Đơn hàng' },
      { id: 'SHOP_BIKE', label: 'Xe & đồ dùng' },
      { id: 'SHOP_FURNITURE', label: 'Nội thất' }
    ];
    for (const tab of tabs) {
      const button = this.button(tab.label, () => {
        this.positions[this.activeTab] = this.viewport.scrollTop;
        this.activeTab = tab.id;
        this.render();
        this.tabs.querySelector<HTMLButtonElement>('[data-tab="' + tab.id + '"]')?.focus({ preventScroll: true });
      }, 'phone-tab');
      button.dataset.tab = tab.id;
      button.setAttribute('aria-pressed', String(this.activeTab === tab.id));
      this.tabs.append(button);
    }
    this.viewport.replaceChildren();
    if (this.activeTab === 'ORDERS') this.renderOrders();
    else if (this.activeTab === 'SHOP_BIKE') this.renderVehicles(player);
    else this.renderFurniture(player);
    if (this.isOpen) this.viewport.scrollTop = previousScroll;
    requestAnimationFrame(() => {
      if (!this.isOpen) return;
      this.viewport.scrollTop = previousScroll;
      this.updateFooter();
    });
  }

  private renderOrders() {
    const orders = OrderManager.getInstance();
    const stats = this.getPlayer()?.stats;
    if (stats && (stats.day <= WEEK_CONFIG.rentPeriodDays || WeekManager.progress(stats).rentDebt > 0)) {
      const progress = WeekManager.progress(stats);
      const deliveries = WeekManager.deliveriesToday(stats);
      const debt = progress.rentDebt;
      const daysUntilRent = stats.day % WEEK_CONFIG.rentPeriodDays === 0
        ? 0 : WEEK_CONFIG.rentPeriodDays - stats.day % WEEK_CONFIG.rentPeriodDays;
      this.card(`Nhật ký ngày ${stats.day} • ${Math.min(deliveries, WEEK_CONFIG.dailyDeliveryGoal)}/${WEEK_CONFIG.dailyDeliveryGoal} đơn`,
        debt > 0 ? `Còn nợ cô Hạnh ${debt.toLocaleString('vi-VN')}đ tiền trọ.` :
          `Thưởng ${WEEK_CONFIG.dailyGoalBonus.toLocaleString('vi-VN')}đ khi giao đủ đơn hôm nay. ` +
          (daysUntilRent === 0 ? 'Hôm nay đến kỳ tiền trọ.' : `Còn ${daysUntilRent} ngày tới kỳ trọ ${WEEK_CONFIG.rentAmount.toLocaleString('vi-VN')}đ.`));
    }
    if (stats) {
      const request = FishingEconomyManager.dailyRequest(stats.day);
      const completed = stats.fishRequestCompletedDay === stats.day;
      const inBag = FishingEconomyManager.fishInBag(stats).some((fish) => fish.id === request.fishId);
      this.card(`🐟 Đơn cá tươi • Ngày ${stats.day}${completed ? ' ✓' : ''}`,
        completed ? 'Đã giao cá cho quán hôm nay. Ngày mai sẽ có yêu cầu mới.' :
          `${request.restaurantName} cần ${request.fishName}. Câu ở bến cuối ngõ rồi bán trực tiếp tại quầy.` +
          ` Thưởng thêm ${request.bonus.toLocaleString('vi-VN')}đ và thiện cảm.${inBag ? ' Cá đã có trong túi.' : ''}`);
    }
    const online = orders.getIsOnline();
    const toggle = this.button(online ? '● Đang online • Nhận đơn' : '○ Offline • Bật nhận đơn', () => {
      orders.setOnline(!online);
      this.render();
    }, 'phone-online-toggle');
    toggle.setAttribute('aria-pressed', String(online));
    this.viewport.append(toggle);
    const active = orders.getActiveOrders();
    const current = orders.getCurrentOrder();
    if (active.length > 0) {
      this.viewport.append(this.element('h3', 'phone-section-title',
        `${active.every((order) => order.status === OrderStatus.ACCEPTED) ? 'Đã nhận' : 'Đang chở'} ` +
        `${active.length}/${orders.getBatchCapacity()} đơn`));
      active.forEach((order) => this.renderOrderCard(order, true, current?.id === order.id));
      if (active.every((order) => order.status === OrderStatus.ACCEPTED) &&
        orders.getAvailableOrders().length > 0) {
        this.viewport.append(this.element('h3', 'phone-section-title', 'Ghép thêm • Cùng quán, khách gần nhau'));
        orders.getAvailableOrders().forEach((order) => this.renderOrderCard(order, false));
      }
    } else if (!online) {
      this.viewport.append(this.element('h3', 'phone-section-title', 'Chọn đơn'));
      this.card('Bạn đang nghỉ ca', 'Bật online khi sẵn sàng nhận đơn mới.');
    } else if (orders.getAvailableOrders().length === 0) {
      this.viewport.append(this.element('h3', 'phone-section-title', 'Chọn đơn'));
      this.card('Đang tìm đơn mới', 'Bạn có thể khám phá thành phố trong lúc chờ.');
    } else {
      this.viewport.append(this.element('h3', 'phone-section-title', 'Chọn một trong ba đơn'));
      orders.getAvailableOrders().forEach((order) => this.renderOrderCard(order, false));
    }
  }

  private renderOrderCard(order: Order, active: boolean, focused = false) {
    const card = this.card(order.restaurantName, 'Giao tới: ' + order.customerAddress);
    card.dataset.order = order.id;
    card.append(this.element('p', 'phone-food', order.foodName));
    const player = this.getPlayer();
    const maxSpeed = player
      ? VehicleShopManager.getInstance().getVehicleById(player.stats.currentVehicleId)?.maxSpeed ??
        DEFAULT_MOTORBIKE.maxSpeed : DEFAULT_MOTORBIKE.maxSpeed;
    const estimate = player ? DeliveryPlanner.estimateOrder(
      { x: player.x, y: player.y }, order, maxSpeed) : undefined;
    const customerAffection = player?.stats.relationships?.[customerId(order.customerName)]?.affection ?? 0;
    const fees = this.element('div', 'phone-fee-row');
    fees.append(this.element('strong', 'phone-fee', '+' + order.deliveryFee.toLocaleString('vi-VN') + 'đ'));
    if (order.isRushHour) fees.append(this.element('span', 'phone-badge', 'Cao điểm'));
    if (order.isRainSurged) fees.append(this.element('span', 'phone-badge', 'Mưa +50%'));
    if (order.serviceType === 'express') fees.append(this.element('span', 'phone-badge', 'Giao nhanh'));
    if (order.serviceType === 'careful') fees.append(this.element('span', 'phone-badge', 'Dễ đổ'));
    if (order.deliveryMode === 'apartment') fees.append(this.element('span', 'phone-badge', 'Giao tận cửa'));
    if (customerAffection >= SOCIAL_CONFIG.familiarThreshold)
      fees.append(this.element('span', 'phone-badge', 'Khách quen • boa thêm'));
    card.append(fees);
    if (estimate && player) {
      card.append(this.element('p', 'phone-card-detail',
        `📍 ${estimate.distanceMeters.toLocaleString('vi-VN')}m ` +
        `${order.status === OrderStatus.PICKED_UP ? 'tới khách' : 'qua quán tới khách'} • ` +
        `khoảng ${estimate.gameHours.toFixed(1)} giờ game`));
      card.append(this.element('p', 'phone-card-detail',
        `⛽ Xăng khoảng ${estimate.fuelPercent}% • ⚡ Sức khoảng ${estimate.energyPercent}%`));
      if (!active && (player.stats.fuel < estimate.fuelPercent + DELIVERY_CONFIG.lowResourceReserve ||
        player.stats.energy < estimate.energyPercent + DELIVERY_CONFIG.lowResourceReserve)) {
        card.append(this.element('p', 'phone-card-detail', 'Nên nghỉ hoặc đổ xăng trước khi nhận tuyến này.'));
      }
    }
    if (order.serviceType === 'express') card.append(this.element('p', 'phone-card-detail',
      `Thưởng ${DELIVERY_CONFIG.expressBonus.toLocaleString('vi-VN')}đ nếu giao trong ` +
      `${(order.deadlineGameHours ?? (estimate ? DeliveryPlanner.expressDeadline(estimate) : DELIVERY_CONFIG.expressDeadlineHours)).toFixed(1)} giờ game. ` +
      (active ? `Còn ${Math.max(0, (order.deadlineGameHours ?? DELIVERY_CONFIG.expressDeadlineHours) -
        (order.elapsedGameHours ?? 0)).toFixed(1)} giờ.` : 'Tính từ lúc nhận đơn.')));
    if (order.serviceType === 'careful') card.append(this.element('p', 'phone-card-detail',
      `Thưởng ${DELIVERY_CONFIG.carefulBonus.toLocaleString('vi-VN')}đ nếu món còn ít nhất ${DELIVERY_CONFIG.carefulIntegrityThreshold}% nguyên vẹn.`));
    if (active) {
      if (focused) card.classList.add('phone-card-active');
      card.append(this.element('p', 'phone-card-detail',
        order.status === OrderStatus.PICKED_UP ? `Chất lượng món: ${order.currentIntegrity}%` :
          'Đã nhận • Chưa lấy món'));
      card.append(this.element('p', 'phone-active-hint', order.status === OrderStatus.ACCEPTED
        ? 'Vào quán, gặp người bán để lấy món.' : order.status === OrderStatus.DELIVERED
          ? 'Hoàn tất bảng thưởng để nhận tiền.' : 'Theo la bàn tới khách, gặp người xuống nhận món.'));
      if (order.fragility > 1.3) card.append(this.element('p', 'phone-card-detail', 'Món dễ đổ: đi chậm khi qua ổ gà.'));
      if (order.status === OrderStatus.PICKED_UP && !focused) {
        card.append(this.button('Chọn giao đơn này', () => {
          if (OrderManager.getInstance().focusOrder(order.id)) this.render();
        }));
      }
    } else {
      const batch = OrderManager.getInstance().getActiveOrders().length > 0;
      const accept = this.button(batch ? 'Nhận ghép' : 'Nhận đơn', () => {
        if (!OrderManager.getInstance().acceptOrder(order.id)) return;
        SoundManager.getInstance().playOrderChime();
        this.render();
        this.onOrderAccepted();
        this.showToast(batch ? 'Đã ghép thêm đơn gần khách. Cùng tới quán lấy món.' :
          'Đã nhận đơn ' + order.foodName + '. Theo la bàn tới quán.');
      });
      accept.disabled = !OrderManager.getInstance().canAcceptOrder(order);
      accept.dataset.action = 'accept';
      card.append(accept);
      if (batch && accept.disabled) card.append(this.element('p', 'phone-card-detail',
        OrderManager.getInstance().getActiveOrders().length >= OrderManager.getInstance().getBatchCapacity()
          ? 'Túi giữ nhiệt đã đầy. Nâng cấp túi để chở thêm đơn.' :
            'Điểm giao này quá xa đơn đang chở.'));
    }
  }

  private renderVehicles(player: Player) {
    const shop = VehicleShopManager.getInstance();
    this.viewport.append(this.element('h3', 'phone-section-title', 'Phương tiện giao hàng'));
    for (const vehicle of shop.getVehiclesCatalog()) {
      const equipped = player.stats.currentVehicleId === vehicle.id;
      const owned = player.stats.ownedVehicleIds.includes(vehicle.id);
      const card = this.card(vehicle.name, vehicle.description ?? '');
      card.dataset.vehicle = vehicle.id;
      card.append(this.element('p', 'phone-specs',
        vehicle.maxSpeed + ' px/s • Giảm xóc ' + Math.round(vehicle.cargoDamping * 100) + '%'));
      const button = this.button(equipped ? 'Đang sử dụng' : owned ? 'Chọn xe này'
        : 'Mua • ' + (vehicle.price ?? 0).toLocaleString('vi-VN') + 'đ', () => {
        if (owned) {
          shop.equipVehicle(player, vehicle.id);
          this.showToast('Đã đổi sang ' + vehicle.name);
        } else this.showToast(shop.buyVehicle(player, vehicle.id).message);
        this.render();
      }, 'phone-action phone-action-secondary');
      button.disabled = equipped;
      card.append(button);
    }
    this.viewport.append(this.element('h3', 'phone-section-title', 'Trang bị tài xế'));
    const bag = GEAR_CATALOG.thermalBag.find((item) => item.level === player.stats.thermalBagLevel + 1);
    const bagCard = this.card('Balo giữ nhiệt • Cấp ' + player.stats.thermalBagLevel + '/3',
      `Sức chứa hiện tại: ${OrderManager.getInstance().getBatchCapacity()} đơn. ` +
      (bag ? bag.desc : 'Đã nâng cấp tối đa.'));
    bagCard.dataset.gear = 'thermalBag';
    if (bag) bagCard.append(this.button('Nâng cấp • ' + bag.price.toLocaleString('vi-VN') + 'đ', () => {
      this.showToast(shop.upgradeThermalBag(player).message);
      this.render();
    }));
    const mount = GEAR_CATALOG.phoneMount.find((item) => item.level === player.stats.phoneMountLevel + 1);
    const mountCard = this.card('Giá điện thoại • Cấp ' + player.stats.phoneMountLevel + '/3',
      mount ? mount.desc : 'Đã nâng cấp tối đa.');
    mountCard.dataset.gear = 'phoneMount';
    if (mount) mountCard.append(this.button('Nâng cấp • ' + mount.price.toLocaleString('vi-VN') + 'đ', () => {
      this.showToast(shop.upgradePhoneMount(player).message);
      this.render();
    }));
  }

  private renderFurniture(player: Player) {
    const furniture = FurnitureManager.getInstance();
    this.viewport.append(this.element('h3', 'phone-section-title', 'Trang trí phòng trọ'));
    for (const item of furniture.getCatalog()) {
      const placed = player.stats.ownedFurnitureIds.includes(item.id);
      const inBag = furniture.bagQuantity(player.stats, item.id);
      const status = placed || inBag ? `Đã đặt: ${placed ? 'Có' : 'Chưa'} • Trong túi: ${inBag}` : undefined;
      const card = this.card(item.icon + ' ' + item.name, item.buffDescription, status);
      card.dataset.furniture = item.id;
      const button = this.button('Mua • ' + item.price.toLocaleString('vi-VN') + 'đ', () => {
        this.showToast(furniture.buyFurniture(player, item.id).message);
        this.render();
      }, 'phone-action phone-action-secondary');
      card.append(button);
    }
  }

  private updateFooter() {
    if (this.feedbackTimer) return;
    const max = this.viewport.scrollHeight - this.viewport.clientHeight;
    this.footer.textContent = max <= 1 ? 'TAB hoặc ESC để đóng'
      : this.viewport.scrollTop >= max - 2 ? 'Đã tới cuối • Cuộn lên để xem lại'
        : 'Cuộn chuột hoặc kéo để xem thêm ↓';
  }

  public notify(message: string) {
    this.feedbackTimer?.remove(false);
    this.footer.classList.add('is-feedback');
    this.footer.setAttribute('aria-live', 'polite');
    this.footer.textContent = message;
    this.feedbackTimer = this.scene.time.delayedCall(2800, () => {
      this.feedbackTimer = undefined;
      this.footer.classList.remove('is-feedback');
      this.updateFooter();
    });
  }

  public destroy() {
    this.closeTimer?.remove(false);
    this.feedbackTimer?.remove(false);
    this.scene.scale.off('resize', this.syncLayout, this);
    window.removeEventListener('keydown', this.handleWindowKey, true);
    this.layer.remove();
  }
}
