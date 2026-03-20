(function () {
  // Symbol definitions + reel strip layouts (12 positions each).
  // These are used both for weighted roll odds and for rendering placeholders.
  const SYMBOLS = {
    sword: { id: 'sword', color: '#C0392B', icon: 'S' },
    shield: { id: 'shield', color: '#2980B9', icon: 'SH' },
    fireball: { id: 'fireball', color: '#E67E22', icon: 'FB' },
    potion: { id: 'potion', color: '#27AE60', icon: 'P' },
    skull: { id: 'skull', color: '#7F8C8D', icon: 'SK' },
  };

  // Distribution from the design doc.
  const REEL_STRIPS = [
    // Reel 1
    [
      'sword',
      'sword',
      'sword',
      'shield',
      'shield',
      'fireball',
      'fireball',
      'potion',
      'potion',
      'skull',
      'skull',
      'skull',
    ],
    // Reel 2
    [
      'sword',
      'sword',
      'sword',
      'shield',
      'shield',
      'fireball',
      'fireball',
      'potion',
      'potion',
      'skull',
      'skull',
      'skull',
    ],
    // Reel 3
    [
      'sword',
      'sword',
      'sword',
      'shield',
      'shield',
      'fireball',
      'potion',
      'potion',
      'skull',
      'skull',
      'skull',
      'skull',
    ],
  ];

  window.SYMBOLS = SYMBOLS;
  window.REEL_STRIPS = REEL_STRIPS;
})();

