(function () {
  // A single reel with placeholder symbols that scroll with modular wrapping.
  class Reel {
    constructor(scene, opts) {
      this.scene = scene;
      this.strip = opts.strip; // array of symbol ids, length 12
      this.symbols = window.SYMBOLS;
      this.stripLen = this.strip.length;

      this.x = opts.x;
      this.yTop = opts.yTop;
      this.cellW = opts.cellW;
      this.cellH = opts.cellH;
      this.visibleRows = opts.visibleRows;
      this.topPad = opts.topPad; // space between reel top and first visible row

      // How many cells to keep above/below the visible window for wrap.
      this.bufferAbove = opts.bufferAbove ?? 3;
      this.bufferBelow = opts.bufferBelow ?? 3;
      this.numCells = this.visibleRows + this.bufferAbove + this.bufferBelow;

      this.BUFFER_CENTER_INDEX = this.bufferAbove + 1; // center visible row

      // Reel container moved only for minor bounce effects; symbol cells are repositioned manually.
      this.container = this.scene.add.container(this.x, this.yTop);
      this.baseY = this.yTop;
      this.container.setDepth(10);

      // Optional reel background.
      this.bg = this.scene.add.rectangle(
        this.cellW / 2,
        this.topPad + (this.visibleRows * this.cellH) / 2,
        this.cellW,
        this.visibleRows * this.cellH,
        0x3d2b1f,
        0.75
      );
      this.bg.setStrokeStyle(2, 0x8b7355, 0.25);
      this.container.add(this.bg);

      this.cells = [];
      this.stripPosCursor = 0;
      this.scrollY = 0;
      this.isSpinning = false;

      // Create symbol cells that we will rotate as the reel wraps.
      for (let i = 0; i < this.numCells; i++) {
        const cell = this._makeCell();
        cell.setDepth(5);
        this.container.add(cell);
        this.cells.push(cell);
      }

      // Initial layout (at scrollY=0).
      this.setStripPosCursor(0);
    }

    _makeCell() {
      const cell = this.scene.add.container(0, 0);

      // Placeholder circle.
      const r = 25;
      const centerY = this.cellH / 2;
      const circle = this.scene.add.circle(
        this.cellW / 2,
        centerY,
        r,
        0xffffff,
        1
      );
      circle.setStrokeStyle(2, 0x000000, 0.15);

      const iconText = this.scene.add.text(this.cellW / 2, centerY, '?', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '22px',
        color: '#F5E6D3',
        fontStyle: 'bold',
        align: 'center',
      });
      iconText.setOrigin(0.5);

      cell._circle = circle;
      cell._iconText = iconText;

      cell.setSize(this.cellW, this.cellH);
      return cell;
    }

    _updateCellPositions() {
      for (let i = 0; i < this.numCells; i++) {
        // Visible window top row index is `bufferAbove`.
        const y = this.topPad + (i - this.bufferAbove) * this.cellH + this.scrollY;
        this.cells[i].y = y;

        const isCenter = i === this.BUFFER_CENTER_INDEX;
        this.cells[i].setAlpha(isCenter ? 1 : 0.35);
      }
    }

    setStripPosCursor(cursor) {
      // cursor indicates which strip position is shown by cells[0] at scrollY=0.
      this.stripPosCursor = ((cursor % this.stripLen) + this.stripLen) % this.stripLen;
      for (let i = 0; i < this.numCells; i++) {
        const stripPos = (this.stripPosCursor + i) % this.stripLen;
        this._setCellSymbol(i, stripPos);

        // Dim symbols above/below the center payline for the slot "peek" look.
        const isCenter = i === this.BUFFER_CENTER_INDEX;
        this.cells[i].setAlpha(isCenter ? 1 : 0.35);
      }
      this.scrollY = 0;
      this._updateCellPositions();
    }

    _setCellSymbol(cellIndex, stripPos) {
      const symId = this.strip[stripPos];
      const sym = this.symbols[symId];
      const cell = this.cells[cellIndex];

      cell._circle.setFillStyle(
        parseInt(sym.color.replace('#', ''), 16),
        1
      );
      cell._iconText.setText(sym.icon);
      cell._iconText.setColor('#F5E6D3');
    }

    getCenterSymbolId() {
      const centerCellIndex = this.BUFFER_CENTER_INDEX;
      const cell = this.cells[centerCellIndex];
      // Infer symbol id from the stripPosCursor + index.
      const stripPos = (this.stripPosCursor + centerCellIndex) % this.stripLen;
      return this.strip[stripPos];
    }

    pulseCenter() {
      const centerCellIndex = this.BUFFER_CENTER_INDEX;
      const cell = this.cells[centerCellIndex];
      this.scene.tweens.add({
        targets: cell,
        scale: 1.12,
        duration: 140,
        yoyo: true,
        ease: 'Power2',
      });
    }

    spinTo(targetStripPosIndex, durationMs, onComplete) {
      if (this.isSpinning) return;

      this.isSpinning = true;
      this.scrollY = 0;
      const totalBounceMs = 160;
      const overshootMs = 80;
      const returnMs = totalBounceMs - overshootMs;

      // Wrap amount: choose an integer number of full strip cycles for consistent landing.
      // Keep it high enough for the visual feel across all stop delays.
      const loops = Math.max(2, Math.round(durationMs / 400));
      const totalWraps = loops * this.stripLen; // multiple of 12 => stable landing alignment

      // Choose starting cursor such that after `totalWraps` wraps, the center row lands on `targetStripPosIndex`.
      // Using: centerSymbol = strip[(cursorStart + totalWraps + bufferAbove+1) mod stripLen]
      const desired = targetStripPosIndex;
      const cursorStart = desired - totalWraps - (this.bufferAbove + 1);
      const normalizedCursorStart = ((cursorStart % this.stripLen) + this.stripLen) % this.stripLen;
      this.setStripPosCursor(normalizedCursorStart);

      // Speed so we travel exactly `totalWraps` cells in (durationMs - bounceMs).
      const scrollDuration = Math.max(80, durationMs - totalBounceMs);
      const pixelsToTravel = totalWraps * this.cellH;
      const speedPxPerMs = pixelsToTravel / scrollDuration;

      let elapsed = 0;

      const wrapStep = () => {
        this.scrollY += speedPxPerMs * this._deltaMs;
      };

      const update = (time, delta) => {
        if (!this.isSpinning) return;
        this._deltaMs = delta;
        elapsed += delta;
        this.scrollY += speedPxPerMs * delta;

        while (this.scrollY >= this.cellH) {
          this.scrollY -= this.cellH;

          // Advance the virtual strip by 1 position.
          this.stripPosCursor = (this.stripPosCursor + 1) % this.stripLen;

          // Rotate the first cell to the bottom.
          const moved = this.cells.shift();
          this.cells.push(moved);

          // Update the moved (now last) cell to the next symbol.
          const newStripPos = (this.stripPosCursor + (this.numCells - 1)) % this.stripLen;
          // The moved cell is already the correct index in `this.cells` array at the end,
          // so it's `cellIndex = numCells - 1` after push.
          const movedIndex = this.numCells - 1;
          this._setCellSymbol(movedIndex, newStripPos);
        }

        this._updateCellPositions();

        if (elapsed >= scrollDuration) {
          // Stop scrolling and snap to the exact landing alignment (scrollY=0).
          this.isSpinning = false;
          this.scene.events.off('update', update);

          const finalCursor = ((targetStripPosIndex - (this.bufferAbove + 1)) % this.stripLen + this.stripLen) % this.stripLen;
          this.setStripPosCursor(finalCursor);

          // Small overshoot bounce using container translation.
          const yBase = this.yTop;
          const overshoot = this.cellH * 0.15;

          this.container.y = 0;
          this.scene.tweens.add({
            targets: this.container,
            y: this.baseY + overshoot,
            duration: overshootMs,
            ease: 'Power2',
            onComplete: () => {
              this.scene.tweens.add({
                targets: this.container,
                y: this.baseY,
                duration: returnMs,
                ease: 'Back.easeOut',
                onComplete: () => {
                  if (onComplete) onComplete();
                },
              });
            },
          });
        }
      };

      this.scene.events.on('update', update);
    }
  }

  window.Reel = Reel;
})();

