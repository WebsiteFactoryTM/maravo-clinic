import React from 'react'
import { getPayloadClient } from '@/lib/payload'
import CtaButtons from '@/components/ui/CtaButtons'
import LeadForm, { type ProcedureOption } from '@/components/forms/LeadForm'
import { buildMetadata, defaultMetaTitle, jsonLdHtml } from '@/lib/seo'
import { CLINIC } from '@/lib/clinic'
import SocialIcons from '@/components/ui/SocialIcons'
import type { Procedure, SiteSetting } from '@/payload-types'

export const revalidate = 3600

export const metadata = buildMetadata({
  title: defaultMetaTitle('Contact Timișoara'),
  // Derived from CLINIC so the NAP in search results can't drift from the page body.
  description: `Programări și informații ${CLINIC.name}: ${CLINIC.addressFull}, ${CLINIC.phone}. Sună, scrie pe WhatsApp sau completează formularul.`,
  path: '/contact',
})

interface PageProps {
  searchParams: Promise<{ procedura?: string }>
}

export default async function ContactPage({ searchParams }: PageProps) {
  const { procedura } = await searchParams
  const payload = await getPayloadClient()

  const settings = (await payload
    .findGlobal({ slug: 'site-settings' })
    .catch(() => null)) as SiteSetting | null

  const clinicName = settings?.clinicName ?? CLINIC.name
  const address = settings?.address ?? CLINIC.addressFull
  const phone = settings?.phone ?? process.env.CLINIC_PHONE ?? CLINIC.phone
  const whatsapp = settings?.whatsapp ?? process.env.WHATSAPP_NUMBER ?? CLINIC.whatsapp
  const email = settings?.email ?? CLINIC.email
  const hours =
    settings?.hours && settings.hours.length > 0
      ? settings.hours.map((h) => ({ day: h.day ?? '', value: h.value ?? '' }))
      : CLINIC.hours.map((h) => ({ day: h.day, value: h.value }))
  const mapsEmbedUrl = settings?.mapsEmbedUrl ?? CLINIC.mapsEmbedUrl

  // ?procedura=<slug> → prefill the lead form with that procedure.
  let prefillProcedure: { id: number; title: string } | null = null
  if (procedura) {
    const res = await payload
      .find({
        collection: 'procedures',
        where: { slug: { equals: procedura } },
        limit: 1,
        depth: 0,
      })
      .catch(() => null)
    const proc = res?.docs[0] as Procedure | undefined
    if (proc) prefillProcedure = { id: proc.id, title: proc.title }
  }

  // Procedure options for the form's select (only used when no prefill).
  let procedureOptions: ProcedureOption[] = []
  if (!prefillProcedure) {
    const res = await payload
      .find({
        collection: 'procedures',
        where: { status: { equals: 'published' } },
        limit: 0,
        depth: 0,
        sort: 'title',
      })
      .catch(() => null)
    procedureOptions = (res?.docs ?? []).map((p) => ({ id: p.id, title: p.title }))
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: clinicName,
    url: `${siteUrl}/contact`,
    ...(address ? { address } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(hours.length
      ? {
          openingHours: hours
            .map((h) => [h.day, h.value].filter(Boolean).join(' '))
            .filter(Boolean),
        }
      : {}),
  }

  return (
    <main className="contact-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />

      <header className="contact-hero">
        <span className="section-tag">Contact</span>
        <h1 className="contact-hero__title">Hai să ne cunoaștem</h1>
        <p className="contact-hero__lead">
          Programări, întrebări sau consultații la Maravo Clinic Timișoara — suntem aici pentru
          tine. Sună-ne, scrie-ne pe WhatsApp sau completează formularul de mai jos.
        </p>
      </header>

      <div className="contact-grid">
        {/* NAP + hours + map */}
        <section className="contact-info" aria-labelledby="contact-detalii">
          <h2 className="contact-info__title" id="contact-detalii">
            Detalii de contact
          </h2>

          <p className="contact-nap__row">
            <span className="contact-nap__label">Clinică</span>
            {clinicName}
          </p>
          <p className="contact-nap__row">
            <span className="contact-nap__label">Adresă</span>
            {address}
          </p>
          {phone && (
            <p className="contact-nap__row">
              <span className="contact-nap__label">Telefon</span>
              <a href={`tel:${phone}`}>{phone}</a>
            </p>
          )}
          {email && (
            <p className="contact-nap__row">
              <span className="contact-nap__label">Email</span>
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          )}

          {hours.length > 0 && (
            <div className="contact-hours">
              <h3 className="contact-hours__title">Program</h3>
              <dl className="contact-hours__list">
                {hours.map((h, i) => (
                  <div className="contact-hours__row" key={i}>
                    <dt>{h.day}</dt>
                    <dd>{h.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="contact-socials">
            <h3 className="contact-hours__title">Urmărește-ne</h3>
            <SocialIcons socials={CLINIC.socials.map((s) => ({ platform: s.platform, url: s.url }))} />
          </div>

          {(whatsapp || phone) && (
            <div className="contact-cta">
              <CtaButtons whatsapp={whatsapp} phone={phone} variant="stacked" />
            </div>
          )}
        </section>

        {/* Lead form */}
        <section className="contact-form-section" aria-labelledby="contact-formular">
          <h2 className="contact-form-section__title" id="contact-formular">
            Trimite o solicitare
          </h2>
          <LeadForm
            source={procedura ? `/contact?procedura=${procedura}` : '/contact'}
            procedureInterestId={prefillProcedure?.id}
            procedureTitle={prefillProcedure?.title}
            procedureOptions={procedureOptions}
          />
        </section>
      </div>

      <section className="contact-locate" aria-labelledby="contact-locate-title">
        <div className="contact-locate__head">
          <div>
            <span className="section-tag">Locație</span>
            <h2 className="contact-locate__title" id="contact-locate-title">
              Unde ne găsești
            </h2>
            <p className="contact-locate__address">{address}</p>
          </div>
          {address && (
            <a
              className="contact-locate__link"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Deschide în Google Maps →
            </a>
          )}
        </div>

        {mapsEmbedUrl ? (
          <div className="contact-map">
            <iframe
              src={mapsEmbedUrl}
              title={`Harta către ${clinicName}`}
              className="contact-map__frame"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="contact-map__placeholder">
            Harta va fi disponibilă în curând. Ne găsești în {address}.
          </p>
        )}
      </section>
    </main>
  )
}
