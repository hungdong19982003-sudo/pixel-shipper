export enum PlayerState {
  ON_FOOT = 'ON_FOOT',
  MOUNTED = 'MOUNTED'
}

export enum TimePeriod {
  MORNING = 'MORNING',           // 06:00 - 11:30
  NOON_RUSH = 'NOON_RUSH',       // 11:30 - 13:30 (Cao điểm trưa)
  AFTERNOON = 'AFTERNOON',       // 13:30 - 16:30
  SUNSET = 'SUNSET',             // 16:30 - 18:30 (Hoàng hôn)
  EVENING_RUSH = 'EVENING_RUSH', // 18:30 - 20:30 (Cao điểm tối)
  NIGHT = 'NIGHT'                // 20:30 - 06:00 (Đêm khuya phố lên đèn)
}

export enum WeatherType {
  CLEAR = 'CLEAR',
  RAIN = 'RAIN'
}

export interface PlayerStats {
  wallet: number;
  rating: number;
  completedOrders: number;
  day: number;
  hunger: number;
  thirst: number;
  energy: number;
  fuel: number; // 0 - 100% dung tích bình xăng
  // Hệ thống Nuôi mèo (Task 2.3: Pet System)
  catAffection: number;     // 0 - 100 độ thân thiết
  hasPetToday: boolean;     // Đã vuốt ve hôm nay chưa
  hasFedToday: boolean;     // Đã cho ăn hôm nay chưa
  luckyBuffActive: boolean; // Buff mèo may mắn (+30% tỉ lệ khách tip, +25% tiền tip)
  // Mua sắm & Nâng cấp Phương tiện (Task 2.4)
  currentVehicleId: string;
  ownedVehicleIds: string[];
  thermalBagLevel: number;  // 1: Balo thường, 2: Balo bạc (+20%), 3: Balo Pro Foam (+45%)
  phoneMountLevel: number;  // 1: Túi quần, 2: Giá ghi-đông, 3: MagSafe chống rung
  // Trang trí Phòng trọ (Task 2.5)
  ownedFurnitureIds: string[];
  relationships: Record<string, RelationshipProgress>;
  inventory: InventoryItem[];
  furniturePlacements: FurniturePlacement[];
  trafficViolations: number;
  fishRequestCompletedDay: number;
  storyProgress?: StoryProgress;
}

export interface StoryProgress {
  introSeen: boolean;
  landladyVisitCount: number;
  lastLandladyVisitDay: number;
  lastRentDay: number;
  rentDebt: number;
  lastStoryDay: number;
  dayStartOrders: number;
  lastRewardedDay: number;
  firstWeekCompleted: boolean;
}

export interface FishRequest {
  fishId: string;
  fishName: string;
  restaurantName: string;
  bonus: number;
}

export type InventoryCategory = 'consumable' | 'furniture' | 'fishing_gear' | 'fish' | 'misc';

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  quantity: number;
  category: InventoryCategory;
  description?: string;
  hunger?: number;
  thirst?: number;
  energy?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface FurniturePlacement {
  itemId: string;
  x: number;
  y: number;
}

export interface RelationshipProgress {
  affection: number;
  lastTalkDay: number;
  purchases: number;
  deliveries: number;
}

export interface ConversationAction {
  id: string;
  label: string;
  disabled?: boolean;
  run: () => void;
}

export interface ConversationModel {
  name: string;
  role: string;
  texture: string;
  affection: number;
  message: string;
  actions: ConversationAction[];
  onClose?: () => void;
  showAffection?: boolean;
}

export interface NpcDefinition {
  id: string;
  name: string;
  role: 'pedestrian' | 'dog' | 'customer';
  variant: number;
  route: { x: number; y: number }[];
  speed: number;
}

export interface TrafficDefinition {
  id: string;
  axis: 'horizontal' | 'vertical';
  direction: 1 | -1;
  speed: number;
  variant: number;
  motorbike: boolean;
  pos: { x: number; y: number };
}

export interface SaveData {
  wallet: number;
  rating: number;
  completedOrders: number;
  day: number;
  hunger: number;
  thirst: number;
  energy: number;
  fuel: number;
  catAffection?: number;
  hasPetToday?: boolean;
  hasFedToday?: boolean;
  luckyBuffActive?: boolean;
  currentVehicleId?: string;
  ownedVehicleIds?: string[];
  thermalBagLevel?: number;
  phoneMountLevel?: number;
  ownedFurnitureIds?: string[];
  relationships?: Record<string, RelationshipProgress>;
  inventory?: InventoryItem[];
  furniturePlacements?: FurniturePlacement[];
  trafficViolations?: number;
  fishRequestCompletedDay?: number;
  storyProgress?: StoryProgress;
  version?: number;
  savedAt: number;
}

export interface RestaurantTemplate {
  name: string;
  badgeColor: string;
  pos: { x: number; y: number };
  textureKey?: string;
  dishes: {
    name: string;
    price: number;
    baseFee: number;
    fragility: number;
  }[];
}

export interface CityBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  column: number;
  row: number;
  isPark: boolean;
}

export interface CityBuilding {
  x: number;
  y: number;
  texture: string;
  scale: number;
  footprintWidth: number;
  footprintHeight: number;
  kind: 'home' | 'shop' | 'landmark';
  label?: string;
  color?: string;
}

export interface CityDecoration {
  x: number;
  y: number;
  texture: string;
  scale: number;
  solid: boolean;
  footprintWidth: number;
  footprintHeight: number;
}

export interface CustomerTemplate {
  name: string;
  address: string;
  pos: { x: number; y: number };
  deliveryMode?: 'street' | 'apartment';
}

export interface VehicleConfig {
  id: string;
  name: string;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  turnSpeed: number;
  driftFactor: number;
  cargoDamping: number;
  price?: number;
  description?: string;
  badge?: string;
  fuelType?: 'GASOLINE' | 'ELECTRIC';
  fuelCapacity?: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  price: number;
  description: string;
  buffDescription: string;
  icon: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  SETTLED = 'SETTLED'
}

export interface Order {
  id: string;
  restaurantName: string;
  restaurantPos: { x: number; y: number };
  customerName: string;
  customerAddress: string;
  customerPos: { x: number; y: number };
  deliveryMode?: 'street' | 'apartment';
  foodName: string;
  foodPrice: number;
  deliveryFee: number;
  baseDeliveryFee?: number;
  isRushHour?: boolean;
  isRainSurged?: boolean;
  serviceType?: 'standard' | 'express' | 'careful';
  elapsedGameHours?: number;
  deadlineGameHours?: number;
  deliveryDistanceMeters?: number;
  fragility: number; // 1.0 = standard, > 1.0 = fragile (soup/tea)
  currentIntegrity: number; // 0.0 - 100.0%
  status: OrderStatus;
}

export interface RouteEstimate {
  distanceMeters: number;
  gameHours: number;
  fuelPercent: number;
  energyPercent: number;
}

export enum HazardType {
  POTHOLE = 'POTHOLE',
  OIL_SLICK = 'OIL_SLICK',
  DOG = 'DOG'
}

export interface SettlementResult {
  order: Order;
  stars: number;
  baseFee: number;
  tipFee: number;
  totalEarnings: number;
  reviewComment: string;
  luckyCatTipBonus?: number;
}
