(function () {
  // Phaser game config: single entry point, no bundler/npm.
  const GAME_WIDTH = 390;
  const GAME_HEIGHT = 844;

  const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1A0E0A',
    // Resolve asset URLs relative to index.html (helps with local servers).
    loader: {
      baseURL: '',
      path: '',
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [window.BootScene, window.GameScene],
  };

  // Expose for debugging in the console.
  window.__lootLegendsGame = new Phaser.Game(config);
})();
