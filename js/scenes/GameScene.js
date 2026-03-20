(function () {
  class GameScene extends Phaser.Scene {
    constructor() {
      super('GameScene');
    }

    create() {
      const W = this.scale.gameSize.width;
      const H = this.scale.gameSize.height;

      // Helper to draw labeled placeholder zones.
      const drawZone = (
        x,
        y,
        w,
        h,
        label,
        fill = 0x2d1f15,
        stroke = 0x8b7355
      ) => {
        const rect = this.add
          .rectangle(x, y, w, h, fill, 0.35)
          .setStrokeStyle(2, stroke, 1);

        const text = this.add
          .text(x, y, label, {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '14px',
            color: '#F5E6D3',
            align: 'center',
          })
          .setOrigin(0.5);

        rect.setDepth(1);
        text.setDepth(2);
      };

      // Match the prompt's Phase 1 layout zones with rectangles.
      // Wave counter: 20–55 (height 35)
      drawZone(W / 2, 37.5, W, 35, 'WAVE COUNTER', 0x3d2b1f);

      // Player HP bar: 55–85 (height 30) at top-left of battle scene
      drawZone(W / 2 - 95, 70, 180, 30, 'PLAYER HP BAR', 0x2d1f15, 0xc0392b);

      // Battle scene: 85–400 (height 315)
      drawZone(W / 2, 242.5, W, 315, 'BATTLE SCENE', 0x2d1f15);

      // Divider: 400–415 (height 15)
      drawZone(W / 2, 407.5, W, 15, 'DIVIDER', 0x4a3728);

      // Slot machine area: 415–670 (height 255)
      drawZone(W / 2, 542.5, W, 255, 'SLOT AREA', 0x3d2b1f);

      // Spin button zone: 680–770 (height 90)
      drawZone(W / 2, 725, W, 90, 'SPIN BUTTON', 0x4a3728, 0xffd700);

      // Best score zone: 775–800 (height 25)
      drawZone(W / 2, 787.5, 240, 25, 'BEST: Wave X', 0x2d1f15);

      // Bottom padding: 800–844 (height 44)
      drawZone(W / 2, 822, W, 44, 'SAFE AREA', 0x1a0e0a);

      // Title watermark.
      this.add
        .text(W / 2, H - 10, 'LOOT & LEGENDS', {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '12px',
          color: '#8B7355',
        })
        .setOrigin(0.5);
    }
  }

  window.GameScene = GameScene;
})();

