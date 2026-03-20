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

      this.add
        .text(W / 2, H * 0.52, 'LOOT & LEGENDS', {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '22px',
          color: '#F5E6D3',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      // Same paths as GameScene.preload — assets next to index.html.
      this.load.image('goblin', 'assets/goblin.png');
      this.load.image('enemy_rat', 'assets/rat.png');
      this.load.image('enemy_skeleton', 'assets/skeleton.png');
      this.load.image('enemy_orc', 'assets/orc.png');
      this.load.image('enemy_dark_elf', 'assets/darkElf.png');
      this.load.image('enemy_troll', 'assets/troll.png');
      this.load.image('enemy_shadow_knight', 'assets/shadowKnight.png');
      this.load.image('enemy_necromancer', 'assets/necromancer.png');
      this.load.image('enemy_dragon', 'assets/dragon.png');

      this.load.on('progress', (value) => {
        fillBar.width = barW * value;
      });

      this.load.on('loaderror', (file) => {
        console.warn(
          '[Loot & Legends] Asset failed to load:',
          file.key,
          file.url,
          '(Place assets/goblin.png next to index.html, or run from a local HTTP server.)'
        );
      });

      this.input.enabled = false;
    }

    create() {
      this.scene.start('GameScene');
    }
  }

  window.BootScene = BootScene;
})();
