import Phaser from 'phaser';

/** Native low resolution art, enlarged by an integer factor. */
export class PopulationAssetGenerator {
  private static canvas(width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }
  private static register(scene: Phaser.Scene, key: string, source: HTMLCanvasElement) {
    if (scene.textures.exists(key)) return;
    const { canvas, ctx } = this.canvas(source.width * 2, source.height * 2);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    scene.textures.addCanvas(key, canvas);
  }
  public static generateAll(scene: Phaser.Scene) {
    const shirts = ['#7195ab', '#bd8290', '#c7a269', '#7f9c7e', '#8d86ae', '#b88967', '#e5dbc0'];
    shirts.forEach((shirt, variant) => {
      for (const direction of ['down', 'up', 'left', 'right']) {
        for (let frame = 0; frame < 2; frame++) {
          const { canvas, ctx } = this.canvas(16, 24);
          ctx.fillStyle = '#3e4b4d55';
          ctx.fillRect(3, 22, 11, 2);
          ctx.fillStyle = '#3f3b3b';
          ctx.fillRect(5, 2, 7, 5);
          ctx.fillStyle = '#e4b391';
          ctx.fillRect(5, 5, 7, 5);
          ctx.fillRect(3, 12, 2, 6);
          ctx.fillRect(12, 12, 2, 6);
          ctx.fillStyle = shirt;
          ctx.fillRect(4, 10, 9, 9);
          ctx.fillStyle = '#ffffff30';
          ctx.fillRect(5, 10, 2, 7);
          ctx.fillStyle = '#526071';
          ctx.fillRect(5, 19, 3, 3 + frame);
          ctx.fillRect(9, 19, 3, 4 - frame);
          ctx.fillStyle = '#313d49';
          ctx.fillRect(4, 22 + frame, 4, 1);
          ctx.fillRect(9, 23 - frame, 4, 1);
          ctx.fillStyle = '#483c37';
          if (direction === 'down') {
            ctx.fillRect(6, 7, 1, 1); ctx.fillRect(10, 7, 1, 1);
          } else if (direction === 'up') {
            ctx.fillRect(5, 4, 7, 5);
          } else ctx.fillRect(direction === 'right' ? 11 : 5, 7, 1, 1);
          if (variant === 6) {
            ctx.fillStyle = '#f2eee1';
            ctx.fillRect(4, 1, 9, 4);
            ctx.fillRect(6, 0, 5, 2);
            ctx.fillStyle = '#b57559';
            ctx.fillRect(6, 13, 5, 6);
          }
          this.register(scene, 'npc_' + variant + '_' + direction + '_' + frame, canvas);
        }
      }
    });
    for (const direction of ['down', 'up', 'left', 'right']) {
      for (let frame = 0; frame < 2; frame++) {
        const { canvas, ctx } = this.canvas(22, 16);
        ctx.fillStyle = '#48524c55';
        ctx.fillRect(2, 13, 18, 2);
        ctx.fillStyle = '#c49462';
        ctx.fillRect(4, 6, 12, 7);
        ctx.fillRect(direction === 'left' ? 1 : 14, 3, 6, 7);
        ctx.fillStyle = '#936c49';
        ctx.fillRect(direction === 'left' ? 2 : 16, 2, 3, 3);
        ctx.fillRect(direction === 'left' ? 17 : 2, 5 - frame, 3, 2);
        ctx.fillRect(5, 12, 2, 3 - frame);
        ctx.fillRect(13, 12, 2, 2 + frame);
        ctx.fillStyle = '#eee0bf';
        ctx.fillRect(direction === 'left' ? 1 : 17, 7, 4, 2);
        ctx.fillStyle = '#443e39';
        ctx.fillRect(direction === 'left' ? 2 : 18, 5, 1, 1);
        ctx.fillStyle = '#ba6470';
        ctx.fillRect(direction === 'left' ? 6 : 14, 8, 1, 3);
        this.register(scene, 'dog_' + direction + '_' + frame, canvas);
      }
    }
    ['#88a0ad', '#bf8b73', '#a3ae7b', '#d0ba8c'].forEach((color, variant) => {
      for (const bike of [false, true]) {
        const source = this.canvas(bike ? 18 : 24, bike ? 28 : 40);
        const ctx = source.ctx;
        const w = source.canvas.width, h = source.canvas.height;
        ctx.fillStyle = '#313e48';
        ctx.fillRect(0, 10, 3, 7); ctx.fillRect(w - 3, 10, 3, 7);
        ctx.fillRect(0, h - 14, 3, 7); ctx.fillRect(w - 3, h - 14, 3, 7);
        ctx.fillStyle = color; ctx.fillRect(3, 3, w - 6, h - 5);
        ctx.fillStyle = '#ffffff38'; ctx.fillRect(4, 4, 2, h - 8);
        ctx.fillStyle = '#456879'; ctx.fillRect(5, 11, w - 10, bike ? 6 : 9);
        ctx.fillStyle = '#acc7c8'; ctx.fillRect(6, 11, w - 12, 2);
        ctx.fillStyle = '#f0d7a2'; ctx.fillRect(4, h - 5, 4, 2); ctx.fillRect(w - 8, h - 5, 4, 2);
        ctx.fillStyle = '#ac6262'; ctx.fillRect(4, 3, 3, 2); ctx.fillRect(w - 7, 3, 3, 2);
        if (bike) {
          ctx.fillStyle = '#e8cfa4';ctx.fillRect(6, 6, 6, 5);
          ctx.fillStyle = color;ctx.fillRect(5, 3, 8, 4);
          ctx.fillStyle = '#668c91';ctx.fillRect(5, 11, 8, 8);
        }
        for (const direction of ['down', 'up', 'left', 'right']) {
          const horizontal = direction === 'left' || direction === 'right';
          const rotated = this.canvas(horizontal ? h : w, horizontal ? w : h);
          rotated.ctx.translate(rotated.canvas.width / 2, rotated.canvas.height / 2);
          rotated.ctx.rotate(direction === 'down' ? 0 : direction === 'up' ? Math.PI
            : direction === 'right' ? -Math.PI / 2 : Math.PI / 2);
          rotated.ctx.drawImage(source.canvas, -w / 2, -h / 2);
          this.register(scene, (bike ? 'traffic_bike_' : 'traffic_car_') + variant + '_' + direction, rotated.canvas);
        }
      }
    });
    const counter = this.canvas(128, 24);
    counter.ctx.fillStyle = '#6c594a'; counter.ctx.fillRect(1, 4, 126, 20);
    counter.ctx.fillStyle = '#bd986b'; counter.ctx.fillRect(0, 3, 128, 8);
    counter.ctx.fillStyle = '#dfcda0'; counter.ctx.fillRect(0, 3, 128, 2);
    counter.ctx.fillStyle = '#879ca3'; counter.ctx.fillRect(9, 0, 28, 7);
    counter.ctx.fillStyle = '#e7ded0'; counter.ctx.fillRect(11, 0, 24, 3);
    for(let x=52;x<120;x+=20) {
      counter.ctx.fillStyle='#ddd3b6';counter.ctx.fillRect(x,0,13,5);
      counter.ctx.fillStyle='#a87950';counter.ctx.fillRect(x+3,0,7,2);
    }
    this.register(scene, 'shop_counter', counter.canvas);
    const table = this.canvas(48, 48);
    table.ctx.fillStyle='#7c6250';table.ctx.fillRect(9,14,30,24);
    table.ctx.fillStyle='#bd9a70';table.ctx.fillRect(7,12,34,20);
    table.ctx.fillStyle='#ddc598';table.ctx.fillRect(9,13,30,2);
    table.ctx.fillStyle='#8b8c74';table.ctx.fillRect(3,17,5,16);table.ctx.fillRect(41,17,5,16);
    table.ctx.fillStyle='#e6dcc3';table.ctx.fillRect(14,18,10,7);
    table.ctx.fillStyle='#a9815b';table.ctx.fillRect(16,19,6,4);
    table.ctx.fillStyle='#b2cdcf';table.ctx.fillRect(30,18,4,6);
    this.register(scene, 'shop_table', table.canvas);
  }
}
