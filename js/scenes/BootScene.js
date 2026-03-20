(function () {
  class BootScene extends Phaser.Scene {
    constructor() {
      super('BootScene');
    }

    preload() {
      const W = 390;
      const H = 844;

      this.add
        .rectangle(W / 2, H / 2, W, H, 0x1a0e0a, 1)
        .setStrokeStyle(0);

      const barY = H * 0.62;
      const barW = 260;
      const barH = 16;

      const barBg = this.add.rectangle(W / 2, barY, barW, barH, 0x333333, 1);
      barBg.setStrokeStyle(2, 0x8b7355, 0.8);

      // Left-anchored loading bar.
      const barLeftX = W / 2 - barW / 2;
      const fillBar = this.add.rectangle(
        barLeftX,
        barY,
        0,
        barH,
        0xffd700,
        1
      );
      fillBar.setOrigin(0, 0.5);

      const title = this.add
        .text(W / 2, H * 0.52, 'LOOT & LEGENDS', {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '22px',
          color: '#F5E6D3',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const progressState = { p: 0 };
      this.tweens.add({
        targets: progressState,
        p: 1,
        duration: 650,
        ease: 'Linear',
        onUpdate: () => {
          fillBar.width = barW * progressState.p;
        },
        onComplete: () => {
          // Phase 1 has no external assets yet; transition immediately.
          this.scene.start('GameScene');
        },
      });

      // Keep the loading bar visible even if preload completes instantly.
      this.input.enabled = false;
    }
  }

  window.BootScene = BootScene;
})();

