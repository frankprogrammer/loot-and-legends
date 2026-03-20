(function () {
  function getRankTitle(wave) {
    if (wave <= 0) return 'Tavern Brawler';
    if (wave <= 3) return 'Tavern Brawler';
    if (wave <= 7) return 'Goblin Grunt';
    if (wave <= 11) return 'Battle Captain';
    if (wave <= 15) return 'Warlord';
    if (wave <= 20) return 'Champion';
    return 'LEGENDARY';
  }

  class ResultCard {
    constructor(scene, opts) {
      this.scene = scene;
      this.onFightAgain = opts.onFightAgain ?? (() => {});
      this.session = opts.session;
      this.newRecord = opts.newRecord ?? false;
      this.bestWave = opts.bestWave ?? this.session.currentWave;

      const W = scene.scale.gameSize.width;
      const H = scene.scale.gameSize.height;

      this.overlay = scene.add
        .rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
        .setDepth(500);

      const cardW = W - 40;
      const cardH = 440;
      const cardX = W / 2;
      const cardY = H / 2;

      this.card = scene.add
        .rectangle(cardX, cardY, cardW, cardH, 0x1a0e0a, 0.95)
        .setStrokeStyle(4, 0x8b7355, 0.6)
        .setDepth(501);

      this.title = scene.add
        .text(W / 2, cardY - cardH / 2 + 40, '⚔ LOOT & LEGENDS ⚔', {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '22px',
          color: '#F5E6D3',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(502);

      this.waveText = scene.add
        .text(W / 2, cardY - 5, `WAVE  ${this.session.currentWave}`, {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '40px',
          color: '#FFD700',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(502);

      this.rankText = scene.add
        .text(W / 2, cardY + 36, getRankTitle(this.session.currentWave), {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '18px',
          color:
            this.session.currentWave > 20 ? '#FFD700' : '#8B7355',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(502);

      if (this.session.currentWave > 20) {
        this.scene.tweens.add({
          targets: this.rankText,
          scale: 1.05,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      if (this.newRecord) {
        const badgeY = cardY + 70;
        this.newRecordText = scene.add
          .text(W / 2, badgeY, '★ NEW RECORD! ★', {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '22px',
            color: '#FFD700',
            fontStyle: 'bold',
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(502);

        this.scene.tweens.add({
          targets: this.newRecordText,
          scale: 1.08,
          duration: 420,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Sparkles around the badge (cosmetic).
        for (let i = 0; i < 14; i++) {
          const sx = W / 2 + (Math.random() - 0.5) * 240;
          const sy = badgeY + (Math.random() - 0.5) * 60;
          const s = scene.add.circle(sx, sy, 2.2, '#FFD700', 0.95);
          s.setDepth(503);
          scene.tweens.add({
            targets: s,
            scale: 0.2,
            alpha: 0,
            duration: 900 + Math.random() * 300,
            ease: 'Power2',
            onComplete: () => s.destroy(),
          });
        }
      }

      const bestHit =
        this.session.bestHit?.name && this.session.bestHit?.value
          ? `${this.session.bestHit.name} (${this.session.bestHit.value})`
          : 'None';

      const statsLines = [
        `Total Damage: ${this.session.totalDamageDealt}`,
        `Enemies Slain: ${this.session.enemiesSlain}`,
        `Best Hit: ${bestHit}`,
      ];

      this.stats = scene.add
        .text(W / 2 - 80, cardY + 90, statsLines.join('\n'), {
          fontFamily: 'Courier New, monospace',
          fontSize: '16px',
          color: '#F5E6D3',
          align: 'left',
        })
        .setDepth(502);

      const btnY = cardY + 205;
      const btnW = W - 120;
      const btnH = 60;

      this.fightBtn = scene.add
        .rectangle(W / 2, btnY, btnW, btnH, 0x8b0000, 1)
        .setStrokeStyle(3, 0x5c0000, 1)
        .setDepth(503);

      this.fightBtnText = scene.add
        .text(W / 2, btnY, '[ FIGHT AGAIN ]', {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '20px',
          color: '#F5E6D3',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(504);

      this.fightBtn.setInteractive({ useHandCursor: true });
      this.fightBtn.on('pointerdown', () => {
        // Button press feedback (placeholder).
        this.scene.tweens.add({
          targets: this.fightBtn,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 80,
          yoyo: true,
          ease: 'Back.easeOut',
        });
        this._onFightAgain();
      });

      // Animate in.
      this.card.setScale(0);
      this.card.setAlpha(0.01);
      this.scene.tweens.add({
        targets: [
          this.card,
          this.title,
          this.waveText,
          this.rankText,
          this.stats,
          this.fightBtn,
          this.fightBtnText,
        ],
        scale: { from: 0, to: 1 },
        alpha: { from: 0.01, to: 1 },
        duration: 400,
        ease: 'Back.easeOut',
      });
    }

    _onFightAgain() {
      this.destroy();
      this.onFightAgain();
    }

    destroy() {
      if (this.overlay) this.overlay.destroy();
      if (this.card) this.card.destroy();
      if (this.title) this.title.destroy();
      if (this.waveText) this.waveText.destroy();
      if (this.rankText) this.rankText.destroy();
      if (this.newRecordText) this.newRecordText.destroy();
      if (this.stats) this.stats.destroy();
      if (this.fightBtn) this.fightBtn.destroy();
      if (this.fightBtnText) this.fightBtnText.destroy();
    }
  }

  window.ResultCard = ResultCard;
})();

