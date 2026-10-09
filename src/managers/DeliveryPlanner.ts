import {
  DAY_NIGHT_CONFIG, DELIVERY_CONFIG, FUEL_CONFIG, VITALS_CONFIG
} from '../config/GameConfig';
import { Order, OrderStatus, RouteEstimate } from '../types';

interface RoutePoint { x: number; y: number }

export class DeliveryPlanner {
  public static routePixels(start: RoutePoint, pickup: RoutePoint, destination: RoutePoint): number {
    return Math.abs(start.x - pickup.x) + Math.abs(start.y - pickup.y) +
      Math.abs(pickup.x - destination.x) + Math.abs(pickup.y - destination.y);
  }

  public static estimate(start: RoutePoint, pickup: RoutePoint, destination: RoutePoint,
    maxSpeed: number): RouteEstimate {
    const pixels = this.routePixels(start, pickup, destination);
    const cruiseSpeed = Math.max(1, maxSpeed * DELIVERY_CONFIG.cruisingSpeedFactor);
    const seconds = pixels / cruiseSpeed * DELIVERY_CONFIG.routeDelayFactor;
    const fuelRate = FUEL_CONFIG.idleConsumptionRate * 0.5 +
      cruiseSpeed * FUEL_CONFIG.speedConsumptionFactor;
    return {
      distanceMeters: Math.round(pixels / DELIVERY_CONFIG.pixelsPerMeter),
      gameHours: Math.round(seconds / DAY_NIGHT_CONFIG.secondsPerGameHour * 10) / 10,
      fuelPercent: Math.ceil(seconds * fuelRate * DELIVERY_CONFIG.routeFuelFactor),
      energyPercent: Math.ceil(seconds * VITALS_CONFIG.energyDecayRateMounted *
        DELIVERY_CONFIG.routeEnergyFactor)
    };
  }

  public static estimateOrder(start: RoutePoint, order: Order, maxSpeed: number): RouteEstimate {
    const pickup = order.status === OrderStatus.PICKED_UP || order.status === OrderStatus.DELIVERED
      ? start : order.restaurantPos;
    return this.estimate(start, pickup, order.customerPos, maxSpeed);
  }

  public static distanceFee(pickup: RoutePoint, destination: RoutePoint): number {
    const meters = this.routePixels(pickup, pickup, destination) / DELIVERY_CONFIG.pixelsPerMeter;
    const extraMeters = Math.max(0, meters - DELIVERY_CONFIG.distanceFeeFreeMeters);
    return Math.min(DELIVERY_CONFIG.maxDistanceFee,
      Math.ceil(extraMeters / DELIVERY_CONFIG.distanceFeeStepMeters) * DELIVERY_CONFIG.distanceFeePerStep);
  }

  public static expressDeadline(estimate: RouteEstimate): number {
    const hours = estimate.gameHours * DELIVERY_CONFIG.expressPaceFactor +
      DELIVERY_CONFIG.expressBufferHours;
    return Math.min(DELIVERY_CONFIG.expressMaxHours,
      Math.max(DELIVERY_CONFIG.expressMinHours, Math.ceil(hours * 10) / 10));
  }
}
