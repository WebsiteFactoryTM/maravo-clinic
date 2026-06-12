import React from 'react'
import { getPayloadClient } from '@/lib/payload'
import CtaButtons from '@/components/ui/CtaButtons'
import type { SiteSetting } from '@/payload-types'
import { buildMetadata, defaultMetaTitle } from '@/lib/seo'
import { CLINIC } from '@/lib/clinic'

export const revalidate = 3600

export const metadata = buildMetadata({
  title: defaultMetaTitle('Despre — clinică estetică premium Timișoara'),
  description:
    'Maravo Clinic, clinică de estetică medicală premium în Timișoara. Echipă coordonată de Dr. Cristiana Voinescu, tehnologie certificată CE.',
  path: '/despre',
})

/* ──────────────────────────────────────────────────────────────────────────
 * EDITABLE STATIC CONTENT (v2)
 * Premium copy for Maravo Clinic. Verified facts published on the client's live
 * site (maravoclinic.ro) are used: Dr. Cristiana Voinescu and the clinic NAP
 * (see src/lib/clinic.ts). Doctor credentials are phrased conservatively — no
 * specific certifications are asserted. CMS site-settings still override NAP.
 * ────────────────────────────────────────────────────────────────────────── */

const ABOUT_CONTENT = {
  heroLead:
    'Maravo Clinic este o clinică de estetică medicală premium din Timișoara, dedicată tratamentelor care îmbină rigoarea medicală cu un simț estetic rafinat. Punem accent pe rezultate naturale, siguranță și o experiență discretă, gândită pentru fiecare pacient în parte.',
  story: [
    'Am creat Maravo Clinic pornind de la o convingere simplă: frumusețea autentică se obține atunci când expertiza medicală întâlnește grija pentru detaliu. Fiecare tratament începe cu o consultație atentă, în care ascultăm, evaluăm și construim împreună un plan personalizat.',
    'Filozofia noastră este una a echilibrului — intervenții fine, calibrate, care îți pun în valoare trăsăturile fără a le transforma. Credem în transparență, în recomandări oneste și în a-ți spune și atunci când o procedură nu este potrivită pentru tine.',
  ],
  values: [
    {
      title: 'Siguranță medicală',
      text: 'Protocoale stricte, aparatură certificată CE și produse de la branduri recunoscute internațional — siguranța ta este pe primul loc.',
    },
    {
      title: 'Rezultate naturale',
      text: 'Estetica noastră este subtilă și echilibrată. Urmărim armonia, nu exagerarea, pentru un rezultat care te reprezintă.',
    },
    {
      title: 'Abordare personalizată',
      text: 'Fiecare plan de tratament este conceput individual, în urma unei consultații detaliate cu medicul.',
    },
    {
      title: 'Discreție & confort',
      text: 'Un spațiu intim și o experiență premium, de la prima programare până la urmărirea rezultatelor.',
    },
  ],
  // Reference to the equipment portfolio — keep aligned with the 7 seeded devices.
  technology: [
    'Lutronic Clarity II — laser dual pentru leziuni vasculare și pigmentare',
    'Tehnologie HIFU pentru lifting non-chirurgical',
    'Radiofrecvență (RF) pentru fermitatea pielii',
    'Tratamente injectabile — toxină botulinică & acid hialuronic',
    'Proceduri regenerative pentru revitalizarea tenului',
    'Soluții pentru remodelare corporală',
    'Tratamente dedicate îngrijirii părului',
  ],
} as const

export default async function DesprePage() {
  const payload = await getPayloadClient()
  const settings = (await payload
    .findGlobal({ slug: 'site-settings' })
    .catch(() => null)) as SiteSetting | null

  const clinicName = settings?.clinicName ?? CLINIC.name
  const address = settings?.address ?? CLINIC.addressFull
  const phone = settings?.phone ?? process.env.CLINIC_PHONE ?? CLINIC.phone
  const whatsapp = settings?.whatsapp ?? process.env.WHATSAPP_NUMBER ?? CLINIC.whatsapp
  const email = settings?.email ?? CLINIC.email

  return (
    <main className="despre-page">
      <header className="despre-hero">
        <span className="section-tag">Despre noi</span>
        <h1 className="despre-hero__title">
          Estetică medicală <em>premium</em> în inima Timișoarei
        </h1>
        <p className="despre-hero__lead">{ABOUT_CONTENT.heroLead}</p>
      </header>

      {/* Story / philosophy */}
      <section className="despre-section" aria-labelledby="despre-poveste">
        <h2 className="despre-section__title" id="despre-poveste">
          Povestea & filozofia noastră
        </h2>
        {ABOUT_CONTENT.story.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </section>

      {/* Values / pillars */}
      <section className="despre-section" aria-labelledby="despre-valori">
        <h2 className="despre-section__title" id="despre-valori">
          Valorile care ne ghidează
        </h2>
        <div className="despre-values">
          {ABOUT_CONTENT.values.map((v, i) => (
            <article className="despre-value" key={v.title}>
              <span className="despre-value__num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="despre-value__title">{v.title}</h3>
              <p className="despre-value__text">{v.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Medical team (role-based, no fabricated names) */}
      <section className="despre-section" aria-labelledby="despre-echipa">
        <h2 className="despre-section__title" id="despre-echipa">
          Echipa medicală
        </h2>
        <p>
          Echipa medicală {clinicName} este coordonată de{' '}
          <strong>Dr. Cristiana Voinescu</strong>, alături de personal medical instruit pentru
          fiecare tehnologie pe care o folosim. Fiecare tratament este efectuat sau supervizat de
          medic, după o consultație în care stabilim împreună abordarea potrivită pentru tine.
          Investim constant în formare și în participarea la cursuri și conferințe de profil, pentru
          a aduce cele mai actuale protocoale de estetică medicală în Timișoara.
        </p>
      </section>

      {/* Certifications / technology */}
      <section className="despre-section" aria-labelledby="despre-tehnologie">
        <h2 className="despre-section__title" id="despre-tehnologie">
          Tehnologie & certificări
        </h2>
        <p>
          Lucrăm exclusiv cu aparatură medicală certificată CE și cu produse de la branduri
          recunoscute la nivel internațional. Portofoliul nostru de echipamente acoperă o gamă largă
          de nevoi estetice și dermatologice:
        </p>
        <ul className="despre-tech-list">
          {ABOUT_CONTENT.technology.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Location / NAP */}
      <section className="despre-nap" aria-labelledby="despre-locatie">
        <div className="despre-nap__card">
          <h2 className="despre-nap__title" id="despre-locatie">
            Unde ne găsești
          </h2>
          <p className="despre-nap__row">
            <span className="despre-nap__label">Clinică</span>
            {clinicName}
          </p>
          <p className="despre-nap__row">
            <span className="despre-nap__label">Adresă</span>
            {address}
          </p>
          {phone && (
            <p className="despre-nap__row">
              <span className="despre-nap__label">Telefon</span>
              <a href={`tel:${phone}`}>{phone}</a>
            </p>
          )}
          {email && (
            <p className="despre-nap__row">
              <span className="despre-nap__label">Email</span>
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          )}
        </div>
      </section>

      {(whatsapp || phone) && (
        <section className="despre-cta" aria-label="Programează o consultație">
          <h2 className="despre-cta__heading">Hai să ne cunoaștem</h2>
          <CtaButtons whatsapp={whatsapp} phone={phone} variant="stacked" />
        </section>
      )}
    </main>
  )
}
