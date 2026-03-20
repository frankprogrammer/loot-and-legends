(function () {
  class Enemy {
    constructor(scene, x, y, enemyData, hpBar) {
      this.scene = scene;
      this.enemyData = enemyData;
      this.baseX = x;
      this.baseY = y;

      this.container = this.scene.add.container(x, y);
      this.container.setDepth(60);
      this.container.setScale(1);
      this.container.setAlpha(1);

      const w = enemyData.w ?? 70;
      const h = enemyData.h ?? 90;
      // Phaser expects int fill for rectangles.
      const fill = parseInt(enemyData.color.replace('#', ''), 16);
      this.bodyBaseFill = fill;

      this.body = this.scene.add.rectangle(0, 0, w, h, fill, 1);
      this.body.setStrokeStyle(2, 0x000000, 0.15);

      // Simple label.
      this.nameText = this.scene.add
        .text(0, 12, enemyData.name, {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '13px',
          color: '#F5E6D3',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      // Subtle "weapon" mark.
      this.weapon = this.scene.add.rectangle(
        0,
        -h * 0.1,
        Math.max(10, w * 0.18),
        Math.max(30, h * 0.3),
        0x000000,
        0.15
      );

      this.container.add([this.body, this.weapon, this.nameText]);

      // Idle breathing tween.
      this.scene.tweens.add({
        targets: this.container,
        scaleY: 1.02,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // HP bar + enemy label.
      const { x: barX, y: barY, w: barW, h: barH } = hpBar;
      this.hpBarW = barW;
      this.hpBarH = barH;

      this.hp = enemyData.hp;
      this.maxHP = enemyData.hp;

      this.hpBarBg = this.scene.add.rectangle(
        barX + barW / 2,
        barY + barH / 2,
        barW,
        barH,
        0x333333,
        1
      );
      this.hpBarBg.setDepth(120);

      this.hpBarFill = this.scene.add.rectangle(
        barX + barW / 2,
        barY + barH / 2,
        barW,
        barH,
        0xe74c3c,
        1
      );
      this.hpBarFill.setDepth(121);
      this.hpBarFill.setOrigin(0.5, 0.5);

      this.hpBarText = this.scene.add
        .text(barX + barW / 2, barY + barH + 14, enemyData.name, {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '14px',
          color: '#F5E6D3',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.hpBarText.setDepth(122);
    }

    get speed() {
      return this.enemyData.speed;
    }
    get x() {
      return this.container.x;
    }
    get y() {
      return this.container.y;
    }

    setHP(hp) {
      this.hp = Math.max(0, hp);
      const pct = this.maxHP > 0 ? this.hp / this.maxHP : 0;
      this.scene.tweens.add({
        targets: this.hpBarFill,
        scaleX: pct,
        duration: 250,
        ease: 'Power2',
      });
    }

    async playTakeDamageAnimation(heavy = false) {
      // Flash white.
      this.body.setFillStyle(0xffffff, 1);

      const dx = heavy ? 28 : 20;
      const originalX = this.container.x;
      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.container,
          x: originalX + dx,
          duration: 80,
          ease: 'Power2',
          yoyo: true,
          onComplete: resolve,
        });
      });

      // Restore.
      this.body.setFillStyle(this.bodyBaseFill, 1);
    }

    async playAttackAnimation() {
      const originalX = this.container.x;
      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.container,
          x: originalX - 40,
          duration: 150,
          ease: 'Power2',
          yoyo: true,
          onComplete: resolve,
        });
      });
    }

    async playDeathAnimation() {
      // Rapid flashes.
      for (let i = 0; i < 3; i++) {
        this.body.setFillStyle(0xffffff, 1);
        await new Promise((r) => this.scene.time.delayedCall(90, r));
        this.body.setFillStyle(this.bodyBaseFill, 1);
        await new Promise((r) => this.scene.time.delayedCall(90, r));
      }

      // Smoke poof (placeholder circles).
      const smokeCount = 10;
      for (let i = 0; i < smokeCount; i++) {
        const c = this.scene.add.circle(0, 0, 3 + Math.random() * 5, 0xaaaaaa, 0.55);
        c.setDepth(160);
        const ox = (Math.random() - 0.5) * 40;
        const oy = -10 + Math.random() * 10;
        this.container.add(c);
        this.scene.tweens.add({
          targets: c,
          x: ox,
          y: oy,
          alpha: 0,
          duration: 420,
          ease: 'Power2',
          onComplete: () => c.destroy(),
        });
      }

      // Collapse.
      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.container,
          scaleY: 0,
          alpha: 0,
          duration: 300,
          ease: 'Power2',
          onComplete: resolve,
        });
      });
    }
  }

  window.Enemy = Enemy;
})();

