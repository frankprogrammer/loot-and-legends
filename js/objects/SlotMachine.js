(function () {
  class SlotMachine {
    constructor(scene, opts) {
      this.scene = scene;

      // Slot machine geometry (based on the Phase 1 single-screen layout).
      this.reelAreaTop = opts.reelAreaTop;
      this.reelAreaLeft = opts.reelAreaLeft;
      this.reelAreaW = opts.reelAreaW;
      this.reelAreaH = opts.reelAreaH;

      this.cellW = opts.cellW;
      this.cellH = opts.cellH;
      this.visibleRows = opts.visibleRows;
      this.topPad = opts.topPad;
      this.gap = opts.gap;

      this.isSpinning = false;

      this.lootTable = new window.LootTable();
      this.combatResolver = new window.CombatResolver();

      this._createFrame();
      this._createPaylineIndicator();

      this.reels = [];
      for (let reelIdx = 0; reelIdx < 3; reelIdx++) {
        const reelX =
          this.reelAreaLeft + reelIdx * (this.cellW + this.gap);
        const reel = new window.Reel(scene, {
          strip: window.REEL_STRIPS[reelIdx],
          x: reelX,
          yTop: this.reelAreaTop,
          cellW: this.cellW,
          cellH: this.cellH,
          visibleRows: this.visibleRows,
          topPad: this.topPad,
          bufferAbove: 3,
          bufferBelow: 3,
        });
        this.reels.push(reel);
      }
    }

    _createFrame() {
      // Simple "drum/wood" placeholder frame around the reel area.
      const frame = this.scene.add.rectangle(
        this.reelAreaLeft + this.reelAreaW / 2,
        this.reelAreaTop + this.reelAreaH / 2,
        this.reelAreaW,
        this.reelAreaH,
        0x4a3728,
        0.35
      );
      frame.setStrokeStyle(4, 0x8b7355, 0.5);
      frame.setDepth(1);
      this.frame = frame;
    }

    _createPaylineIndicator() {
      this.paylineGraphic = this.scene.add.graphics();
      this.paylineGraphic.setDepth(20);
      this.paylineGraphic.setAlpha(0);

      this._drawPayline(0.0);
    }

    _drawPayline(alpha) {
      this.paylineGraphic.clear();
      this.paylineGraphic.setAlpha(alpha);

      const y =
        this.reelAreaTop + this.topPad + this.cellH + this.cellH / 2; // center of center-row symbols
      const x1 = this.reelAreaLeft - 2;
      const x2 = this.reelAreaLeft + this.reelAreaW + 2;

      this.paylineGraphic.lineStyle(6, 0xffd700, alpha);
      this.paylineGraphic.beginPath();
      this.paylineGraphic.moveTo(x1, y);
      this.paylineGraphic.lineTo(x2, y);
      this.paylineGraphic.strokePath();
    }

    _pulseMatchingReels(actionType, pulseMs) {
      const reelsToPulse = this.reels.filter(
        (r) => r.getCenterSymbolId() === actionType
      );

      const interval = 160;
      const ticks = Math.ceil(pulseMs / interval);
      for (let i = 0; i < ticks; i++) {
        this.scene.time.delayedCall(i * interval, () => {
          reelsToPulse.forEach((r) => r.pulseCenter());
        });
      }
    }

    spin() {
      if (this.isSpinning) return Promise.resolve(null);
      this.isSpinning = true;

      const roll = this.lootTable.roll();
      const symbols = roll.symbols;
      const targetStripPosIndices = roll.targetStripPosIndices;

      const stopTimes = [800, 1200, 1600];

      // Start spinning all reels immediately.
      for (let i = 0; i < this.reels.length; i++) {
        this.reels[i].spinTo(targetStripPosIndices[i], stopTimes[i]);
      }

      const pauseMs = 300;
      const pulseMs = 500;

      return new Promise((resolve) => {
        const action = this.combatResolver.resolve(symbols);

        this.scene.time.delayedCall(stopTimes[2] + pauseMs, () => {
          // Flash payline and glow/pulse matching symbols before the action "fires".
          this._drawPayline(1);
          if (action.matchLevel > 0) {
            this._pulseMatchingReels(action.type, pulseMs);
          }

          this.scene.time.delayedCall(pulseMs, () => {
            this._drawPayline(0);

            // Phase 2 requirement: log evaluated match result.
            console.log('[Loot & Legends] Spin result', {
              symbols,
              action,
            });

            this.isSpinning = false;
            resolve({ symbols, action });
          });
        });
      });
    }
  }

  window.SlotMachine = SlotMachine;
})();

