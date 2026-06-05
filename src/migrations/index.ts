import * as migration_20260605_071916_init from './20260605_071916_init';
import * as migration_20260605_084606 from './20260605_084606';
import * as migration_20260605_085721_equipment_procedures from './20260605_085721_equipment_procedures';
import * as migration_20260605_092026_posts_leads from './20260605_092026_posts_leads';

export const migrations = [
  {
    up: migration_20260605_071916_init.up,
    down: migration_20260605_071916_init.down,
    name: '20260605_071916_init',
  },
  {
    up: migration_20260605_084606.up,
    down: migration_20260605_084606.down,
    name: '20260605_084606',
  },
  {
    up: migration_20260605_085721_equipment_procedures.up,
    down: migration_20260605_085721_equipment_procedures.down,
    name: '20260605_085721_equipment_procedures',
  },
  {
    up: migration_20260605_092026_posts_leads.up,
    down: migration_20260605_092026_posts_leads.down,
    name: '20260605_092026_posts_leads'
  },
];
