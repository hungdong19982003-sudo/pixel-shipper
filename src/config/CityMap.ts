import { CityBlock, CityBuilding, CityDecoration, NpcDefinition, TrafficDefinition } from '../types';
import {
  CITY_LAYOUT, WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE,
  MAP_LOCATIONS, RESTAURANT_CATALOG, CUSTOMER_CATALOG, GAS_STATIONS, POPULATION_CONFIG
} from './GameConfig';

export const CITY_SHOP_STYLES = [
  { id: 'pho', sign: 'PHỞ BÒ', wall: '#f0d8a8', roof: '#8e5144', accent: '#bc5249', wares: 'food' },
  { id: 'milk_tea', sign: 'TRÀ SỮA', wall: '#e9c6c3', roof: '#896574', accent: '#b2638a', wares: 'drinks' },
  { id: 'rice', sign: 'CƠM TẤM', wall: '#e6c29d', roof: '#8b5847', accent: '#c47943', wares: 'food' },
  { id: 'pizza', sign: 'PIZZA', wall: '#e5d7ad', roof: '#7b594c', accent: '#ba564a', wares: 'food' },
  { id: 'bun_cha', sign: 'BÚN CHẢ', wall: '#d6ddbd', roof: '#556e60', accent: '#5c8971', wares: 'food' },
  { id: 'cafe', sign: 'CÀ PHÊ', wall: '#d4bc9b', roof: '#73594c', accent: '#856744', wares: 'drinks' },
  { id: 'sushi', sign: 'SUSHI', wall: '#e4d0c1', roof: '#665966', accent: '#bc6b6b', wares: 'food' },
  { id: 'banh_xeo', sign: 'BÁNH XÈO', wall: '#efdaa7', roof: '#996450', accent: '#bf9446', wares: 'food' },
  { id: 'noodles', sign: 'HỦ TIẾU', wall: '#bfdbd5', roof: '#596f77', accent: '#558a98', wares: 'food' },
  { id: 'bakery', sign: 'LÒ BÁNH', wall: '#e9d4b3', roof: '#a87957', accent: '#b88550', wares: 'bakery' },
  { id: 'seafood', sign: 'HẢI SẢN', wall: '#b9d6d3', roof: '#526b75', accent: '#4d918e', wares: 'food' },
  { id: 'grocery', sign: 'TẠP HÓA', wall: '#decaaa', roof: '#85705b', accent: '#68855b', wares: 'groceries' },
  { id: 'flowers', sign: 'TIỆM HOA', wall: '#e4ccd0', roof: '#8f667a', accent: '#a46b86', wares: 'flowers' },
  { id: 'books', sign: 'SÁCH CŨ', wall: '#d5d5bb', roof: '#67796b', accent: '#648275', wares: 'books' },
  { id: 'pharmacy', sign: 'NHÀ THUỐC', wall: '#d2dfd4', roof: '#6d8480', accent: '#608f82', wares: 'groceries' },
  { id: 'tailor', sign: 'TIỆM MAY', wall: '#d4c7de', roof: '#706783', accent: '#8d779b', wares: 'books' }
] as const;

export const CITY_HOUSE_PALETTES = [
  ['#e2c69e', '#bc8b70', '#805b50'],
  ['#cad8c7', '#8fab94', '#596e67'],
  ['#d7c5c0', '#b38c8c', '#7d5863'],
  ['#c4d7dd', '#829daa', '#586b81'],
  ['#e3d7b6', '#c1a577', '#8e7054'],
  ['#d0c6dc', '#a596b6', '#716a85'],
  ['#e1c4ab', '#bb8869', '#8b6250'],
  ['#d4d9c4', '#9caa84', '#67775c']
] as const;

const destinations = [
  ...RESTAURANT_CATALOG.map((item) => item.pos),
  ...CUSTOMER_CATALOG.map((item) => item.pos),
  MAP_LOCATIONS.TEA_STALL, MAP_LOCATIONS.BANH_MI_CART,
  MAP_LOCATIONS.BOARDING_HOUSE, MAP_LOCATIONS.FISHING_GATE, ...GAS_STATIONS,
  MAP_LOCATIONS.MOTORBIKE_SHOP
];

function openIntervals(bands: { tile: number; lanes: number }[], extent: number) {
  const intervals: { start: number; end: number }[] = [];
  let start = 0;
  for (const band of bands) {
    intervals.push({ start, end: band.tile * TILE_SIZE });
    start = (band.tile + band.lanes) * TILE_SIZE;
  }
  intervals.push({ start, end: extent });
  return intervals;
}

export const CITY_BLOCKS: CityBlock[] = openIntervals(CITY_LAYOUT.horizontalRoads, WORLD_HEIGHT)
  .flatMap((vertical, row) => openIntervals(CITY_LAYOUT.verticalRoads, WORLD_WIDTH)
    .map((horizontal, column) => ({
      x: horizontal.start, y: vertical.start,
      width: horizontal.end - horizontal.start,
      height: vertical.end - vertical.start,
      column, row, isPark: CITY_LAYOUT.parkBlocks.includes(column + ':' + row)
    })));

export function isCityRoadTile(column: number, row: number): boolean {
  return CITY_LAYOUT.horizontalRoads.some((road) => row >= road.tile && row < road.tile + road.lanes) ||
    CITY_LAYOUT.verticalRoads.some((road) => column >= road.tile && column < road.tile + road.lanes);
}

export function isNearCityDestination(x: number, y: number, radius = 96): boolean {
  return destinations.some((point) => Math.abs(point.x - x) < radius && Math.abs(point.y - y) < radius);
}

function buildCityBuildings(): CityBuilding[] {
  const buildings: CityBuilding[] = [];
  const addDestination = (
    point: { x: number; y: number }, texture: string,
    kind: CityBuilding['kind'], label?: string, color?: string, scale = 1
  ) => buildings.push({
    x: point.x, y: point.y - CITY_LAYOUT.doorOffset, texture, kind, label, color, scale,
    footprintWidth: texture === 'urban_apartment' ? 168 :
      texture === 'prop_gas_station' || texture === 'prop_shop_bike' ? 144 : 104,
    footprintHeight: texture === 'urban_apartment' ? 96 : 64
  });

  RESTAURANT_CATALOG.forEach((item) =>
    addDestination(item.pos, item.textureKey ?? 'urban_shop_pho', 'shop', item.name, item.badgeColor));
  CUSTOMER_CATALOG.forEach((item, index) =>
    addDestination(item.pos, index === 0 ? 'urban_apartment' : 'urban_house_' + (index % CITY_HOUSE_PALETTES.length),
      'home'));
  addDestination(MAP_LOCATIONS.TEA_STALL, 'prop_shop_tea', 'landmark', 'Trà Đá Vỉa Hè', '#82c5a4', 2);
  addDestination(MAP_LOCATIONS.BANH_MI_CART, 'prop_cart_banhmi', 'landmark', 'Bánh Mì Patê', '#e4b574', 2);
  addDestination(MAP_LOCATIONS.BOARDING_HOUSE, 'prop_boarding_house_door', 'landmark', 'Phòng Trọ Số 7', '#e7c786', 2);
  GAS_STATIONS.forEach((station) =>
    addDestination(station, 'prop_gas_station', 'landmark', station.name, '#87c0d4', 2));
  addDestination(MAP_LOCATIONS.MOTORBIKE_SHOP, 'prop_shop_bike', 'landmark', 'Tiệm Xe & Phụ Tùng', '#7dd3cf', 2);

  const destinationBuildings = buildings.slice();
  for (const block of CITY_BLOCKS) {
    if (block.isPark) continue;
    const columns = Math.max(1, Math.floor((block.width - 16) / CITY_LAYOUT.buildingSpacing));
    const rows = Math.max(1, Math.floor((block.height - 64) / CITY_LAYOUT.buildingRowSpacing));
    for (let row = 0; row < rows; row++) {
      const y = rows === 1 ? block.y + block.height - 72
        : block.y + 184 + row * (block.height - 256) / (rows - 1);
      for (let column = 0; column < columns; column++) {
        const x = block.x + (column + 0.5) * block.width / columns;
        // Reserve the entire approach to every delivery/service doorway.
        if (destinationBuildings.some((other) =>
          Math.abs(other.x - x) < (other.footprintWidth + 128) / 2 + 32 &&
          Math.abs(other.y - y) < 176)) continue;
        const seed = block.column * 17 + block.row * 31 + column * 7 + row * 13;
        const shop = row === rows - 1 && seed % 3 !== 0;
        const apartment = block.column >= 4 && seed % 11 === 0 &&
          x - 84 >= block.x + 8 && x + 84 <= block.x + block.width - 8;
        const width = apartment ? 168 : 104;
        const height = apartment ? 96 : 64;
        if (buildings.some((other) =>
          Math.abs(other.x - x) < (other.footprintWidth + width) / 2 + 8 &&
          Math.abs(other.y - other.footprintHeight / 2 - y + height / 2) <
            (other.footprintHeight + height) / 2 + 8)) continue;
        buildings.push({
          x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2,
          texture: apartment ? 'urban_apartment' : shop
            ? 'urban_shop_' + CITY_SHOP_STYLES[seed % CITY_SHOP_STYLES.length].id
            : 'urban_house_' + (seed % CITY_HOUSE_PALETTES.length),
          scale: 1, footprintWidth: apartment ? 168 : 104,
          footprintHeight: apartment ? 96 : 64,
          kind: shop && !apartment ? 'shop' : 'home'
        });
      }
    }
  }
  return buildings;
}

export const CITY_BUILDINGS = buildCityBuildings();

function buildCityDecorations(): CityDecoration[] {
  const props: CityDecoration[] = [];
  const add = (x: number, y: number, texture: string, solid = true, scale = 1) => {
    if (isNearCityDestination(x, y)) return;
    if (CITY_BUILDINGS.some((building) => Math.abs(building.x - x) < building.footprintWidth / 2 + 20 &&
      y > building.y - building.footprintHeight - 24 && y < building.y + 24)) return;
    const footprint = texture === 'urban_fountain' ? { width: 76, height: 48 }
      : texture === 'urban_bench' ? { width: 52, height: 12 }
      : texture === 'urban_market_cart' ? { width: 48, height: 24 }
      : texture === 'urban_planter' ? { width: 32, height: 16 }
      : { width: 12, height: 12 };
    props.push({
      x, y, texture, solid, scale,
      footprintWidth: footprint.width, footprintHeight: footprint.height
    });
  };
  for (const road of CITY_LAYOUT.horizontalRoads) {
    for (let x = 112; x < WORLD_WIDTH - 64; x += CITY_LAYOUT.treeSpacing) {
      const y = road.tile * TILE_SIZE - 12;
      if (isCityRoadTile(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE))) continue;
      add(x, y, 'urban_tree');
      if (Math.floor(x / CITY_LAYOUT.treeSpacing) % 3 === 0) add(x + 72, y, 'urban_bench');
    }
    for (let x = 160; x < WORLD_WIDTH - 64; x += CITY_LAYOUT.lampSpacing) {
      const y = (road.tile + road.lanes) * TILE_SIZE + 36;
      if (!isCityRoadTile(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE))) add(x, y, 'urban_lamp');
    }
  }
  for (const road of CITY_LAYOUT.verticalRoads) {
    for (let y = 176; y < WORLD_HEIGHT - 64; y += CITY_LAYOUT.lampSpacing) {
      const x = (road.tile + road.lanes) * TILE_SIZE + 28;
      if (!isCityRoadTile(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE))) add(x, y, 'urban_tree');
    }
  }
  for (const block of CITY_BLOCKS.filter((item) => item.isPark)) {
    add(block.x + block.width / 2, block.y + block.height / 2, 'urban_fountain');
    for (let x = block.x + 96; x < block.x + block.width - 64; x += 128) {
      add(x, block.y + 144, 'urban_tree');
      add(x, block.y + block.height - 64, 'urban_planter');
    }
    add(block.x + block.width / 2 - 120, block.y + block.height / 2 + 64, 'urban_bench');
    add(block.x + block.width / 2 + 120, block.y + block.height / 2 + 64, 'urban_bench');
  }
  CITY_BUILDINGS.forEach((building, index) => {
    if (building.kind !== 'shop' || building.label) return;
    if (index % 4 === 0) add(building.x + 66, building.y + 8, 'urban_market_cart');
    else if (index % 4 === 1) add(building.x + 66, building.y + 8, 'urban_planter');
    else if (index % 4 === 2) add(building.x + 66, building.y + 8, 'bike_down');
  });
  return props;
}

export const CITY_DECORATIONS = buildCityDecorations();

export function isCityWalkable(x: number, y: number): boolean {
  if (x < 16 || y < 20 || x > WORLD_WIDTH - 16 || y > WORLD_HEIGHT - 16) return false;
  return !CITY_BUILDINGS.some((building) =>
    x + 8 > building.x - building.footprintWidth / 2 && x - 8 < building.x + building.footprintWidth / 2 &&
    y - 2 > building.y - building.footprintHeight - 8 && y - 12 < building.y - 8) &&
    !CITY_DECORATIONS.some((prop) => prop.solid &&
      x + 8 > prop.x - prop.footprintWidth / 2 && x - 8 < prop.x + prop.footprintWidth / 2 &&
      y - 2 > prop.y - prop.footprintHeight && y - 12 < prop.y);
}

function clearRoute(points: {x: number; y: number}[]): boolean {
  for(let index=1;index<points.length;index++) {
    const a=points[index-1], b=points[index];
    const steps=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/16);
    for(let step=0;step<=steps;step++) {
      const ratio=step/Math.max(1,steps);
      if(!isCityWalkable(a.x+(b.x-a.x)*ratio,a.y+(b.y-a.y)*ratio)) return false;
    }
  }
  return true;
}

export const CITY_NPCS: NpcDefinition[] = [];
const citizenNames = ['Bác Bình', 'Cô Lan', 'Anh Hoàng', 'Chị Ngọc', 'Chú Sơn', 'Bạn Chi', 'Cô Hoa', 'Anh Hải'];
CITY_BLOCKS.forEach((block,index) => {
  const route = [
    {x:block.x+48,y:block.y+block.height-30},
    {x:block.x+block.width-48,y:block.y+block.height-30}
  ];
  if(clearRoute(route)) CITY_NPCS.push({
    id:'citizen-'+block.column+'-'+block.row,
    name:citizenNames[index%citizenNames.length], role:'pedestrian', variant:index%6,
    route,speed:POPULATION_CONFIG.pedestrianSpeed
  });
  if(block.isPark) {
    const dogRoute = [
      {x:block.x+96,y:block.y+block.height-108},
      {x:block.x+block.width-96,y:block.y+block.height-108}
    ];
    if(clearRoute(dogRoute)) CITY_NPCS.push({
      id:'dog-park-'+index,name:'Bông',role:'dog',variant:0,route:dogRoute,speed:POPULATION_CONFIG.dogSpeed
    });
  }
});
CITY_LAYOUT.horizontalRoads.forEach((road,index) => {
  const vertical = CITY_LAYOUT.verticalRoads[index % CITY_LAYOUT.verticalRoads.length];
  const route = [
    {x:vertical.tile*TILE_SIZE-32,y:road.tile*TILE_SIZE-20},
    {x:vertical.tile*TILE_SIZE-32,y:(road.tile+road.lanes)*TILE_SIZE+20}
  ];
  if(clearRoute(route)) CITY_NPCS.push({
    id:'crossing-'+index,name:index%2?'Mít':'Bạn Phúc',role:index%2?'dog':'pedestrian',
    variant:index%6,route,speed:index%2?POPULATION_CONFIG.dogSpeed:POPULATION_CONFIG.pedestrianSpeed
  });
});
CUSTOMER_CATALOG.forEach((customer,index) => CITY_NPCS.push({
  id:'customer:'+customer.name,name:customer.name,role:'customer',variant:index%6,
  route:[{x:customer.pos.x,y:customer.pos.y-8},{x:customer.pos.x,y:customer.pos.y+20}],
  speed:POPULATION_CONFIG.customerSpeed
}));
const startingDogRoute=[{x:224,y:408},{x:400,y:408}];
if(clearRoute(startingDogRoute)) CITY_NPCS.push({
  id:'dog-start',name:'Đốm',role:'dog',variant:0,route:startingDogRoute,speed:POPULATION_CONFIG.dogSpeed
});

export const CITY_TRAFFIC: TrafficDefinition[] = [];
for (const axis of ['horizontal','vertical'] as const) {
  const roads = axis === 'horizontal' ? CITY_LAYOUT.horizontalRoads : CITY_LAYOUT.verticalRoads;
  const extent = axis === 'horizontal' ? WORLD_WIDTH : WORLD_HEIGHT;
  roads.forEach((road,roadIndex) => {
    for(let index=0;index<POPULATION_CONFIG.trafficPerRoad;index++) {
      const direction = index%2===0 ? 1 : -1;
      const motorbike = index%3===0;
      const lane = (road.tile + road.lanes * (axis==='horizontal'
        ? direction===1?0.72:0.28 : direction===1?0.28:0.72))*TILE_SIZE;
      const travel = (index+0.35)*extent/POPULATION_CONFIG.trafficPerRoad;
      CITY_TRAFFIC.push({
        id:axis+'-'+roadIndex+'-'+index,axis,direction,motorbike,variant:(roadIndex+index)%4,
        speed:motorbike?POPULATION_CONFIG.bikeSpeed:POPULATION_CONFIG.carSpeed,
        pos:axis==='horizontal'?{x:travel,y:lane}:{x:lane,y:travel}
      });
    }
  });
}

export const CITY_TRAFFIC_SIGNALS = POPULATION_CONFIG.trafficSignalIntersections.flatMap((intersection, index) => {
  const horizontal = CITY_LAYOUT.horizontalRoads[intersection.horizontalRoadIndex];
  const vertical = CITY_LAYOUT.verticalRoads[intersection.verticalRoadIndex];
  if (!horizontal || !vertical) return [];
  return [{
    id: 'signal-' + index,
    x: (vertical.tile + vertical.lanes / 2) * TILE_SIZE,
    y: (horizontal.tile + horizontal.lanes / 2) * TILE_SIZE,
    horizontalWidth: horizontal.lanes * TILE_SIZE,
    verticalWidth: vertical.lanes * TILE_SIZE
  }];
});

export function getCityDistrictName(x: number, y: number): string {
  const park = CITY_BLOCKS.find((block) => block.isPark && x >= block.x &&
    x < block.x + block.width && y >= block.y && y < block.y + block.height);
  if (park) return 'Công Viên Vườn Xanh';
  const horizontal = CITY_LAYOUT.horizontalRoads.find((road) =>
    y >= road.tile * TILE_SIZE - 32 && y < (road.tile + road.lanes) * TILE_SIZE + 32);
  if (horizontal) return horizontal.name;
  const vertical = CITY_LAYOUT.verticalRoads.find((road) =>
    x >= road.tile * TILE_SIZE - 32 && x < (road.tile + road.lanes) * TILE_SIZE + 32);
  if (vertical) return vertical.name;
  const districts = [
    'Phố Cổ & Xóm Trọ', 'Khu Cà Phê Ban Công', 'Khu Phố Lồng Đèn',
    'Chợ Mới & Phố Ẩm Thực', 'Khu Dân Cư Hoa Sữa', 'Khu Chung Cư Bình Minh',
    'Ngõ Tập Thể Bến Gió', 'Phố Lò Bánh Mật Ong', 'Khu Vườn Xanh & Chợ Đêm'
  ];
  return districts[Math.min(2, Math.floor(y / (WORLD_HEIGHT / 3))) * 3 +
    Math.min(2, Math.floor(x / (WORLD_WIDTH / 3)))];
}
