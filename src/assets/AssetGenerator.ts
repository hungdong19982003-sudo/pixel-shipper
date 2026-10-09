import Phaser from 'phaser';
import { UrbanAssetGenerator } from './UrbanAssetGenerator';
import { PopulationAssetGenerator } from './PopulationAssetGenerator';
import { StoryArtGenerator } from './StoryArtGenerator';

/**
 * Bảng màu Retro Á Đông chuẩn 16-bit cho Pixel Shipper
 */
export const PALETTE = {
  TRANSPARENT: 'transparent',
  // Shipper Uniform & Body
  HELMET_GREEN: '#059669',
  HELMET_LIGHT: '#34d399',
  HELMET_DARK: '#047857',
  VISOR_BLACK: '#0f172a',
  SKIN: '#fed7aa',
  SKIN_SHADOW: '#fba779',
  SHIRT_GREEN: '#10b981',
  SHIRT_DARK: '#047857',
  SHIRT_STRIPE: '#facc15',
  PANTS_DARK: '#1e293b',
  PANTS_LIGHT: '#334155',
  SHOES_BLACK: '#0f172a',
  SHOES_WHITE: '#f8fafc',
  BAG_ORANGE: '#ea580c',
  BAG_LIGHT: '#fb923c',
  BAG_DARK: '#9a3412',
  BAG_STRAP: '#431407',

  // Motorbike Wave Alpha
  BIKE_RED: '#dc2626',
  BIKE_RED_DARK: '#991b1b',
  BIKE_RED_LIGHT: '#f87171',
  BIKE_SHIELD_SILVER: '#e2e8f0',
  BIKE_FRAME_DARK: '#1e293b',
  BIKE_SEAT_BLACK: '#0f172a',
  BIKE_WHEEL_DARK: '#020617',
  BIKE_RIM_SILVER: '#94a3b8',
  BIKE_HEADLIGHT_YELLOW: '#fef08a',
  BIKE_TAILLIGHT_RED: '#ef4444',
  BIKE_EXHAUST_CHROME: '#cbd5e1',
  BIKE_HANDLEBAR: '#334155',

  // Road & Pavement
  ROAD_BASE: '#282c35',
  ROAD_DARK: '#21242c',
  ROAD_GRAIN: '#343945',
  ROAD_YELLOW: '#facc15',
  ROAD_WHITE: '#f1f5f9',
  SIDEWALK_RED: '#b91c1c',
  SIDEWALK_LIGHT: '#dc2626',
  SIDEWALK_DARK: '#7f1d1d',
  SIDEWALK_GROUT: '#450a0a',
  CURB_GRAY: '#64748b',
  CURB_LIGHT: '#94a3b8',
  CURB_DARK: '#334155',

  // Trees & Nature
  TREE_TRUNK: '#78350f',
  TREE_TRUNK_DARK: '#451a03',
  LEAF_DARK: '#14532d',
  LEAF_MID: '#16a34a',
  LEAF_LIGHT: '#4ade80',
  LEAF_HIGHLIGHT: '#86efac',

  // Buildings & Decor
  WALL_YELLOW: '#fde047',
  WALL_OCHRE: '#d97706',
  WALL_CREAM: '#fef3c7',
  WALL_CONCRETE: '#94a3b8',
  WALL_CONCRETE_DARK: '#475569',
  ROOF_BLUE: '#0284c7',
  ROOF_DARK_BLUE: '#0369a1',
  AWNING_GREEN: '#059669',
  AWNING_WHITE: '#ffffff',
  SIGN_RED: '#b91c1c',
  SIGN_GOLD: '#facc15',
  GLASS_BLUE: '#38bdf8',
  GLASS_DARK: '#0284c7',
  WOOD_BROWN: '#854d0e',
  WOOD_DARK: '#543109',
  PLASTIC_RED: '#ef4444',
  PLASTIC_BLUE: '#3b82f6',

  // Hazards
  HOLE_BLACK: '#090d16',
  HOLE_DARK: '#1e2430',
  HOLE_EDGE: '#475569',
  OIL_CENTER: '#0f172a',
  OIL_CYAN: '#06b6d4',
  OIL_MAGENTA: '#d946ef',
  OIL_PURPLE: '#8b5cf6',

  // Particles & FX
  SMOKE_WHITE: '#e2e8f0',
  SMOKE_GRAY: '#94a3b8',
  SKID_MARK: '#090d16',
  SPARK_GOLD: '#fbbf24'
};

/**
 * Trình sinh Procedural Pixel Art Textures trên HTML5 Canvas
 */
export class AssetGenerator {
  /**
   * Tạo canvas offscreen với cấu hình pixel art không mờ
   */
  private static createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  /**
   * Đăng ký canvas vào Phaser TextureManager
   */
  private static registerTexture(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement) {
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
    scene.textures.addCanvas(key, canvas);
  }

  /**
   * Vẽ ma trận pixel 2D theo bảng màu ký tự
   */
  private static drawPixelMatrix(
    ctx: CanvasRenderingContext2D,
    matrix: string[],
    colorMap: Record<string, string>,
    scale: number = 2,
    offsetX: number = 0,
    offsetY: number = 0
  ) {
    for (let r = 0; r < matrix.length; r++) {
      const row = matrix[r];
      for (let c = 0; c < row.length; c++) {
        const char = row[c];
        const color = colorMap[char];
        if (color && color !== PALETTE.TRANSPARENT && color !== ' ') {
          ctx.fillStyle = color;
          ctx.fillRect(offsetX + c * scale, offsetY + r * scale, scale, scale);
        }
      }
    }
  }

  // =========================================================================
  // 1. NHÂN VẬT SHIPPER (ĐI BỘ 4 HƯỚNG: DOWN, UP, LEFT, RIGHT)
  // =========================================================================

  private static generatePlayerDown(scene: Phaser.Scene) {
    // 16x20 matrix -> 32x40 pixels (scale 2)
    const { canvas, ctx } = this.createCanvas(32, 40);
    const C = {
      H: PALETTE.HELMET_GREEN,
      L: PALETTE.HELMET_LIGHT,
      D: PALETTE.HELMET_DARK,
      V: PALETTE.VISOR_BLACK,
      S: PALETTE.SKIN,
      G: PALETTE.SHIRT_GREEN,
      K: PALETTE.SHIRT_DARK,
      Y: PALETTE.SHIRT_STRIPE,
      P: PALETTE.PANTS_DARK,
      B: PALETTE.SHOES_BLACK,
      W: PALETTE.SHOES_WHITE,
      O: PALETTE.BAG_ORANGE,
      ' ': ' '
    };

    const matrix = [
      '    DDHHHHLL    ',
      '   DHHHHHHHLL   ',
      '   DHHHVVHHLL   ',
      '   DHHVVVVHLL   ',
      '    DHSSSSHD    ',
      '     SSSSSS     ',
      '    GGYYYYGG    ',
      '   GGGGGGGGGG   ',
      '  OGGGGGGGGGGO  ',
      '  OGGGGYGGGGGO  ',
      '  OGGGKKGGGGGO  ',
      '  OGGGKKGGGGGO  ',
      '   KKKKKKKKKK   ',
      '    PPPPPPPP    ',
      '    PPPPPPPP    ',
      '    PPP  PPP    ',
      '    PPP  PPP    ',
      '    PPP  PPP    ',
      '    BBW  WBB    ',
      '    BBB  BBB    '
    ];

    this.drawPixelMatrix(ctx, matrix, C, 2);
    this.registerTexture(scene, 'player_down', canvas);

    // Frame bước đi 1 (chân trái tiến)
    const { canvas: cWalk1, ctx: ctxW1 } = this.createCanvas(32, 40);
    const mWalk1 = [...matrix];
    mWalk1[16] = '    PPP   PP    ';
    mWalk1[17] = '   PPPP   PP    ';
    mWalk1[18] = '   BBW   WBB    ';
    mWalk1[19] = '   BBB   BBB    ';
    this.drawPixelMatrix(ctxW1, mWalk1, C, 2);
    this.registerTexture(scene, 'player_down_walk1', cWalk1);

    // Frame bước đi 2 (chân phải tiến)
    const { canvas: cWalk2, ctx: ctxW2 } = this.createCanvas(32, 40);
    const mWalk2 = [...matrix];
    mWalk2[16] = '    PP   PPP    ';
    mWalk2[17] = '    PP   PPPP   ';
    mWalk2[18] = '   WBB   BBW    ';
    mWalk2[19] = '   BBB   BBB    ';
    this.drawPixelMatrix(ctxW2, mWalk2, C, 2);
    this.registerTexture(scene, 'player_down_walk2', cWalk2);
  }

  private static generatePlayerUp(scene: Phaser.Scene) {
    const { canvas, ctx } = this.createCanvas(32, 40);
    const C = {
      H: PALETTE.HELMET_GREEN,
      L: PALETTE.HELMET_LIGHT,
      D: PALETTE.HELMET_DARK,
      G: PALETTE.SHIRT_GREEN,
      K: PALETTE.SHIRT_DARK,
      P: PALETTE.PANTS_DARK,
      B: PALETTE.SHOES_BLACK,
      W: PALETTE.SHOES_WHITE,
      O: PALETTE.BAG_ORANGE,
      T: PALETTE.BAG_LIGHT,
      M: PALETTE.BAG_DARK,
      ' ': ' '
    };

    const matrix = [
      '    DDHHHHLL    ',
      '   DHHHHHHHLL   ',
      '   DHHHHHHHHLL  ',
      '   DHHHHHHHHLL  ',
      '    DDDDDDDD    ',
      '    KKKKKKKK    ',
      '   GGTTTTTTGG   ',
      '  OGGTOOOOTTGGO ',
      '  OGGTOOOOTTGGO ',
      '  OGGTOOOOTTGGO ',
      '  OGGTMMMMTTGGO ',
      '  OGGTTTTTTTGGO ',
      '   KKKKKKKKKK   ',
      '    PPPPPPPP    ',
      '    PPPPPPPP    ',
      '    PPP  PPP    ',
      '    PPP  PPP    ',
      '    PPP  PPP    ',
      '    BBW  WBB    ',
      '    BBB  BBB    '
    ];

    this.drawPixelMatrix(ctx, matrix, C, 2);
    this.registerTexture(scene, 'player_up', canvas);

    const { canvas: cW1, ctx: ctxW1 } = this.createCanvas(32, 40);
    const mW1 = [...matrix];
    mW1[16] = '   PPPP   PP    ';
    mW1[17] = '   PPPP   PP    ';
    mW1[18] = '   BBW   WBB    ';
    mW1[19] = '   BBB   BBB    ';
    this.drawPixelMatrix(ctxW1, mW1, C, 2);
    this.registerTexture(scene, 'player_up_walk1', cW1);

    const { canvas: cW2, ctx: ctxW2 } = this.createCanvas(32, 40);
    const mW2 = [...matrix];
    mW2[16] = '    PP   PPPP   ';
    mW2[17] = '    PP   PPPP   ';
    mW2[18] = '   WBB   BBW    ';
    mW2[19] = '   BBB   BBB    ';
    this.drawPixelMatrix(ctxW2, mW2, C, 2);
    this.registerTexture(scene, 'player_up_walk2', cW2);
  }

  private static generatePlayerRight(scene: Phaser.Scene) {
    const { canvas, ctx } = this.createCanvas(32, 40);
    const C = {
      H: PALETTE.HELMET_GREEN,
      L: PALETTE.HELMET_LIGHT,
      D: PALETTE.HELMET_DARK,
      V: PALETTE.VISOR_BLACK,
      S: PALETTE.SKIN,
      G: PALETTE.SHIRT_GREEN,
      K: PALETTE.SHIRT_DARK,
      Y: PALETTE.SHIRT_STRIPE,
      P: PALETTE.PANTS_DARK,
      B: PALETTE.SHOES_BLACK,
      W: PALETTE.SHOES_WHITE,
      O: PALETTE.BAG_ORANGE,
      T: PALETTE.BAG_LIGHT,
      ' ': ' '
    };

    const matrix = [
      '    DHHHHLL     ',
      '   DHHHHHHLL    ',
      '   DHHHHHVVLL   ',
      '   DHHHHHVVV    ',
      '   DDHHSSSS     ',
      '    DDSSSSS     ',
      '   TTGGYYGG     ',
      '  OTOGGGGGGG    ',
      '  OTOGGGYGGG    ',
      '  OTOGGGKGGG    ',
      '  OTOGGGKGGG    ',
      '  OTOGGGGGGG    ',
      '   TTKKKKKK     ',
      '    PPPPPP      ',
      '    PPPPPP      ',
      '    PPP  PPP    ',
      '    PPP  PPP    ',
      '    PPP  PPP    ',
      '    BBW  WBB    ',
      '    BBB  BBB    '
    ];

    this.drawPixelMatrix(ctx, matrix, C, 2);
    this.registerTexture(scene, 'player_right', canvas);

    // Frame walk 1 (bước sải)
    const { canvas: cW1, ctx: ctxW1 } = this.createCanvas(32, 40);
    const mW1 = [...matrix];
    mW1[16] = '   PPPP    PP   ';
    mW1[17] = '  PPPPP     PP  ';
    mW1[18] = '  BBW       WBB ';
    mW1[19] = '  BBB       BBB ';
    this.drawPixelMatrix(ctxW1, mW1, C, 2);
    this.registerTexture(scene, 'player_right_walk1', cW1);

    // Frame walk 2 (co chân)
    const { canvas: cW2, ctx: ctxW2 } = this.createCanvas(32, 40);
    const mW2 = [...matrix];
    mW2[16] = '    PPP   PP    ';
    mW2[17] = '    PPP  PPP    ';
    mW2[18] = '    BBW  WBB    ';
    mW2[19] = '    BBB  BBB    ';
    this.drawPixelMatrix(ctxW2, mW2, C, 2);
    this.registerTexture(scene, 'player_right_walk2', cW2);

    // Tạo player_left bằng cách lật ngang (flip horizontal)
    const { canvas: cLeft, ctx: ctxLeft } = this.createCanvas(32, 40);
    ctxLeft.save();
    ctxLeft.scale(-1, 1);
    ctxLeft.drawImage(canvas, -32, 0);
    ctxLeft.restore();
    this.registerTexture(scene, 'player_left', cLeft);

    const { canvas: cLeftW1, ctx: ctxLW1 } = this.createCanvas(32, 40);
    ctxLW1.save();
    ctxLW1.scale(-1, 1);
    ctxLW1.drawImage(cW1, -32, 0);
    ctxLW1.restore();
    this.registerTexture(scene, 'player_left_walk1', cLeftW1);

    const { canvas: cLeftW2, ctx: ctxLW2 } = this.createCanvas(32, 40);
    ctxLW2.save();
    ctxLW2.scale(-1, 1);
    ctxLW2.drawImage(cW2, -32, 0);
    ctxLW2.restore();
    this.registerTexture(scene, 'player_left_walk2', cLeftW2);
  }

  // =========================================================================
  // 2. XE MÁY WAVE ALPHA (STANDALONE: DOWN, UP, LEFT, RIGHT)
  // =========================================================================

  private static generateMotorbike(scene: Phaser.Scene) {
    const C = {
      R: PALETTE.BIKE_RED,
      D: PALETTE.BIKE_RED_DARK,
      L: PALETTE.BIKE_RED_LIGHT,
      S: PALETTE.BIKE_SHIELD_SILVER,
      F: PALETTE.BIKE_FRAME_DARK,
      B: PALETTE.BIKE_SEAT_BLACK,
      W: PALETTE.BIKE_WHEEL_DARK,
      M: PALETTE.BIKE_RIM_SILVER,
      Y: PALETTE.BIKE_HEADLIGHT_YELLOW,
      T: PALETTE.BIKE_TAILLIGHT_RED,
      X: PALETTE.BIKE_EXHAUST_CHROME,
      H: PALETTE.BIKE_HANDLEBAR,
      O: PALETTE.BAG_ORANGE,
      ' ': ' '
    };

    // 1) Xe Wave nhìn từ trước (DOWN) - 16x24 -> 32x48
    {
      const { canvas, ctx } = this.createCanvas(32, 48);
      const matrix = [
        '     H H  H H   ',
        '    HHHH  HHHH  ',
        '     HH YYY HH  ',
        '       DYYYD    ',
        '      DRRRRRD   ',
        '     DSRRRRSD   ',
        '     DSRRRRSD   ',
        '     D SSRR SD  ',
        '      F    F    ',
        '      F WW F    ',
        '      F MM F    ',
        '      F WW F    ',
        '      FRRRRF    ',
        '     FDRRRRDF   ',
        '     F BBB  F   ',
        '     F BBB  F   ',
        '     F BBB  F   ',
        '      F    F    ',
        '      F WW F    ',
        '      F MM F    ',
        '      F WW F    ',
        '      F WW F    ',
        '       FFFF     ',
        '                '
      ];
      this.drawPixelMatrix(ctx, matrix, C, 2);
      this.registerTexture(scene, 'bike_down', canvas);
    }

    // 2) Xe Wave nhìn từ sau (UP) - có thùng shipper phía sau
    {
      const { canvas, ctx } = this.createCanvas(32, 48);
      const matrix = [
        '      F WW F    ',
        '      F MM F    ',
        '      F WW F    ',
        '      F    F    ',
        '     H H  H H   ',
        '    HHHH  HHHH  ',
        '      FRRRRF    ',
        '     FDRRRRDF   ',
        '     F BBB  F   ',
        '     F BBB  F   ',
        '     F BBB  F   ',
        '     DSRRRRSD   ',
        '    DOOOOOOOOD  ',
        '   DOOOOOOOOOOD ',
        '   DOOOOOOOOOOD ',
        '   DOOOOOOOOOOD ',
        '    DOODTTDOOD  ',
        '      F    F    ',
        '      F WW F    ',
        '      F MM F    ',
        '      F WW F    ',
        '      F WW F    ',
        '       FFFF     ',
        '                '
      ];
      this.drawPixelMatrix(ctx, matrix, C, 2);
      this.registerTexture(scene, 'bike_up', canvas);
    }

    // 3) Xe Wave nhìn nghiêng (RIGHT) - 24x16 -> 48x32
    {
      const { canvas, ctx } = this.createCanvas(48, 32);
      const matrix = [
        '                  H     ',
        '                 HH Y   ',
        '  OOOO         DRSSSY   ',
        ' OOOOOO       DRRSSSY   ',
        ' OOOOOO      DRRRSS Y   ',
        '  BBBBBBBBB DRRRR       ',
        '   BBBBBBBBDRRRRF       ',
        '    F RRRRRF  WW F      ',
        '    F RRRR F  WM F      ',
        '   WW FFF  F  WM F      ',
        '   WM F    F  WW F      ',
        '   WW XXXXXXXX          ',
        '   WW  XXXXXXX          ',
        '    W                   ',
        '                        ',
        '                        '
      ];
      this.drawPixelMatrix(ctx, matrix, C, 2);
      this.registerTexture(scene, 'bike_right', canvas);

      // Bike left = lật ngang
      const { canvas: cLeft, ctx: ctxLeft } = this.createCanvas(48, 32);
      ctxLeft.save();
      ctxLeft.scale(-1, 1);
      ctxLeft.drawImage(canvas, -48, 0);
      ctxLeft.restore();
      this.registerTexture(scene, 'bike_left', cLeft);
    }
  }

  // =========================================================================
  // 3. SHIPPER ĐANG LÁI XE (MOUNTED: 4 HƯỚNG)
  // =========================================================================

  private static generatePlayerMounted(scene: Phaser.Scene) {
    const C = {
      // Helmet & Uniform
      H: PALETTE.HELMET_GREEN,
      L: PALETTE.HELMET_LIGHT,
      D: PALETTE.HELMET_DARK,
      V: PALETTE.VISOR_BLACK,
      S: PALETTE.SKIN,
      G: PALETTE.SHIRT_GREEN,
      K: PALETTE.SHIRT_DARK,
      Y: PALETTE.SHIRT_STRIPE,
      P: PALETTE.PANTS_DARK,
      B: PALETTE.SHOES_BLACK,
      O: PALETTE.BAG_ORANGE,
      OT: PALETTE.BAG_LIGHT,

      // Bike parts
      R: PALETTE.BIKE_RED,
      RD: PALETTE.BIKE_RED_DARK,
      SI: PALETTE.BIKE_SHIELD_SILVER,
      F: PALETTE.BIKE_FRAME_DARK,
      SE: PALETTE.BIKE_SEAT_BLACK,
      W: PALETTE.BIKE_WHEEL_DARK,
      M: PALETTE.BIKE_RIM_SILVER,
      HY: PALETTE.BIKE_HEADLIGHT_YELLOW,
      TR: PALETTE.BIKE_TAILLIGHT_RED,
      X: PALETTE.BIKE_EXHAUST_CHROME,
      HB: PALETTE.BIKE_HANDLEBAR,
      ' ': ' '
    };

    // 1) MOUNTED DOWN (Lái xe hướng xuống) - 20x26 -> 40x52
    {
      const { canvas, ctx } = this.createCanvas(40, 52);
      const matrix = [
        '        DDHHHHLL        ',
        '       DHHHHHHHLL       ',
        '       DHHHVVHHLL       ',
        '       DHHVVVVHLL       ',
        '        DHSSSSHD        ',
        '     HB  SSSSSS  HB     ',
        '    HBH GGGGGGGG HBH    ',
        '    HB GGGYYYYGGG HB    ',
        '       GGGGGGGGGG       ',
        '       GGGGGGGGGG       ',
        '       KKKK  KKKK       ',
        '      PPPP    PPPP      ',
        '      PPPP    PPPP      ',
        '      BBBB    BBBB      ',
        '      FDRRHYHYRRF       ',
        '     FDSRRHYHYRRSDF     ',
        '     FDSRRRRRRRRSDF     ',
        '      F          F      ',
        '      F   WWWW   F      ',
        '      F   MMMM   F      ',
        '      F   WWWW   F      ',
        '      F   WWWW   F      ',
        '       FFFF  FFFF       ',
        '                        ',
        '                        ',
        '                        '
      ];
      this.drawPixelMatrix(ctx, matrix, C, 2);
      this.registerTexture(scene, 'player_bike_down', canvas);
    }

    // 2) MOUNTED UP (Lái xe hướng lên)
    {
      const { canvas, ctx } = this.createCanvas(40, 52);
      const matrix = [
        '      F   WWWW   F      ',
        '      F   MMMM   F      ',
        '      F   WWWW   F      ',
        '      F          F      ',
        '     HB          HB     ',
        '    HBH DDHHHHLL HBH    ',
        '    HB DHHHHHHHLL HB    ',
        '       DHHHHHHHHLL      ',
        '        DDDDDDDD        ',
        '       KKKKKKKKKK       ',
        '      GGTTTTTTTTGG      ',
        '     OGGTOOOOOOTTGGO    ',
        '     OGGTOOOOOOTTGGO    ',
        '     OGGTOOOOOOTTGGO    ',
        '      GGTTTTTTTTGG      ',
        '      PPPP    PPPP      ',
        '      PPPP    PPPP      ',
        '      BBBB    BBBB      ',
        '       F  TRTR  F       ',
        '      F   WWWW   F      ',
        '      F   MMMM   F      ',
        '      F   WWWW   F      ',
        '      F   WWWW   F      ',
        '       FFFF  FFFF       ',
        '                        ',
        '                        '
      ];
      this.drawPixelMatrix(ctx, matrix, C, 2);
      this.registerTexture(scene, 'player_bike_up', canvas);
    }

    // 3) MOUNTED RIGHT (Lái xe sang phải) - 26x20 -> 52x40
    {
      const { canvas, ctx } = this.createCanvas(52, 40);
      const matrix = [
        '              DHHHHLL       ',
        '             DHHHHHHLL      ',
        '             DHHHHHVVLL     ',
        '             DDHHSSSS       ',
        '            GGGGSSSS        ',
        '   OOOO    GGYYYYGG    HB   ',
        '  OOOOOO  OGGGGGGGGG  HBH   ',
        '  OOOOOO  OGGGYGGGGG  HB    ',
        '   OOOO    KKKKKKKK         ',
        '  F   F   PPPPPPPP DRSIHY   ',
        '  F   F   PPPPPPPP DRSIHY   ',
        '  FBBBF   PPPP  BB DRSI     ',
        '  F   F  DRRRRRF   WW F     ',
        '  F   F  DRRRR F   WM F     ',
        ' WW FFF  DRRRR F   WM F     ',
        ' WM F    DRRRR F   WW F     ',
        ' WW XXXXXXXXXXXX            ',
        ' WW  XXXXXXXXXXX            ',
        '  W                         ',
        '                            '
      ];
      this.drawPixelMatrix(ctx, matrix, C, 2);
      this.registerTexture(scene, 'player_bike_right', canvas);

      // MOUNTED LEFT (Lật ngang)
      const { canvas: cLeft, ctx: ctxLeft } = this.createCanvas(52, 40);
      ctxLeft.save();
      ctxLeft.scale(-1, 1);
      ctxLeft.drawImage(canvas, -52, 0);
      ctxLeft.restore();
      this.registerTexture(scene, 'player_bike_left', cLeft);
    }
  }

  // =========================================================================
  // 4. MẶT ĐƯỜNG & VỈA HÈ (TILES 64x64)
  // =========================================================================

  private static generateRoadTiles(scene: Phaser.Scene) {
    // 1) Mặt đường nhựa trơn (tile_road)
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      ctx.fillStyle = PALETTE.ROAD_BASE;
      ctx.fillRect(0, 0, 64, 64);

      // Điểm hạt sần pixel asphalt
      for (let y = 0; y < 64; y += 4) {
        for (let x = 0; x < 64; x += 4) {
          const rand = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          const noise = rand - Math.floor(rand);
          if (noise > 0.8) {
            ctx.fillStyle = PALETTE.ROAD_GRAIN;
            ctx.fillRect(x, y, 2, 2);
          } else if (noise < 0.15) {
            ctx.fillStyle = PALETTE.ROAD_DARK;
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
      this.registerTexture(scene, 'tile_road', canvas);
    }

    // 2) Mặt đường có vạch kẻ tim đường vàng đứt nét ngang (tile_road_line_h)
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      const base = scene.textures.get('tile_road').getSourceImage() as CanvasImageSource;
      ctx.drawImage(base, 0, 0);

      // Vạch vàng đứt nét ở giữa (dài 40px, dày 4px)
      ctx.fillStyle = PALETTE.ROAD_YELLOW;
      ctx.fillRect(12, 30, 40, 4);
      // Đổ bóng sẫm mép vạch
      ctx.fillStyle = PALETTE.ROAD_DARK;
      ctx.fillRect(12, 34, 40, 2);

      this.registerTexture(scene, 'tile_road_line_h', canvas);
    }

    // 3) Mặt đường có vạch kẻ tim đường vàng đứt nét dọc (tile_road_line_v)
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      const base = scene.textures.get('tile_road').getSourceImage() as CanvasImageSource;
      ctx.drawImage(base, 0, 0);

      ctx.fillStyle = PALETTE.ROAD_YELLOW;
      ctx.fillRect(30, 12, 4, 40);
      ctx.fillStyle = PALETTE.ROAD_DARK;
      ctx.fillRect(34, 12, 2, 40);

      this.registerTexture(scene, 'tile_road_line_v', canvas);
    }

    // 4) Vạch kẻ qua đường cho người đi bộ (tile_crosswalk_h & tile_crosswalk_v)
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      const base = scene.textures.get('tile_road').getSourceImage() as CanvasImageSource;
      ctx.drawImage(base, 0, 0);

      ctx.fillStyle = PALETTE.ROAD_WHITE;
      for (let x = 6; x < 60; x += 14) {
        ctx.fillRect(x, 10, 8, 44);
      }
      this.registerTexture(scene, 'tile_crosswalk_h', canvas);
    }

    // 4b) Vạch kẻ qua đường dọc (tile_crosswalk_v)
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      const base = scene.textures.get('tile_road').getSourceImage() as CanvasImageSource;
      ctx.drawImage(base, 0, 0);

      ctx.fillStyle = PALETTE.ROAD_WHITE;
      for (let y = 6; y < 60; y += 14) {
        ctx.fillRect(10, y, 44, 8);
      }
      this.registerTexture(scene, 'tile_crosswalk_v', canvas);
    }

    // 5) Vỉa hè gạch đỏ truyền thống (tile_sidewalk) - 64x64
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      ctx.fillStyle = PALETTE.SIDEWALK_RED;
      ctx.fillRect(0, 0, 64, 64);

      // Hoa văn gạch gốm 16x16 viên với mạch vữa sẫm màu
      const tileSize = 16;
      for (let y = 0; y < 64; y += tileSize) {
        for (let x = 0; x < 64; x += tileSize) {
          // Viền vữa
          ctx.fillStyle = PALETTE.SIDEWALK_GROUT;
          ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);

          // Điểm sáng gạch nổi 3D
          ctx.fillStyle = PALETTE.SIDEWALK_LIGHT;
          ctx.fillRect(x + 2, y + 2, tileSize - 4, 2);
          ctx.fillRect(x + 2, y + 2, 2, tileSize - 4);

          // Đổ bóng góc gạch
          ctx.fillStyle = PALETTE.SIDEWALK_DARK;
          ctx.fillRect(x + tileSize - 4, y + 2, 2, tileSize - 4);
          ctx.fillRect(x + 2, y + tileSize - 4, tileSize - 4, 2);

          // Hoa văn chữ thập / bông hoa kim cương tâm gạch
          ctx.fillStyle = PALETTE.SIDEWALK_GROUT;
          ctx.fillRect(x + 7, y + 6, 2, 4);
          ctx.fillRect(x + 6, y + 7, 4, 2);
        }
      }
      this.registerTexture(scene, 'tile_sidewalk', canvas);
    }

    // 6) Bó vỉa hè bê tông giáp lòng đường (tile_sidewalk_curb)
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      const sidewalk = scene.textures.get('tile_sidewalk').getSourceImage() as CanvasImageSource;
      ctx.drawImage(sidewalk, 0, 0);

      // Dải bó vỉa xám ở dưới cùng (dày 12px)
      ctx.fillStyle = PALETTE.CURB_LIGHT;
      ctx.fillRect(0, 52, 64, 4);
      ctx.fillStyle = PALETTE.CURB_GRAY;
      ctx.fillRect(0, 56, 64, 6);
      ctx.fillStyle = PALETTE.CURB_DARK;
      ctx.fillRect(0, 62, 64, 2);

      this.registerTexture(scene, 'tile_sidewalk_curb', canvas);
    }

    // 7) Bãi cỏ xanh công viên đô thị (tile_grass) - 64x64
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, 64, 64);

      // Hạt cỏ và bông hoa pixel
      for (let y = 0; y < 64; y += 4) {
        for (let x = 0; x < 64; x += 4) {
          const rand = Math.sin(x * 37.1 + y * 92.7) * 43758.5453;
          const noise = rand - Math.floor(rand);
          if (noise > 0.8) {
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(x, y, 2, 3);
          } else if (noise < 0.12) {
            ctx.fillStyle = '#14532d';
            ctx.fillRect(x, y, 2, 2);
          } else if (noise > 0.77 && noise < 0.79) {
            // Hoa dại trắng nhỏ xinh
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
      this.registerTexture(scene, 'tile_grass', canvas);
    }

  }

  // =========================================================================
  // 5. CÔNG TRÌNH & ĐỊA ĐIỂM (QUÁN PHỞ, TRÀ ĐÁ, NHÀ ỐNG, CHUNG CƯ)
  // =========================================================================

  private static generateBuildings(scene: Phaser.Scene) {
    // 1) QUÁN PHỞ GIA TRUYỀN (prop_shop_pho) - 96x96 pixels
    {
      const { canvas, ctx } = this.createCanvas(96, 96);

      // Thân tường gạch vàng cam ấm
      ctx.fillStyle = PALETTE.WALL_OCHRE;
      ctx.fillRect(4, 20, 88, 76);
      ctx.fillStyle = PALETTE.WALL_CREAM;
      ctx.fillRect(8, 24, 80, 70);

      // Mái hiên di động sọc xanh lá / trắng
      const awningHeight = 16;
      for (let x = 2; x < 94; x += 8) {
        ctx.fillStyle = (x % 16 === 2) ? PALETTE.AWNING_GREEN : PALETTE.AWNING_WHITE;
        ctx.fillRect(x, 14, 8, awningHeight);
      }
      // Đổ bóng viền mái hiên
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(2, 14 + awningHeight - 3, 92, 3);

      // Biển hiệu đỏ chữ vàng "PHỞ"
      ctx.fillStyle = PALETTE.SIGN_RED;
      ctx.fillRect(16, 2, 64, 16);
      ctx.lineWidth = 2;
      ctx.strokeStyle = PALETTE.SIGN_GOLD;
      ctx.strokeRect(17, 3, 62, 14);

      // Chữ PHỞ kiểu pixel block
      ctx.fillStyle = PALETTE.SIGN_GOLD;
      // Chữ P
      ctx.fillRect(28, 5, 2, 10);
      ctx.fillRect(30, 5, 4, 2);
      ctx.fillRect(34, 5, 2, 5);
      ctx.fillRect(30, 9, 4, 2);
      // Chữ H
      ctx.fillRect(40, 5, 2, 10);
      ctx.fillRect(46, 5, 2, 10);
      ctx.fillRect(42, 9, 4, 2);
      // Chữ Ở
      ctx.fillRect(52, 5, 6, 2);
      ctx.fillRect(52, 13, 6, 2);
      ctx.fillRect(50, 6, 2, 8);
      ctx.fillRect(58, 6, 2, 8);
      ctx.fillRect(56, 3, 3, 2); // dấu hỏi

      // Quầy phở bốc khói & nồi nước dùng kim loại
      ctx.fillStyle = '#64748b';
      ctx.fillRect(14, 44, 30, 36);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(16, 46, 26, 6);
      // Nồi phở tròn
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(29, 64, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(29, 64, 7, 0, Math.PI * 2);
      ctx.fill();

      // Cửa cuốn / lối vào bên phải
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(50, 42, 36, 52);
      // Bàn inox & ghế nhựa đỏ bên trong
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(54, 58, 20, 10);
      ctx.fillStyle = PALETTE.PLASTIC_RED;
      ctx.fillRect(56, 72, 6, 6);
      ctx.fillRect(66, 72, 6, 6);

      // Đèn lồng đỏ treo góc hiên
      ctx.fillStyle = PALETTE.SIGN_RED;
      ctx.fillRect(8, 30, 6, 8);
      ctx.fillStyle = PALETTE.SIGN_GOLD;
      ctx.fillRect(10, 38, 2, 4);

      this.registerTexture(scene, 'prop_shop_pho', canvas);
    }

    // 2) QUÁN TRÀ ĐÁ VỈA HÈ / CÀ PHÊ CÓC (prop_shop_tea) - 64x64 pixels
    {
      const { canvas, ctx } = this.createCanvas(64, 64);

      // Bạt che nghiêng màu xanh
      ctx.fillStyle = PALETTE.AWNING_GREEN;
      ctx.fillRect(4, 4, 56, 16);
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(4, 18, 56, 3);

      // Cột chống bạt bằng tre/kim loại
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, 20, 3, 40);
      ctx.fillRect(55, 20, 3, 40);

      // Bàn gỗ nhỏ / thùng xốp ủ trà đá
      ctx.fillStyle = '#f8fafc'; // thùng xốp trắng
      ctx.fillRect(14, 28, 20, 16);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(14, 28, 20, 3);
      // Chữ "TRÀ ĐÁ" nhỏ
      ctx.fillStyle = PALETTE.BIKE_RED;
      ctx.fillRect(16, 34, 16, 4);

      // Ấm tích tráng men bọc vải
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(38, 30, 8, 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(36, 34, 3, 2); // vòi

      // Ghế cóc nhựa đỏ & xanh xếp vỉa hè
      ctx.fillStyle = PALETTE.PLASTIC_RED;
      ctx.fillRect(12, 48, 8, 8);
      ctx.fillRect(26, 48, 8, 8);
      ctx.fillStyle = PALETTE.PLASTIC_BLUE;
      ctx.fillRect(40, 48, 8, 8);
      ctx.fillRect(48, 48, 8, 8);

      this.registerTexture(scene, 'prop_shop_tea', canvas);
    }

    // 3) NHÀ ỐNG Á ĐÔNG (prop_building_resident) - 80x112 pixels
    {
      const { canvas, ctx } = this.createCanvas(80, 112);

      // Thân nhà 3 tầng màu vàng kem cổ kính
      ctx.fillStyle = PALETTE.WALL_YELLOW;
      ctx.fillRect(4, 10, 72, 100);
      ctx.fillStyle = PALETTE.WALL_CREAM;
      ctx.fillRect(8, 14, 64, 94);

      // Tầng 3: Cửa sổ gỗ lá sách & ban công sắt
      ctx.fillStyle = PALETTE.WOOD_DARK;
      ctx.fillRect(16, 22, 16, 20);
      ctx.fillRect(48, 22, 16, 20);
      ctx.fillStyle = PALETTE.GLASS_BLUE;
      ctx.fillRect(18, 24, 12, 16);
      ctx.fillRect(50, 24, 12, 16);
      // Nan sắt ban công
      ctx.fillStyle = '#334155';
      ctx.fillRect(12, 38, 56, 4);
      for (let x = 14; x < 68; x += 6) {
        ctx.fillRect(x, 34, 2, 8);
      }
      // Chậu hoa trên ban công
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(20, 34, 6, 5);
      ctx.fillStyle = PALETTE.LEAF_MID;
      ctx.fillRect(19, 31, 8, 4);

      // Cục nóng điều hòa tầng 2
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(52, 54, 16, 12);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(54, 57, 6, 6); // cánh quạt

      // Tầng 2: Cửa kính trượt
      ctx.fillStyle = PALETTE.GLASS_DARK;
      ctx.fillRect(16, 52, 28, 24);
      ctx.fillStyle = PALETTE.GLASS_BLUE;
      ctx.fillRect(18, 54, 24, 20);

      // Tầng 1: Cửa cuốn sắt màu xám xanh
      ctx.fillStyle = '#334155';
      ctx.fillRect(14, 82, 52, 28);
      for (let y = 84; y < 108; y += 4) {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(16, y, 48, 2);
      }

      // Mái ngói đỏ dốc truyền thống
      ctx.fillStyle = PALETTE.SIDEWALK_RED;
      ctx.fillRect(0, 4, 80, 8);
      ctx.fillStyle = PALETTE.SIDEWALK_DARK;
      ctx.fillRect(0, 10, 80, 3);

      this.registerTexture(scene, 'prop_building_resident', canvas);
    }

    // 4) CHUNG CƯ XANH / KHÁCH HÀNG (prop_building_apartment) - 112x120 pixels
    {
      const { canvas, ctx } = this.createCanvas(112, 120);

      // Khối chung cư hiện đại tông trắng - xanh lam
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 8, 100, 110);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(10, 12, 92, 104);

      // Dải màu nhấn thương hiệu chung cư xanh
      ctx.fillStyle = '#10b981';
      ctx.fillRect(10, 12, 92, 6);
      ctx.fillRect(48, 12, 16, 104); // lõi thang máy kính giữa tòa

      // Các ô cửa sổ ban công 3 tầng
      const floors = [26, 50, 74];
      floors.forEach((fy) => {
        // Căn hộ trái
        ctx.fillStyle = PALETTE.GLASS_DARK;
        ctx.fillRect(16, fy, 24, 18);
        ctx.fillStyle = PALETTE.GLASS_BLUE;
        ctx.fillRect(18, fy + 2, 20, 14);
        // Ban công kính
        ctx.fillStyle = '#059669';
        ctx.fillRect(14, fy + 14, 28, 6);

        // Căn hộ phải
        ctx.fillStyle = PALETTE.GLASS_DARK;
        ctx.fillRect(72, fy, 24, 18);
        ctx.fillStyle = '#fef08a'; // Phòng sáng đèn vàng ấm cúng
        ctx.fillRect(74, fy + 2, 20, 14);
        // Ban công kính
        ctx.fillStyle = '#059669';
        ctx.fillRect(70, fy + 14, 28, 6);
      });

      // Sảnh ra vào tầng trệt & mái kính che
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(36, 96, 40, 20);
      ctx.fillStyle = PALETTE.GLASS_BLUE;
      ctx.fillRect(40, 98, 32, 18);
      // Mái hiên sảnh
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(32, 94, 48, 4);

      // Biển hiệu "CHUNG CƯ XANH"
      ctx.fillStyle = '#065f46';
      ctx.fillRect(28, 0, 56, 10);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(32, 3, 48, 4);

      this.registerTexture(scene, 'prop_building_apartment', canvas);
    }

    // 6) ĐẠI LÝ & TIỆM XE MÁY Á ĐÔNG (prop_shop_bike) - 88x76 pixels (Task 2.4)
    {
      const { canvas, ctx } = this.createCanvas(88, 76);
      // Tường tiệm gạch xám & đỏ nổi bật
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 8, 80, 66);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(4, 4, 80, 14);

      // Biển hiệu "ĐẠI LÝ XE MÁY"
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(16, 7, 56, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(18, 9, 52, 4);

      // Cửa cuốn kim loại mở 1/2
      ctx.fillStyle = '#64748b';
      ctx.fillRect(8, 20, 72, 12);
      ctx.fillStyle = '#94a3b8';
      for (let y = 20; y < 32; y += 3) {
        ctx.fillRect(8, y, 72, 1);
      }

      // Showroom kính tầng trệt
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fillRect(8, 34, 72, 36);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 34, 72, 36);

      // Chiếc xe máy tay ga trưng bày sau kính
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(24, 48, 22, 12);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(26, 62, 5, 0, Math.PI * 2);
      ctx.arc(44, 62, 5, 0, Math.PI * 2);
      ctx.fill();

      // Cờ phướn quảng cáo xe máy điện cạnh cửa
      ctx.fillStyle = '#10b981';
      ctx.fillRect(72, 36, 6, 26);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(72, 40, 6, 6);

      this.registerTexture(scene, 'prop_shop_bike', canvas);
    }
  }

  // =========================================================================
  // 6. CÂY XANH ĐÔ THỊ, CỘT ĐIỆN CHẰNG CHỊT & VẬT CẢN (HAZARDS)
  // =========================================================================

  private static generatePropsAndHazards(scene: Phaser.Scene) {
    // 1) CÂY XANH ĐÔ THỊ (prop_tree) - 48x64 pixels
    {
      const { canvas, ctx } = this.createCanvas(48, 64);

      // Thân cây gỗ nâu gân guốc
      ctx.fillStyle = PALETTE.TREE_TRUNK;
      ctx.fillRect(20, 36, 8, 26);
      ctx.fillStyle = PALETTE.TREE_TRUNK_DARK;
      ctx.fillRect(20, 36, 3, 26);

      // Rễ cây xòe gốc
      ctx.fillRect(18, 58, 4, 4);
      ctx.fillRect(26, 58, 4, 4);

      // Tán lá xanh nhiều tầng hình tròn pixel art
      const drawFoliageCircle = (x: number, y: number, r: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };

      // Đổ bóng tán lá sẫm
      drawFoliageCircle(24, 26, 20, PALETTE.LEAF_DARK);
      drawFoliageCircle(18, 22, 14, PALETTE.LEAF_MID);
      drawFoliageCircle(30, 22, 14, PALETTE.LEAF_MID);
      drawFoliageCircle(24, 16, 16, PALETTE.LEAF_MID);

      // Điểm sáng mảng lá trên cùng
      drawFoliageCircle(22, 12, 10, PALETTE.LEAF_LIGHT);
      drawFoliageCircle(26, 14, 8, PALETTE.LEAF_HIGHLIGHT);

      this.registerTexture(scene, 'prop_tree', canvas);
    }

    // 2) CỘT ĐIỆN BÊ TÔNG CHẰNG CHỊT DÂY (prop_utility_pole) - 32x80 pixels
    {
      const { canvas, ctx } = this.createCanvas(32, 80);

      // Thân cột bê tông vuông xám
      ctx.fillStyle = PALETTE.WALL_CONCRETE;
      ctx.fillRect(12, 8, 8, 70);
      ctx.fillStyle = PALETTE.WALL_CONCRETE_DARK;
      ctx.fillRect(12, 8, 3, 70);

      // Giá đỡ sứ cách điện bằng thép ngang
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 14, 24, 4);
      ctx.fillRect(6, 24, 20, 4);

      // Các bát sứ màu trắng cách điện
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(4, 12, 3, 3);
      ctx.fillRect(14, 12, 3, 3);
      ctx.fillRect(25, 12, 3, 3);

      // Dây điện chằng chịt uốn lượn
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.bezierCurveTo(8, 22, 20, 24, 32, 18);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.bezierCurveTo(12, 36, 18, 32, 32, 28);
      ctx.stroke();

      // Đèn đường vàng ấm gắn nghiêng ra ngoài
      ctx.fillStyle = '#475569';
      ctx.fillRect(20, 8, 10, 3);
      ctx.fillStyle = PALETTE.SIGN_GOLD;
      ctx.fillRect(28, 11, 4, 4);

      this.registerTexture(scene, 'prop_utility_pole', canvas);
    }

    // 3) CHƯỚNG NGẠI VẬT: Ổ GÀ (hazard_pothole) - 40x40 pixels
    {
      const { canvas, ctx } = this.createCanvas(40, 40);

      // Vùng sụp nứt viền đá dăm
      ctx.fillStyle = PALETTE.HOLE_EDGE;
      ctx.beginPath();
      ctx.ellipse(20, 20, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hố đen sâu lõm
      ctx.fillStyle = PALETTE.HOLE_DARK;
      ctx.beginPath();
      ctx.ellipse(20, 20, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = PALETTE.HOLE_BLACK;
      ctx.beginPath();
      ctx.ellipse(19, 19, 10, 6, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Vết nứt chân chim xung quanh ổ gà
      ctx.strokeStyle = PALETTE.HOLE_BLACK;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(6, 16);
      ctx.lineTo(2, 12);
      ctx.moveTo(34, 22);
      ctx.lineTo(39, 25);
      ctx.moveTo(22, 31);
      ctx.lineTo(25, 37);
      ctx.stroke();

      this.registerTexture(scene, 'hazard_pothole', canvas);
    }

    // 4) CHƯỚNG NGẠI VẬT: VŨNG NƯỚC TRƠN / VỆT DẦU (hazard_oil_slick) - 44x44 pixels
    {
      const { canvas, ctx } = this.createCanvas(44, 44);

      // Vũng nước trơn óng ánh phản chiếu
      ctx.fillStyle = PALETTE.OIL_CENTER;
      ctx.beginPath();
      ctx.ellipse(22, 22, 19, 13, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Quầng ánh dầu 7 màu óng ánh (cyan, magenta, purple)
      ctx.strokeStyle = PALETTE.OIL_CYAN;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(22, 22, 15, 9, 0.1, 0, Math.PI * 1.2);
      ctx.stroke();

      ctx.strokeStyle = PALETTE.OIL_MAGENTA;
      ctx.beginPath();
      ctx.ellipse(22, 22, 11, 6, -0.2, Math.PI * 0.8, Math.PI * 2.2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      // Đốm sáng phản chiếu ánh trời
      ctx.fillRect(28, 18, 3, 2);
      ctx.fillRect(16, 24, 2, 2);

      this.registerTexture(scene, 'hazard_oil_slick', canvas);
    }

    // 5) BIỂN TÊN PHỐ ĐÔ THỊ VIỆT NAM (prop_street_sign) - 28x36
    {
      const { canvas, ctx } = this.createCanvas(28, 36);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(12, 14, 4, 22);
      ctx.fillStyle = '#334155';
      ctx.fillRect(12, 14, 2, 22);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(2, 4, 24, 12);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(3, 5, 22, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, 9, 18, 2);
      this.registerTexture(scene, 'prop_street_sign', canvas);
    }

    // 6) THÙNG RÁC CÔNG CỘNG ĐÔ THỊ (prop_trash_bin) - 20x24
    {
      const { canvas, ctx } = this.createCanvas(20, 24);
      ctx.fillStyle = '#059669';
      ctx.fillRect(3, 6, 14, 16);
      ctx.fillStyle = '#047857';
      ctx.fillRect(3, 6, 4, 16);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(2, 4, 16, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 12, 4, 4);
      this.registerTexture(scene, 'prop_trash_bin', canvas);
    }

    // 7) CỌC TIÊU PHẢN QUANG MÃN VỈA HÈ (prop_barrier) - 16x24
    {
      const { canvas, ctx } = this.createCanvas(16, 24);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 20, 12, 4);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(4, 2, 8, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 6, 8, 4);
      ctx.fillRect(4, 14, 8, 4);
      this.registerTexture(scene, 'prop_barrier', canvas);
    }
  }


  // =========================================================================
  // 7. HIỆU ỨNG HẠT & ICON (SMOKE, SKID, SPARK, TARGET BEACON)
  // =========================================================================

  private static generateEffectsAndUI(scene: Phaser.Scene) {
    // 1) Hạt khói pô xe máy (fx_smoke) - 12x12
    {
      const { canvas, ctx } = this.createCanvas(12, 12);
      ctx.fillStyle = PALETTE.SMOKE_WHITE;
      ctx.beginPath();
      ctx.arc(6, 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.SMOKE_GRAY;
      ctx.beginPath();
      ctx.arc(5, 7, 3, 0, Math.PI * 2);
      ctx.fill();
      this.registerTexture(scene, 'fx_smoke', canvas);
    }

    // 2) Vệt lết bánh xe phanh gấp (fx_skid) - 20x8
    {
      const { canvas, ctx } = this.createCanvas(20, 8);
      ctx.fillStyle = PALETTE.SKID_MARK;
      ctx.fillRect(0, 1, 20, 3);
      ctx.fillRect(2, 5, 16, 2);
      this.registerTexture(scene, 'fx_skid', canvas);
    }

    // 3) Ngôi sao lấp lánh (fx_spark) - 12x12
    {
      const { canvas, ctx } = this.createCanvas(12, 12);
      ctx.fillStyle = PALETTE.SPARK_GOLD;
      // Dấu thập sao
      ctx.fillRect(5, 1, 2, 10);
      ctx.fillRect(1, 5, 10, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(4, 4, 4, 4);
      this.registerTexture(scene, 'fx_spark', canvas);
    }

    // 4) Vòng tròn định vị điểm đến phát sáng (fx_target_ring) - 48x48
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      // Vòng tròn phát sáng neon
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(24, 24, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.beginPath();
      ctx.arc(24, 24, 16, 0, Math.PI * 2);
      ctx.fill();

      // Tâm định vị
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(24, 24, 4, 0, Math.PI * 2);
      ctx.fill();

      this.registerTexture(scene, 'fx_target_ring', canvas);
    }

    // 5) Kim la bàn neon chỉ hướng mục tiêu (fx_compass_needle) - 32x32
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Mũi tên hướng lên (chỉ Bắc)
      // Nửa trái sáng màu lục ngọc
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(8, 26);
      ctx.lineTo(16, 20);
      ctx.closePath();
      ctx.fill();

      // Nửa phải xanh lục đậm đổ bóng
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(24, 26);
      ctx.lineTo(16, 20);
      ctx.closePath();
      ctx.fill();

      // Điểm nhọn phát sáng
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 2, 2, 4);

      // Tâm quay tròn kim loại vàng
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fill();

      this.registerTexture(scene, 'fx_compass_needle', canvas);
    }

    // 6) Icon điện thoại Driver App (fx_phone_icon) - 24x24
    {
      const { canvas, ctx } = this.createCanvas(24, 24);
      // Thân máy bo tròn đen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 2, 16, 20);
      // Viền máy
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(4.5, 2.5, 15, 19);
      // Màn hình phát sáng xanh cyan
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(6, 5, 12, 14);
      // Nút Home / loa
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(10, 3, 4, 1);
      this.registerTexture(scene, 'fx_phone_icon', canvas);
    }

    // 7) Icon Vitals & Save Game (icon_hunger, icon_thirst, icon_energy, icon_save) - 16x16
    {
      // Hunger (Đùi gà / Ổ bánh mì vàng cam)
      const { canvas: hCanvas, ctx: hCtx } = this.createCanvas(16, 16);
      hCtx.fillStyle = '#f97316';
      hCtx.beginPath();
      hCtx.arc(10, 6, 5, 0, Math.PI * 2);
      hCtx.fill();
      hCtx.fillStyle = '#fed7aa';
      hCtx.fillRect(3, 10, 5, 3);
      hCtx.fillStyle = '#fb923c';
      hCtx.fillRect(6, 6, 4, 4);
      this.registerTexture(scene, 'icon_hunger', hCanvas);

      // Thirst (Giọt nước xanh cyan lấp lánh)
      const { canvas: tCanvas, ctx: tCtx } = this.createCanvas(16, 16);
      tCtx.fillStyle = '#38bdf8';
      tCtx.beginPath();
      tCtx.moveTo(8, 2);
      tCtx.bezierCurveTo(4, 7, 3, 11, 8, 14);
      tCtx.bezierCurveTo(13, 11, 12, 7, 8, 2);
      tCtx.closePath();
      tCtx.fill();
      tCtx.fillStyle = '#ffffff';
      tCtx.fillRect(7, 5, 2, 2);
      this.registerTexture(scene, 'icon_thirst', tCanvas);

      // Energy (Tia chớp vàng sáng rực)
      const { canvas: eCanvas, ctx: eCtx } = this.createCanvas(16, 16);
      eCtx.fillStyle = '#facc15';
      eCtx.beginPath();
      eCtx.moveTo(9, 1);
      eCtx.lineTo(4, 8);
      eCtx.lineTo(8, 8);
      eCtx.lineTo(7, 15);
      eCtx.lineTo(12, 7);
      eCtx.lineTo(8, 7);
      eCtx.closePath();
      eCtx.fill();
      eCtx.fillStyle = '#ffffff';
      eCtx.fillRect(7, 4, 2, 2);
      this.registerTexture(scene, 'icon_energy', eCanvas);

      // Save Icon (Đĩa mềm Retro Floppy Disk)
      const { canvas: sCanvas, ctx: sCtx } = this.createCanvas(16, 16);
      sCtx.fillStyle = '#0284c7';
      sCtx.fillRect(2, 2, 12, 12);
      sCtx.fillStyle = '#94a3b8';
      sCtx.fillRect(4, 2, 8, 5);
      sCtx.fillStyle = '#0f172a';
      sCtx.fillRect(5, 3, 3, 3);
      sCtx.fillStyle = '#ffffff';
      sCtx.fillRect(4, 9, 8, 4);
      this.registerTexture(scene, 'icon_save', sCanvas);

      // Fuel Icon (Cột bơm xăng cam) - 16x16
      const { canvas: fCanvas, ctx: fCtx } = this.createCanvas(16, 16);
      fCtx.fillStyle = '#f97316';
      fCtx.fillRect(3, 3, 7, 11);
      fCtx.fillStyle = '#0f172a';
      fCtx.fillRect(4, 5, 5, 3);
      fCtx.fillStyle = '#facc15';
      fCtx.fillRect(5, 6, 3, 1);
      fCtx.strokeStyle = '#f8fafc';
      fCtx.lineWidth = 1;
      fCtx.beginPath();
      fCtx.moveTo(10, 5);
      fCtx.lineTo(12, 7);
      fCtx.lineTo(12, 12);
      fCtx.stroke();
      fCtx.fillStyle = '#ef4444';
      fCtx.fillRect(11, 11, 3, 3);
      this.registerTexture(scene, 'icon_fuel', fCanvas);
    }

    // 8) Đèn pha xe máy rọi sáng ban đêm (fx_headlight) - 120x60
    {
      const { canvas, ctx } = this.createCanvas(120, 60);
      const grad = ctx.createRadialGradient(8, 30, 2, 60, 30, 60);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      grad.addColorStop(0.3, 'rgba(253, 224, 71, 0.4)');
      grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(8, 30);
      ctx.lineTo(116, 4);
      ctx.lineTo(116, 56);
      ctx.closePath();
      ctx.fill();
      this.registerTexture(scene, 'fx_headlight', canvas);
    }

    // 9) Vầng hào quang đèn đường ban đêm (fx_lamp_glow) - 96x96
    {
      const { canvas, ctx } = this.createCanvas(96, 96);
      const grad = ctx.createRadialGradient(48, 48, 4, 48, 48, 46);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
      grad.addColorStop(0.4, 'rgba(253, 224, 71, 0.25)');
      grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(48, 48, 46, 0, Math.PI * 2);
      ctx.fill();
      this.registerTexture(scene, 'fx_lamp_glow', canvas);
    }

    // 10) Hạt mưa rơi pixel lấp lánh (fx_raindrop) - 8x16
    {
      const { canvas, ctx } = this.createCanvas(8, 16);
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(6, 1);
      ctx.lineTo(2, 14);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 5, 1, 3);
      this.registerTexture(scene, 'fx_raindrop', canvas);
    }

    // 11) Gợn sóng bọt nước mưa rơi trên đường (fx_rain_splash) - 16x8
    {
      const { canvas, ctx } = this.createCanvas(16, 8);
      ctx.strokeStyle = 'rgba(191, 219, 254, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(8, 4, 6, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      this.registerTexture(scene, 'fx_rain_splash', canvas);
    }

    // 12) Icon Mèo May Mắn (icon_lucky_cat) - 16x16
    {
      const { canvas, ctx } = this.createCanvas(16, 16);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(8, 9, 6, 0, Math.PI * 2);
      ctx.fill();
      // Tai mèo nhọn
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(3, 7);
      ctx.lineTo(4, 2);
      ctx.lineTo(7, 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(9, 5);
      ctx.lineTo(12, 2);
      ctx.lineTo(13, 7);
      ctx.fill();
      // Mắt mèo
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 8, 1.5, 2);
      ctx.fillRect(9, 8, 1.5, 2);
      // Mũi hồng
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(7.5, 10, 1.5, 1);
      this.registerTexture(scene, 'icon_lucky_cat', canvas);
    }

    // 13) Icon Thời Tiết: Nắng (icon_weather_clear) & Mưa (icon_weather_rain) - 16x16
    {
      const { canvas: cCanvas, ctx: cCtx } = this.createCanvas(16, 16);
      cCtx.fillStyle = '#facc15';
      cCtx.beginPath();
      cCtx.arc(8, 8, 5, 0, Math.PI * 2);
      cCtx.fill();
      cCtx.fillStyle = '#fb923c';
      cCtx.fillRect(7, 1, 2, 2);
      cCtx.fillRect(7, 13, 2, 2);
      cCtx.fillRect(1, 7, 2, 2);
      cCtx.fillRect(13, 7, 2, 2);
      this.registerTexture(scene, 'icon_weather_clear', cCanvas);

      const { canvas: rCanvas, ctx: rCtx } = this.createCanvas(16, 16);
      rCtx.fillStyle = '#94a3b8';
      rCtx.beginPath();
      rCtx.arc(6, 6, 4, 0, Math.PI * 2);
      rCtx.arc(10, 6, 5, 0, Math.PI * 2);
      rCtx.fill();
      rCtx.strokeStyle = '#38bdf8';
      rCtx.lineWidth = 1.5;
      rCtx.beginPath();
      rCtx.moveTo(5, 11);
      rCtx.lineTo(4, 15);
      rCtx.moveTo(8, 11);
      rCtx.lineTo(7, 15);
      rCtx.moveTo(11, 11);
      rCtx.lineTo(10, 15);
      rCtx.stroke();
      this.registerTexture(scene, 'icon_weather_rain', rCanvas);
    }

    // 14) Nút Cảm Ứng Bo Tròn (touch_btn_round) - 48x48 (Task 2.6)
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.beginPath();
      ctx.arc(24, 24, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();
      this.registerTexture(scene, 'touch_btn_round', canvas);
    }

    // 15) Mũi Tên Virtual D-Pad (touch_dpad_arrow) - 40x40 (Task 2.6)
    {
      const { canvas, ctx } = this.createCanvas(40, 40);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
      ctx.beginPath();
      ctx.arc(20, 20, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Tam giác chỉ hướng
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(20, 10);
      ctx.lineTo(12, 26);
      ctx.lineTo(28, 26);
      ctx.closePath();
      ctx.fill();
      this.registerTexture(scene, 'touch_dpad_arrow', canvas);
    }
  }

  /**
   * Sinh đạo cụ Xe Bánh Mì Patê, Cổng Phòng Trọ và Cây Xăng Petrolimex
   */
  public static generateVitalsAndCartProps(scene: Phaser.Scene) {
    // 0) Cây Xăng Petrolimex Á Đông (prop_gas_station) - 84x74
    {
      const { canvas, ctx } = this.createCanvas(84, 74);
      // Mái che vòm lớn màu xanh dương đậm & viền cam
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(4, 4, 76, 16);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(4, 18, 76, 4);

      // Biển hiệu chữ "PETROL"
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(22, 6, 40, 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(26, 9, 32, 4);

      // 2 Cột trụ thép đỡ mái che
      ctx.fillStyle = '#64748b';
      ctx.fillRect(14, 22, 6, 38);
      ctx.fillRect(64, 22, 6, 38);

      // Bệ bê tông móng cây xăng
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, 58, 68, 12);
      ctx.fillStyle = '#475569';
      ctx.fillRect(10, 58, 64, 2);

      // 2 Cột bơm xăng điện tử màu trắng xanh
      const drawPump = (px: number) => {
        // Thân máy
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px, 32, 16, 28);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(px, 32, 16, 6);
        // Màn hình hiển thị số lít & tiền
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 2, 40, 12, 7);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(px + 4, 42, 8, 3);
        // Dây vòi bơm xăng
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px + 16, 42);
        ctx.lineTo(px + 19, 48);
        ctx.lineTo(px + 16, 54);
        ctx.stroke();
        // Cò vòi bơm màu vàng
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 15, 52, 3, 3);
      };

      drawPump(26);
      drawPump(46);

      this.registerTexture(scene, 'prop_gas_station', canvas);
    }
    // 1) Xe Bánh Mì Patê Cột Đèn (prop_cart_banhmi) - 64x64
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      // Mái che bạt cong sọc đỏ - trắng
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#f8fafc';
        ctx.fillRect(8 + i * 7, 6, 7, 10);
      }
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(6, 15, 52, 2);

      // Tủ kính trưng bày đồ ăn
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(10, 17, 44, 20);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 17, 44, 20);

      // Những ổ bánh mì vàng rộm trong tủ kính
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(14, 22, 14, 5);
      ctx.fillRect(14, 29, 14, 5);
      ctx.fillRect(32, 22, 16, 5);
      ctx.fillStyle = '#78350f'; // pate sẫm
      ctx.fillRect(32, 29, 8, 6);
      ctx.fillStyle = '#16a34a'; // rau mùi dưa leo
      ctx.fillRect(42, 29, 8, 6);

      // Thân xe kim loại & Biển hiệu BÁNH MÌ PATÊ
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(8, 37, 48, 16);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(12, 40, 40, 10);
      ctx.fillStyle = '#fef08a';
      // Vẽ chữ mô phỏng "BM"
      ctx.fillRect(18, 42, 8, 6);
      ctx.fillRect(30, 42, 12, 6);

      // Bánh xe đẩy màu đen với vành bạc
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(18, 56, 6, 0, Math.PI * 2);
      ctx.arc(46, 56, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(18, 56, 2, 0, Math.PI * 2);
      ctx.arc(46, 56, 2, 0, Math.PI * 2);
      ctx.fill();

      this.registerTexture(scene, 'prop_cart_banhmi', canvas);
    }

    // 2) Cổng Ngõ Khu Trọ Bình Dân (prop_boarding_house_door) - 64x64
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      // Khung gạch đỏ vòm cổng
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(6, 8, 52, 54);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(10, 12, 44, 4);

      // Lòng cổng sổ tối
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(14, 16, 36, 46);

      // Cửa xếp sắt màu xanh ngọc có nan thoáng
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(16, 20, 32, 42);
      ctx.fillStyle = '#0369a1';
      for (let x = 18; x < 48; x += 5) {
        ctx.fillRect(x, 22, 2, 38);
      }

      // Biển gỗ: "TRỌ 7"
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(18, 10, 28, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(22, 12, 20, 4);

      // Đèn ngủ quả nhót ánh vàng ấm áp trước cửa
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(32, 6, 4, 0, Math.PI * 2);
      ctx.fill();

      // Chậu cây cảnh mini bên cổng
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, 52, 8, 10);
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(10, 50, 6, 0, Math.PI * 2);
      ctx.fill();

      this.registerTexture(scene, 'prop_boarding_house_door', canvas);
    }
  }

  /**
   * Sinh các texture nội thất căn phòng trọ ấm cúng (RoomScene Assets)
   */
  public static generateRoomAssets(scene: Phaser.Scene) {
    // 1) Sàn gỗ ấm Parquet (room_floor) - 64x64
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 0, 64, 64);
      // Vân các thanh gỗ đan so le
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, 0, 32, 16);
      ctx.fillRect(32, 16, 32, 16);
      ctx.fillRect(0, 32, 32, 16);
      ctx.fillRect(32, 48, 32, 16);
      // Đường chỉ rãnh gỗ
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 15, 64, 1);
      ctx.fillRect(0, 31, 64, 1);
      ctx.fillRect(0, 47, 64, 1);
      ctx.fillRect(31, 0, 1, 64);
      this.registerTexture(scene, 'room_floor', canvas);
    }

    // 2) Tường phòng kem ấm có len chân tường & tranh trang trí (room_wall) - 64x64
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      ctx.fillStyle = '#fef3c7'; // kem ấm
      ctx.fillRect(0, 0, 64, 64);
      // Len chân tường gỗ
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 56, 64, 8);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, 54, 64, 2);
      // Bức tranh nhỏ treo tường
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(16, 14, 32, 24);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(19, 17, 26, 18);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(38, 22, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(20, 28, 24, 7);
      this.registerTexture(scene, 'room_wall', canvas);
    }

    // 3) Giường ngủ êm ái chăn caro ấm áp (room_bed) - 64x80
    {
      const { canvas, ctx } = this.createCanvas(64, 80);
      // Khung giường gỗ sẫm
      ctx.fillStyle = '#78350f';
      ctx.fillRect(4, 2, 56, 76);
      // Đầu giường gỗ
      ctx.fillStyle = '#543109';
      ctx.fillRect(4, 2, 56, 12);

      // Đệm nệm êm
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(8, 14, 48, 60);

      // 2 chiếc gối trắng mềm mại
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(12, 16, 18, 12);
      ctx.fillRect(34, 16, 18, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14, 18, 14, 8);
      ctx.fillRect(36, 18, 14, 8);

      // Chăn caro màu cam - xanh ngọc ấm áp phủ 2/3 giường
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(8, 30, 48, 44);
      // Sọc caro
      ctx.fillStyle = '#fb923c';
      for (let y = 30; y < 74; y += 8) {
        ctx.fillRect(8, y, 48, 4);
      }
      ctx.fillStyle = '#059669';
      for (let x = 8; x < 56; x += 12) {
        ctx.fillRect(x, 30, 4, 44);
      }
      this.registerTexture(scene, 'room_bed', canvas);
    }

    // 4) Bàn học/làm việc có laptop & đèn bàn ấm (room_desk) - 64x48
    {
      const { canvas, ctx } = this.createCanvas(64, 48);
      // Mặt bàn gỗ tự nhiên
      ctx.fillStyle = '#92400e';
      ctx.fillRect(4, 8, 56, 32);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(6, 10, 52, 28);

      // Chân bàn
      ctx.fillStyle = '#543109';
      ctx.fillRect(6, 40, 6, 8);
      ctx.fillRect(52, 40, 6, 8);

      // Laptop màn hình mở sáng màu xanh cyan
      ctx.fillStyle = '#334155';
      ctx.fillRect(20, 14, 20, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(22, 16, 16, 10);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(18, 28, 24, 4);

      // Đèn bàn cổ ngỗng ánh vàng
      ctx.fillStyle = '#eab308';
      ctx.fillRect(48, 12, 6, 6);
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(51, 18);
      ctx.lineTo(51, 26);
      ctx.stroke();
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(51, 28, 4, 0, Math.PI * 2);
      ctx.fill();

      // Cốc cà phê / trà bốc khói
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, 18, 6, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 14, 2, 3);
      this.registerTexture(scene, 'room_desk', canvas);
    }

    // 5) Cửa sổ nhìn ra phố (room_window) - 48x48
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(2, 2, 44, 44);
      // Khung kính trời hoàng hôn / đêm
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 6, 36, 36);
      // Sao trên trời
      ctx.fillStyle = '#fde047';
      ctx.fillRect(12, 12, 2, 2);
      ctx.fillRect(28, 16, 2, 2);
      ctx.fillRect(36, 10, 2, 2);
      // Rèm ren trắng hai bên
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(6, 6, 8, 36);
      ctx.fillRect(34, 6, 8, 36);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(6, 22, 8, 3);
      ctx.fillRect(34, 22, 8, 3);
      this.registerTexture(scene, 'room_window', canvas);
    }

    // 6) Thảm len boho tròn vintage (room_carpet) - 64x48
    {
      const { canvas, ctx } = this.createCanvas(64, 48);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(32, 24, 30, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(32, 24, 22, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.ellipse(32, 24, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(32, 24, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      this.registerTexture(scene, 'room_carpet', canvas);
    }

    // 7) Tủ quần áo gỗ mộc (room_wardrobe) - 48x64
    {
      const { canvas, ctx } = this.createCanvas(48, 64);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(4, 2, 40, 60);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(6, 6, 17, 52);
      ctx.fillRect(25, 6, 17, 52);
      // Tay nắm cửa bằng đồng
      ctx.fillStyle = '#facc15';
      ctx.fillRect(20, 30, 2, 4);
      ctx.fillRect(26, 30, 2, 4);
      this.registerTexture(scene, 'room_wardrobe', canvas);
    }

    // 8) Cửa ra vào dẫn ra phố (room_door_exit) - 32x48
    {
      const { canvas, ctx } = this.createCanvas(32, 48);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(2, 2, 28, 44);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(5, 5, 22, 38);
      // Nắm đấm tròn
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(23, 26, 2, 0, Math.PI * 2);
      ctx.fill();
      // Thảm chùi chân trước cửa
      ctx.fillStyle = '#059669';
      ctx.fillRect(4, 43, 24, 4);
      this.registerTexture(scene, 'room_door_exit', canvas);
    }

    // 9) Chú mèo mướp ngủ cuộn tròn ngoan ngoãn (room_cat) - 32x32
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Thân mèo mướp cam
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(16, 18, 11, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Đầu mèo
      ctx.beginPath();
      ctx.arc(22, 14, 6, 0, Math.PI * 2);
      ctx.fill();
      // Tai mèo
      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.moveTo(21, 9);
      ctx.lineTo(24, 6);
      ctx.lineTo(26, 10);
      ctx.closePath();
      ctx.fill();
      // Vằn mướp
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(12, 14, 2, 6);
      ctx.fillRect(16, 13, 2, 7);
      // Đuôi cuộn tròn
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(10, 18, 6, 0.5, Math.PI * 1.5);
      ctx.stroke();
      this.registerTexture(scene, 'room_cat', canvas);
    }

    // 10) Bát ăn cho mèo có cá/pate (room_cat_bowl) - 24x16
    {
      const { canvas, ctx } = this.createCanvas(24, 16);
      // Bát gốm xanh ngọc
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(12, 10, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(12, 8, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pate cá ngừ thơm ngon
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(12, 8, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Mẩu cá nhỏ
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(10, 7, 4, 2);
      this.registerTexture(scene, 'room_cat_bowl', canvas);
    }

    // 11) Giường đệm lò xo hoàng gia nệm gấm (room_bed_luxury) - 64x80 (Task 2.5)
    {
      const { canvas, ctx } = this.createCanvas(64, 80);
      // Khung giường gỗ gụ điêu khắc vàng
      ctx.fillStyle = '#451a03';
      ctx.fillRect(4, 2, 56, 76);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(4, 2, 56, 12);
      // Đệm lò xo bọc nỉ nhung tím hoàng gia
      ctx.fillStyle = '#581c87';
      ctx.fillRect(8, 14, 48, 60);
      // Chăn gấm thêu rồng phụng vàng
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(8, 28, 48, 46);
      ctx.fillStyle = '#facc15';
      for (let y = 32; y < 72; y += 10) {
        ctx.fillRect(12, y, 40, 2);
      }
      // Gối gấm êm
      ctx.fillStyle = '#fae8ff';
      ctx.fillRect(12, 16, 18, 11);
      ctx.fillRect(34, 16, 18, 11);
      this.registerTexture(scene, 'room_bed_luxury', canvas);
    }

    // 12) Chậu Bonsai May Mắn (room_bonsai) - 32x32 (Task 2.5)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Chậu gốm men lam
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(8, 22, 16, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, 20, 20, 3);
      // Gốc bonsai gỗ uốn lượn
      ctx.fillStyle = '#78350f';
      ctx.fillRect(14, 12, 4, 10);
      ctx.fillRect(10, 14, 6, 3);
      // Tán lá xanh tròn ngọc
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(16, 8, 7, 0, Math.PI * 2);
      ctx.arc(10, 11, 5, 0, Math.PI * 2);
      ctx.arc(22, 11, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(14, 6, 4, 3);
      this.registerTexture(scene, 'room_bonsai', canvas);
    }

    // 13) Máy pha cà phê mini Espresso (room_coffee_maker) - 24x24 (Task 2.5)
    {
      const { canvas, ctx } = this.createCanvas(24, 24);
      // Thân máy đỏ tươi retro
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(5, 4, 14, 17);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(5, 4, 14, 3);
      // Khay kim loại & vòi rót
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(6, 17, 12, 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, 11, 4, 3);
      // Ly espresso nhỏ có cà phê
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 14, 6, 5);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(10, 15, 4, 2);
      this.registerTexture(scene, 'room_coffee_maker', canvas);
    }

    // 14) Dàn loa đĩa than Retro Vinyl (room_lofi_speaker) - 32x32 (Task 2.5)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Hộp gỗ cổ điển
      ctx.fillStyle = '#78350f';
      ctx.fillRect(4, 10, 24, 18);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(6, 12, 20, 14);
      // Đĩa than đen quay tròn
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(16, 19, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(16, 19, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Kèn loa cổ mạ đồng
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(8, 10);
      ctx.lineTo(4, 2);
      ctx.lineTo(14, 4);
      ctx.closePath();
      ctx.fill();
      this.registerTexture(scene, 'room_lofi_speaker', canvas);
    }

    // 15) Thảm Len Thổ Nhĩ Kỳ Cao Cấp (room_carpet_luxury) - 64x48 (Task 2.5)
    {
      const { canvas, ctx } = this.createCanvas(64, 48);
      // Nền nhung đỏ đô
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.ellipse(32, 24, 30, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Viền vàng hoàng gia
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Hoa văn Mandala xanh ngọc tâm
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.ellipse(32, 24, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(32, 24, 6, 0, Math.PI * 2);
      ctx.fill();
      this.registerTexture(scene, 'room_carpet_luxury', canvas);
    }
  }


  // =========================================================================
  // ENTRY POINT DUY NHẤT: GENERATE TOÀN BỘ TEXTURES CHO GAME
  // =========================================================================

  /**
   * Sinh và đăng ký toàn bộ Texture procedural pixel art vào Phaser TextureManager
   */
  public static generateAll(scene: Phaser.Scene) {
    PopulationAssetGenerator.generateAll(scene);
    UrbanAssetGenerator.generateAll(scene);
    console.log('[AssetGenerator] Đang khởi tạo Procedural Pixel Art Textures...');

    this.generatePlayerDown(scene);
    this.generatePlayerUp(scene);
    this.generatePlayerRight(scene);

    this.generateMotorbike(scene);
    this.generatePlayerMounted(scene);

    this.generateRoadTiles(scene);
    this.generateBuildings(scene);
    this.generatePropsAndHazards(scene);
    this.generateVitalsAndCartProps(scene);
    this.generateRoomAssets(scene);
    this.generateEffectsAndUI(scene);
    StoryArtGenerator.generateAll(scene);

    console.log('[AssetGenerator] Hoàn tất nạp toàn bộ Textures vào Phaser!');
  }
}
