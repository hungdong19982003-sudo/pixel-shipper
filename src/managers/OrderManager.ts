import Phaser from 'phaser';
import { CustomerTemplate, Order, OrderStatus, RestaurantTemplate } from '../types';
import {
  RESTAURANT_CATALOG, CUSTOMER_CATALOG, DAY_NIGHT_CONFIG, DELIVERY_CONFIG,
  MAP_LOCATIONS, DEFAULT_MOTORBIKE, BATCH_CONFIG
} from '../config/GameConfig';
import { IntegrityManager } from './IntegrityManager';
import { SoundManager } from '../assets/SoundManager';

import { TimeManager } from './TimeManager';
import { WeatherManager } from './WeatherManager';
import { SocialManager } from './SocialManager';
import { DeliveryPlanner } from './DeliveryPlanner';
import { VehicleShopManager } from './VehicleShopManager';
import type { RestaurantScene } from '../scenes/RestaurantScene';
import type { ApartmentScene } from '../scenes/ApartmentScene';
import type { CityScene } from '../scenes/CityScene';

/**
 * Trình quản lý Vòng đời & Sinh Đơn hàng Đa dạng (Task 1.6: Order Generator)
 */
export class OrderManager {
  private static instance: OrderManager;
  private scene?: Phaser.Scene;
  private isOnline: boolean = true;
  private currentOrder: Order | null = null;
  private activeOrders: Order[] = [];
  private availableOrders: Order[] = [];
  private orderCounter: number = 101;

  private constructor() {}

  public static getInstance(): OrderManager {
    if (!OrderManager.instance) {
      OrderManager.instance = new OrderManager();
    }
    return OrderManager.instance;
  }

  public init(scene: Phaser.Scene) {
    this.scene = scene;
    this.isOnline = true;
    this.currentOrder = null;
    this.activeOrders = [];
    this.availableOrders = [];

    this.refillAvailableOrders(DELIVERY_CONFIG.offerCount);
  }

  /**
   * Sinh ngẫu nhiên một đơn hàng từ hệ thống quán ăn & khách hàng Á Đông
   */
  public generateRandomOrder(requestedType?: NonNullable<Order['serviceType']>,
    forcedRestaurant?: RestaurantTemplate, forcedCustomer?: CustomerTemplate): Order {
    const serviceType: NonNullable<Order['serviceType']> = requestedType ??
      (['standard', 'express', 'careful'] as const)[(this.orderCounter - 101) % 3];
    const player = (this.scene as CityScene | undefined)?.player;
    const origin = player ? { x: player.x, y: player.y } : MAP_LOCATIONS.BOARDING_HOUSE;
    const candidates = RESTAURANT_CATALOG.flatMap((restaurant) =>
      CUSTOMER_CATALOG.map((customer) => ({ restaurant, customer })))
      .filter(({ restaurant, customer }) => !this.availableOrders.some((existing) =>
      existing.restaurantName === restaurant.name && existing.customerName === customer.name));
    candidates.sort((a, b) =>
      DeliveryPlanner.routePixels(origin, a.restaurant.pos, a.customer.pos) -
      DeliveryPlanner.routePixels(origin, b.restaurant.pos, b.customer.pos));
    const targetIndex = Math.floor((candidates.length - 1) *
      DELIVERY_CONFIG.offerRoutePercentiles[serviceType]);
    const candidateIndex = Math.max(0, Math.min(candidates.length - 1,
      targetIndex + Phaser.Math.Between(-DELIVERY_CONFIG.offerRouteJitterCount,
        DELIVERY_CONFIG.offerRouteJitterCount)));
    const selected = forcedRestaurant && forcedCustomer ?
      { restaurant: forcedRestaurant, customer: forcedCustomer } : candidates[candidateIndex] ?? {
      restaurant: Phaser.Utils.Array.GetRandom(RESTAURANT_CATALOG),
      customer: Phaser.Utils.Array.GetRandom(CUSTOMER_CATALOG)
    };
    const { restaurant, customer } = selected;
    const dish = Phaser.Utils.Array.GetRandom(restaurant.dishes);
    const orderId = `ORD-${this.orderCounter++}`;

    // Áp dụng phụ phí Giờ Cao Điểm (Task 2.1) & Phụ phí Mưa gió (Task 2.2)
    const timeMult = TimeManager.getInstance().getRushHourBonusMultiplier();
    const weatherMult = WeatherManager.getInstance().getSurchargeMultiplier();
    const isRushHour = TimeManager.getInstance().isRushHour();
    const isRainSurged = WeatherManager.getInstance().isRaining();

    const distanceFee = DeliveryPlanner.distanceFee(restaurant.pos, customer.pos);
    const deliveryFee = Math.round((dish.baseFee + distanceFee) * timeMult * weatherMult);

    const order: Order = {
      id: orderId,
      restaurantName: restaurant.name,
      restaurantPos: { x: restaurant.pos.x, y: restaurant.pos.y },
      customerName: customer.name,
      customerAddress: customer.address,
      customerPos: { x: customer.pos.x, y: customer.pos.y },
      deliveryMode: customer.deliveryMode ?? 'street',
      foodName: dish.name,
      foodPrice: dish.price,
      baseDeliveryFee: dish.baseFee,
      deliveryDistanceMeters: Math.round(DeliveryPlanner.routePixels(
        restaurant.pos, restaurant.pos, customer.pos) / DELIVERY_CONFIG.pixelsPerMeter),
      deliveryFee,
      isRushHour,
      isRainSurged,
      serviceType,
      elapsedGameHours: 0,
      fragility: serviceType === 'careful'
        ? Math.max(dish.fragility, DELIVERY_CONFIG.carefulFragilityMinimum) : dish.fragility,
      currentIntegrity: 100,
      status: OrderStatus.PENDING
    };

    return order;
  }

  /**
   * Bổ sung đơn hàng mới vào danh sách chờ
   */
  public refillAvailableOrders(targetCount: number = DELIVERY_CONFIG.offerCount) {
    if (!this.isOnline) return;
    for (const type of ['standard', 'express', 'careful'] as const) {
      if (this.availableOrders.length >= targetCount) break;
      if (!this.availableOrders.some((order) => order.serviceType === type)) {
        this.availableOrders.push(this.generateRandomOrder(type));
      }
    }
    while (this.availableOrders.length < targetCount) {
      const order = this.generateRandomOrder();
      this.availableOrders.push(order);
    }

    this.emitEvent('orders_pool_updated', { orders: this.availableOrders });
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public setOnline(status: boolean) {
    this.isOnline = status;
    if (this.isOnline && this.availableOrders.length === 0) {
      this.refillAvailableOrders(DELIVERY_CONFIG.offerCount);
      SoundManager.getInstance().playPhoneRing();
    }
    this.emitEvent('driver_online_changed', { isOnline: this.isOnline });
  }

  public getAvailableOrders(): Order[] {
    return this.availableOrders;
  }

  public getCurrentOrder(): Order | null {
    return this.currentOrder;
  }

  public getActiveOrders(): readonly Order[] {
    return this.activeOrders;
  }

  public getBatchCapacity(): number {
    const level = (this.scene as CityScene | undefined)?.player?.stats.thermalBagLevel ?? 1;
    return BATCH_CONFIG.capacityByBagLevel[Math.max(0,
      Math.min(BATCH_CONFIG.capacityByBagLevel.length - 1, level - 1))];
  }

  public canAcceptOrder(order: Order): boolean {
    if (!this.isOnline || order.status !== OrderStatus.PENDING ||
      !this.availableOrders.includes(order) || this.activeOrders.length >= this.getBatchCapacity()) return false;
    if (this.activeOrders.length === 0) return true;
    const lead = this.activeOrders[0];
    return this.activeOrders.every((active) => active.status === OrderStatus.ACCEPTED &&
      active.restaurantName === order.restaurantName && active.customerName !== order.customerName &&
      Phaser.Math.Distance.Between(active.customerPos.x, active.customerPos.y,
        order.customerPos.x, order.customerPos.y) <= BATCH_CONFIG.maxCustomerSeparationPx) &&
      lead.restaurantName === order.restaurantName;
  }

  public focusOrder(orderId: string): boolean {
    const order = this.activeOrders.find((active) => active.id === orderId &&
      active.status === OrderStatus.PICKED_UP);
    if (!order || this.currentOrder?.status === OrderStatus.DELIVERED) return false;
    this.currentOrder = order;
    this.emitEvent('order_status_changed', { order });
    return true;
  }

  private makeBatchOffers(lead: Order): Order[] {
    const restaurant = RESTAURANT_CATALOG.find((entry) => entry.name === lead.restaurantName);
    if (!restaurant) return [];
    const nearby = CUSTOMER_CATALOG.filter((customer) => customer.name !== lead.customerName &&
      Phaser.Math.Distance.Between(customer.pos.x, customer.pos.y,
        lead.customerPos.x, lead.customerPos.y) <= BATCH_CONFIG.maxCustomerSeparationPx)
      .sort((a, b) => Phaser.Math.Distance.Between(a.pos.x, a.pos.y,
        lead.customerPos.x, lead.customerPos.y) - Phaser.Math.Distance.Between(b.pos.x, b.pos.y,
        lead.customerPos.x, lead.customerPos.y));
    const first = nearby[0];
    const second = nearby.find((customer) => customer !== first && first &&
      Phaser.Math.Distance.Between(customer.pos.x, customer.pos.y,
        first.pos.x, first.pos.y) <= BATCH_CONFIG.maxCustomerSeparationPx);
    return [first, second].filter((customer): customer is CustomerTemplate => Boolean(customer))
      .slice(0, BATCH_CONFIG.extraOffers)
      .map((customer) => this.generateRandomOrder('standard', restaurant, customer));
  }

  public update(deltaMs: number): void {
    for (const order of this.activeOrders) {
      if (order.status !== OrderStatus.ACCEPTED && order.status !== OrderStatus.PICKED_UP) continue;
      order.elapsedGameHours = (order.elapsedGameHours ?? 0) +
        deltaMs / 1000 / DAY_NIGHT_CONFIG.secondsPerGameHour;
    }
  }

  public getServiceBonus(order: Order): { amount: number; label: string } {
    if (order.serviceType === 'express') {
      const onTime = (order.elapsedGameHours ?? 0) <=
        (order.deadlineGameHours ?? DELIVERY_CONFIG.expressDeadlineHours);
      return { amount: onTime ? DELIVERY_CONFIG.expressBonus : 0,
        label: onTime ? 'Thưởng giao nhanh' : 'Hết thời gian thưởng giao nhanh' };
    }
    if (order.serviceType === 'careful') {
      const safe = order.currentIntegrity >= DELIVERY_CONFIG.carefulIntegrityThreshold;
      return { amount: safe ? DELIVERY_CONFIG.carefulBonus : 0,
        label: safe ? 'Thưởng giữ món nguyên vẹn' : 'Chưa đạt mức thưởng món dễ đổ' };
    }
    return { amount: 0, label: 'Đơn thường' };
  }

  /**
   * Tài xế bấm Nhận đơn trên smartphone
   */
  public acceptOrder(orderId: string): boolean {
    const order = this.availableOrders.find((o) => o.id === orderId);
    if (!order || !this.canAcceptOrder(order)) return false;
    const first = this.activeOrders.length === 0;

    if (order.serviceType === 'express') {
      const player = (this.scene as CityScene | undefined)?.player;
      const origin = player ? { x: player.x, y: player.y } : MAP_LOCATIONS.BOARDING_HOUSE;
      const maxSpeed = player
        ? VehicleShopManager.getInstance().getVehicleById(player.stats.currentVehicleId)?.maxSpeed ??
          DEFAULT_MOTORBIKE.maxSpeed : DEFAULT_MOTORBIKE.maxSpeed;
      order.deadlineGameHours = DeliveryPlanner.expressDeadline(
        DeliveryPlanner.estimateOrder(origin, order, maxSpeed));
    }

    order.status = OrderStatus.ACCEPTED;
    this.activeOrders.push(order);
    if (first) this.currentOrder = order;
    this.availableOrders = first ? this.makeBatchOffers(order) :
      this.availableOrders.filter((o) => o.id !== orderId);

    // Bắt đầu gán đơn vào IntegrityManager
    this.emitEvent('orders_pool_updated', { orders: this.availableOrders });

    this.emitEvent('order_accepted', { order });
    this.emitEvent('order_status_changed', { order });
    return true;
  }

  /**
   * Kiểm tra người chơi có đang đứng trong bán kính lấy món tại Quán ăn (< 65px)
   */
  public canPickup(playerX: number, playerY: number): boolean {
    if (!this.currentOrder || this.currentOrder.status !== OrderStatus.ACCEPTED) return false;
    const dist = Phaser.Math.Distance.Between(
      playerX,
      playerY,
      this.currentOrder.restaurantPos.x,
      this.currentOrder.restaurantPos.y
    );
    return dist <= 75;
  }

  /**
   * Tài xế bấm E tại Quán ăn để lấy món
   */
  public pickupFood(restaurantName?:string): boolean {
    if (!this.currentOrder || this.currentOrder.status !== OrderStatus.ACCEPTED) return false;
    if(restaurantName!==this.currentOrder.restaurantName||!this.scene) return false;
    const scenes=this.scene.game.scene;
    if(!scenes.isActive('RestaurantScene')&&!scenes.isPaused('RestaurantScene')) return false;
    const interior=this.scene.game.scene.getScene('RestaurantScene') as RestaurantScene;
    if(interior.restaurant.name!==restaurantName||!interior.canTalkToSeller()) return false;

    const picked = this.activeOrders.filter((order) => order.status === OrderStatus.ACCEPTED &&
      order.restaurantName === restaurantName);
    for (const order of picked) {
      order.status = OrderStatus.PICKED_UP;
      order.currentIntegrity = 100;
    }
    this.availableOrders = [];
    IntegrityManager.getInstance().setActiveOrders(this.activeOrders);
    const city=this.scene as CityScene;
    for (const _order of picked) SocialManager.getInstance().collected(city.player.stats,interior.restaurant);

    this.emitEvent('order_picked_up', { order: this.currentOrder, count: picked.length });
    this.emitEvent('order_status_changed', { order: this.currentOrder });
    return true;
  }

  /**
   * Kiểm tra người chơi có đang đứng trong bán kính bàn giao tại Nhà khách (< 80px)
   */
  public canDeliver(playerX: number, playerY: number): boolean {
    if (!this.currentOrder || this.currentOrder.status !== OrderStatus.PICKED_UP) return false;
    if (this.currentOrder.deliveryMode === 'apartment') {
      if (!this.scene?.game.scene.isActive('ApartmentScene')) return false;
      const apartment = this.scene.game.scene.getScene('ApartmentScene') as ApartmentScene;
      return apartment.canDeliverToDoor();
    }
    const dist = Phaser.Math.Distance.Between(
      playerX,
      playerY,
      this.currentOrder.customerPos.x,
      this.currentOrder.customerPos.y
    );
    return dist <= 85 && Boolean((this.scene as CityScene)?.population?.isCustomerReady(this.currentOrder.customerName));
  }

  /**
   * Tài xế bấm E tại Nhà khách để bàn giao đơn hàng
   */
  public deliverOrder(customerName?:string): boolean {
    if (!this.currentOrder || this.currentOrder.status !== OrderStatus.PICKED_UP) return false;
    const city=this.scene as CityScene;
    if(customerName!==this.currentOrder.customerName||!this.canDeliver(city.player.x,city.player.y)) return false;

    this.currentOrder.status = OrderStatus.DELIVERED;
    const deliveredOrder = this.currentOrder;
    IntegrityManager.getInstance().setActiveOrders(this.activeOrders);
    SocialManager.getInstance().delivered(city.player.stats,customerName,deliveredOrder.currentIntegrity);

    this.emitEvent('order_delivered', { order: deliveredOrder });
    this.emitEvent('order_status_changed', { order: deliveredOrder });
    return true;
  }

  /**
   * Hoàn tất quyết toán: Giải phóng đơn hiện tại và tự động sinh thêm đơn mới (Task 1.6)
   */
  public completeSettlement() {
    if (this.currentOrder) {
      this.currentOrder.status = OrderStatus.SETTLED;
      this.activeOrders = this.activeOrders.filter((order) => order !== this.currentOrder);
    }
    const player = (this.scene as CityScene | undefined)?.player;
    this.currentOrder = this.activeOrders.filter((order) => order.status === OrderStatus.PICKED_UP)
      .sort((a, b) => player ?
        Phaser.Math.Distance.Between(player.x, player.y, a.customerPos.x, a.customerPos.y) -
        Phaser.Math.Distance.Between(player.x, player.y, b.customerPos.x, b.customerPos.y) : 0)[0] ??
      this.activeOrders[0] ?? null;
    IntegrityManager.getInstance().setActiveOrders(this.activeOrders);
    this.emitEvent('order_status_changed', { order: this.currentOrder });
    if (this.scene && this.activeOrders.length === 0) {
      this.scene.time.delayedCall(2500, () => {
        if (this.isOnline) {
          this.refillAvailableOrders(DELIVERY_CONFIG.offerCount);
          SoundManager.getInstance().playPhoneRing();
          this.emitEvent('new_order_ready', { count: this.availableOrders.length });
        }
      });
    }
  }

  private emitEvent(eventName: string, data: any) {
    if (this.scene) {
      this.scene.events.emit(eventName, data);
      // Phát sự kiện toàn cục tới Game EventBus
      this.scene.game.events.emit(eventName, data);
    }
  }
}
