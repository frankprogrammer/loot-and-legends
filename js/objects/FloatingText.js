(function () {
  class FloatingText {
    static spawn(scene, text, x, y, color, opts = {}) {
      const duration = opts.duration ?? 800;
      const riseBy = opts.riseBy ?? 60;
      const fontSize = opts.fontSize ?? 20;
      const fontStyle = opts.fontStyle ?? 'bold';

      const t = scene.add
        .text(x, y, text, {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: `${fontSize}px`,
          color,
          fontStyle,
          align: 'center',
        })
        .setOrigin(0.5);

      t.setDepth(200);

      scene.tweens.add({
        targets: t,
        y: y - riseBy,
        alpha: 0,
        scale: 1.15,
        duration,
        ease: 'Power2',
        onComplete: () => {
          t.destroy();
        },
      });

      return t;
    }
  }

  window.FloatingText = FloatingText;
})();

