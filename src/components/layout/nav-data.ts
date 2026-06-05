/* ═══════════════════════════════════════════════
   MARAVO CLINIC — nav-data.ts
   Static navigation data.
   Task 17 will wire this to the CMS.
   ═══════════════════════════════════════════════ */

export interface Category {
  id: string
  label: string
  icon: string
}

export interface Procedure {
  name: string
  /** primary category (for grouping in mobile accordion) */
  cat: string
  /** all categories this procedure belongs to */
  cats: string[]
}

export const CATEGORIES: Category[] = [
  { id: 'fata',        label: 'Față',        icon: '✦' },
  { id: 'corp',        label: 'Corp',        icon: '◈' },
  { id: 'laser',       label: 'Laser',       icon: '◉' },
  { id: 'injectabile', label: 'Injectabile', icon: '◎' },
  { id: 'par',         label: 'Păr',         icon: '◇' },
]

export const PROCEDURES: Procedure[] = [
  { name: 'Drenaj Limfatic BTL Lymphastim',                         cat: 'corp',        cats: ['corp'] },
  { name: 'Epilare Definitivă Lutronic Clarity II',                 cat: 'laser',       cats: ['laser', 'corp', 'fata'] },
  { name: 'Lipoliză Localizată',                                    cat: 'corp',        cats: ['corp'] },
  { name: 'Mezoterapie',                                            cat: 'fata',        cats: ['fata'] },
  { name: 'Microneedling Medical (Dermapen 4)',                      cat: 'fata',        cats: ['fata'] },
  { name: 'Rejuvenare Facială cu Laser – Lutronic Clarity II',      cat: 'laser',       cats: ['laser', 'fata'] },
  { name: 'Remodelare Corporală Nuera Tight Lumenis',               cat: 'corp',        cats: ['corp'] },
  { name: 'HydraFacial Timișoara – Curățare și Hidratare Ten',      cat: 'fata',        cats: ['fata'] },
  { name: 'Tratament Regenerare și Stopare Cădere Păr',             cat: 'par',         cats: ['par'] },
  { name: 'Tratament Vascular cu Laser – Lutronic Clarity II',      cat: 'laser',       cats: ['laser', 'fata', 'corp'] },
  { name: 'Tratamente Corporale HIFU – Remodelare Fără Bisturiu',   cat: 'corp',        cats: ['corp'] },
  { name: 'Tratamente cu Fire Resorbabile (PDO)',                   cat: 'fata',        cats: ['fata'] },
  { name: 'Tratamente cu Plasmă Proprie (PRP – Terapia Vampir)',    cat: 'fata',        cats: ['fata'] },
  { name: 'Tratamente Faciale cu Radiofrecvență Nuera Tight',       cat: 'fata',        cats: ['fata'] },
  { name: 'HIFU Liftera Asterasys Timișoara',                       cat: 'corp',        cats: ['corp', 'fata'] },
  { name: 'Tratamente Injectabile cu Acid Hialuronic',              cat: 'injectabile', cats: ['injectabile', 'fata'] },
  { name: 'Biorevitalizare și Biostimulare de Colagen',             cat: 'injectabile', cats: ['injectabile', 'fata'] },
  { name: 'Tratamente Injectabile cu Toxină Botulinică',            cat: 'injectabile', cats: ['injectabile', 'fata'] },
  { name: 'Tratamente Laser Specializate cu Lutronic Clarity II',   cat: 'laser',       cats: ['laser'] },
]

/**
 * Build a procedure href.
 * Currently returns '#' for all procedures; swap to real slug-based paths in Task 17.
 */
export function procedureHref(_procedure: Procedure): string {
  // TODO Task 17: return `/proceduri/${procedure.cat}/${slugify(procedure.name)}`
  return '#'
}

/** Main nav links */
export const NAV_LINKS = [
  { label: 'Aparatură', href: '/aparatura' },
  { label: 'Tarife',    href: '/tarife' },
  { label: 'Despre noi',href: '/despre' },
  { label: 'Blog',      href: '/blog' },
  { label: 'Contact',   href: '/contact' },
] as const
