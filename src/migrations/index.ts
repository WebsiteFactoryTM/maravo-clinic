import * as migration_20260605_071916_init from './20260605_071916_init';

export const migrations = [
  {
    up: migration_20260605_071916_init.up,
    down: migration_20260605_071916_init.down,
    name: '20260605_071916_init'
  },
];
