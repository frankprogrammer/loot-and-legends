(function () {
  class Goblin {
    constructor(scene, x, y, hpBar) {
      this.scene = scene;
      this.baseX = x;
      this.baseY = y;

      this.container = this.scene.add.container(x, y);
      this.container.setDepth(50);

      // Body placeholder (tintable by swapping fill).
      this.body = this.scene.add.rectangle(0, 0, 60, 80, 0x27ae60, 1);
      this.body.setStrokeStyle(2, 0x145a32, 0.6);

      // Face details.
      const eyeL = this.scene.add.circle(-12, -10, 3.5, 0xffffff, 1);
      const eyeR = this.scene.add.circle(12, -10, 3.5, 0xffffff, 1);
      const mouth = this.scene.add.graphics();
      mouth.lineStyle(3, 0x000000, 0.8);
      mouth.beginPath();
      mouth.moveTo(-8, 10);
      mouth.lineTo(8, 10);
      mouth.lineTo(0, 16);
      mouth.strokePath();

      this.label = this.scene.add
        .text(0, 22, 'GOBLIN', {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '12px',
          color: '#F5E6D3',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.bodyBaseFill = 0x27ae60;

      this.container.add([this.body, eyeL, eyeR, mouth, this.label]);

      // Shield bubble.
      this.shieldBubble = this.scene.add.circle(0, -2, 48, 0x2980b9, 0.18);
      this.shieldBubble.setStrokeStyle(3, 0x2980b9, 0.7);
      this.shieldBubble.setVisible(false);
      this.container.add(this.shieldBubble);

      // Idle breathing tween.
      this.scene.tweens.add({
        targets: this.container,
        scaleY: 1.03,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // HP bar.
      const { x: barX, y: barY, w, h, maxHP } = hpBar;
      this.hpBarW = w;
      this.hpBarH = h;

      this.hp = maxHP;
      this.maxHP = maxHP;

      this.hpBarBg = this.scene.add.rectangle(
        barX + w / 2,
        barY + h / 2,
        w,
        h,
        0x333333,
        1
      );
      this.hpBarBg.setDepth(100);

      this.hpBarFill = this.scene.add.rectangle(
        barX + w / 2,
        barY + h / 2,
        w,
        h,
        0x2ecc71,
        1
      );
      this.hpBarFill.setDepth(101);
      this.hpBarFill.setOrigin(0.5, 0.5);

      this.hpBarText = this.scene.add
        .text(barX + w / 2, barY + h / 2, `${this.hp}/${this.maxHP}`, {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '14px',
          color: '#F5E6D3',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.hpBarText.setDepth(102);

      // Shield icon near HP bar.
      this.shieldIcon = this.scene.add.circle(
        barX + w + 15,
        barY + h / 2,
        10,
        0x2980b9,
        0.95
      );
      this.shieldIcon.setStrokeStyle(2, 0xd6eaf8, 0.8);
      this.shieldIcon.setVisible(false);
      this.shieldIcon.setDepth(103);

      this.shieldIconPulseTween = null;
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

      const fillColor = pct < 0.25 ? 0xe74c3c : 0x2ecc71;

      this.hpBarText.setText(`${this.hp}/${this.maxHP}`);
      this.hpBarFill.setFillStyle(fillColor, 1);

      // Reset scale so repeated tweens don't compound.
      this.hpBarFill.scaleX = 1;
      this.scene.tweens.add({
        targets: this.hpBarFill,
        scaleX: pct,
        duration: 250,
        ease: 'Power2',
      });
    }

    setShieldActive(active) {
      this.shieldBubble.setVisible(active);
      this.shieldIcon.setVisible(active);

      if (active) {
        if (this.shieldIconPulseTween) this.shieldIconPulseTween.stop();
        this.shieldIconPulseTween = this.scene.tweens.add({
          targets: this.shieldIcon,
          alpha: { from: 0.7, to: 1.0 },
          duration: 450,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        this.scene.tweens.add({
          targets: this.shieldBubble,
          scale: { from: 0.4, to: 1.0 },
          duration: 200,
          ease: 'Power2',
        });
      } else {
        if (this.shieldIconPulseTween) this.shieldIconPulseTween.stop();
        this.shieldIconPulseTween = null;
        this.shieldBubble.setScale(1);
      }
    }

    async playTakeDamageAnimation(heavy = false) {
      const dx = heavy ? -30 : -20;
      const originalX = this.container.x;

      // Flash red.
      this.body.setFillStyle(0xe74c3c, 1);
      this.scene.tweens.add({
        targets: this.body,
        alpha: { from: 1, to: 0.85 },
        duration: 120,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          this.body.setFillStyle(this.bodyBaseFill, 1);
        },
      });

      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.container,
          x: originalX + dx,
          duration: 120,
          ease: 'Power2',
          yoyo: true,
          hold: 0,
          onComplete: resolve,
        });
      });
    }

    async playSwordAttack() {
      const originalX = this.container.x;
      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.container,
          x: originalX + 40,
          duration: 120,
          ease: 'Power2',
          yoyo: true,
          onComplete: resolve,
        });
      });
    }

    async playFireballCast() {
      const originalScaleX = this.container.scaleX ?? 1;
      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.container,
          scaleX: originalScaleX * 1.04,
          duration: 120,
          ease: 'Power2',
          yoyo: true,
          onComplete: resolve,
        });
      });
    }

    async playShieldSet() {
      // Quick hunch.
      const originalScaleY = this.container.scaleY ?? 1;
      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.container,
          scaleY: 0.95,
          duration: 100,
          yoyo: true,
          ease: 'Power2',
          onComplete: resolve,
        });
      });
      this.setShieldActive(true);
    }

    async playHeal() {
      const original = this.bodyBaseFill;
      this.body.setFillStyle(0x2ecc71, 1);
      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.body,
          alpha: { from: 1, to: 0.75 },
          duration: 200,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.body.setFillStyle(original, 1);
            resolve();
          },
        });
      });
    }

    async playDeathAnimation() {
      // Collapse + fade.
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

  window.Goblin = Goblin;
})();

