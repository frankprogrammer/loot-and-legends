(function () {
  class GameScene extends Phaser.Scene {
    constructor() {
      super('GameScene');
    }

    create() {
      const W = this.scale.gameSize.width;
      const H = this.scale.gameSize.height;

      const BEST_WAVE_KEY = 'lootlegends_best_wave';
      const loadBestWave = () => {
        try {
          const raw = window.localStorage.getItem(BEST_WAVE_KEY);
          const n = raw == null ? 0 : parseInt(raw, 10);
          return Number.isFinite(n) ? n : 0;
        } catch (e) {
          return 0;
        }
      };

      const bestWaveInitial = loadBestWave();

      // Helper to draw labeled placeholder zones.
      const drawZone = (
        x,
        y,
        w,
        h,
        label,
        fill = 0x2d1f15,
        stroke = 0x8b7355,
        alpha = 0.35
      ) => {
        const rect = this.add
          .rectangle(x, y, w, h, fill, alpha)
          .setStrokeStyle(2, stroke, 1);

        const text = this.add
          .text(x, y, label, {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '14px',
            color: '#F5E6D3',
            align: 'center',
          })
          .setOrigin(0.5);

        rect.setDepth(1);
        text.setDepth(2);

        return { rect, text };
      };

      // Match the prompt's Phase 1 layout zones with rectangles.
      // Wave counter: 20–55 (height 35)
      drawZone(W / 2, 37.5, W, 35, 'WAVE COUNTER', 0x3d2b1f, 0x8b7355, 0.18);

      // Player HP bar: 55–85 (height 30) at top-left of battle scene
      drawZone(110, 69, 180, 18, 'PLAYER HP BAR', 0x2d1f15, 0xc0392b, 0.12);

      // Battle scene: 85–400 (height 315)
      drawZone(W / 2, 242.5, W, 315, 'BATTLE SCENE', 0x2d1f15);

      // Divider: 400–415 (height 15)
      drawZone(W / 2, 407.5, W, 15, 'DIVIDER', 0x4a3728);

      // Slot machine area: 415–670 (height 255)
      drawZone(W / 2, 542.5, W, 255, 'SLOT AREA', 0x3d2b1f);

      // Spin button zone: 680–770 (height 90)
      drawZone(W / 2, 725, W, 90, 'SPIN BUTTON', 0x4a3728, 0xffd700);

      // Best score zone: 775–800 (height 25)
      const bestZone = drawZone(
        W / 2,
        787.5,
        240,
        25,
        `BEST: Wave ${bestWaveInitial}`,
        0x2d1f15
      );

      // Bottom padding: 800–844 (height 44)
      drawZone(W / 2, 822, W, 44, 'SAFE AREA', 0x1a0e0a);

      // Title watermark.
      this.add
        .text(W / 2, H - 10, 'LOOT & LEGENDS', {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '12px',
          color: '#8B7355',
        })
        .setOrigin(0.5);

      // Phase 2: Slot machine + SPIN button.
      const reelAreaW = 320;
      const reelAreaH = 200;
      const cellW = 100;
      const gap = 10;
      const cellH = 60;
      const visibleRows = 3;
      const topPad = 10;

      const slotZoneTop = 415; // from the Phase 1 design doc
      const slotZoneH = 255;
      const reelAreaTop = slotZoneTop + (slotZoneH - reelAreaH) / 2; // 442.5
      const reelAreaLeft = W / 2 - reelAreaW / 2; // 35

      this.slotMachine = new window.SlotMachine(this, {
        reelAreaTop,
        reelAreaLeft,
        reelAreaW,
        reelAreaH,
        cellW,
        cellH,
        visibleRows,
        topPad,
        gap,
      });

      const spinBtnX = W / 2;
      const spinBtnY = 725;
      const spinW = 280;
      const spinH = 70;

      this.spinButtonRect = this.add
        .rectangle(spinBtnX, spinBtnY, spinW, spinH, 0x8b0000, 1)
        .setStrokeStyle(3, 0x5c0000, 1)
        .setDepth(30);

      const spinText = this.add
        .text(spinBtnX, spinBtnY, 'SPIN', {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '28px',
          color: '#F5E6D3',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(31);

      this.spinButtonText = spinText;

      const enableSpin = () => {
        this.spinButtonRect.setInteractive({ useHandCursor: true });
      };

      const disableSpin = () => {
        this.spinButtonRect.disableInteractive();
      };

      enableSpin();

      // Subtle idle pulsing for the "ready" state.
      this.tweens.add({
        targets: this.spinButtonRect,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.spinButtonRect.on('pointerdown', () => {
        if (!this.slotMachine || this.slotMachine.isSpinning) return;

        disableSpin();
        this.spinButtonText.setText('...');

        // Press feedback.
        this.tweens.add({
          targets: this.spinButtonRect,
          scaleX: 0.93,
          scaleY: 0.93,
          duration: 80,
          yoyo: true,
          ease: 'Back.easeOut',
        });

        this.slotMachine.spin().then(({ action }) => {
          if (!this.battle) {
            this.spinButtonText.setText('SPIN');
            enableSpin();
            return;
          }

          this.battle.executeAction(action).then(({ gameOver }) => {
            if (gameOver) return;
            this.spinButtonText.setText('SPIN');
            enableSpin();
          });
        });
      });

      // Phase 3: Battle layer (Goblin + Enemy + HP + action animations)
      this.session = new window.SessionState();
      this.battle = new window.BattleScene(this, {
        sessionState: this.session,
        playerX: 100,
        playerY: 260,
        playerHPBarX: 20,
        playerHPBarY: 60,
        playerHPBarW: 180,
        playerHPBarH: 18,
        enemyX: 290,
        enemyY: 260,
        enemyHPBarX: 220,
        enemyHPBarY: 190,
        enemyHPBarW: 150,
        enemyHPBarH: 14,
        onGameOver: (sessionSnapshot) => {
          disableSpin();
          this.spinButtonText.setText('...');

          // Persist best wave + detect NEW RECORD.
          const currentWave = sessionSnapshot?.currentWave ?? 1;
          const previousBest = bestWaveInitial;
          const isNewRecord = currentWave > previousBest;

          if (isNewRecord) {
            try {
              window.localStorage.setItem(
                BEST_WAVE_KEY,
                String(currentWave)
              );
            } catch (e) {
              // ignore storage failures
            }
          }

          // Update best-wave HUD for this session.
          bestZone.text.setText(`BEST: Wave ${Math.max(previousBest, currentWave)}`);

          this.resultCard = new window.ResultCard(this, {
            session: sessionSnapshot,
            newRecord: isNewRecord,
            bestWave: Math.max(previousBest, currentWave),
            onFightAgain: () => {
              this.battle.restartRun();
              this.spinButtonText.setText('SPIN');
              enableSpin();
            },
          });
        },
      });
    }
  }

  window.GameScene = GameScene;
})();

