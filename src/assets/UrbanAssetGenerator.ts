import Phaser from 'phaser';
import { CITY_HOUSE_PALETTES, CITY_SHOP_STYLES } from '../config/CityMap';

/**
 * Draw at half resolution, then enlarge by exactly 2 for a consistent pixel grid.
 * Variants are shared across hundreds of buildings; no per-building textures.
 */
export class UrbanAssetGenerator {
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

  private static window(ctx: CanvasRenderingContext2D, x: number, y: number, lit: boolean) {
    ctx.fillStyle = '#58626b';
    ctx.fillRect(x, y, 15, 15);
    ctx.fillStyle = lit ? '#eac991' : '#8ba9ae';
    ctx.fillRect(x + 2, y + 2, 11, 11);
    ctx.fillStyle = lit ? '#f8e5bb' : '#b6cbd0';
    ctx.fillRect(x + 3, y + 3, 3, 7);
    ctx.fillStyle = '#566068';
    ctx.fillRect(x + 7, y + 2, 1, 11);
    ctx.fillRect(x + 1, y + 14, 13, 2);
  }

  private static balcony(ctx: CanvasRenderingContext2D, y: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(7, y, 50, 5);
    ctx.fillStyle = '#536365';
    ctx.fillRect(7, y - 5, 50, 1);
    for (let x = 8; x < 56; x += 4) ctx.fillRect(x, y - 5, 1, 6);
    ctx.fillStyle = '#af775b';
    ctx.fillRect(12, y - 3, 5, 3);
    ctx.fillRect(47, y - 3, 5, 3);
    ctx.fillStyle = '#668959';
    ctx.fillRect(11, y - 6, 7, 3);
    ctx.fillRect(46, y - 6, 7, 3);
    ctx.fillStyle = '#cf8b92';
    ctx.fillRect(13, y - 7, 2, 2);
    ctx.fillRect(49, y - 7, 2, 2);
  }

  private static shell(ctx: CanvasRenderingContext2D, wall: string, trim: string, roof: string, variant: number) {
    // Offset roof, side wall and ground shadow give the facade some volume.
    ctx.fillStyle = '#35434b';
    ctx.fillRect(5, 89, 58, 6);
    ctx.fillStyle = trim;
    ctx.fillRect(5, 15, 56, 76);
    ctx.fillStyle = wall;
    ctx.fillRect(4, 18, 53, 71);
    ctx.fillStyle = '#ffffff20';
    ctx.fillRect(5, 19, 2, 69);
    ctx.fillStyle = roof;
    ctx.fillRect(2, 7, 58, 12);
    ctx.fillRect(0, 16, 62, 4);
    ctx.fillStyle = '#ffffff24';
    for (let y = 8; y < 17; y += 3) ctx.fillRect(4, y, 53, 1);
    ctx.fillStyle = '#00000018';
    for (let x = 5; x < 58; x += 6) ctx.fillRect(x, 8, 1, 10);
    ctx.fillRect(4, 20, 53, 3);
    ctx.fillStyle = '#87999b';
    ctx.fillRect(42, 2, 10, 6); // rooftop water tank
    ctx.fillStyle = '#b4c1bf';
    ctx.fillRect(42, 2, 10, 1);
    ctx.fillStyle = '#566367';
    ctx.fillRect(44, 7, 1, 2);
    ctx.fillRect(49, 7, 1, 2);
    if (variant % 2 === 0) {
      ctx.fillStyle = '#657276';
      ctx.fillRect(13, 0, 1, 7);
      ctx.fillRect(9, 2, 9, 1);
    }
    ctx.fillStyle = '#ffffff20';
    for (let y = 24; y < 86; y += 13) ctx.fillRect(5, y, 51, 1);
  }

  private static generateHouses(scene: Phaser.Scene) {
    CITY_HOUSE_PALETTES.forEach(([wall, trim, roof], index) => {
      const { canvas, ctx } = this.canvas(64, 96);
      this.shell(ctx, wall, trim, roof, index);
      this.window(ctx, 11, 27, index % 3 === 0);
      this.window(ctx, 36, 27, index % 3 === 1);
      this.balcony(ctx, 44, trim);
      this.window(ctx, 11, 52, index % 2 === 0);
      this.window(ctx, 36, 52, false);
      this.balcony(ctx, 68, trim);
      ctx.fillStyle = '#617074';
      ctx.fillRect(14, 76, 32, 15);
      ctx.fillStyle = '#a8b7b5';
      for (let y = 78; y < 90; y += 2) ctx.fillRect(16, y, 28, 1);
      ctx.fillStyle = '#e0ded0';
      ctx.fillRect(48, 55, 9, 7); // outdoor AC unit
      ctx.fillStyle = '#7a898b';
      ctx.fillRect(50, 57, 4, 3);
      ctx.fillStyle = '#b17a5a';
      ctx.fillRect(6, 84, 5, 7);
      ctx.fillStyle = '#6c915e';
      ctx.fillRect(4, 81, 9, 5);
      ctx.fillStyle = '#ebe0c2';
      ctx.fillRect(10, 73, 6, 3); // house number plate
      this.register(scene, 'urban_house_' + index, canvas);
    });
  }

  private static generateShops(scene: Phaser.Scene) {
    CITY_SHOP_STYLES.forEach((style, index) => {
      const { canvas, ctx } = this.canvas(64, 96);
      this.shell(ctx, style.wall, style.roof, style.roof, index);
      this.window(ctx, 11, 26, false);
      this.window(ctx, 36, 26, index % 2 === 0);
      this.balcony(ctx, 43, style.roof);
      ctx.fillStyle = '#5c6264';
      ctx.fillRect(3, 48, 57, 13);
      ctx.fillStyle = style.accent;
      ctx.fillRect(4, 49, 55, 11);
      ctx.fillStyle = '#fcf0ce';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(style.sign, 31, 57, 51);
      ctx.fillStyle = '#46545a';
      ctx.fillRect(7, 65, 49, 26);
      ctx.fillStyle = '#73898d';
      ctx.fillRect(9, 68, 20, 19);
      ctx.fillStyle = '#acc6c7';
      ctx.fillRect(10, 69, 2, 14);
      ctx.fillStyle = '#e8ce9e';
      ctx.fillRect(32, 67, 21, 22);
      ctx.fillStyle = '#80694f';
      ctx.fillRect(32, 80, 21, 2);
      ctx.fillRect(38, 67, 1, 22);
      ctx.fillStyle = '#f8e0a4';
      ctx.fillRect(33, 68, 18, 2);
      // Repeated striped awnings, with a scalloped pixel edge.
      for (let x = 2; x < 62; x += 5) {
        ctx.fillStyle = x % 10 === 2 ? style.accent : '#f1e5cb';
        ctx.fillRect(x, 61, 5, 6);
        ctx.fillRect(x + 1, 67, 3, 2);
      }
      const wareColors = style.wares === 'flowers' ? ['#d9869c', '#e5c16e', '#a6bf81']
        : style.wares === 'books' ? ['#b67562', '#819da5', '#d5bb86']
        : style.wares === 'drinks' ? ['#d4b38b', '#b2c995', '#e6c5ad']
        : style.wares === 'groceries' ? ['#acbd79', '#d6a36d', '#d28770']
        : ['#efc991', '#e5b774', '#bd8d57'];
      for (let item = 0; item < 3; item++) {
        ctx.fillStyle = wareColors[item];
        ctx.fillRect(34 + item * 6, 75, 4, 4);
        ctx.fillRect(34 + item * 6, 84, 4, 3);
      }
      ctx.fillStyle = '#667473';
      ctx.fillRect(7, 90, 49, 2);
      ctx.fillStyle = style.accent;
      ctx.fillRect(0, 75, 5, 10); // hanging menu board
      ctx.fillStyle = '#f7e7c1';
      ctx.fillRect(1, 77, 3, 1);
      ctx.fillRect(1, 80, 3, 1);
      ctx.fillRect(1, 83, 3, 1);
      this.register(scene, 'urban_shop_' + style.id, canvas);
    });
  }

  private static generateApartment(scene: Phaser.Scene) {
    const { canvas, ctx } = this.canvas(96, 128);
    ctx.fillStyle = '#3e4d53';
    ctx.fillRect(7, 120, 86, 6);
    ctx.fillStyle = '#8ea99f';
    ctx.fillRect(9, 13, 83, 110);
    ctx.fillStyle = '#dfddc9';
    ctx.fillRect(5, 17, 80, 104);
    ctx.fillStyle = '#647f79';
    ctx.fillRect(3, 10, 84, 8);
    ctx.fillStyle = '#78988e';
    ctx.fillRect(39, 19, 12, 103);
    for (let row = 0; row < 4; row++) {
      const y = 25 + row * 21;
      this.window(ctx, 12, y, row % 2 === 0);
      this.window(ctx, 60, y, row % 2 !== 0);
      ctx.fillStyle = '#94b0a1';
      ctx.fillRect(9, y + 13, 23, 5);
      ctx.fillRect(57, y + 13, 23, 5);
      ctx.fillStyle = '#506d66';
      for (let x = 11; x < 31; x += 4) ctx.fillRect(x, y + 11, 1, 6);
      for (let x = 59; x < 79; x += 4) ctx.fillRect(x, y + 11, 1, 6);
    }
    ctx.fillStyle = '#4d6263';
    ctx.fillRect(31, 107, 30, 15);
    ctx.fillStyle = '#a2c4c4';
    ctx.fillRect(34, 109, 24, 12);
    ctx.fillStyle = '#72988b';
    ctx.fillRect(27, 105, 38, 4);
    ctx.fillStyle = '#bfd1c1';
    ctx.fillRect(19, 3, 46, 8);
    ctx.fillStyle = '#496d62';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHUNG CƯ XANH', 42, 9, 42);
    this.register(scene, 'urban_apartment', canvas);
  }

  private static generateGround(scene: Phaser.Scene) {
    const { canvas, ctx } = this.canvas(15 * 32, 32);
    for (let tile = 0; tile < 15; tile++) {
      ctx.save();
      ctx.translate(tile * 32, 0);
      const road = [1, 2, 3, 6, 7, 13, 14].includes(tile);
      ctx.fillStyle = road ? '#46535b' : tile === 4 ? '#8cab78'
        : tile === 5 ? '#b7afa1' : tile === 12 ? '#cbbd94' : '#cbbfb0';
      ctx.fillRect(0, 0, 32, 32);
      if (road || tile === 4) {
        for (let pixel = 0; pixel < 36; pixel++) {
          ctx.fillStyle = road ? pixel % 2 ? '#4b5860' : '#414e55' : pixel % 2 ? '#9bb884' : '#7f9f6e';
          ctx.fillRect((pixel * 13 + 3) % 32, (pixel * 7 + 11) % 32, 1, 1);
        }
      } else {
        ctx.fillStyle = tile === 5 ? '#aaa497' : '#b6ac9e';
        for (let y = 0; y < 32; y += 8) {
          ctx.fillRect(0, y, 32, 1);
          for (let x = (y % 16 === 0 ? 0 : 8); x < 32; x += 16) ctx.fillRect(x, y, 1, 8);
        }
      }
      ctx.fillStyle = '#dfc788';
      if (tile === 2 || tile === 13) ctx.fillRect(5, tile === 2 ? 31 : 15, 20, 1);
      if (tile === 3 || tile === 14) ctx.fillRect(tile === 3 ? 31 : 15, 5, 1, 20);
      ctx.fillStyle = '#d8dfd7';
      if (tile === 6) for (let x = 3; x < 30; x += 5) ctx.fillRect(x, 2, 3, 28);
      if (tile === 7) for (let y = 3; y < 30; y += 5) ctx.fillRect(2, y, 28, 3);
      ctx.fillStyle = '#8e9b98';
      if (tile === 8) ctx.fillRect(0, 30, 32, 2);
      if (tile === 9) ctx.fillRect(0, 0, 32, 2);
      if (tile === 10) ctx.fillRect(30, 0, 2, 32);
      if (tile === 11) ctx.fillRect(0, 0, 2, 32);
      ctx.restore();
    }
    this.register(scene, 'urban_tiles', canvas);
  }

  private static generateProps(scene: Phaser.Scene) {
    const tree = this.canvas(48, 64);
    const tc = tree.ctx;
    tc.fillStyle = '#465b4355';
    tc.fillRect(9, 56, 34, 6);
    tc.fillStyle = '#806d51';
    tc.fillRect(21, 31, 6, 28);
    tc.fillStyle = '#54774f';
    tc.fillRect(7, 11, 34, 32);
    tc.fillRect(3, 20, 42, 17);
    tc.fillRect(14, 5, 21, 43);
    tc.fillStyle = '#71925f';
    tc.fillRect(8, 14, 31, 21);
    tc.fillRect(15, 8, 18, 31);
    tc.fillStyle = '#91ad77';
    tc.fillRect(13, 12, 17, 6);
    tc.fillRect(8, 22, 12, 5);
    tc.fillRect(25, 28, 10, 5);
    this.register(scene, 'urban_tree', tree.canvas);

    const bench = this.canvas(32, 16);
    bench.ctx.fillStyle = '#45565b';
    bench.ctx.fillRect(3, 12, 2, 4);
    bench.ctx.fillRect(27, 12, 2, 4);
    bench.ctx.fillStyle = '#a9845a';
    for (let y = 3; y < 13; y += 3) bench.ctx.fillRect(1, y, 30, 2);
    this.register(scene, 'urban_bench', bench.canvas);

    const planter = this.canvas(24, 24);
    planter.ctx.fillStyle = '#ac805f';
    planter.ctx.fillRect(3, 15, 18, 8);
    planter.ctx.fillStyle = '#d4b79a';
    planter.ctx.fillRect(2, 14, 20, 3);
    planter.ctx.fillStyle = '#76975c';
    planter.ctx.fillRect(4, 7, 16, 8);
    planter.ctx.fillRect(8, 3, 8, 12);
    planter.ctx.fillStyle = '#d1949d';
    planter.ctx.fillRect(6, 6, 3, 3);
    planter.ctx.fillRect(13, 4, 3, 3);
    this.register(scene, 'urban_planter', planter.canvas);

    const lamp = this.canvas(16, 48);
    lamp.ctx.fillStyle = '#566b6d';
    lamp.ctx.fillRect(7, 8, 2, 37);
    lamp.ctx.fillRect(4, 44, 8, 3);
    lamp.ctx.fillRect(4, 5, 8, 8);
    lamp.ctx.fillStyle = '#eed7a2';
    lamp.ctx.fillRect(5, 6, 6, 6);
    lamp.ctx.fillStyle = '#536568';
    lamp.ctx.fillRect(3, 4, 10, 2);
    this.register(scene, 'urban_lamp', lamp.canvas);

    const fountain = this.canvas(48, 48);
    fountain.ctx.fillStyle = '#8faaa5';
    fountain.ctx.fillRect(5, 9, 38, 34);
    fountain.ctx.fillRect(2, 14, 44, 23);
    fountain.ctx.fillStyle = '#cbd1bc';
    fountain.ctx.fillRect(6, 11, 36, 30);
    fountain.ctx.fillStyle = '#82b5ba';
    fountain.ctx.fillRect(9, 14, 30, 23);
    fountain.ctx.fillStyle = '#afdbd9';
    fountain.ctx.fillRect(11, 17, 12, 2);
    fountain.ctx.fillRect(26, 31, 10, 2);
    fountain.ctx.fillStyle = '#dde1ce';
    fountain.ctx.fillRect(21, 8, 6, 22);
    fountain.ctx.fillRect(17, 7, 14, 4);
    fountain.ctx.fillStyle = '#c2e3dc';
    fountain.ctx.fillRect(23, 2, 2, 6);
    this.register(scene, 'urban_fountain', fountain.canvas);

    const cart = this.canvas(32, 40);
    cart.ctx.fillStyle = '#695c51';
    cart.ctx.fillRect(4, 10, 2, 27);
    cart.ctx.fillRect(26, 10, 2, 27);
    cart.ctx.fillStyle = '#b98c61';
    cart.ctx.fillRect(2, 24, 28, 11);
    cart.ctx.fillStyle = '#e0c794';
    cart.ctx.fillRect(1, 22, 30, 3);
    for (let x = 0; x < 32; x += 4) {
      cart.ctx.fillStyle = x % 8 === 0 ? '#bf6d59' : '#e5d4ad';
      cart.ctx.fillRect(x, 4, 4, 8);
      cart.ctx.fillRect(x + 1, 12, 2, 2);
    }
    cart.ctx.fillStyle = '#9bb06d';
    for (let x = 5; x < 27; x += 5) cart.ctx.fillRect(x, 17, 4, 5);
    cart.ctx.fillStyle = '#485657';
    cart.ctx.fillRect(5, 35, 5, 4);
    cart.ctx.fillRect(22, 35, 5, 4);
    this.register(scene, 'urban_market_cart', cart.canvas);
  }

  public static generateAll(scene: Phaser.Scene) {
    this.generateGround(scene);
    this.generateHouses(scene);
    this.generateShops(scene);
    this.generateApartment(scene);
    this.generateProps(scene);
  }
}
