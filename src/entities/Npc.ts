import Phaser from 'phaser';
import { NpcDefinition } from '../types';

export class Npc extends Phaser.Physics.Arcade.Sprite {
  public readonly definition: NpcDefinition;
  public ready = false;
  private targetIndex = 1;
  private walking = true;
  private direction = 'down';
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, definition: NpcDefinition) {
    const start = definition.route[0];
    super(scene,start.x,start.y,definition.role==='dog'?'dog_down_0':'npc_'+definition.variant+'_down_0');
    this.definition = definition;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5,1).setImmovable(true);
    if(definition.role==='dog') this.setSize(26,10).setOffset(9,20);
    else this.setSize(14,10).setOffset(9,36);
    this.label = scene.add.text(this.x,this.y-52,definition.name,{
      fontFamily:'"Plus Jakarta Sans", sans-serif',fontSize:'9px',color:'#f0dec0',
      backgroundColor:'#172331',padding:{x:5,y:3}
    }).setOrigin(0.5).setDepth(10001).setVisible(false);
    if(definition.role==='customer') this.walking=false;
  }

  public comeOutside() {
    const home=this.definition.route[0];
    (this.body as Phaser.Physics.Arcade.Body).reset(home.x,home.y);
    this.ready=false;
    this.targetIndex=1;
    this.walking=true;
  }

  public step(time: number, active: boolean, nearby: boolean) {
    const body=this.body as Phaser.Physics.Arcade.Body;
    body.enable=active;
    this.setVisible(active);
    this.label.setVisible(active&&nearby).setPosition(this.x,this.y-52);
    if(!active) return;
    if(this.walking) {
      const target=this.definition.route[this.targetIndex];
      const dx=target.x-this.x,dy=target.y-this.y;
      const distance=Math.hypot(dx,dy);
      if(distance<4) {
        if(this.definition.role==='customer') {
          this.ready=true;this.walking=false;this.setVelocity(0,0);
        } else this.targetIndex=(this.targetIndex+1)%this.definition.route.length;
      } else {
        this.setVelocity(dx/distance*this.definition.speed,dy/distance*this.definition.speed);
        this.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
      }
    } else this.setVelocity(0,0);
    const frame=this.walking?Math.floor(time/220)%2:0;
    this.setTexture(this.definition.role==='dog'?'dog_'+this.direction+'_'+frame:
      'npc_'+this.definition.variant+'_'+this.direction+'_'+frame);
    this.setDepth(this.y);
  }

  public override destroy(fromScene?: boolean) {
    this.label?.destroy();
    super.destroy(fromScene);
  }
}
