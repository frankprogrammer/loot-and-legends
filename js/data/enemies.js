(function () {
  // Enemy roster + wave mapping.
  const ENEMY_BASES = {
    giant_rat: {
      id: 'giant_rat',
      name: 'Giant Rat',
      hp: 20,
      damage: 5,
      speed: 'normal',
      color: '#8B5E3C',
      w: 50,
      h: 55,
      /** Phaser texture key; loaded from assets/rat.png */
      spriteTextureKey: 'enemy_rat',
    },
    skeleton: {
      id: 'skeleton',
      name: 'Skeleton',
      hp: 35,
      damage: 8,
      speed: 'normal',
      color: '#D6D6D6',
      w: 65,
      h: 80,
      spriteTextureKey: 'enemy_skeleton',
    },
    orc_grunt: {
      id: 'orc_grunt',
      name: 'Orc Grunt',
      hp: 55,
      damage: 12,
      speed: 'normal',
      color: '#2ECC71',
      w: 70,
      h: 90,
      spriteTextureKey: 'enemy_orc',
    },
    dark_elf: {
      id: 'dark_elf',
      name: 'Dark Elf',
      hp: 45,
      damage: 18,
      speed: 'fast',
      color: '#8E44AD',
      w: 65,
      h: 85,
      spriteTextureKey: 'enemy_dark_elf',
    },
    troll: {
      id: 'troll',
      name: 'Troll',
      hp: 90,
      damage: 15,
      speed: 'slow',
      color: '#7F8C8D',
      w: 90,
      h: 105,
      spriteTextureKey: 'enemy_troll',
    },
    shadow_knight: {
      id: 'shadow_knight',
      name: 'Shadow Knight',
      hp: 75,
      damage: 22,
      speed: 'normal',
      color: '#2C3E50',
      w: 75,
      h: 95,
      spriteTextureKey: 'enemy_shadow_knight',
    },
    necromancer: {
      id: 'necromancer',
      name: 'Necromancer',
      hp: 60,
      damage: 28,
      speed: 'normal',
      color: '#27AE60',
      w: 75,
      h: 95,
      spriteTextureKey: 'enemy_necromancer',
    },
    dragon: {
      id: 'dragon',
      name: 'Dragon',
      hp: 120,
      damage: 35,
      speed: 'slow',
      color: '#E67E22',
      w: 110,
      h: 120,
      spriteTextureKey: 'enemy_dragon',
    },
  };

  const WAVE_TO_BASE = [
    { from: 1, to: 1, key: 'giant_rat' },
    { from: 2, to: 3, key: 'skeleton' },
    { from: 4, to: 5, key: 'orc_grunt' },
    { from: 6, to: 7, key: 'dark_elf' },
    { from: 8, to: 9, key: 'troll' },
    { from: 10, to: 11, key: 'shadow_knight' },
    { from: 12, to: 14, key: 'necromancer' },
    { from: 15, to: 15, key: 'dragon' },
  ];

  function getEnemyForWave(wave) {
    let baseKey = 'skeleton';
    for (const r of WAVE_TO_BASE) {
      if (wave >= r.from && wave <= r.to) {
        baseKey = r.key;
        break;
      }
    }

    // After all introduced (wave > 15), reuse in random order with scaling.
    if (wave > 15) {
      const keys = [
        'giant_rat',
        'skeleton',
        'orc_grunt',
        'dark_elf',
        'troll',
        'shadow_knight',
        'necromancer',
        'dragon',
      ];
      baseKey = keys[Math.floor(Math.random() * keys.length)];
    }

    const base = ENEMY_BASES[baseKey];

    if (wave <= 15) return { ...base };

    const over = wave - 15;
    const hp = Math.round(base.hp * (1 + over * 0.1));
    const damage = Math.round(base.damage * (1 + over * 0.05));
    return { ...base, hp, damage };
  }

  window.getEnemyForWave = getEnemyForWave;
  window.ENEMY_BASES = ENEMY_BASES;
})();

