const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const cache = new Map();
function load(file) {
  const filename = path.resolve(file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
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

const { DeliveryPlanner } = load('src/managers/DeliveryPlanner.ts');
const { OrderStatus } = load('src/types/index.ts');
const start = { x: 300, y: 1200 };
const nearby = { x: 500, y: 1200 };
const nearCustomer = { x: 900, y: 1400 };
const farCustomer = { x: 5900, y: 4600 };
const near = DeliveryPlanner.estimate(start, nearby, nearCustomer, 360);
const far = DeliveryPlanner.estimate(start, nearby, farCustomer, 360);

assert(far.distanceMeters > near.distanceMeters);
assert(far.gameHours > near.gameHours);
assert(far.fuelPercent > near.fuelPercent);
assert(far.energyPercent > near.energyPercent);
assert(DeliveryPlanner.distanceFee(nearby, farCustomer) >
  DeliveryPlanner.distanceFee(nearby, nearCustomer));
assert(DeliveryPlanner.expressDeadline(far) > DeliveryPlanner.expressDeadline(near));
assert(DeliveryPlanner.expressDeadline(near) >= 2);
assert(DeliveryPlanner.expressDeadline(far) <= 7);

const pickedUp = DeliveryPlanner.estimateOrder(nearby, {
  restaurantPos: nearby, customerPos: farCustomer, status: OrderStatus.PICKED_UP
}, 360);
assert(pickedUp.distanceMeters < far.distanceMeters,
  'After pickup, the phone should estimate only the remaining route');
assert.equal(DeliveryPlanner.distanceFee(nearby, nearby), 0);
console.log('Passed short/long route fare and resource estimates, express deadlines and remaining-route preview.');
