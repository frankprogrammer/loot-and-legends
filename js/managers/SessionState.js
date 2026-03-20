(function () {
  class SessionState {
    constructor() {
      this.playerMaxHP = 100;
      this.reset();
    }

    reset() {
      this.playerHP = this.playerMaxHP;
      this.shieldActive = false;
      this.shieldPower = 0; // 0..1
      this.shieldReflectPower = 0; // not in prompt, but needed for Fortress reflect

      this.currentWave = 1;

      this.totalDamageDealt = 0;
      this.enemiesSlain = 0;
      this.bestHit = { name: '', value: 0 };

      this.isGameOver = false;
    }
  }

  window.SessionState = SessionState;
})();

