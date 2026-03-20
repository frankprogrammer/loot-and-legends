(function () {
  class BattleScene {
    constructor(scene, opts) {
      this.scene = scene;
      this.W = scene.scale.gameSize.width;
      this.H = scene.scale.gameSize.height;

      this.player = null;
      this.enemy = null;

      this.playerMaxHP = opts.playerMaxHP ?? 100;
      this.currentWave = 1;

      this.isBusy = false;
      this.gameOver = false;

      // Shield persists until next incoming skull (with speed exception).
      this.shieldState = null; // { power, reflectPower }

      // Layout.
      this.playerX = opts.playerX;
      this.playerY = opts.playerY;
      this.enemyX = opts.enemyX;
      this.enemyY = opts.enemyY;

      // HUD.
      this.waveText = this.scene.add
        .text(this.W / 2, 37.5, 'WAVE 1', {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '26px',
          color: '#FFD700',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.waveText.setDepth(250);

      // Setup instances.
      this.player = new window.Goblin(
        this.scene,
        this.playerX,
        this.playerY,
        {
          x: opts.playerHPBarX,
          y: opts.playerHPBarY,
          w: opts.playerHPBarW,
          h: opts.playerHPBarH,
          maxHP: this.playerMaxHP,
        }
      );

      this.enemyHPBar = {
        x: opts.enemyHPBarX,
        y: opts.enemyHPBarY,
        w: opts.enemyHPBarW,
        h: opts.enemyHPBarH,
      };

      this.onGameOver = opts.onGameOver ?? (() => {});

      // Start with first enemy.
      this.spawnEnemyForWave(this.currentWave, true);
    }

    spawnEnemyForWave(wave, immediate = false) {
      const enemyData = window.getEnemyForWave(wave);

      if (this.enemy) {
        // Destroy old enemy visuals.
        this.enemy.container.destroy(true);
      }

      this.enemy = new window.Enemy(this.scene, this.enemyX, this.enemyY, enemyData, this.enemyHPBar);

      if (!immediate) {
        // Slide in from the right edge.
        this.enemy.container.x = this.enemyX + 60;
        this.enemy.container.alpha = 0;
        this.scene.tweens.add({
          targets: this.enemy.container,
          x: this.enemyX,
          alpha: 1,
          duration: 300,
          ease: 'Power2',
        });
      }
    }

    async executeAction(action) {
      if (this.isBusy || this.gameOver) return { gameOver: this.gameOver };
      this.isBusy = true;

      try {
        if (!action || !action.type) return { gameOver: this.gameOver };

        if (action.type === 'sword') {
          await this._handlePlayerSword(action);
        } else if (action.type === 'fireball') {
          await this._handlePlayerFireball(action);
        } else if (action.type === 'potion') {
          await this._handlePlayerPotion(action);
        } else if (action.type === 'shield') {
          await this._handlePlayerShield(action);
        } else if (action.type === 'skull') {
          await this._handleEnemySkull(action);
        }
      } finally {
        this.isBusy = false;
      }

      return { gameOver: this.gameOver };
    }

    _updateWaveText() {
      this.waveText.setText(`WAVE ${this.currentWave}`);
      this.scene.tweens.add({
        targets: this.waveText,
        scale: 1.12,
        duration: 120,
        yoyo: true,
        ease: 'Power2',
      });
    }

    async _handlePlayerSword(action) {
      const dmg = Math.max(0, action.value ?? 0);

      await this.player.playSwordAttack();

      // Slash effect at enemy.
      const slash = this.scene.add.graphics();
      slash.setDepth(140);
      const ex = this.enemy.x;
      const ey = this.enemy.y - 5;
      slash.lineStyle(5, 0xffffff, 0.95);
      slash.beginPath();
      slash.arc(ex, ey, 34, -0.8, 0.8, false);
      slash.strokePath();

      this.scene.tweens.add({
        targets: slash,
        alpha: 0,
        duration: 180,
        onComplete: () => slash.destroy(),
      });

      await this.enemy.playTakeDamageAnimation(dmg >= 40);

      this.enemy.setHP(this.enemy.hp - dmg);
      window.FloatingText.spawn(this.scene, `-${dmg}`, ex, ey - 60, '#E74C3C', {
        fontSize: 20,
      });

      if (this.enemy.hp <= 0) {
        await this._handleEnemyDeathAndNextWave();
      }
    }

    async _handlePlayerFireball(action) {
      const dmg = Math.max(0, action.value ?? 0);

      await this.player.playFireballCast();

      // Projectile placeholder.
      const projectile = this.scene.add.circle(
        this.player.x + 30,
        this.player.y - 20,
        8,
        0xe67e22,
        1
      );
      projectile.setDepth(140);

      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: projectile,
          x: this.enemy.x,
          y: this.enemy.y - 20,
          duration: 400,
          ease: 'Sine.easeInOut',
          onComplete: resolve,
        });
      });

      const impact = this.scene.add.circle(
        this.enemy.x,
        this.enemy.y - 10,
        10,
        0xe67e22,
        0.75
      );
      impact.setDepth(141);
      this.scene.tweens.add({
        targets: impact,
        scale: 2.5,
        alpha: 0,
        duration: 260,
        ease: 'Power2',
        onComplete: () => impact.destroy(),
      });
      projectile.destroy();

      await this.enemy.playTakeDamageAnimation(dmg >= 60);

      this.enemy.setHP(this.enemy.hp - dmg);
      window.FloatingText.spawn(this.scene, `-${dmg}`, this.enemy.x, this.enemy.y - 55, '#E74C3C', {
        fontSize: 20,
      });

      if (this.enemy.hp <= 0) {
        await this._handleEnemyDeathAndNextWave();
      }
    }

    async _handlePlayerPotion(action) {
      let heal = Math.max(0, action.value ?? 0);
      if (action.name === 'FULL RESTORE') {
        heal = this.playerMaxHP - this.player.hp;
      }

      await this.player.playHeal();

      const before = this.player.hp;
      this.player.setHP(before + heal);

      if (heal > 0) {
        window.FloatingText.spawn(
          this.scene,
          `+${heal}`,
          this.player.x,
          this.player.y - 70,
          '#27AE60',
          { fontSize: 20 }
        );
      }
    }

    async _handlePlayerShield(action) {
      const power = Math.max(0, Math.min(1, action.value ?? 0));
      const reflectPower = action.reflectPower ?? 0;

      this.shieldState = { power, reflectPower };
      await this.player.playShieldSet();
      window.FloatingText.spawn(this.scene, 'SHIELDED!', this.player.x, this.player.y - 70, '#2980B9', {
        fontSize: 18,
      });
    }

    async _handleEnemySkull(action) {
      const mult = action.value ?? 1;
      let raw = (this.enemy.enemyData.damage ?? this.enemy.enemyData.baseDamage ?? 0) * mult;

      // Slow enemies deal reduced skull damage.
      if (this.enemy.speed === 'slow') raw *= 0.75;
      raw = Math.max(0, Math.round(raw));

      const bypassShield = this.enemy.speed === 'fast';

      await this.enemy.playAttackAnimation();

      // Impact point.
      const impact = this.scene.add.circle(
        this.player.x,
        this.player.y - 10,
        10,
        0xe74c3c,
        0.6
      );
      impact.setDepth(145);
      this.scene.tweens.add({
        targets: impact,
        scale: 1.8,
        alpha: 0,
        duration: 220,
        ease: 'Power2',
        onComplete: () => impact.destroy(),
      });

      let damageTaken = raw;
      let blocked = 0;
      let reflected = 0;

      if (this.shieldState && !bypassShield) {
        const { power, reflectPower } = this.shieldState;
        blocked = Math.round(raw * power);
        damageTaken = Math.max(0, raw - blocked);

        // Shield is consumed on the next skull hit.
        this.player.setShieldActive(false);
        this.shieldState = null;

        window.FloatingText.spawn(
          this.scene,
          'BLOCKED!',
          this.player.x,
          this.player.y - 70,
          '#2980B9',
          { fontSize: 18 }
        );

        reflected = reflectPower ? Math.round(blocked * reflectPower) : 0;
      }

      // Apply player damage.
      if (damageTaken > 0) {
        await this.player.playTakeDamageAnimation(false);
        this.player.setHP(this.player.hp - damageTaken);
        window.FloatingText.spawn(
          this.scene,
          `-${damageTaken}`,
          this.player.x,
          this.player.y - 65,
          '#E74C3C',
          { fontSize: 20 }
        );
      }

      // Apply reflect damage if Fortress.
      if (reflected > 0 && this.enemy.hp > 0) {
        await this.enemy.playTakeDamageAnimation(false);
        this.enemy.setHP(this.enemy.hp - reflected);
        window.FloatingText.spawn(
          this.scene,
          `-${reflected}`,
          this.enemy.x,
          this.enemy.y - 55,
          '#E74C3C',
          { fontSize: 18 }
        );

        if (this.enemy.hp <= 0) {
          await this._handleEnemyDeathAndNextWave();
        }
      }

      // Player death.
      if (this.player.hp <= 0 && !this.gameOver) {
        await this.player.playDeathAnimation();
        this.gameOver = true;
        this.onGameOver(this.currentWave);
      }
    }

    async _handleEnemyDeathAndNextWave() {
      // Enemy death animation + next enemy entry.
      await this.enemy.playDeathAnimation();

      this.currentWave += 1;
      this._updateWaveText();

      // Small "WAVE X" flash in center of battle area.
      const centerText = this.scene.add.text(this.W / 2, 260, `WAVE ${this.currentWave}`, {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '34px',
        color: '#FFD700',
        fontStyle: 'bold',
      });
      centerText.setOrigin(0.5);
      centerText.setDepth(260);
      centerText.setAlpha(0);

      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: centerText,
          alpha: 1,
          scale: { from: 0, to: 1.0 },
          duration: 250,
          ease: 'Back.easeOut',
          onComplete: resolve,
        });
      });

      this.scene.tweens.add({
        targets: centerText,
        alpha: 0,
        duration: 250,
        delay: 200,
        onComplete: () => centerText.destroy(),
      });

      await new Promise((resolve) => this.scene.time.delayedCall(250, resolve));

      this.spawnEnemyForWave(this.currentWave, false);
    }
  }

  window.BattleScene = BattleScene;
})();

