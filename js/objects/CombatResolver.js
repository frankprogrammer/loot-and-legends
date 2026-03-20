(function () {
  // Match evaluation from the design doc:
  // - 3 of a kind => jackpot (matchLevel 2)
  // - exactly one pair => matchLevel 1
  // - all different => matchLevel 0; leftmost reel decides action at weakest power
  class CombatResolver {
    resolve(symbols3) {
      const [a, b, c] = symbols3;
      const counts = {};
      counts[a] = (counts[a] || 0) + 1;
      counts[b] = (counts[b] || 0) + 1;
      counts[c] = (counts[c] || 0) + 1;

      const distinct = Object.keys(counts).length;
      let matchLevel = 0;
      if (distinct === 1) matchLevel = 2;
      else if (distinct === 2) matchLevel = 1;

      let type = a;
      if (matchLevel === 2) {
        type = a;
      } else if (matchLevel === 1) {
        // Find which symbol is duplicated.
        for (const k of Object.keys(counts)) {
          if (counts[k] === 2) {
            type = k;
            break;
          }
        }
      } else {
        // No match: leftmost reel decides at weakest power.
        type = a;
      }

      // Compute action name + value (per Combat Values table).
      // `value` is interpreted by later battle logic:
      // - sword/fireball/potion => damage/heal amount, skull => multiplier (1, 1.5, 3)
      // - shield => block percentage (0.25, 1) or block+reflect marker (handled in battle later)
      const out = {
        type,
        matchLevel,
        value: 0,
        name: '',
      };

      if (type === 'sword') {
        if (matchLevel === 2) {
          out.name = 'CRITICAL STRIKE';
          out.value = 40;
        } else if (matchLevel === 1) {
          out.name = 'STRONG ATTACK';
          out.value = 15;
        } else {
          out.name = 'WEAK ATTACK';
          out.value = 5;
        }
      } else if (type === 'shield') {
        if (matchLevel === 2) {
          out.name = 'FORTRESS';
          out.value = 1; // block fully; battle can add reflect behavior at matchLevel 2
          out.reflectPower = 0.5;
        } else if (matchLevel === 1) {
          out.name = 'STURDY BLOCK';
          out.value = 1; // block entirely
        } else {
          out.name = 'PARTIAL BLOCK';
          out.value = 0.25; // block 25% of next hit
        }
      } else if (type === 'fireball') {
        if (matchLevel === 2) {
          out.name = 'INFERNO';
          out.value = 60;
        } else if (matchLevel === 1) {
          out.name = 'FIRE BLAST';
          out.value = 25;
        } else {
          out.name = 'WEAK FIRE BLAST';
          out.value = 8;
        }
      } else if (type === 'potion') {
        if (matchLevel === 2) {
          out.name = 'FULL RESTORE';
          out.value = 100; // placeholder: restore to full (phase 3 can clamp to maxHP)
        } else if (matchLevel === 1) {
          out.name = 'BIG HEAL';
          out.value = 15;
        } else {
          out.name = 'MINOR HEAL';
          out.value = 5;
        }
      } else if (type === 'skull') {
        if (matchLevel === 2) {
          out.name = 'CATASTROPHE';
          out.value = 3; // multiplier on enemy damage
        } else if (matchLevel === 1) {
          out.name = 'ENEMY ASSAULT';
          out.value = 1.5;
        } else {
          out.name = 'ENEMY ATTACK';
          out.value = 1;
        }
      }

      return out;
    }
  }

  window.CombatResolver = CombatResolver;
})();

