const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const modules = new Map();
function load(file) {
  const filename = path.resolve(file);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const localRequire = (name) => {
    const resolved = path.resolve(path.dirname(filename), name);
    return load(fs.existsSync(resolved + '.ts') ? resolved + '.ts' : path.join(resolved, 'index.ts'));
  };
  new Function('require', 'exports', 'module', code)(localRequire, module.exports, module);
  return module.exports;
}

const data = new Map();
global.localStorage = {
  getItem: (key) => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, value),
  removeItem: (key) => data.delete(key)
};

const { WeekManager } = load('src/managers/WeekManager.ts');
const { FishingEconomyManager } = load('src/managers/FishingEconomyManager.ts');
const { SaveManager } = load('src/managers/SaveManager.ts');
const stats = {
  wallet: 35000, rating: 5, completedOrders: 0, day: 1,
  hunger: 55, thirst: 80, energy: 50, fuel: 100,
  catAffection: 30, hasPetToday: false, hasFedToday: false, luckyBuffActive: false,
  currentVehicleId: 'wave_alpha', ownedVehicleIds: ['wave_alpha'],
  thermalBagLevel: 1, phoneMountLevel: 1, ownedFurnitureIds: [],
  relationships: {}, inventory: [], furniturePlacements: [], trafficViolations: 0,
  fishRequestCompletedDay: 0
};

assert(WeekManager.storyForDay(1)?.includes('Công nghệ thông tin'));
assert(WeekManager.storyForDay(7)?.includes('tiền trọ'));
assert.equal(WeekManager.storyForDay(8), null);
WeekManager.progress(stats);
stats.completedOrders++;
assert.equal(WeekManager.finishDay(stats), 6000);
assert.equal(WeekManager.finishDay(stats), 0, 'Daily bonus must be paid once');
stats.day = 2;
WeekManager.beginDay(stats);
assert.equal(WeekManager.deliveriesToday(stats), 0);
assert.equal(WeekManager.finishDay(stats), 0);

stats.day = 7;
assert.equal(WeekManager.chargeDueRent(stats), 80000);
assert.equal(WeekManager.chargeDueRent(stats), 80000, 'Same due day must not charge twice');
assert.equal(WeekManager.payRent(stats), false);
stats.day = 8;
assert.equal(WeekManager.chargeDueRent(stats), 80000, 'Debt must survive postponement');
stats.day = 14;
assert.equal(WeekManager.chargeDueRent(stats), 160000, 'Each seven-day period adds rent');
stats.wallet = 170000;
assert(WeekManager.payRent(stats));
assert.equal(stats.wallet, 10000);
assert.equal(stats.storyProgress.rentDebt, 0);
assert(stats.storyProgress.firstWeekCompleted);

stats.inventory.push({ id: 'fish_carp', name: 'Cá chép', icon: '🐠', quantity: 3, category: 'fish' });
assert(FishingEconomyManager.cook(stats, 'fish_carp').success);
assert.equal(stats.hunger, 85);
assert.equal(stats.inventory[0].quantity, 2);
assert(FishingEconomyManager.sell(stats, 'fish_carp', 'seller:test').success);
assert.equal(stats.wallet, 22000);
assert.equal(stats.relationships['seller:test'].affection, 2);
assert(FishingEconomyManager.gift(stats, 'fish_carp', 'landlady:co-hanh').success);
assert.equal(stats.inventory.length, 0);
assert.equal(stats.relationships['landlady:co-hanh'].affection, 8);
assert.equal(FishingEconomyManager.sell(stats, 'fish_carp', 'seller:test').success, false);

const market = {
  ...stats, day: 1, wallet: 0, relationships: {}, fishRequestCompletedDay: 0,
  inventory: [{ id: 'fish_tilapia', name: 'Cá rô đồng', icon: '🐟', quantity: 3, category: 'fish' }]
};
const request = FishingEconomyManager.dailyRequest(market.day);
assert.equal(request.fishId, 'fish_tilapia');
assert.equal(FishingEconomyManager.salePrice(market, request.fishId, request.restaurantName), 16000);
assert.equal(FishingEconomyManager.salePrice(market, request.fishId, 'Quán khác'), 9000);
assert(FishingEconomyManager.sell(market, request.fishId, 'seller:wrong', 'Quán khác').success);
assert.equal(market.wallet, 9000, 'Wrong restaurant only pays the ordinary fish price');
assert.equal(market.fishRequestCompletedDay, 0);
assert(FishingEconomyManager.sell(market, request.fishId, 'seller:buyer', request.restaurantName).success);
assert.equal(market.wallet, 25000);
assert.equal(market.fishRequestCompletedDay, 1);
assert.equal(market.relationships['seller:buyer'].affection, 6);
assert(FishingEconomyManager.sell(market, request.fishId, 'seller:buyer', request.restaurantName).success);
assert.equal(market.wallet, 34000, 'Daily request bonus must only be paid once');
market.day = 2;
assert.notEqual(FishingEconomyManager.dailyRequest(2).fishId, request.fishId);
assert.equal(FishingEconomyManager.isDailyRequest(market, 'fish_carp',
  FishingEconomyManager.dailyRequest(2).restaurantName), true);

const oldLog = console.log;
console.log = () => {};
try {
  const save = SaveManager.getInstance();
  assert(save.saveAtDesk(stats));
  const restored = save.loadGame();
  assert.equal(restored.storyProgress.lastRentDay, 14);
  assert.equal(restored.storyProgress.firstWeekCompleted, true);
  assert.equal(restored.relationships['seller:test'].affection, 2);
  assert(save.saveAtDesk(market));
  assert.equal(save.loadGame().fishRequestCompletedDay, 1);
  data.set('pixel_shipper_save_data_v1', JSON.stringify({
    wallet: 40000, rating: 5, completedOrders: 2, day: 5, hunger: 70, thirst: 70, energy: 70, fuel: 70,
    storyProgress: { introSeen: true, landladyVisitCount: 1, lastLandladyVisitDay: 3, lastRentDay: 0 }
  }));
  const oldSave = save.loadGame();
  assert.equal(oldSave.storyProgress.rentDebt, 0);
  assert.equal(oldSave.storyProgress.lastStoryDay, 5);
  assert.equal(oldSave.storyProgress.dayStartOrders, 2);
  assert.equal(oldSave.fishRequestCompletedDay, 0);
} finally {
  console.log = oldLog;
}
console.log('Passed seven-day goals, rent, fish trading and daily requests, save round trip and migration.');
