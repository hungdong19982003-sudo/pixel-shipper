const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const cache=new Map();
function load(filename) {
  filename=path.resolve(filename);
  if(cache.has(filename))return cache.get(filename).exports;
  const module={exports:{}};cache.set(filename,module);
  const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  const localRequire=name=>{
    const resolved=path.resolve(path.dirname(filename),name);
    return load(fs.existsSync(resolved+'.ts')?resolved+'.ts':path.join(resolved,'index.ts'));
  };
  new Function('require','exports','module',code)(localRequire,module.exports,module);
  return module.exports;
}
const storage=new Map();
global.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
const log=console.log;console.log=()=>{};
try {
  const {SocialManager,sellerId,customerId}=load('src/managers/SocialManager.ts');
  const {SaveManager}=load('src/managers/SaveManager.ts');
  const {RESTAURANT_CATALOG}=load('src/config/GameConfig.ts');
  const {CUSTOMER_CATALOG}=load('src/config/GameConfig.ts');
  const social=SocialManager.getInstance(),save=SaveManager.getInstance(),restaurant=RESTAURANT_CATALOG[0];
  assert.equal(CUSTOMER_CATALOG[0].deliveryMode,'apartment');
  const stats={wallet:1500000,rating:5,completedOrders:0,day:1,hunger:10,thirst:10,energy:10,fuel:30,
    catAffection:30,hasPetToday:false,hasFedToday:false,luckyBuffActive:false,
    currentVehicleId:'scooter_lead',ownedVehicleIds:['wave_alpha','scooter_lead'],
    thermalBagLevel:2,phoneMountLevel:3,ownedFurnitureIds:['warm_rug'],relationships:{},trafficViolations:1};
  const id=sellerId(restaurant);
  assert(social.talk(stats,id).gained);
  assert(!social.talk(stats,id).gained,'Repeated greeting in one day should not farm affection');
  assert.equal(social.get(stats,id).affection,4);
  stats.day++;
  assert(social.talk(stats,id).gained);
  assert.equal(social.get(stats,id).affection,8);
  const before=stats.wallet;
  const price=social.price(stats,restaurant,0);
  assert(social.buyMeal(stats,restaurant,0).success);
  assert.equal(stats.wallet,before-price);
  assert.equal(stats.hunger,55);
  assert.equal(social.get(stats,id).purchases,1);
  stats.wallet=0;
  const snapshot=JSON.stringify(stats);
  assert(!social.buyMeal(stats,restaurant,0).success);
  assert.equal(JSON.stringify(stats),snapshot,'Failed purchase must not change wallet, vitals or affection');
  stats.wallet=1000000;
  social.get(stats,id).affection=60;
  assert.equal(social.price(stats,restaurant,0),Math.round(restaurant.dishes[0].price*.9));
  const customer='Anh Nam';
  social.get(stats,customerId(customer)).affection=60;
  assert.equal(social.tipBonus(stats,customer,15000),3000);
  assert.equal(social.tipBonus(stats,customer,-10000),0);
  social.delivered(stats,customer,100);
  assert.equal(social.get(stats,customerId(customer)).deliveries,1);
  assert.equal(social.get(stats,customerId(customer)).affection,66);
  social.get(stats,id).affection=99;
  social.collected(stats,restaurant);
  assert.equal(social.get(stats,id).affection,100);
  assert(save.saveAtDesk(stats));
  const loaded=save.loadGame();
  assert.deepEqual(loaded.relationships,stats.relationships);
  assert.deepEqual(loaded.ownedVehicleIds,stats.ownedVehicleIds);
  assert.deepEqual(loaded.ownedFurnitureIds,stats.ownedFurnitureIds);
  assert.equal(loaded.phoneMountLevel,3);
  assert.equal(loaded.thermalBagLevel,2);
  assert.equal(loaded.currentVehicleId,'scooter_lead');
  assert.equal(loaded.trafficViolations,1);
  storage.set('pixel_shipper_save_data_v1',JSON.stringify({wallet:42000,rating:4.8,day:2,completedOrders:2,hunger:70,thirst:80,energy:90,fuel:40}));
  assert.equal(save.loadGame().wallet,42000);
  assert.deepEqual(save.loadGame().relationships,{});
  storage.set('pixel_shipper_save_data_v1',JSON.stringify({wallet:42000,rating:5,relationships:{bad:{affection:'broken'},bounded:{affection:150}}}));
  const repaired=save.loadGame().relationships;
  assert(!('bad' in repaired));assert.equal(repaired.bounded.affection,100);
} finally {console.log=log;}
console.log('Passed social transactions, daily greeting limit, meal vitals, discount/tip perks, affection cap, full save round trip and old-save migration.');
