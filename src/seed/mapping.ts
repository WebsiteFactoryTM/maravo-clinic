/**
 * Explicit category and body-zone mapping for each procedure.
 * Keys are lowercase normalized fragments that match procedure titles.
 * The mapper applies the FIRST matching rule.
 */

export type CategorySlug = 'fata' | 'corp' | 'laser' | 'injectabile' | 'par'
export type BodyZone = 'par' | 'fata' | 'gat' | 'brate' | 'abdomen' | 'picioare'

export interface ProcedureMapping {
  category: CategorySlug
  bodyZones: BodyZone[]
  /** Slug of the linked equipment item (if any) */
  equipmentSlug?: string
}

/** Normalize a title for matching */
function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** All mapping rules, evaluated top-to-bottom; first match wins */
const RULES: Array<{ test: (t: string) => boolean; mapping: ProcedureMapping }> = [
  // ── LASER treatments (Clarity II) ──────────────────────────────────────────
  {
    test: (t) => t.includes('epilare') && (t.includes('laser') || t.includes('definitiv')),
    mapping: {
      category: 'laser',
      bodyZones: ['fata', 'brate', 'abdomen', 'picioare'],
      equipmentSlug: 'clarity-ii',
    },
  },
  {
    test: (t) => t.includes('vascular') && t.includes('laser'),
    mapping: {
      category: 'laser',
      bodyZones: ['fata', 'picioare'],
      equipmentSlug: 'clarity-ii',
    },
  },
  {
    test: (t) => t.includes('onicomicoza') || t.includes('ciuperca'),
    mapping: {
      category: 'laser',
      bodyZones: ['picioare'],
      equipmentSlug: 'clarity-ii',
    },
  },
  {
    test: (t) => t.includes('veruci') || t.includes('plantare'),
    mapping: {
      category: 'laser',
      bodyZones: ['picioare'],
      equipmentSlug: 'clarity-ii',
    },
  },
  {
    test: (t) =>
      (t.includes('rejuvenare') || t.includes('rejuvenare faciala')) && t.includes('laser'),
    mapping: {
      category: 'laser',
      bodyZones: ['fata'],
      equipmentSlug: 'clarity-ii',
    },
  },
  {
    test: (t) => t.includes('pete pigmentare') && t.includes('laser'),
    mapping: {
      category: 'laser',
      bodyZones: ['fata', 'brate'],
      equipmentSlug: 'clarity-ii',
    },
  },

  // ── Device corp treatments ──────────────────────────────────────────────────
  {
    test: (t) => t.includes('hifu') || t.includes('liftera'),
    mapping: {
      category: 'corp',
      bodyZones: ['fata', 'gat', 'abdomen'],
      equipmentSlug: 'hifu-liftera-asterasys',
    },
  },
  {
    test: (t) =>
      t.includes('radiofrecventa') && t.includes('faciale'),
    mapping: {
      category: 'fata',
      bodyZones: ['fata'],
      equipmentSlug: 'nuera-tight-lumenis',
    },
  },
  {
    test: (t) =>
      t.includes('radiofrecventa') ||
      (t.includes('remodelare') && (t.includes('rf') || t.includes('radiofrecv'))),
    mapping: {
      category: 'corp',
      bodyZones: ['abdomen', 'brate', 'picioare'],
      equipmentSlug: 'nuera-tight-lumenis',
    },
  },
  {
    test: (t) => t.includes('drenaj') || t.includes('lymphastim') || t.includes('presoterapie'),
    mapping: {
      category: 'corp',
      bodyZones: ['picioare', 'abdomen'],
      equipmentSlug: 'btl-lymphastim',
    },
  },
  {
    test: (t) => t.includes('crio') || t.includes('crioterapie'),
    mapping: {
      category: 'corp',
      bodyZones: ['fata', 'picioare'],
      equipmentSlug: 'cryopen-o',
    },
  },
  {
    test: (t) => t.includes('lipoliza') && !t.includes('laser'),
    mapping: { category: 'corp', bodyZones: ['abdomen', 'brate'] },
  },
  {
    test: (t) => t.includes('lanluma'),
    mapping: { category: 'corp', bodyZones: ['abdomen', 'brate', 'picioare'] },
  },

  // ── FAȚĂ device treatments ─────────────────────────────────────────────────
  {
    test: (t) => t.includes('hydrafacial'),
    mapping: {
      category: 'fata',
      bodyZones: ['fata'],
      equipmentSlug: 'hydrafacial-syndeo',
    },
  },
  {
    test: (t) => t.includes('dermapen') || t.includes('microneedling'),
    mapping: {
      category: 'fata',
      bodyZones: ['fata'],
      equipmentSlug: 'dermapen-4',
    },
  },

  // ── PĂR ────────────────────────────────────────────────────────────────────
  {
    test: (t) => t.includes('par') || t.includes('scalp') || t.includes('alopecie'),
    mapping: { category: 'par', bodyZones: ['par'] },
  },

  // ── INJECTABILE – facial fillers & toxins ────────────────────────────────
  {
    test: (t) =>
      t.includes('acid hialuronic') ||
      t.includes('hialuronic') ||
      t.includes('filler'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('botox') || t.includes('toxin'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('prp') || t.includes('vampir'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('mezoterapie'),
    mapping: { category: 'fata', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('polinucleotide'),
    mapping: { category: 'fata', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('sculptra') || t.includes('biostimulator'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('harmonyca'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('radiesse'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('colagen') && t.includes('regenerare'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('fire pdo') || t.includes('fire resorbabile') || t.includes('pdo'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('dizolvare') || t.includes('hialuronidaza'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('volumetrie') || t.includes('pometi') || t.includes('mandibula'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('cearcane') || t.includes('infraorbital'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('santuri') || t.includes('nazo') || t.includes('labiale'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },
  {
    test: (t) => t.includes('rinocorectie') || t.includes('nas'),
    mapping: { category: 'injectabile', bodyZones: ['fata'] },
  },

  // ── Consultație (special) ─────────────────────────────────────────────────
  {
    test: (t) => t.includes('consultatie') || t.includes('consultat'),
    mapping: { category: 'fata', bodyZones: ['fata'] },
  },

  // ── Default fallback ──────────────────────────────────────────────────────
  {
    test: () => true,
    mapping: { category: 'fata', bodyZones: ['fata'] },
  },
]

/**
 * Look up the category and body-zone mapping for a procedure by its title.
 */
export function getMappingForTitle(title: string): ProcedureMapping {
  const normalized = norm(title)
  for (const rule of RULES) {
    if (rule.test(normalized)) {
      return rule.mapping
    }
  }
  return { category: 'fata', bodyZones: ['fata'] }
}
