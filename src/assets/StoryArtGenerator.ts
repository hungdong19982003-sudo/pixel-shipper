import Phaser from 'phaser';

/** Small, crisp pixel-art vignettes for the opening story and recurring room scenes. */
export class StoryArtGenerator {
  private static canvas(width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  private static rect(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  private static register(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
  }

  public static generateAll(scene: Phaser.Scene) {
    this.generateGraduate(scene);
    this.generateJobSearch(scene);
    this.generateFirstRide(scene);
    this.generateLandlady(scene);
  }

  private static generateGraduate(scene: Phaser.Scene) {
    const { canvas, ctx } = this.canvas(320, 176);
    this.rect(ctx, '#25334c', 0, 0, 320, 176);
    this.rect(ctx, '#364762', 0, 0, 320, 96);
    this.rect(ctx, '#d4b675', 25, 22, 270, 8);
    this.rect(ctx, '#f1d896', 50, 42, 220, 4);
    this.rect(ctx, '#495c73', 18, 90, 284, 7);
    this.rect(ctx, '#d7c7a5', 0, 134, 320, 42);
    for (let i = 0; i < 8; i++) this.rect(ctx, '#b7a88d', i * 42, 137, 2, 39);
    // Graduate in a dark gown, cap and gold certificate.
    this.rect(ctx, '#0f1727', 133, 74, 52, 54);
    this.rect(ctx, '#17263d', 126, 91, 66, 40);
    this.rect(ctx, '#f4c8a0', 144, 68, 30, 22);
    this.rect(ctx, '#203150', 139, 59, 39, 7);
    this.rect(ctx, '#203150', 145, 52, 27, 8);
    this.rect(ctx, '#facc62', 182, 91, 17, 24);
    this.rect(ctx, '#fff0b5', 185, 94, 11, 15);
    this.rect(ctx, '#facc62', 195, 109, 6, 9);
    this.register(scene, 'story_graduate', canvas);
  }

  private static generateJobSearch(scene: Phaser.Scene) {
    const { canvas, ctx } = this.canvas(320, 176);
    this.rect(ctx, '#121b30', 0, 0, 320, 176);
    this.rect(ctx, '#24334c', 0, 0, 320, 96);
    this.rect(ctx, '#273f52', 18, 14, 70, 59);
    this.rect(ctx, '#607d8b', 23, 19, 60, 49);
    this.rect(ctx, '#f4cb7b', 28, 23, 6, 6);
    this.rect(ctx, '#dcb76f', 43, 23, 6, 6);
    this.rect(ctx, '#f4cb7b', 61, 23, 6, 6);
    // Desk, laptop and unanswered applications.
    this.rect(ctx, '#73513f', 45, 117, 236, 13);
    this.rect(ctx, '#4b3440', 54, 130, 220, 13);
    this.rect(ctx, '#0a111d', 117, 77, 88, 38);
    this.rect(ctx, '#7bc6d7', 122, 82, 78, 27);
    this.rect(ctx, '#dce8e5', 130, 87, 60, 3);
    this.rect(ctx, '#e65e69', 132, 94, 10, 10);
    this.rect(ctx, '#f6d8c2', 148, 96, 44, 3);
    this.rect(ctx, '#b4c5cb', 137, 115, 48, 4);
    for (let row = 0; row < 3; row++) {
      this.rect(ctx, '#e5d9bd', 224, 84 + row * 13, 54, 8);
      this.rect(ctx, '#d86d6d', 229, 86 + row * 13, 5, 4);
      this.rect(ctx, '#8c9baa', 238, 87 + row * 13, 34, 2);
    }
    this.rect(ctx, '#283548', 0, 149, 320, 27);
    this.register(scene, 'story_job_search', canvas);
  }

  private static generateFirstRide(scene: Phaser.Scene) {
    const { canvas, ctx } = this.canvas(320, 176);
    this.rect(ctx, '#101a2d', 0, 0, 320, 176);
    this.rect(ctx, '#1c2b43', 0, 0, 320, 112);
    for (let i = 0; i < 6; i++) {
      const x = 10 + i * 54;
      this.rect(ctx, ['#34445c', '#3f4b5c', '#2a3c55'][i % 3], x, 30 + (i % 2) * 12, 34, 80);
      this.rect(ctx, '#e7b869', x + 7, 43 + (i % 2) * 12, 6, 9);
      this.rect(ctx, '#79b7c3', x + 21, 43 + (i % 2) * 12, 6, 9);
    }
    this.rect(ctx, '#26313e', 0, 112, 320, 64);
    this.rect(ctx, '#e9c566', 0, 141, 320, 3);
    this.rect(ctx, '#161d28', 69, 128, 142, 26);
    this.rect(ctx, '#05080c', 78, 143, 32, 22);
    this.rect(ctx, '#05080c', 177, 143, 32, 22);
    this.rect(ctx, '#bd4850', 93, 118, 93, 20);
    this.rect(ctx, '#e76b67', 116, 108, 36, 16);
    this.rect(ctx, '#f3d39b', 155, 121, 21, 14);
    this.rect(ctx, '#0b332d', 130, 91, 25, 25);
    this.rect(ctx, '#16a085', 126, 96, 32, 15);
    this.rect(ctx, '#ea580c', 164, 108, 19, 24);
    this.rect(ctx, '#facc62', 26, 55, 5, 34);
    this.rect(ctx, '#facc62', 280, 43, 5, 43);
    this.register(scene, 'story_first_ride', canvas);
  }

  private static generateLandlady(scene: Phaser.Scene) {
    const { canvas, ctx } = this.canvas(48, 64);
    this.rect(ctx, '#243247', 0, 0, 48, 64);
    // Hair and bun.
    this.rect(ctx, '#34251f', 11, 7, 27, 16);
    this.rect(ctx, '#4b3025', 31, 4, 10, 10);
    this.rect(ctx, '#e7b998', 14, 14, 21, 19);
    this.rect(ctx, '#33261f', 11, 12, 5, 15);
    this.rect(ctx, '#33261f', 34, 13, 5, 13);
    this.rect(ctx, '#5b382c', 18, 22, 3, 3);
    this.rect(ctx, '#5b382c', 29, 22, 3, 3);
    this.rect(ctx, '#bd746d', 21, 29, 8, 2);
    this.rect(ctx, '#e9d2a7', 14, 34, 23, 4);
    this.rect(ctx, '#a94e50', 9, 38, 31, 24);
    this.rect(ctx, '#843b47', 5, 41, 8, 20);
    this.rect(ctx, '#843b47', 36, 41, 8, 20);
    this.rect(ctx, '#e8c88d', 19, 43, 4, 4);
    this.rect(ctx, '#e8c88d', 29, 50, 4, 4);
    this.rect(ctx, '#e9b994', 17, 59, 7, 5);
    this.rect(ctx, '#e9b994', 28, 59, 7, 5);
    this.register(scene, 'npc_landlady', canvas);
  }
}
