import { VehicleConfig, RestaurantTemplate, CustomerTemplate } from '../types';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const PLAYER_NAME = 'Minh';

export const HUD_LAYOUT = {
  header: { x: 12, y: 12, width: 936, height: 38 },
  status: { x: 12, y: 58, width: 936, height: 42 },
  phoneButton: { x: 12, y: 12, width: 108, height: 38 },
  day: { x: 128, y: 12, width: 90, height: 38 },
  clock: { x: 226, y: 12, width: 250, height: 38 },
  district: { x: 484, y: 12, width: 204, height: 38 },
  inventory: { x: 696, y: 12, width: 112, height: 38 },
  settings: { x: 816, y: 12, width: 132, height: 38 },
  order: { x: 12, y: 58, width: 332, height: 42 },
  integrity: { x: 352, y: 58, width: 136, height: 42 },
  compass: { x: 496, y: 58, width: 224, height: 42 },
  luck: { x: 728, y: 58, width: 220, height: 42 },
  vehicle: { x: 724, y: GAME_HEIGHT - 58, width: 224, height: 46 },
  vitals: { x: 242, y: GAME_HEIGHT - 58, width: 476, height: 46 },
  minimap: { x: 12, y: 416, width: 140, height: 108 },
  toast: { x: GAME_WIDTH / 2, y: 220, width: 408 },
  warning: { x: GAME_WIDTH / 2, y: 462, width: 560 }
};

export const INVENTORY_CONFIG = { maxItems: 12, overlayWidth: 520, overlayHeight: 420 };

export const WEEK_CONFIG = {
  rentPeriodDays: 7,
  rentAmount: 80000,
  dailyDeliveryGoal: 1,
  dailyGoalBonus: 6000,
  fishMealHunger: 30,
  fishMealEnergy: 8,
  fishGiftAffection: 8,
  fishSaleAffection: 2,
  fishPrices: {
    fish_tilapia: 9000,
    fish_carp: 12000,
    fish_catfish: 15000,
    fish_koi: 30000
  } as Record<string, number>
};

export const DELIVERY_CONFIG = {
  expressDeadlineHours: 5,
  expressBonus: 8000,
  carefulIntegrityThreshold: 90,
  carefulBonus: 6000,
  carefulFragilityMinimum: 1.6,
  offerCount: 3,
  offerRouteJitterCount: 4,
  pixelsPerMeter: 6.4,
  cruisingSpeedFactor: 0.5,
  routeDelayFactor: 1.2,
  routeFuelFactor: 1.25,
  routeEnergyFactor: 1.2,
  offerRoutePercentiles: { standard: 0.05, express: 0.4, careful: 0.68 },
  distanceFeeFreeMeters: 300,
  distanceFeeStepMeters: 100,
  distanceFeePerStep: 800,
  maxDistanceFee: 14000,
  expressPaceFactor: 1.6,
  expressBufferHours: 0.8,
  expressMinHours: 2,
  expressMaxHours: 7,
  lowResourceReserve: 3
};

export const BATCH_CONFIG = {
  maxCustomerSeparationPx: 2400,
  extraOffers: 2,
  capacityByBagLevel: [1, 2, 3]
};

export const FISHING_CONFIG = {
  mapWidth: 1280,
  mapHeight: 960,
  entrance: { x: 640, y: 192 },
  returnGate: { x: 640, y: 112 },
  fishingSpot: { x: 704, y: 472 },
  bobber: { x: 862, y: 464 },
  interactionRadius: 78,
  biteDelayMinMs: 1800,
  biteDelayMaxMs: 3400,
  biteWindowMs: 3600,
  starterRod: {
    id: 'starter_fishing_rod',
    name: 'Cần câu tre',
    icon: '🎣',
    category: 'fishing_gear' as const,
    description: 'Cần câu tre Minh mượn ở bến.'
  }
};

export const FISH_MARKET_CONFIG = {
  requestedFish: [
    { id: 'fish_tilapia', name: 'Cá rô đồng' },
    { id: 'fish_carp', name: 'Cá chép' },
    { id: 'fish_catfish', name: 'Cá trê' }
  ],
  buyerNames: ['Quán Cơm Tấm Sườn Bì Chả', 'Hủ Tiếu Bến Gió', 'Hải Sản Chợ Đêm'],
  bonus: 7000,
  bonusAffection: 4
};

export const PHONE_LAYOUT = {
  x: GAME_WIDTH - 320,
  y: 30,
  width: 304,
  height: 480,
  dragThreshold: 6,
  closeDurationMs: 180
};

export const WORLD_WIDTH = 6400;
export const WORLD_HEIGHT = 5120;
export const TILE_SIZE = 64;

// Road bands are shared by the world, district labels and radar.
export const CITY_LAYOUT = {
  horizontalRoads: [
    { tile: 7, lanes: 2, name: 'Phố Hàng Phở' },
    { tile: 20, lanes: 3, name: 'Đại Lộ Ánh Dương' },
    { tile: 34, lanes: 2, name: 'Phố Chợ Mới' },
    { tile: 47, lanes: 3, name: 'Đại Lộ Hoa Giấy' },
    { tile: 61, lanes: 2, name: 'Phố Bến Gió' },
    { tile: 74, lanes: 2, name: 'Đường Vườn Xanh' }
  ],
  verticalRoads: [
    { tile: 7, lanes: 2, name: 'Ngõ Yên Thái' },
    { tile: 21, lanes: 2, name: 'Phố Lồng Đèn' },
    { tile: 35, lanes: 3, name: 'Đại Lộ Trung Tâm' },
    { tile: 50, lanes: 2, name: 'Phố Hoa Sữa' },
    { tile: 64, lanes: 3, name: 'Đại Lộ Bình Minh' },
    { tile: 79, lanes: 2, name: 'Phố Phất Lộc' },
    { tile: 93, lanes: 2, name: 'Đường Ngoại Ô' }
  ],
  parkBlocks: ['3:0', '5:2', '1:4', '6:3'],
  buildingSpacing: 112,
  buildingRowSpacing: 184,
  doorOffset: 24,
  sidewalkWidth: 64,
  lampSpacing: 384,
  treeSpacing: 224,
  hazardSpacing: 960
};

export const MAP_LOCATIONS = {
  SPAWN_POINT: { x: 304, y: 480 },
  BIKE_SPAWN: { x: 384, y: 480 },
  PHO_RESTAURANT: { x: 304, y: 416, name: 'Quán Phở Bò Gia Truyền' },
  TEA_STALL: { x: 768, y: 416, name: 'Quán Trà Đá Vỉa Hè' },
  BANH_MI_CART: { x: 1088, y: 416, name: 'Xe Bánh Mì Patê Cột Đèn' },
  APARTMENT: { x: 3920, y: 2976, name: 'Chung Cư Xanh' },
  RESIDENCE_1: { x: 1056, y: 1248, name: 'Dãy Nhà Phố Cổ' },
  RESIDENCE_2: { x: 304, y: 1248, name: 'Khu Trọ Bình Dân' },
  BOARDING_HOUSE: { x: 304, y: 1248, name: 'Phòng Trọ Số 7' },
  FISHING_GATE: { x: 304, y: 1512, name: 'Lối xuống bến câu' },
  GAS_STATION: { x: 1808, y: 1248, name: 'Cây Xăng Petrolimex' },
  GAS_STATION_EAST: { x: 5456, y: 3872, name: 'Cây Xăng Bến Gió' },
  MOTORBIKE_SHOP: { x: 1072, y: 1248, name: 'Đại Lý Xe Máy & Đồ Chơi Xe' }
};

export const GAS_STATIONS = [MAP_LOCATIONS.GAS_STATION, MAP_LOCATIONS.GAS_STATION_EAST];

export const SOCIAL_CONFIG = {
  maxAffection: 100,
  talkGain: 4,
  purchaseGain: 3,
  pickupGain: 2,
  goodDeliveryGain: 6,
  averageDeliveryGain: 3,
  familiarThreshold: 30,
  friendlyThreshold: 60,
  familiarDiscount: 0.05,
  friendlyDiscount: 0.10,
  familiarTipBonus: 0.10,
  friendlyTipBonus: 0.20,
  foodHungerRestore: 45,
  foodThirstRestore: 8,
  drinkThirstRestore: 45,
  mealEnergyRestore: 18
};

export const POPULATION_CONFIG = {
  pedestrianSpeed: 38,
  dogSpeed: 54,
  customerSpeed: 52,
  carSpeed: 110,
  bikeSpeed: 160,
  trafficPerRoad: 6,
  yieldDistance: 90,
  pedestrianYieldDistance: 34,
  followingDistance: 110,
  signalPeriodMs: 9000,
  activationMargin: 280,
  interactionRadius: 58,
  customerArrivalRadius: 320,
  bumpCooldownMs: 2500,
  bumpDamage: 5,
  trafficFine: 25000,
  trafficViolationCooldownMs: 1400,
  trafficSignalIntersections: [
    { horizontalRoadIndex: 1, verticalRoadIndex: 2 },
    { horizontalRoadIndex: 3, verticalRoadIndex: 4 },
    { horizontalRoadIndex: 4, verticalRoadIndex: 1 },
    { horizontalRoadIndex: 0, verticalRoadIndex: 5 }
  ]
};

export const APARTMENT_ROOM_CONFIG = {
  bounds: { x: 144, y: 164, width: 672, height: 336 },
  spawn: { x: 480, y: 456 },
  deliveryDoor: { x: 480, y: 312, radius: 46 },
  exit: { x: 480, y: 486 },
  moveSpeed: 130
};

export const RESTAURANT_ROOM_CONFIG = {
  bounds: { x: 144, y: 164, width: 672, height: 336 },
  spawn: { x: 480, y: 456 },
  vendor: { x: 480, y: 306 },
  counter: { x: 480, y: 330, width: 256, height: 36 },
  exit: { x: 480, y: 486 },
  vendorRadius: 90,
  doorRadius: 40
};

export const FUEL_CONFIG = {
  maxFuel: 100, // 100% dung tích bình xăng Wave Alpha
  idleConsumptionRate: 0.04, // %/s khi dừng xe nổ máy
  speedConsumptionFactor: 0.0012, // %/s tỉ lệ với vận tốc xe
  costPerPercent: 350, // 350đ / 1% xăng (~35.000đ đầy bình)
  lowFuelThreshold: 20, // báo động đỏ dưới 20%
  outOfFuelSpeed: 35 // px/s tốc độ dắt bộ xe khi cạn xăng
};

export const RESTAURANT_CATALOG: RestaurantTemplate[] = [
  {
    name: 'Quán Phở Bò Gia Truyền',
    badgeColor: '#ef4444',
    pos: MAP_LOCATIONS.PHO_RESTAURANT,
    textureKey: 'urban_shop_pho',
    dishes: [
      { name: 'Phở Bò Tái Nạm Gầu Bốc Khói', price: 55000, baseFee: 25000, fragility: 1.4 },
      { name: 'Phở Gà Đồi Trứng Non Thơm Lừng', price: 50000, baseFee: 24000, fragility: 1.3 }
    ]
  },
  {
    name: 'Tiệm Trà Sữa Oolong Kem Cheese',
    badgeColor: '#ec4899',
    pos: { x: 1760, y: 416 },
    textureKey: 'urban_shop_milk_tea',
    dishes: [
      { name: 'Trà Sữa Oolong Nướng Kem Cheese', price: 45000, baseFee: 28000, fragility: 1.6 },
      { name: 'Trà Đào Cam Sả Full Topping', price: 42000, baseFee: 26000, fragility: 1.5 }
    ]
  },
  {
    name: 'Quán Cơm Tấm Sườn Bì Chả',
    badgeColor: '#f97316',
    pos: { x: 2592, y: 2144 },
    textureKey: 'urban_shop_rice',
    dishes: [
      { name: 'Cơm Tấm Sườn Cọng Trứng Ốp La', price: 60000, baseFee: 30000, fragility: 0.9 },
      { name: 'Cơm Tấm Ba Rọi Nướng Muối Ớt', price: 55000, baseFee: 29000, fragility: 0.95 }
    ]
  },
  {
    name: 'Tiệm Pizza & Gà Rán Giòn Rụm',
    badgeColor: '#eab308',
    pos: { x: 4528, y: 2976 },
    textureKey: 'urban_shop_pizza',
    dishes: [
      { name: 'Pizza Hải Sản Phô Mai Kéo Sợi', price: 120000, baseFee: 32000, fragility: 1.2 },
      { name: 'Mẹt Gà Rán Giòn Sốt Cay Hàn Quốc', price: 85000, baseFee: 28000, fragility: 1.1 }
    ]
  },
  {
    name: 'Quán Bún Chả Nướng Than Hoa',
    badgeColor: '#10b981',
    pos: { x: 848, y: 1248 },
    textureKey: 'urban_shop_bun_cha',
    dishes: [
      { name: 'Bún Chả Đặc Biệt Nem Rán Giòn', price: 55000, baseFee: 27000, fragility: 1.35 },
      { name: 'Bún Nem Cua Bể Hải Phòng', price: 50000, baseFee: 25000, fragility: 1.25 }
    ]
  },
  {
    name: 'Cà Phê Góc Ban Công',
    badgeColor: '#a16207',
    pos: { x: 2768, y: 1248 },
    textureKey: 'urban_shop_cafe',
    dishes: [
      { name: 'Cà Phê Sữa Đá & Croissant', price: 48000, baseFee: 28000, fragility: 1.4 },
      { name: 'Bạc Xỉu Kem Muối', price: 38000, baseFee: 25000, fragility: 1.5 }
    ]
  },
  {
    name: 'Sushi Phố Hoa Sữa',
    badgeColor: '#fb7185',
    pos: { x: 3728, y: 2144 },
    textureKey: 'urban_shop_sushi',
    dishes: [{ name: 'Sushi Cá Hồi & Cơm Cuộn', price: 95000, baseFee: 35000, fragility: 1.1 }]
  },
  {
    name: 'Bánh Xèo Cô Sáu',
    badgeColor: '#eab308',
    pos: { x: 5456, y: 2144 },
    textureKey: 'urban_shop_banh_xeo',
    dishes: [{ name: 'Bánh Xèo Tôm Thịt Giòn Rụm', price: 55000, baseFee: 32000, fragility: 1.2 }]
  },
  {
    name: 'Hủ Tiếu Bến Gió',
    badgeColor: '#38bdf8',
    pos: { x: 1664, y: 3872 },
    textureKey: 'urban_shop_noodles',
    dishes: [{ name: 'Hủ Tiếu Nam Vang Đặc Biệt', price: 60000, baseFee: 34000, fragility: 1.6 }]
  },
  {
    name: 'Lò Bánh Mật Ong',
    badgeColor: '#fbbf24',
    pos: { x: 3552, y: 3872 },
    textureKey: 'urban_shop_bakery',
    dishes: [{ name: 'Hộp Bánh Su Kem & Bánh Mật Ong', price: 75000, baseFee: 30000, fragility: 1.3 }]
  },
  {
    name: 'Hải Sản Chợ Đêm',
    badgeColor: '#2dd4bf',
    pos: { x: 5456, y: 4704 },
    textureKey: 'urban_shop_seafood',
    dishes: [{ name: 'Mì Xào Hải Sản & Tôm Nướng', price: 85000, baseFee: 38000, fragility: 1.0 }]
  }
];

export const CUSTOMER_CATALOG: CustomerTemplate[] = [
  { name: 'Anh Nam', address: 'Phòng 802, Chung Cư Xanh', pos: MAP_LOCATIONS.APARTMENT, deliveryMode: 'apartment' },
  { name: 'Chị Linh', address: 'Số 14, Phố Phất Lộc', pos: { x: 5456, y: 1248 } },
  { name: 'Bác Tuấn', address: 'Số 28, Ngõ Yên Thái', pos: { x: 944, y: 2144 } },
  { name: 'Bạn Vy', address: 'Căn hộ 12A, Dãy Phố Cổ', pos: { x: 1232, y: 2144 } },
  { name: 'Chú Hùng', address: 'Số 5, Ngõ Tập Thể', pos: { x: 304, y: 3872 } },
  { name: 'Em Mai', address: 'Số 42, Đường Vườn Xanh', pos: { x: 4688, y: 4704 } },
  { name: 'Cô Hạnh', address: 'Số 18, Phố Lồng Đèn', pos: { x: 2592, y: 4704 } },
  { name: 'Anh Duy', address: 'Nhà Vườn 6, Đường Ngoại Ô', pos: { x: 6224, y: 3872 } },
  { name: 'Chị Thảo', address: 'Số 32, Phố Hoa Sữa', pos: { x: 3728, y: 1248 } },
  { name: 'Bác Minh', address: 'Tập thể Hoa Giấy, Nhà B2', pos: { x: 1760, y: 2976 } },
  { name: 'Bạn An', address: 'Số 9, Phố Hàng Phở', pos: { x: 5456, y: 416 } }
];

export const VITALS_CONFIG = {
  // Tiêu hao mỗi giây (Cozy Life-sim nhẹ nhàng, thư giãn)
  hungerDecayRate: 0.15, // ~100s tụt 15 điểm đói
  thirstDecayRate: 0.22, // ~100s tụt 22 điểm khát
  energyDecayRateOnFoot: 0.10, // Đi bộ tiêu hao năng lượng
  energyDecayRateMounted: 0.16, // Lái xe tập trung

  // Quán Trà Đá vỉa hè
  teaStall: {
    cost: 3000,
    thirstRestore: 50,
    energyRestore: 10
  },

  // Xe Bánh Mì Patê
  banhMiCart: {
    cost: 15000,
    hungerRestore: 45,
    energyRestore: 15
  },

  // Ngủ qua đêm tại phòng trọ
  sleep: {
    energyRestore: 100, // hồi đầy 100%
    hungerCost: 15, // ngủ dậy hơi đói
    thirstCost: 20 // ngủ dậy hơi khát
  },

  // Ngưỡng suy nhược
  lowVitalThreshold: 20,
  speedDebuffFactor: 0.75 // khi đói/khát/năng lượng quá thấp, giảm 25% tốc độ
};

export const ROOM_CONFIG = {
  width: 960,
  height: 540,
  roomBounds: { x: 200, y: 90, width: 560, height: 380 },
  bedPos: { x: 300, y: 200 },
  deskPos: { x: 620, y: 200 },
  doorPos: { x: 480, y: 430 },
  catPos: { x: 480, y: 280 },
  bowlPos: { x: 525, y: 285 }
};

export const PLAYER_ON_FOOT_SPEED = 130; // px/s
export const MOUNT_INTERACTION_RADIUS = 48; // px để bấm E lên xe
export const DISMOUNT_MAX_SPEED = 100; // px/s tốc độ tối đa cho phép bấm E xuống xe

export const DEFAULT_MOTORBIKE: VehicleConfig = {
  id: 'wave_alpha',
  name: 'Xe Số Wave Alpha 110',
  maxSpeed: 360,
  acceleration: 750,
  deceleration: 600,
  turnSpeed: 380,
  driftFactor: 0.88,
  cargoDamping: 0.25,
  price: 0,
  description: 'Chiếc xe số quốc dân bền bỉ, tiết kiệm xăng, đồng hành cùng bạn những ngày đầu.',
  badge: 'Mặc định',
  fuelType: 'GASOLINE'
};

export const VEHICLES_CATALOG: VehicleConfig[] = [
  DEFAULT_MOTORBIKE,
  {
    id: 'scooter_lead',
    name: 'Xe Tay Ga Scooter Lead 125',
    maxSpeed: 420,
    acceleration: 820,
    deceleration: 680,
    turnSpeed: 360,
    driftFactor: 0.82,
    cargoDamping: 0.48, // Giảm xóc 48% bảo vệ đồ ăn cực tốt
    price: 650000,
    description: 'Cốp to siêu rộng, phuộc nhún êm ái lướt qua ổ gà nhẹ như mây.',
    badge: 'Êm Ái +48% Giảm Xóc',
    fuelType: 'GASOLINE'
  },
  {
    id: 'electric_vin',
    name: 'Xe Máy Điện E-Scooter Felix Pro',
    maxSpeed: 480,
    acceleration: 950, // Khởi tốc tức thì
    deceleration: 750,
    turnSpeed: 400,
    driftFactor: 0.78,
    cargoDamping: 0.65, // Giảm xóc thủy lực đỉnh cao 65%
    price: 1500000,
    description: 'Công nghệ điện thế hệ mới, tăng tốc tức thì, êm ru không tiếng ồn, sạc điện siêu rẻ.',
    badge: 'Tốc Độ 480 px/s - Êm Ru',
    fuelType: 'ELECTRIC'
  }
];

export const GEAR_CATALOG = {
  thermalBag: [
    { level: 1, name: 'Balo Tiêu Chuẩn', price: 0, dampingBonus: 0, desc: 'Chở 1 đơn, balo vải bạt tiêu chuẩn của hãng shipper.' },
    { level: 2, name: 'Balo Bạc Giữ Nhiệt', price: 180000, dampingBonus: 0.20, desc: 'Chở 2 đơn; +20% kháng chấn động và giữ nóng món.' },
    { level: 3, name: 'Balo Pro Foam Chống Va Đập', price: 460000, dampingBonus: 0.45, desc: 'Chở 3 đơn; +45% kháng chấn động, bảo vệ món.' }
  ],
  phoneMount: [
    { level: 1, name: 'Túi Quần Shipper', price: 0, radarBonus: 0, desc: 'Mỗi lần xem đơn phải rút điện thoại ra xem.' },
    { level: 2, name: 'Giá Kẹp Ghi-Đông Hợp Kim', price: 130000, radarBonus: 30, desc: 'Mở rộng tầm radar định vị +30 mét, chống rung rơi rớt.' },
    { level: 3, name: 'Giá Chống Rung MagSafe Đỉnh Cao', price: 330000, radarBonus: 60, desc: 'Tầm radar cực đại +60m, la bàn nhạy bén xoay tức thì!' }
  ]
};

export const FURNITURE_CATALOG = [
  {
    id: 'bed_luxury',
    name: 'Đệm Lò Xo Hoàng Gia Nệm Gấm',
    price: 280000,
    description: 'Nệm êm ái bồng bềnh, chăn gấm tím ấm áp hoàng gia.',
    buffDescription: 'Ngủ dậy hồi đầy 100% Đói, Khát và Năng lượng!',
    icon: '🛏️'
  },
  {
    id: 'bonsai_tree',
    name: 'Chậu Bonsai May Mắn Ban Công',
    price: 110000,
    description: 'Cây kiểng thế rồng xanh tươi đặt cạnh cửa sổ phòng trọ.',
    buffDescription: 'Không gian xanh mát, giảm 15% tốc độ mệt mỏi cả ngày!',
    icon: '🪴'
  },
  {
    id: 'coffee_maker',
    name: 'Máy Pha Cà Phê Mini Espresso',
    price: 210000,
    description: 'Máy pha espresso mini màu đỏ đặt trên bàn làm việc.',
    buffDescription: 'Bấm [E] tại bàn uống cà phê miễn phí: Hồi ngay +40 Sức & Khát!',
    icon: '☕'
  },
  {
    id: 'lofi_speaker',
    name: 'Dàn Loa Đĩa Than Retro Vinyl',
    price: 360000,
    description: 'Đầu máy đĩa than cổ điển phát ra những giai điệu Lo-fi hoài niệm.',
    buffDescription: 'Phát nhạc Lo-fi chill & thả nốt nhạc bay lượn trong phòng!',
    icon: '📻'
  },
  {
    id: 'warm_rug',
    name: 'Thảm Len Thổ Nhĩ Kỳ Cao Cấp',
    price: 145000,
    description: 'Thảm dệt thổ cẩm êm ái tuyệt đối cho mèo nằm sưởi nắng.',
    buffDescription: 'Mèo thích mê, tăng gấp đôi (+16) điểm thân mật mỗi lần vuốt ve!',
    icon: '🧶'
  }
];

export const HAZARDS_CONFIG = {
  pothole: {
    minSpeedToDamage: 140, // đi chậm dưới ngưỡng này không bị trừ
    baseDamage: 14, // trừ 14% chất lượng
    shakeDuration: 140,
    shakeIntensity: 0.007
  },
  oilSlick: {
    spinDurationMs: 1200,
    controlLossFactor: 0.25
  }
};

export const REVIEW_COMMENTS = {
  fiveStar: [
    'Bác tài giao siêu nhanh, bát phở còn nóng hổi bốc khói! 10 sao cho bác!',
    'Đồ ăn nguyên vẹn không đổ một giọt nước dùng, shipper quá có tâm!',
    'Lái xe khéo quá em ơi, trà sữa nguyên seal không bị sóng bọt. Sẽ ủng hộ tiếp!'
  ],
  fourStar: [
    'Giao hàng nhanh, đồ ăn hơi ấm một chút nhưng vẫn ngon miệng.',
    'Bác tài nhiệt tình, lần sau đi cẩn thận kẻo xóc nhé.'
  ],
  threeStar: [
    'Nước dùng bị sánh ra túi bóng một ít rồi bác tài ơi, cần đi cẩn thận hơn.',
    'Bánh hơi bị xô lệch góc, ăn tạm được.'
  ],
  oneStar: [
    'Trời ơi bánh nát bét, nước lèo đổ tung tóe hết cả túi! Quá thất vọng!',
    'Bác tài chạy ẩu quá, hộp cơm lộn tùng phèo không ăn nổi!'
  ]
};

// =========================================================================
// CẤU HÌNH PHASE 2: THẾ GIỚI ĐỘNG & NỘI DUNG RPG
// =========================================================================

/**
 * Task 2.1: Chu kỳ Ngày & Đêm (Day/Night Simulation)
 */
export const DAY_NIGHT_CONFIG = {
  startHour: 7, // 07:00 sáng
  startMinute: 0,
  secondsPerGameHour: 18, // 18s thực = 1h trong game (~7.2 phút cho chu kỳ 24h)
  periods: {
    MORNING: {
      name: 'Buổi Sáng',
      startHour: 6,
      endHour: 11.5,
      ambientColor: 0xffffff,
      ambientAlpha: 0.0,
      skyColor: '#ffffff',
      orderBonusMultiplier: 1.0,
      badgeText: '☀️ Sáng'
    },
    NOON_RUSH: {
      name: 'Cao Điểm Trưa',
      startHour: 11.5,
      endHour: 13.5,
      ambientColor: 0xfef08a,
      ambientAlpha: 0.08,
      skyColor: '#fffbeb',
      orderBonusMultiplier: 1.25, // +25% tiền cước giờ cao điểm trưa
      badgeText: '⚡ Trưa Cao Điểm'
    },
    AFTERNOON: {
      name: 'Buổi Chiều',
      startHour: 13.5,
      endHour: 16.5,
      ambientColor: 0xffedd5,
      ambientAlpha: 0.06,
      skyColor: '#fff7ed',
      orderBonusMultiplier: 1.0,
      badgeText: '⛅ Chiều'
    },
    SUNSET: {
      name: 'Hoàng Hôn',
      startHour: 16.5,
      endHour: 18.5,
      ambientColor: 0xea580c,
      ambientAlpha: 0.35,
      skyColor: '#fb923c',
      orderBonusMultiplier: 1.15,
      badgeText: '🌇 Hoàng Hôn'
    },
    EVENING_RUSH: {
      name: 'Cao Điểm Tối',
      startHour: 18.5,
      endHour: 20.5,
      ambientColor: 0x1e1b4b,
      ambientAlpha: 0.52,
      skyColor: '#312e81',
      orderBonusMultiplier: 1.35, // +35% cước cao điểm tối
      badgeText: '⚡ Tối Cao Điểm'
    },
    NIGHT: {
      name: 'Đêm Khuya',
      startHour: 20.5,
      endHour: 24,
      ambientColor: 0x050814,
      ambientAlpha: 0.72,
      skyColor: '#090d16',
      orderBonusMultiplier: 1.2,
      badgeText: '🌙 Đêm Phố Thị'
    }
  }
};

/**
 * Task 2.2: Hệ thống Thời tiết Mưa rơi (Rain & Slick Roads)
 */
export const WEATHER_CONFIG = {
  rainSurchargeMultiplier: 1.5, // Tăng +50% tiền cước khi trời mưa
  rainFrictionMultiplier: 0.65, // Giảm ma sát mặt đường (trơn trượt)
  rainDriftFactor: 1.35, // Tăng quán tính trượt văng đuôi
  rainTipChanceBonus: 0.25, // Khách thương tài xế dầm mưa (+25% tỉ lệ tip)
  naturalWeatherIntervalSec: 120 // Chu kỳ tự nhiên kiểm tra thời tiết
};

/**
 * Task 2.3: Hệ thống Nuôi mèo tại Phòng trọ (Pet System)
 */
export const PET_CONFIG = {
  feedCost: 10000, // 10.000đ mua hộp cá ngừ pate
  feedAffectionGain: 15, // +15 điểm thân mật
  petAffectionGain: 8, // +8 điểm thân mật khi vuốt ve
  maxAffection: 100,
  luckyTipChanceBonus: 0.30, // Tăng 30% tỉ lệ khách tip tiền boa
  luckyTipValueMultiplier: 1.25 // Tiền boa nhận được x1.25
};
