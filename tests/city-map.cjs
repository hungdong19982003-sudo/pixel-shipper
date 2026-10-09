const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function loadSource(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const requireSource = (name) => {
    const resolved = path.resolve(path.dirname(filename), name);
    return loadSource(fs.existsSync(resolved + '.ts') ? resolved + '.ts' : path.join(resolved, 'index.ts'));
  };
  new Function('require', 'exports', 'module', compiled)(requireSource, module.exports, module);
  return module.exports;
}
const config = loadSource('src/config/GameConfig.ts');
const city = loadSource('src/config/CityMap.ts');
assert.equal(city.CITY_TRAFFIC_SIGNALS.length, config.POPULATION_CONFIG.trafficSignalIntersections.length,
  'Selected road intersections should have visible traffic signals');
assert(city.CITY_SHOP_STYLES.length > 0, 'The map should provide enterable shop facade styles');
for (const shop of city.CITY_BUILDINGS.filter((building) => building.kind === 'shop')) {
  assert(city.isCityWalkable(shop.x, shop.y + config.CITY_LAYOUT.doorOffset),
    'Every shop should have a walkable entrance at ' + shop.x + ',' + shop.y);
}
const { WORLD_WIDTH: width, WORLD_HEIGHT: height, TILE_SIZE, CITY_LAYOUT } = config;
assert(width * height >= 7 * 2400 * 1800, 'City area should be at least seven times the original');
assert(city.CITY_BUILDINGS.length >= 600, 'The denser city needs more closely packed buildings');
assert(city.CITY_BUILDINGS.filter((building) => building.kind === 'shop').length >= 80);
assert.equal(city.CITY_BLOCKS.filter((block) => block.isPark).length, 4);
assert(config.RESTAURANT_CATALOG.length >= 10);
assert(city.CITY_NPCS.filter(npc=>npc.role==='pedestrian').length>=35);
assert(city.CITY_NPCS.filter(npc=>npc.role==='dog').length>=5);
assert.equal(city.CITY_NPCS.filter(npc=>npc.role==='customer').length,config.CUSTOMER_CATALOG.length);
assert(city.CITY_TRAFFIC.length>=60);
for(const npc of city.CITY_NPCS) {
  for(let index=1;index<npc.route.length;index++) {
    const a=npc.route[index-1],b=npc.route[index];
    const steps=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/8);
    for(let step=0;step<=steps;step++) {
      const ratio=step/Math.max(1,steps);
      assert(city.isCityWalkable(a.x+(b.x-a.x)*ratio,a.y+(b.y-a.y)*ratio),
        'NPC route crosses a solid object: '+npc.id);
    }
  }
}

const obstacles = [
  ...city.CITY_BUILDINGS.map((building) => ({
    x: building.x - building.footprintWidth / 2,
    y: building.y - building.footprintHeight - 8,
    width: building.footprintWidth, height: building.footprintHeight
  })),
  ...city.CITY_DECORATIONS.filter((prop) => prop.solid).map((prop) => ({
    x: prop.x - prop.footprintWidth / 2, y: prop.y - prop.footprintHeight,
    width: prop.footprintWidth, height: prop.footprintHeight
  }))
];
for (const obstacle of obstacles) {
  assert(obstacle.x >= 8 && obstacle.y >= 8 &&
    obstacle.x + obstacle.width <= width - 8 && obstacle.y + obstacle.height <= height - 8,
    'Building or prop exceeds the world bounds: ' + JSON.stringify(obstacle));
  for (const road of CITY_LAYOUT.horizontalRoads) {
    assert(obstacle.y + obstacle.height <= road.tile * TILE_SIZE ||
      obstacle.y >= (road.tile + road.lanes) * TILE_SIZE,
      'A solid object blocks a horizontal road: ' + JSON.stringify(obstacle));
  }
  for (const road of CITY_LAYOUT.verticalRoads) {
    assert(obstacle.x + obstacle.width <= road.tile * TILE_SIZE ||
      obstacle.x >= (road.tile + road.lanes) * TILE_SIZE,
      'A solid object blocks a vertical road: ' + JSON.stringify(obstacle));
  }
}

// Flood fill actual free space with a walking hitbox, independently of the road graph.
const step = 16;
const columns = width / step;
const rows = height / step;
const blocked = new Uint8Array(columns * rows);
for (const obstacle of obstacles) {
  const left = Math.max(0, Math.floor((obstacle.x - 8) / step));
  const right = Math.min(columns - 1, Math.ceil((obstacle.x + obstacle.width + 8) / step));
  const top = Math.max(0, Math.floor((obstacle.y - 6) / step));
  const bottom = Math.min(rows - 1, Math.ceil((obstacle.y + obstacle.height + 6) / step));
  for (let row = top; row <= bottom; row++) {
    for (let column = left; column <= right; column++) blocked[row * columns + column] = 1;
  }
}
const indexAt = (point) => Math.floor((point.y + 12) / step) * columns + Math.floor(point.x / step);
const start = indexAt(config.MAP_LOCATIONS.SPAWN_POINT);
assert(!blocked[start], 'Spawn must be clear');
const visited = new Uint8Array(blocked.length);
const queue = new Int32Array(blocked.length);
queue[0] = start;
visited[start] = 1;
let head = 0;
let tail = 1;
while (head < tail) {
  const current = queue[head++];
  const column = current % columns;
  const neighbors = [
    column > 0 ? current - 1 : -1,
    column < columns - 1 ? current + 1 : -1,
    current >= columns ? current - columns : -1,
    current < blocked.length - columns ? current + columns : -1
  ];
  for (const next of neighbors) {
    if (next < 0 || visited[next] || blocked[next]) continue;
    visited[next] = 1;
    queue[tail++] = next;
  }
}
const targets = [
  ...config.RESTAURANT_CATALOG.map((item) => ({ name: item.name, ...item.pos })),
  ...config.CUSTOMER_CATALOG.map((item) => ({ name: item.name, ...item.pos })),
  ...['TEA_STALL', 'BANH_MI_CART', 'BOARDING_HOUSE', 'MOTORBIKE_SHOP']
    .map((key) => config.MAP_LOCATIONS[key]),
  ...config.GAS_STATIONS
];
assert.equal(config.GAS_STATIONS.length, 2);
assert(Math.hypot(config.GAS_STATIONS[0].x - config.GAS_STATIONS[1].x,
  config.GAS_STATIONS[0].y - config.GAS_STATIONS[1].y) > 4000, 'The gas stations should serve distant districts');
for (const target of targets) {
  assert(visited[indexAt(target)], 'Doorway cannot be reached from spawn: ' + target.name);
  assert(city.CITY_BUILDINGS.some((building) =>
    building.x === target.x && building.y + CITY_LAYOUT.doorOffset === target.y),
    'Delivery/service target must have a real building: ' + target.name);
}
console.log(JSON.stringify({
  world: [width, height],
  buildings: city.CITY_BUILDINGS.length,
  shops: city.CITY_BUILDINGS.filter((building) => building.kind === 'shop').length,
  decorations: city.CITY_DECORATIONS.length,
  reachableTargets: targets.length,
  parks: 4,
  npcs:city.CITY_NPCS.length,
  traffic:city.CITY_TRAFFIC.length
}, null, 2));
