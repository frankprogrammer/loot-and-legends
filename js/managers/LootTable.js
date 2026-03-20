(function () {
  // Weighted roll based on reel strip occurrences.
  // The reels are purely cosmetic; we pre-calc the results before spinning.
  class LootTable {
    constructor() {
      this.reelStrips = window.REEL_STRIPS;
      this.symbols = window.SYMBOLS;
      this.stripLen = this.reelStrips[0].length;
    }

    roll() {
      const symbols = [];
      const targetStripPosIndices = [];

      for (let reelIdx = 0; reelIdx < this.reelStrips.length; reelIdx++) {
        const strip = this.reelStrips[reelIdx];
        const pos = Math.floor(Math.random() * strip.length);
        symbols.push(strip[pos]);
        targetStripPosIndices.push(pos);
      }

      return { symbols, targetStripPosIndices };
    }
  }

  window.LootTable = LootTable;
})();

