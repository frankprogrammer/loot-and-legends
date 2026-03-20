(function () {
  class BattleScene {
    constructor(scene, opts) {
      this.scene = scene;
      this.W = scene.scale.gameSize.width;
      this.H = scene.scale.gameSize.height;

      this.player = null;
      this.enemy = null;

      this.session = opts.sessionState ?? new window.SessionState();
      this.playerMaxHP = this.session.playerMaxHP;

      this.isBusy = false;

      // Shield persists until next incoming skull (with speed exception).
      this.shieldState = null; // { power, reflectPower }

      // Layout.
      this.playerX = opts.playerX;
      this.playerY = opts.playerY;
      this.enemyX = opts.enemyX;
      this.enemyY = opts.enemyY;

      // HUD.
      this.waveText = this.scene.add
        .text(this.W / 2, 37.5, `WAVE ${this.session.currentWave}`, {
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
      this.spawnEnemyForWave(this.session.currentWave, true);
    }

    _delay(ms) {
      return new Promise((resolve) => this.scene.time.delayedCall(ms, resolve));
    }

    _spawnRain(count, color, startY, endY, xRange) {
      for (let i = 0; i < count; i++) {
        const x =
          xRange?.min != null && xRange?.max != null
            ? xRange.min + Math.random() * (xRange.max - xRange.min)
            : this.W / 2 + (Math.random() - 0.5) * 120;
        const y = startY;
        const p = this.scene.add.circle(x, y, 2 + Math.random() * 3, color, 0.85);
        p.setDepth(180);
        this.scene.tweens.add({
          targets: p,
          y: endY,
          alpha: 0,
          duration: 650 + Math.random() * 120,
          ease: 'Power2',
          onComplete: () => p.destroy(),
        });
      }
    }

    async _playJackpotIntro(action) {
      // Design doc: show a big action name slam + subtle background tint.
      const map = {
        sword: { text: action.name, tint: 0xc0392b },
        shield: { text: action.name, tint: 0x2980b9 },
        fireball: { text: action.name, tint: 0xe67e22 },
        potion: { text: action.name, tint: 0x27ae60 },
        skull: { text: action.name, tint: 0xe74c3c },
      };
      const info = map[action.type] ?? { text: action.name, tint: 0xffd700 };

      // Background tint flash.
      const overlay = this.scene.add.rectangle(
        this.W / 2,
        this.H / 2,
        this.W,
        this.H,
        info.tint,
        0.0
      );
      overlay.setDepth(300);

      const overlayPromise = new Promise((resolve) => {
        this.scene.tweens.add({
          targets: overlay,
          alpha: 0.2,
          duration: 140,
          yoyo: true,
          onComplete: () => {
            overlay.destroy();
            resolve();
          },
        });
      });

      const centerText = this.scene.add
        .text(this.W / 2, this.H / 2 - 20, `${info.text}!`, {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '44px',
          color: action.type === 'skull' ? '#E74C3C' : '#FFD700',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5);
      centerText.setDepth(301);
      centerText.setScale(2.0);
      centerText.setAlpha(1);

      const textPromise = new Promise((resolve) => {
        this.scene.tweens.add({
          targets: centerText,
          scale: 1.0,
          duration: 320,
          ease: 'Back.easeOut',
          onComplete: () => resolve(),
        });
      });

      await Promise.all([overlayPromise, textPromise]);

      // Fade it out quickly so combat remains readable.
      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: centerText,
          alpha: 0,
          duration: 220,
          delay: 260,
          onComplete: () => {
            centerText.destroy();
            resolve();
          },
        });
      });
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
      if (this.isBusy || this.session.isGameOver) {
        return { gameOver: this.session.isGameOver };
      }
      this.isBusy = true;

      try {
        if (!action || !action.type) {
          return { gameOver: this.session.isGameOver };
        }

        if (action.matchLevel === 2) {
          await this._playJackpotIntro(action);
        }

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

      return { gameOver: this.session.isGameOver };
    }

    _updateWaveText() {
      this.waveText.setText(`WAVE ${this.session.currentWave}`);
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
      const isCritical = action.matchLevel === 2;
      slash.lineStyle(isCritical ? 8 : 5, 0xffffff, 0.95);
      slash.beginPath();
      slash.arc(ex, ey, isCritical ? 42 : 34, -0.8, 0.8, false);
      slash.strokePath();

      this.scene.tweens.add({
        targets: slash,
        alpha: 0,
        duration: 180,
        onComplete: () => slash.destroy(),
      });

      await this.enemy.playTakeDamageAnimation(dmg >= 40);

      this.enemy.setHP(this.enemy.hp - dmg);
      this.session.totalDamageDealt += dmg;
      if (dmg > this.session.bestHit.value) {
        this.session.bestHit = { name: action.name ?? 'ATTACK', value: dmg };
      }
      window.FloatingText.spawn(this.scene, `-${dmg}`, ex, ey - 60, '#E74C3C', {
        fontSize: 20,
      });

      if (this.enemy.hp <= 0) {
        await this._handleEnemyDeathAndNextWave();
      }
    }

    async _handlePlayerFireball(action) {
      const dmg = Math.max(0, action.value ?? 0);
      const isInferno = action.matchLevel === 2;

      await this.player.playFireballCast();

      // Projectile placeholder.
      if (isInferno) {
        this._spawnRain(20, 0xe67e22, 0, this.enemy.y + 10, {
          min: this.enemy.x - 110,
          max: this.enemy.x + 110,
        });
      }

      const projectile = this.scene.add.circle(
        this.player.x + 30,
        this.player.y - 20,
        isInferno ? 20 : 8,
        0xe67e22,
        1
      );
      projectile.setDepth(140);

      // Trail dots while the projectile travels.
      const trail = this.scene.time.addEvent({
        delay: 40,
        repeat: 9,
        callback: () => {
          const t = this.scene.add.circle(
            projectile.x,
            projectile.y,
            2 + Math.random() * 3,
            0xe67e22,
            0.9
          );
          t.setDepth(139);
          this.scene.tweens.add({
            targets: t,
            alpha: 0,
            duration: 220,
            ease: 'Power2',
            onComplete: () => t.destroy(),
          });
        },
      });

      await new Promise((resolve) => {
        this.scene.tweens.add({
          targets: projectile,
          x: this.enemy.x,
          y: this.enemy.y - 20,
          duration: 400,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            if (trail && trail.remove) trail.remove();
            resolve();
          },
        });
      });

      const impact = this.scene.add.circle(
        this.enemy.x,
        this.enemy.y - 10,
        isInferno ? 18 : 10,
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
        onComplete: () => {
          if (isInferno) {
            this.scene.cameras.main.shake(300, 0.01);
          }
          impact.destroy();
        },
      });
      projectile.destroy();

      await this.enemy.playTakeDamageAnimation(dmg >= 60);

      this.enemy.setHP(this.enemy.hp - dmg);
      this.session.totalDamageDealt += dmg;
      if (dmg > this.session.bestHit.value) {
        this.session.bestHit = { name: action.name ?? 'ATTACK', value: dmg };
      }
      window.FloatingText.spawn(this.scene, `-${dmg}`, this.enemy.x, this.enemy.y - 55, '#E74C3C', {
        fontSize: 20,
      });

      if (this.enemy.hp <= 0) {
        await this._handleEnemyDeathAndNextWave();
      }
    }

    async _handlePlayerPotion(action) {
      let heal = Math.max(0, action.value ?? 0);
      const isFullRestore = action.matchLevel === 2;
      if (action.name === 'FULL RESTORE') {
        heal = this.playerMaxHP - this.player.hp;
      }

      await this.player.playHeal();

      const before = this.player.hp;
      this.player.setHP(before + heal);

      if (heal > 0) {
        if (isFullRestore) {
          // Green explosion particles.
          for (let i = 0; i < 14; i++) {
            const p = this.scene.add.circle(
              this.player.x + (Math.random() - 0.5) * 25,
              this.player.y + (Math.random() - 0.5) * 25,
              2 + Math.random() * 3,
              0x27ae60,
              0.9
            );
            p.setDepth(160);
            const dx = (Math.random() - 0.5) * 50;
            const dy = -30 - Math.random() * 30;
            this.scene.tweens.add({
              targets: p,
              x: p.x + dx,
              y: p.y + dy,
              alpha: 0,
              duration: 520,
              ease: 'Power2',
              onComplete: () => p.destroy(),
            });
          }
        }

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
      this.session.shieldActive = true;
      this.session.shieldPower = power;
      this.session.shieldReflectPower = reflectPower;
      window.FloatingText.spawn(this.scene, 'SHIELDED!', this.player.x, this.player.y - 70, '#2980B9', {
        fontSize: 18,
      });
    }

    async _handleEnemySkull(action) {
      const mult = action.value ?? 1;
      const isCatastrophe = action.matchLevel === 2;
      let raw = (this.enemy.enemyData.damage ?? this.enemy.enemyData.baseDamage ?? 0) * mult;

      // Slow enemies deal reduced skull damage.
      if (this.enemy.speed === 'slow') raw *= 0.75;
      raw = Math.max(0, Math.round(raw));

      const bypassShield = this.enemy.speed === 'fast';

      if (isCatastrophe) {
        // Catastrophe pre-fx: red flash + enemy grow + shake.
        const flash = this.scene.add.rectangle(
          this.W / 2,
          this.H / 2,
          this.W,
          this.H,
          0xe74c3c,
          0.0
        );
        flash.setDepth(320);
        this.scene.tweens.add({
          targets: flash,
          alpha: 0.65,
          duration: 120,
          yoyo: true,
          onComplete: () => flash.destroy(),
        });

        this.scene.tweens.add({
          targets: this.enemy.container,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 120,
          ease: 'Power2',
          yoyo: true,
        });

        this.scene.cameras.main.shake(400, 0.012);
      }

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
        await this.player.playShieldShatter();
        this.session.shieldActive = false;
        this.session.shieldPower = 0;
        this.session.shieldReflectPower = 0;
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
        await this.player.playTakeDamageAnimation(isCatastrophe);
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

      // Player death check immediately after damage application.
      if (this.player.hp <= 0 && !this.session.isGameOver) {
        await this.player.playDeathAnimation();
        this.session.isGameOver = true;
        const snapshot = this._getSessionSnapshot();
        this.onGameOver(snapshot);
        return;
      }

      // Apply reflect damage if Fortress.
      if (reflected > 0 && this.enemy.hp > 0) {
        await this.enemy.playTakeDamageAnimation(false);
        this.enemy.setHP(this.enemy.hp - reflected);
        this.session.totalDamageDealt += reflected;
        if (reflected > this.session.bestHit.value) {
          this.session.bestHit = { name: action.name ?? 'ATTACK', value: reflected };
        }
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
      // (handled immediately after damage)
    }

    async _handleEnemyDeathAndNextWave() {
      // Enemy death animation + next enemy entry.
      await this.enemy.playDeathAnimation();

      this.session.enemiesSlain += 1;
      this.session.currentWave += 1;
      this._updateWaveText();

      // Cosmetic gold coin particles flying toward wave counter.
      for (let i = 0; i < 4; i++) {
        const c = this.scene.add.circle(
          this.enemy.x + (Math.random() - 0.5) * 20,
          this.enemy.y - 10 + (Math.random() - 0.5) * 15,
          3 + Math.random() * 2,
          0xffd700,
          0.95
        );
        c.setDepth(190);
        this.scene.tweens.add({
          targets: c,
          x: this.W / 2 + (Math.random() - 0.5) * 20,
          y: 37.5,
          alpha: 0,
          duration: 520,
          ease: 'Power2',
          onComplete: () => c.destroy(),
        });
      }

      // Small "WAVE X" flash in center of battle area.
      const centerText = this.scene.add.text(
        this.W / 2,
        260,
        `WAVE ${this.session.currentWave}`,
        {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '34px',
          color: '#FFD700',
          fontStyle: 'bold',
        }
      );
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

      this.spawnEnemyForWave(this.session.currentWave, false);
    }

    restartRun() {
      if (this.isBusy) return;

      this.session.reset();
      this.shieldState = null;

      // Reset player visuals/state.
      if (this.player) {
        this.player.setHP(this.session.playerHP);
        this.player.setShieldActive(false);
      }

      // Reset wave HUD.
      if (this.waveText) {
        this.waveText.setText(`WAVE ${this.session.currentWave}`);
      }

      // Respawn first enemy.
      this.spawnEnemyForWave(this.session.currentWave, true);

      // Ensure no previous animations consider the run over.
      this.session.isGameOver = false;
    }

    _getSessionSnapshot() {
      return {
        playerMaxHP: this.session.playerMaxHP,
        playerHP: this.session.playerHP,
        shieldActive: this.session.shieldActive,
        shieldPower: this.session.shieldPower,
        currentWave: this.session.currentWave,
        totalDamageDealt: this.session.totalDamageDealt,
        enemiesSlain: this.session.enemiesSlain,
        bestHit: {
          name: this.session.bestHit?.name ?? '',
          value: this.session.bestHit?.value ?? 0,
        },
      };
    }
  }

  window.BattleScene = BattleScene;
})();

