import Phaser from 'phaser';
import { CITY_NPCS,CITY_TRAFFIC,CITY_TRAFFIC_SIGNALS } from '../config/CityMap';
import { CITY_LAYOUT,POPULATION_CONFIG,TILE_SIZE,WORLD_WIDTH,WORLD_HEIGHT } from '../config/GameConfig';
import { Npc } from '../entities/Npc';
import { Player } from '../entities/Player';
import { OrderStatus,PlayerState,TrafficDefinition } from '../types';
import { OrderManager } from './OrderManager';
import { IntegrityManager } from './IntegrityManager';
import { SoundManager } from '../assets/SoundManager';

export class PopulationManager {
  public readonly npcs: Npc[]=[];
  public readonly traffic: {definition:TrafficDefinition;sprite:Phaser.Physics.Arcade.Image}[]=[];
  private customerOrderId='';
  private lastBump=-POPULATION_CONFIG.bumpCooldownMs;
  private lastSignalViolation=-POPULATION_CONFIG.trafficViolationCooldownMs;
  private previousPlayerPosition={x:0,y:0};
  private readonly signalLamps:{horizontal:Phaser.GameObjects.Arc[];vertical:Phaser.GameObjects.Arc[]}[]=[];

  constructor(private readonly scene:Phaser.Scene,private readonly player:Player,
    obstacles:Phaser.Physics.Arcade.StaticGroup) {
    const people=scene.physics.add.group();
    for(const definition of CITY_NPCS) {
      const npc=new Npc(scene,definition);
      this.npcs.push(npc);people.add(npc);
    }
    // NPCs yield rather than trapping a walking player between houses.
    scene.physics.add.overlap(player,people,()=>this.onBump());
    const vehicles=scene.physics.add.group({immovable:true,allowGravity:false});
    for(const definition of CITY_TRAFFIC) {
      const direction=definition.axis==='horizontal'?definition.direction===1?'right':'left'
        :definition.direction===1?'down':'up';
      const texture=(definition.motorbike?'traffic_bike_':'traffic_car_')+definition.variant+'_'+direction;
      const sprite=scene.physics.add.image(definition.pos.x,definition.pos.y,texture).setImmovable(true);
      sprite.setSize(definition.axis==='horizontal'?definition.motorbike?42:64:24,
        definition.axis==='vertical'?definition.motorbike?42:64:24);
      this.traffic.push({definition,sprite});vehicles.add(sprite);
    }
    scene.physics.add.collider(player,vehicles,()=>this.onBump());
    this.previousPlayerPosition={x:player.x,y:player.y};
    this.createTrafficSignals();
    scene.physics.add.collider(people,obstacles, (actor) => {
      const npc=actor as Npc;
      if(npc.definition.role!=='customer') npc.setVelocity(0,0);
    });
  }

  private onBump() {
    const now=this.scene.time.now;
    if(this.player.playerState!==PlayerState.MOUNTED||this.player.getCurrentSpeed()<140||
      now-this.lastBump<POPULATION_CONFIG.bumpCooldownMs) return;
    this.lastBump=now;
    this.player.setVelocity(this.player.body!.velocity.x*0.4,this.player.body!.velocity.y*0.4);
    const order=OrderManager.getInstance().getCurrentOrder();
    if(order?.status===OrderStatus.PICKED_UP) {
      const integrity=IntegrityManager.getInstance();
      integrity.setIntegrity(integrity.getIntegrity()-POPULATION_CONFIG.bumpDamage);
      this.scene.game.events.emit('toast_notification','Phanh gấp tránh xe/người qua đường! -5% chất lượng món.');
    }
    SoundManager.getInstance().playRattle();
  }

  public update(time:number) {
    const order=OrderManager.getInstance().getCurrentOrder();
    const view=this.scene.cameras.main.worldView;
    const margin=POPULATION_CONFIG.activationMargin;
    const isVisible=(x:number,y:number)=>x>view.left-margin&&x<view.right+margin&&y>view.top-margin&&y<view.bottom+margin;
    for(const npc of this.npcs) {
      if(npc.definition.role==='customer'&&order?.status===OrderStatus.PICKED_UP&&
        npc.definition.name===order.customerName&&this.customerOrderId!==order.id&&
        Phaser.Math.Distance.Between(this.player.x,this.player.y,npc.x,npc.y)<POPULATION_CONFIG.customerArrivalRadius) {
        npc.comeOutside();this.customerOrderId=order.id;
      }
      const nearby=Phaser.Math.Distance.Between(this.player.x,this.player.y,npc.x,npc.y)<POPULATION_CONFIG.interactionRadius;
      npc.step(time,isVisible(npc.x,npc.y),nearby);
      if(npc.visible&&npc.definition.role!=='customer') {
        const dx=this.player.x-npc.x,dy=this.player.y-npc.y;
        const velocity=npc.body!.velocity;
        if(Math.hypot(dx,dy)<POPULATION_CONFIG.pedestrianYieldDistance&&
          velocity.x*dx+velocity.y*dy>0) npc.setVelocity(0,0);
      }
    }
    const phase=time%POPULATION_CONFIG.signalPeriodMs;
    this.updateSignalLights(phase);
    for(const vehicle of this.traffic) {
      const {definition:d,sprite}=vehicle;
      const horizontal=d.axis==='horizontal';
      const extent=horizontal?WORLD_WIDTH:WORLD_HEIGHT;
      const coordinate=horizontal?sprite.x:sprite.y;
      if(coordinate<-90||coordinate>extent+90) {
        sprite.body!.reset(horizontal?(d.direction===1?-70:extent+70):sprite.x,
          horizontal?sprite.y:d.direction===1?-70:extent+70);
      }
      const active=isVisible(sprite.x,sprite.y);
      sprite.setVisible(active).setDepth(sprite.y+sprite.height/2);
      let stop=false;
      const actors=[this.player,...this.npcs.filter(npc=>npc.visible)];
      for(const actor of actors) {
        const forward=(horizontal?actor.x-sprite.x:actor.y-sprite.y)*d.direction;
        const across=Math.abs(horizontal?actor.y-sprite.y:actor.x-sprite.x);
        if(forward>-8&&forward<POPULATION_CONFIG.yieldDistance&&across<(d.motorbike?26:38)) {stop=true;break;}
      }
      if(!stop) stop=this.traffic.some(other=>other!==vehicle&&other.definition.axis===d.axis&&
        other.definition.direction===d.direction&&
        Math.abs(horizontal?other.sprite.y-sprite.y:other.sprite.x-sprite.x)<8&&
        (horizontal?other.sprite.x-sprite.x:other.sprite.y-sprite.y)*d.direction>0&&
        (horizontal?other.sprite.x-sprite.x:other.sprite.y-sprite.y)*d.direction<POPULATION_CONFIG.followingDistance);
      const red=horizontal?phase>POPULATION_CONFIG.signalPeriodMs/2:phase<=POPULATION_CONFIG.signalPeriodMs/2;
      if(red&&!stop) {
        const roads=horizontal?CITY_LAYOUT.verticalRoads:CITY_LAYOUT.horizontalRoads;
        stop=roads.some(road=>{
          const line=(d.direction===1?road.tile*TILE_SIZE-46:(road.tile+road.lanes)*TILE_SIZE+46);
          const distance=(line-coordinate)*d.direction;
          return distance>=0&&distance<46;
        });
      }
      const speed=stop?0:d.speed*d.direction;
      sprite.setVelocity(horizontal?speed:0,horizontal?0:speed);
    }
  }

  private createTrafficSignals() {
    CITY_TRAFFIC_SIGNALS.forEach((signal,index)=>{
      // Put one signal on the west approach and one on the north approach.
      // Their L-shaped placement makes the two controlled road directions easy to read.
      const horizontalX=signal.x-signal.verticalWidth/2-18;
      const horizontalY=signal.y+6;
      const verticalX=signal.x+6;
      const verticalY=signal.y-signal.horizontalWidth/2-18;
      const makeHead=(x:number,y:number,rotation:number)=>{
        const depth=y+30;
        const housing=this.scene.add.graphics();
        housing.fillStyle(0x263840,1).fillRoundedRect(-11,-16,22,48,3);
        housing.fillStyle(0x465a60,1).fillRect(-3,30,6,16);
        const red=this.scene.add.circle(0,-8,4,0xf04444);
        const yellow=this.scene.add.circle(0,4,4,0xd2a345);
        const green=this.scene.add.circle(0,16,4,0x3caa68);
        this.scene.add.container(x,y,[housing,red,yellow,green])
          .setDepth(depth).setRotation(rotation);
        return [red,yellow,green];
      };
      this.signalLamps[index]={
        horizontal:makeHead(horizontalX,horizontalY,0),
        vertical:makeHead(verticalX,verticalY,-Math.PI/2)
      };
    });
  }

  private updateSignalLights(phase:number) {
    const horizontalGreen=phase<POPULATION_CONFIG.signalPeriodMs/2;
    for(const signal of this.signalLamps) {
      signal.horizontal[0].setAlpha(horizontalGreen?0.65:1);
      signal.horizontal[2].setAlpha(horizontalGreen?1:0.32);
      signal.vertical[0].setAlpha(horizontalGreen?1:0.65);
      signal.vertical[2].setAlpha(horizontalGreen?0.32:1);
    }
  }

  public checkPlayerTrafficSignal(time:number) {
    const current={x:this.player.x,y:this.player.y};
    const previous=this.previousPlayerPosition;
    this.previousPlayerPosition=current;
    if(this.player.playerState!==PlayerState.MOUNTED||time-this.lastSignalViolation<POPULATION_CONFIG.trafficViolationCooldownMs) return;
    for(const signal of CITY_TRAFFIC_SIGNALS) {
      const crossedHorizontal=(previous.x-signal.x)*(current.x-signal.x)<=0&&
        previous.x!==current.x&&Math.abs(current.y-signal.y)<signal.verticalWidth/2+28;
      const crossedVertical=(previous.y-signal.y)*(current.y-signal.y)<=0&&
        previous.y!==current.y&&Math.abs(current.x-signal.x)<signal.horizontalWidth/2+28;
      if(!crossedHorizontal&&!crossedVertical) continue;
      const horizontalCrossed=crossedHorizontal&&(!crossedVertical||Math.abs(current.x-previous.x)>=Math.abs(current.y-previous.y));
      const phase=time%POPULATION_CONFIG.signalPeriodMs;
      const red=horizontalCrossed?phase>=POPULATION_CONFIG.signalPeriodMs/2:phase<POPULATION_CONFIG.signalPeriodMs/2;
      if(red) this.recordTrafficViolation();
      break;
    }
  }

  private recordTrafficViolation() {
    this.lastSignalViolation=this.scene.time.now;
    const stats=this.player.stats;
    stats.trafficViolations=(stats.trafficViolations??0)+1;
    if(stats.trafficViolations===1) {
      this.scene.game.events.emit('toast_notification','Đèn đỏ! Đây là lần nhắc nhở đầu tiên. Vượt thêm lần nữa sẽ bị phạt.');
      return;
    }
    const paid=Math.min(stats.wallet,POPULATION_CONFIG.trafficFine);
    stats.wallet-=paid;
    this.scene.game.events.emit('toast_notification',`Vượt đèn đỏ lần ${stats.trafficViolations}: bị phạt ${POPULATION_CONFIG.trafficFine.toLocaleString('vi-VN')}đ.`);
  }

  public nearbyNpc():Npc|undefined {
    const eligible=this.npcs.filter(npc=>npc.visible&&Phaser.Math.Distance.Between(
      this.player.x,this.player.y,npc.x,npc.y)<POPULATION_CONFIG.interactionRadius);
    const order=OrderManager.getInstance().getCurrentOrder();
    const receiver=order?.status===OrderStatus.PICKED_UP
      ? eligible.find(npc=>npc.definition.role==='customer'&&npc.definition.name===order.customerName) : undefined;
    return receiver??eligible.sort((a,b)=>
      Phaser.Math.Distance.Between(this.player.x,this.player.y,a.x,a.y)-
      Phaser.Math.Distance.Between(this.player.x,this.player.y,b.x,b.y))[0];
  }

  public isCustomerReady(name:string):boolean {
    return this.npcs.some(npc=>npc.definition.role==='customer'&&npc.definition.name===name&&npc.ready);
  }
}
