import Phaser from 'phaser';
import { GAME_WIDTH,GAME_HEIGHT } from '../config/GameConfig';
import { ConversationModel } from '../types';
import { SocialManager } from '../managers/SocialManager';
import { SoundManager } from '../assets/SoundManager';

export class ConversationUI {
  public isOpen=false;
  private readonly layer=document.createElement('div');
  private readonly backdrop=document.createElement('div');
  private readonly panel=document.createElement('section');
  private readonly paused=new Set<string>();
  private onClose?: () => void;
  private readonly handleKey=(event:KeyboardEvent)=>{
    if(!this.isOpen||event.key!=='Escape') return;
    event.preventDefault();event.stopImmediatePropagation();this.close();
  };
  constructor(private readonly scene:Phaser.Scene) {
    this.layer.className='npc-dialog-layer';this.layer.hidden=true;
    this.backdrop.className='npc-dialog-backdrop';
    this.panel.className='npc-dialog';
    this.panel.setAttribute('role','dialog');
    this.panel.setAttribute('aria-modal','true');
    this.layer.append(this.backdrop,this.panel);
    document.getElementById('ui-overlay')!.append(this.layer);
    this.backdrop.addEventListener('click',()=>this.close());
    for(const event of ['pointerdown','pointerup','wheel','keydown']) {
      this.layer.addEventListener(event,event=>event.stopPropagation());
    }
    window.addEventListener('keydown',this.handleKey,true);
    this.scene.scale.on('resize',this.layout,this);
    this.scene.events.once('shutdown',this.destroy,this);
  }
  private element<K extends keyof HTMLElementTagNameMap>(tag:K,className:string,text='') {
    const node=document.createElement(tag);node.className=className;node.textContent=text;return node;
  }
  public show(model:ConversationModel) {
    this.onClose=model.onClose;
    if(!this.isOpen) {
      for(const key of ['CityScene','RoomScene','RestaurantScene','ApartmentScene']) {
        if(this.scene.scene.isActive(key)) {this.paused.add(key);this.scene.scene.pause(key);}
      }
    }
    this.isOpen=true;this.layer.hidden=false;
    this.panel.setAttribute('aria-label','Nói chuyện với '+model.name);
    const header=this.element('header','npc-dialog-header');
    const portrait=this.element('img','npc-portrait');
    const source=this.scene.textures.get(model.texture).getSourceImage();
    if(source instanceof HTMLCanvasElement) portrait.src=source.toDataURL();
    portrait.alt=model.name;
    const identity=this.element('div','npc-identity');
    identity.append(this.element('h2','',model.name),this.element('p','',model.role));
    const relationship=this.element('div','npc-affection');
    const caption=this.element('span','','♥ '+Math.round(model.affection)+'/100 • '+SocialManager.getInstance().label(model.affection));
    const track=this.element('div','npc-affection-track');
    const fill=this.element('div','npc-affection-fill');
    fill.style.width=model.affection+'%';track.append(fill);
    relationship.append(caption,track);
    if(model.showAffection!==false) identity.append(relationship);
    header.append(portrait,identity);
    const message=this.element('p','npc-message',model.message);
    message.setAttribute('aria-live','polite');
    const actions=this.element('div','npc-actions');
    for(const action of model.actions) {
      const button=this.element('button','phone-action',action.label);
      button.type='button';button.dataset.action=action.id;button.disabled=Boolean(action.disabled);
      button.addEventListener('click',()=>{
        SoundManager.getInstance().resumeContext();
        SoundManager.getInstance().playClick();
        action.run();
      });
      actions.append(button);
    }
    const close=this.element('button','npc-close','Rời cuộc trò chuyện • ESC');
    close.type='button';close.addEventListener('click',()=>this.close());
    this.panel.replaceChildren(header,message,actions,close);
    this.layout();
    close.focus({preventScroll:true});
  }
  public layout() {
    const canvas=this.scene.game.canvas.getBoundingClientRect();
    const parent=this.layer.parentElement!.getBoundingClientRect();
    const scale=canvas.width/GAME_WIDTH;
    this.panel.style.left=canvas.left-parent.left+(GAME_WIDTH-420)/2*scale+'px';
    this.panel.style.top=canvas.top-parent.top+(GAME_HEIGHT-16-this.panel.offsetHeight)*scale+'px';
    this.panel.style.transform='scale('+scale+')';
    Object.assign(this.backdrop.style,{
      left:canvas.left-parent.left+'px',top:canvas.top-parent.top+'px',
      width:canvas.width+'px',height:canvas.height+'px'
    });
  }
  public close() {
    if (!this.isOpen) return;
    this.isOpen=false;this.layer.hidden=true;
    for(const key of this.paused) {
      const scene=this.scene.scene.get(key);
      scene.input.keyboard?.resetKeys();
      this.scene.scene.resume(key);
    }
    this.paused.clear();
    this.scene.input.keyboard?.resetKeys();
    const callback=this.onClose;
    this.onClose=undefined;
    callback?.();
  }
  public destroy() {
    window.removeEventListener('keydown',this.handleKey,true);
    this.scene.scale.off('resize',this.layout,this);
    this.layer.remove();
  }
}
