import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import CtaButtons from '@/components/ui/CtaButtons'
import type { Category, Procedure, SiteSetting } from '@/payload-types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Tarife proceduri estetice Timișoara — Maravo Clinic',
  description:
    'Tarifele procedurilor estetice și dermatologice la Maravo Clinic Timișoara. Prețuri orientative, pe categorii — programează o consultație pentru o ofertă personalizată.',
}

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
      sort: 'title',
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

  // Keep only categories that have at least one procedure, in CMS order.
  const sections = categories
    .map((cat) => ({ cat, procs: byCategory.get(cat.id) ?? [] }))
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
          sections.map(({ cat, procs }) => (
            <section
              key={cat.id}
              className="tarife-cat"
              aria-labelledby={`tarife-cat-${cat.id}`}
            >
              <div className="tarife-cat__head">
                {cat.icon && (
                  <span className="tarife-cat__icon" aria-hidden="true">
                    {cat.icon}
                  </span>
                )}
                <h2 className="tarife-cat__title" id={`tarife-cat-${cat.id}`}>
                  {cat.name}
                </h2>
              </div>

              <ul className="tarife-rows">
                {procs.map((proc) => {
                  const href = cat.slug && proc.slug ? `/proceduri/${cat.slug}/${proc.slug}` : null
                  return (
                    <li key={proc.id} className="tarife-row">
                      {href ? (
                        <Link href={href} className="tarife-row__name">
                          {proc.title}
                        </Link>
                      ) : (
                        <span className="tarife-row__name">{proc.title}</span>
                      )}

                      <span className="tarife-row__price">
                        {proc.priceFrom != null ? (
                          <>
                            <span className="tarife-row__amount">de la {proc.priceFrom} lei</span>
                            {proc.priceNote && (
                              <span className="tarife-row__note">{proc.priceNote}</span>
                            )}
                          </>
                        ) : (
                          <span className="tarife-row__amount tarife-row__amount--soft">
                            Preț la consultație
                          </span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}

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
