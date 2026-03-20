(function () {
  class Goblin {
    constructor(scene, x, y, hpBar) {
      this.scene = scene;
      this.baseX = x;
      this.baseY = y;

      this.container = this.scene.add.container(x, y);
      this.container.setDepth(50);

      // On-screen character size (was 60×80; triple for readability).
      const GW = 180;
      const GH = 240;

      // Character visual: PNG from preload (BootScene + GameScene), or drawn fallback.
      const hasTex =
        typeof this.scene.textures.exists === "function" &&
        this.scene.textures.exists("goblin");
      const texObj = this.scene.textures.get("goblin");
      this.useSprite = hasTex || texObj != null;
      this.body = null;
      this.bodyBaseFill = 0x27ae60;

      if (!this.useSprite) {
        console.warn(
          "[Loot & Legends] Texture 'goblin' not found — using placeholder. " +
            "Put assets/goblin.png next to index.html. If you open the game as file://, use a local server (e.g. npx serve) so the image can load."
        );
      }

      if (this.useSprite) {
        this.body = this.scene.add.sprite(0, 0, "goblin");
        this.body.setOrigin(0.5, 0.5);
        this.body.setDisplaySize(GW, GH);
        this.container.add(this.body);
      } else {
        this.body = this.scene.add.rectangle(0, 0, GW, GH, 0x27ae60, 1);
        this.body.setStrokeStyle(2, 0x145a32, 0.6);

        const eyeL = this.scene.add.circle(-36, -30, 10.5, 0xffffff, 1);
        const eyeR = this.scene.add.circle(36, -30, 10.5, 0xffffff, 1);
        const mouth = this.scene.add.graphics();
        mouth.lineStyle(9, 0x000000, 0.8);
        mouth.beginPath();
        mouth.moveTo(-24, 30);
        mouth.lineTo(24, 30);
        mouth.lineTo(0, 48);
        mouth.strokePath();

        this.label = this.scene.add
          .text(0, 66, "GOBLIN", {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "36px",
            color: "#F5E6D3",
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        this.container.add([this.body, eyeL, eyeR, mouth, this.label]);
      }

      // Shield bubble (scaled to wrap larger goblin).
      this.shieldBubble = this.scene.add.circle(0, -6, 144, 0x2980b9, 0.18);
      this.shieldBubble.setStrokeStyle(9, 0x2980b9, 0.7);
      this.shieldBubble.setVisible(false);
      this.container.add(this.shieldBubble);

      // Idle breathing tween.
      this.scene.tweens.add({
        targets: this.container,
        scaleY: 1.03,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
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
        1,
      );
      this.hpBarBg.setDepth(100);

      this.hpBarFill = this.scene.add.rectangle(
        barX + w / 2,
        barY + h / 2,
        w,
        h,
        0x2ecc71,
        1,
      );
      this.hpBarFill.setDepth(101);
      this.hpBarFill.setOrigin(0.5, 0.5);

      this.hpBarText = this.scene.add
        .text(barX + w / 2, barY + h / 2, `${this.hp}/${this.maxHP}`, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "14px",
          color: "#F5E6D3",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.hpBarText.setDepth(102);

      // Shield icon near HP bar.
      this.shieldIcon = this.scene.add.circle(
        barX + w + 15,
        barY + h / 2,
        10,
        0x2980b9,
        0.95,
      );
      this.shieldIcon.setStrokeStyle(2, 0xd6eaf8, 0.8);
      this.shieldIcon.setVisible(false);
      this.shieldIcon.setDepth(103);

      this.shieldIconPulseTween = null;

      this.hpBarLowPulseTween = null;
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

      this.scene.tweens.add({
        targets: this.hpBarFill,
        scaleX: pct,
        duration: 250,
        ease: "Power2",
      });

      // Pulse the HP bar when critical.
      if (pct < 0.25) {
        if (!this.hpBarLowPulseTween) {
          this.hpBarLowPulseTween = this.scene.tweens.add({
            targets: this.hpBarFill,
            alpha: { from: 1, to: 0.65 },
            duration: 320,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        }
      } else {
        if (this.hpBarLowPulseTween) {
          this.hpBarLowPulseTween.stop();
          this.hpBarLowPulseTween = null;
        }
        this.hpBarFill.setAlpha(1);
      }
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
          ease: "Sine.easeInOut",
        });

        this.scene.tweens.add({
          targets: this.shieldBubble,
          scale: { from: 0.4, to: 1.0 },
          duration: 200,
          ease: "Power2",
        });
      } else {
        if (this.shieldIconPulseTween) this.shieldIconPulseTween.stop();
        this.shieldIconPulseTween = null;
        this.shieldBubble.setScale(1);
        this.shieldBubble.setAlpha(0.18);
        this.shieldIcon.setAlpha(0.95);
      }
    }

    async playShieldShatter() {
      // Called when a shield absorbs/blocks a skull hit.
      if (!this.shieldBubble.visible) return;

      // Stop the gentle pulse before the shatter.
      if (this.shieldIconPulseTween) this.shieldIconPulseTween.stop();
      this.shieldIconPulseTween = null;

      // shieldBubble.x/y are local to the container.
      const bubbleX = this.container.x + this.shieldBubble.x;
      const bubbleY = this.container.y + this.shieldBubble.y;

      // Spawn small shatter shards (placeholder circles).
      const shards = [];
      const shardCount = 10;
      for (let i = 0; i < shardCount; i++) {
        const a = (i / shardCount) * Math.PI * 2;
        const dist = 8 + Math.random() * 18;
        const dx = Math.cos(a) * dist;
        const dy = Math.sin(a) * dist - 6;
        const shard = this.scene.add.circle(
          bubbleX,
          bubbleY,
          2 + Math.random() * 2,
          0x2980b9,
          0.9,
        );
        shard.setDepth(140);
        shards.push({ shard, dx, dy });

        this.scene.tweens.add({
          targets: shard,
          x: shard.x + dx,
          y: shard.y + dy,
          alpha: 0,
          duration: 260,
          ease: "Power2",
          onComplete: () => shard.destroy(),
        });
      }

      // Pop the bubble + icon quickly.
      const bubblePromise = new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.shieldBubble,
          scale: { from: 1, to: 0.2 },
          alpha: 0,
          duration: 220,
          ease: "Power2",
          onComplete: resolve,
        });
      });

      const iconPromise = new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.shieldIcon,
          scale: { from: this.shieldIcon.scaleX ?? 1, to: 1.8 },
          alpha: 0,
          duration: 160,
          ease: "Power2",
          onComplete: resolve,
        });
      });

      await Promise.all([bubblePromise, iconPromise]);
      this.setShieldActive(false);
    }

    async playTakeDamageAnimation(heavy = false) {
      const dx = heavy ? -30 : -20;
      const originalX = this.container.x;

      // Flash red (sprite: tint; rectangle: fill).
      if (this.useSprite) {
        this.body.setTint(0xff4444);
        this.scene.tweens.add({
          targets: this.body,
          alpha: { from: 1, to: 0.85 },
          duration: 120,
          yoyo: true,
          ease: "Power2",
          onComplete: () => {
            this.body.clearTint();
          },
        });
      } else {
        this.body.setFillStyle(0xe74c3c, 1);
        this.scene.tweens.add({
          targets: this.body,
          alpha: { from: 1, to: 0.85 },
          duration: 120,
          yoyo: true,
          ease: "Power2",
          onComplete: () => {
            this.body.setFillStyle(this.bodyBaseFill, 1);
          },
        });
      }

      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.container,
          x: originalX + dx,
          duration: 120,
          ease: "Power2",
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
          ease: "Power2",
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
          ease: "Power2",
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
          ease: "Power2",
          onComplete: resolve,
        });
      });
      this.setShieldActive(true);
    }

    async playHeal() {
      if (this.useSprite) {
        this.body.setTint(0x88ff88);
        await new Promise((resolve) => {
          this.scene.tweens.add({
            targets: this.body,
            alpha: { from: 1, to: 0.75 },
            duration: 200,
            yoyo: true,
            ease: "Sine.easeInOut",
            onComplete: () => {
              this.body.clearTint();
              resolve();
            },
          });
        });
      } else {
        const original = this.bodyBaseFill;
        this.body.setFillStyle(0x2ecc71, 1);
        await new Promise((resolve) => {
          this.scene.tweens.add({
            targets: this.body,
            alpha: { from: 1, to: 0.75 },
            duration: 200,
            yoyo: true,
            ease: "Sine.easeInOut",
            onComplete: () => {
              this.body.setFillStyle(original, 1);
              resolve();
            },
          });
        });
      }
    }

    async playDeathAnimation() {
      // Collapse + fade.
      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: this.container,
          scaleY: 0,
          alpha: 0,
          duration: 300,
          ease: "Power2",
          onComplete: resolve,
        });
      });
    }
  }

  window.Goblin = Goblin;
})();
