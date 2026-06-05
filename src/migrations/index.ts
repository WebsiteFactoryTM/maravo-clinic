import * as migration_20260605_071916_init from './20260605_071916_init';
import * as migration_20260605_084606 from './20260605_084606';

export const migrations = [
  {
    up: migration_20260605_071916_init.up,
    down: migration_20260605_071916_init.down,
    name: '20260605_071916_init',
  },
  {
    up: migration_20260605_084606.up,
    down: migration_20260605_084606.down,
    name: '20260605_084606'
  },
];
