import React from 'react'
import { buildMetadata, defaultMetaTitle } from '@/lib/seo'
import { getPayloadClient } from '@/lib/payload'
import { PROCEDURE_SORT } from '@/lib/procedure-sort'
import CtaButtons from '@/components/ui/CtaButtons'
import TarifeExplorer, { type TarifeSection } from '@/components/tarife/TarifeExplorer'
import type { Category, Procedure, SiteSetting } from '@/payload-types'

export const revalidate = 3600

export const metadata = buildMetadata({
  title: defaultMetaTitle('Tarife proceduri estetice Timișoara'),
  description:
    'Prețuri orientative pentru procedurile estetice Maravo Clinic Timișoara, pe categorii. Programează o consultație pentru o ofertă personalizată.',
  path: '/tarife',
})

function resolveCategory(cat: number | Category): Category | null {
  if (typeof cat === 'number') return null
  return cat
}

export default async function TarifePage() {
  const payload = await getPayloadClient()

  const [categoriesResult, proceduresResult, settings] = await Promise.all([
    payload.find({ collection: 'categories', limit: 0, sort: 'order' }),
    payload.find({
      collection: 'procedures',
      where: { status: { equals: 'published' } },
      limit: 0,
      depth: 1,
      // Rows are grouped into per-category sections below, so the in-category
      // order is what shows; sections themselves follow `categories.order`.
      sort: PROCEDURE_SORT,
    }),
    payload.findGlobal({ slug: 'site-settings' }).catch(() => null) as Promise<SiteSetting | null>,
  ])

  const categories = categoriesResult.docs as Category[]
  const procedures = proceduresResult.docs as Procedure[]

  const whatsapp = settings?.whatsapp ?? process.env.WHATSAPP_NUMBER ?? ''
  const phone = settings?.phone ?? process.env.CLINIC_PHONE ?? ''

  // Group published procedures by their (populated) category id.
  const byCategory = new Map<number, Procedure[]>()
  for (const proc of procedures) {
    const cat = resolveCategory(proc.category)
    if (!cat) continue
    const list = byCategory.get(cat.id) ?? []
    list.push(proc)
    byCategory.set(cat.id, list)
  }

  // Keep only categories that have at least one procedure, in CMS order, and
  // shape them for the (client) explorer.
  const sections: TarifeSection[] = categories
    .map((cat): TarifeSection => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug ?? null,
      icon: cat.icon,
      procs: (byCategory.get(cat.id) ?? []).map((proc) => ({
        id: proc.id,
        title: proc.title,
        href: cat.slug && proc.slug ? `/proceduri/${cat.slug}/${proc.slug}` : null,
        priceFrom: proc.priceFrom ?? null,
        priceNote: proc.priceNote ?? null,
      })),
    }))
    .filter((s) => s.procs.length > 0)

  return (
    <main className="tarife-page">
      <header className="tarife-hero">
        <span className="section-tag">Estetică medicală</span>
        <h1 className="tarife-hero__title">Tarife Timișoara</h1>
        <p className="tarife-hero__intro">
          Prețurile de mai jos sunt orientative și pornesc de la valoarea pentru o ședință standard.
          Tariful final se stabilește în urma consultației, în funcție de zona tratată și de planul
          personalizat recomandat de medic.
        </p>
      </header>

      <div className="tarife-body">
        {sections.length === 0 ? (
          <p className="tarife-disclaimer">
            Lista de tarife va fi disponibilă în curând. Pentru o ofertă personalizată, contactează-ne.
          </p>
        ) : (
          <TarifeExplorer sections={sections} />
        )}

        <p className="tarife-note">Plată în rate disponibilă pentru toate procedurile.</p>

        <p className="tarife-disclaimer">
          Tarifele afișate au caracter informativ și nu reprezintă o ofertă fermă. Pentru proceduri
          combinate sau pachete de tratament, contactează-ne pentru o evaluare individuală.
        </p>
      </div>

      {(whatsapp || phone) && (
        <section className="tarife-cta" aria-label="Programează o consultație">
          <h2 className="tarife-cta__heading">Programează o consultație</h2>
          <CtaButtons whatsapp={whatsapp} phone={phone} variant="stacked" />
        </section>
      )}
    </main>
  )
}
