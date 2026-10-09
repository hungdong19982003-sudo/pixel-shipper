import Phaser from 'phaser';
import { RestaurantTemplate,ConversationAction,OrderStatus } from '../types';
import { RESTAURANT_ROOM_CONFIG,RESTAURANT_CATALOG,PLAYER_ON_FOOT_SPEED } from '../config/GameConfig';
import { CityScene } from './CityScene';
import { UIScene } from './UIScene';
import { SocialManager,sellerId } from '../managers/SocialManager';
import { OrderManager } from '../managers/OrderManager';
import { SoundManager } from '../assets/SoundManager';
import { FishingEconomyManager } from '../managers/FishingEconomyManager';

export class RestaurantScene extends Phaser.Scene {
  public restaurant!:RestaurantTemplate;
  public actor!:Phaser.Physics.Arcade.Sprite;
  private city!:CityScene;
  private seller!:Phaser.GameObjects.Image;
  private prompt!:Phaser.GameObjects.Text;
  private keys!:Record<'W'|'A'|'S'|'D'|'E',Phaser.Input.Keyboard.Key>;
  private cursors!:Phaser.Types.Input.Keyboard.CursorKeys;
  private lastInteract=0;
  private leaving=false;
  private sellerName='';

  constructor() {super({key:'RestaurantScene'});}
  init(data:{restaurant:RestaurantTemplate}) {
    this.restaurant=data.restaurant;
    this.leaving=false;this.lastInteract=0;
  }
  create() {
    this.city=this.scene.get('CityScene') as CityScene;
    const config=RESTAURANT_ROOM_CONFIG;
    this.physics.world.setBounds(config.bounds.x,config.bounds.y+76,config.bounds.width,config.bounds.height-76);
    this.cameras.main.setRoundPixels(true).fadeIn(240,0,0,0);
    this.add.rectangle(480,270,960,540,0x101a20).setDepth(-2);
    for(let y=config.bounds.y;y<config.bounds.y+config.bounds.height;y+=64) {
      for(let x=config.bounds.x;x<config.bounds.x+config.bounds.width;x+=64) {
        this.add.image(x+32,y+32,y<config.bounds.y+64?'room_wall':'room_floor').setDepth(0);
      }
    }
    const trim=Phaser.Display.Color.HexStringToColor(this.restaurant.badgeColor).color;
    this.add.rectangle(480,config.bounds.y+66,config.bounds.width,8,trim).setDepth(2);
    this.add.text(480,160,this.restaurant.name,{
      fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:'12px',color:'#f0dfb7',backgroundColor:'#14222b',
      padding:{x:12,y:5}
    }).setOrigin(0.5).setDepth(10);
    const menu=this.add.graphics().setDepth(2);
    menu.fillStyle(0x29423d).fillRoundedRect(166,238,170,90,6);
    this.add.text(176,245,'THỰC ĐƠN\n'+this.restaurant.dishes.map(dish=>
      dish.name+' • '+dish.price.toLocaleString('vi-VN')+'đ').join('\n'),{
      fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:'9px',color:'#e8d6ac',wordWrap:{width:150},lineSpacing:4
    }).setDepth(3);
    const window=this.add.graphics().setDepth(2);
    window.fillStyle(0x687f85).fillRect(640,246,130,65);
    window.fillStyle(0xadc7c1).fillRect(645,251,120,55);
    window.fillStyle(0x4c635d).fillRect(700,251,4,55);
    window.fillStyle(0x7f9f75).fillRect(646,287,52,19);
    this.add.image(config.counter.x,config.counter.y,'shop_counter').setDepth(config.counter.y);
    this.actor=this.physics.add.sprite(config.spawn.x,config.spawn.y,'player_up');
    this.actor.setSize(16,12).setOffset(8,26).setCollideWorldBounds(true);
    const furniture=this.physics.add.staticGroup();
    const addSolid=(x:number,y:number,width:number,height:number)=>{
      const solid=this.add.zone(x,y,width,height);this.physics.add.existing(solid,true);furniture.add(solid);
    };
    addSolid(config.counter.x,config.counter.y,config.counter.width,config.counter.height);
    for(const x of [278,682]) {
      this.add.image(x,425,'shop_table').setOrigin(0.5,1).setDepth(425);
      addSolid(x,401,64,36);
    }
    this.physics.add.collider(this.actor,furniture);
    const names=['Chú Tư','Chị Mây','Cô Hạnh','Anh Dũng','Bác Lâm','Chị Nhung','Anh Khoa','Cô Sáu','Chú Phúc','Cô Mai','Chị Hương'];
    this.sellerName=names[RESTAURANT_CATALOG.indexOf(this.restaurant)]??'Chủ quán';
    this.seller=this.add.image(config.vendor.x,config.vendor.y,'npc_6_down_0').setOrigin(0.5,1).setDepth(config.vendor.y);
    this.add.text(config.vendor.x,config.vendor.y-58,this.sellerName,{
      fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:'10px',color:'#f0dfb7'
    }).setOrigin(0.5).setDepth(999);
    this.add.image(config.exit.x,config.exit.y,'room_door_exit').setDepth(1);
    this.prompt=this.add.text(480,520,'Đi tới quầy • E nói chuyện / lấy đơn • E ở cửa để ra phố',{
      fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:'10px',color:'#cfe2ce',backgroundColor:'#14222b',
      padding:{x:10,y:4}
    }).setOrigin(0.5).setDepth(10000);
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,E') as typeof this.keys;
    this.cursors=this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.resetKeys();
  }
  public canTalkToSeller():boolean {
    return !!this.actor && Phaser.Math.Distance.Between(this.actor.x,this.actor.y,
      RESTAURANT_ROOM_CONFIG.vendor.x,RESTAURANT_ROOM_CONFIG.vendor.y)<RESTAURANT_ROOM_CONFIG.vendorRadius;
  }
  public openSellerConversation(message?:string) {
    if(!this.canTalkToSeller()) return;
    const ui=this.scene.get('UIScene') as UIScene;
    const social=SocialManager.getInstance();
    const stats=this.city.player.stats;
    const id=sellerId(this.restaurant);
    const current=OrderManager.getInstance().getCurrentOrder();
    const matching=current?.status===OrderStatus.ACCEPTED&&current.restaurantName===this.restaurant.name;
    const pickupCount=OrderManager.getInstance().getActiveOrders().filter((order) =>
      order.status===OrderStatus.ACCEPTED&&order.restaurantName===this.restaurant.name).length;
    const discount=social.discount(stats,this.restaurant);
    const actions:ConversationAction[]=[
      {id:'talk',label:'Hỏi thăm '+this.sellerName,run:()=>{
        const result=social.talk(stats,id);
        this.openSellerConversation(result.message);
      }}
    ];
    if(matching) actions.push({
      id:'pickup',label:pickupCount>1?`Lấy ${pickupCount} đơn ghép`:'Lấy đơn • '+current.foodName,run:()=>{
        if(OrderManager.getInstance().pickupFood(this.restaurant.name)) {
          this.openSellerConversation(pickupCount>1?
            `Đã xếp ${pickupCount} món vào túi. Chọn điểm giao trên điện thoại rồi lên đường nhé!`:
            'Món đã sẵn sàng! Đi cẩn thận, khách đang chờ bạn nhé. +2 thiện cảm.');
        }
      }
    });
    this.restaurant.dishes.forEach((dish,index)=>{
      actions.push({
      id:'buy-'+index,label:'Dùng tại quán • '+dish.name+' • '+social.price(stats,this.restaurant,index).toLocaleString('vi-VN')+'đ',
      run:()=>{
        const result=social.buyMeal(stats,this.restaurant,index);
        if(result.success) {
          if(this.restaurant.textureKey?.includes('tea')||this.restaurant.textureKey?.includes('cafe'))
            SoundManager.getInstance().playDrinkSip();
          else SoundManager.getInstance().playEatCrunch();
        }
        this.openSellerConversation(result.message);
      }
      });
      actions.push({
        id:'takeaway-'+index,label:'Mua mang đi • '+dish.name+' • '+social.price(stats,this.restaurant,index).toLocaleString('vi-VN')+'đ',
        run:()=>{
          const result=social.buyTakeaway(stats,this.restaurant,index);
          this.openSellerConversation(result.message);
        }
      });
    });
    if (RESTAURANT_CATALOG.some((restaurant) => restaurant.name === this.restaurant.name)) {
      for (const fish of FishingEconomyManager.fishInBag(stats)) {
        actions.push({
          id: 'sell-' + fish.id,
          label: `Bán ${fish.name}${FishingEconomyManager.isDailyRequest(stats, fish.id, this.restaurant.name)
            ? ' • Đơn cá tươi' : ''} • ${FishingEconomyManager.salePrice(stats, fish.id, this.restaurant.name).toLocaleString('vi-VN')}đ`,
          run: () => {
            const result = FishingEconomyManager.sell(stats, fish.id, id, this.restaurant.name);
            if (result.success) SoundManager.getInstance().playCoinSound();
            this.openSellerConversation(result.message);
          }
        });
      }
    }
    ui.showConversation({
      name:this.sellerName,role:this.restaurant.name,texture:'npc_6_down_0',
      affection:social.get(stats,id).affection,
      message:message??(matching?'Đơn của bạn đã chuẩn bị xong. Bạn nhận món hay muốn ăn một chút trước?':
        'Chào bạn! Ghé quán nghỉ chân nhé, mình có món ngon vừa làm xong.')+
        (discount>0?' Quán giảm '+Math.round(discount*100)+'% cho khách quen.':''),
      actions
    });
  }
  override update(time:number) {
    if(this.leaving||!this.actor?.body) return;
    const virtual=this.city.player.virtualInput;
    let dx=0,dy=0;
    if(this.keys.A.isDown||this.cursors.left.isDown||virtual.left) dx--;
    if(this.keys.D.isDown||this.cursors.right.isDown||virtual.right) dx++;
    if(this.keys.W.isDown||this.cursors.up.isDown||virtual.up) dy--;
    if(this.keys.S.isDown||this.cursors.down.isDown||virtual.down) dy++;
    const length=Math.hypot(dx,dy)||1;
    this.actor.setVelocity(dx/length*PLAYER_ON_FOOT_SPEED,dy/length*PLAYER_ON_FOOT_SPEED);
    if(dx||dy) {
      const direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
      this.actor.anims.play('walk_'+direction,true);
    } else this.actor.anims.stop();
    this.actor.setDepth(this.actor.y+20);
    const atExit=Phaser.Math.Distance.Between(this.actor.x,this.actor.y,
      RESTAURANT_ROOM_CONFIG.exit.x,RESTAURANT_ROOM_CONFIG.exit.y)<RESTAURANT_ROOM_CONFIG.doorRadius;
    this.prompt.setText(this.canTalkToSeller()?'[E] Nói chuyện với '+this.sellerName+' • Lấy đơn / Mua món':
      atExit?'[E] Ra phố • Hãy ghé quầy nếu bạn chưa lấy đơn':'Đi tới quầy • E nói chuyện / lấy đơn');
    const keyboard=Phaser.Input.Keyboard.JustDown(this.keys.E);
    const touch=this.city.player.consumeVirtualInteract();
    if((keyboard||touch)&&time-this.lastInteract>400) {
      this.lastInteract=time;
      if(this.canTalkToSeller()) this.openSellerConversation();
      else if(atExit) this.exitToStreet();
    }
  }
  public exitToStreet() {
    if(this.leaving) return;
    this.leaving=true;
    this.actor.setVelocity(0,0);
    this.cameras.main.fadeOut(220,0,0,0);
    this.cameras.main.once('camerafadeoutcomplete',()=>{
      this.scene.stop('RestaurantScene');
      this.scene.wake('CityScene');
      this.city.player.body!.reset(this.restaurant.pos.x,this.restaurant.pos.y+12);
      this.city.player.anims.stop();this.city.player.setTexture('player_down');
      this.city.player.currentDirection='down';
      this.city.input.keyboard?.resetKeys();
      this.city.isTransitioning=false;
      this.city.cameras.main.fadeIn(220,0,0,0);
    });
  }
}
