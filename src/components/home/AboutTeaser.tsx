import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Media } from '@/payload-types'
import { resolveMedia } from '@/lib/media'

interface AboutTeaserProps {
  heading?: string | null
  body?: string | null
  image?: Media | number | null
}

export default function AboutTeaser({ heading, body, image }: AboutTeaserProps) {
  const resolvedHeading = heading ?? 'Medicina estetică\n*la standarde europene*\nîn inima Timișoarei'
  const resolvedBody =
    body ??
    'Maravo Clinic este destinația premium pentru tratamente estetice din Timișoara. Combinăm tehnologia medicală de ultimă generație cu expertiza clinicienilor noștri pentru rezultate excepționale.'

  const resolvedImage = resolveMedia(image)

  // Render heading with line breaks and italic via *…*
  function renderHeading(raw: string) {
    const lines = raw.split('\n')
    return lines.map((line, i) => {
      const parts = line.split(/(\*[^*]+\*)/)
      return (
        <React.Fragment key={i}>
          {parts.map((part, j) =>
            part.startsWith('*') && part.endsWith('*') ? (
              <em key={j}>{part.slice(1, -1)}</em>
            ) : (
              part
            ),
          )}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      )
    })
  }

  return (
    <section id="about">
      <div className="about-visual fade-up">
        <div className="about-visual-inner">
          {resolvedImage?.url ? (
            <Image
              src={resolvedImage.url}
              alt={resolvedImage.alt ?? 'Maravo Clinic'}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="about-logo"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo-gold.png" className="about-logo" alt="Maravo Clinic" />
          )}
        </div>
      </div>
      <div className="about-content">
        <span className="section-tag">Despre Maravo Clinic</span>
        <h2 className="about-title fade-up">{renderHeading(resolvedHeading)}</h2>
        <p className="about-body fade-up">{resolvedBody}</p>
        <div className="about-pillars">
          <div className="about-pillar fade-up">
            <span className="pillar-num">01</span>
            <div className="pillar-text">
              <strong>Tehnologie certificată medical</strong>
              Aparatură Lutronic Clarity II, Lumenis, BTL — certificate CE, utilizate în clinici de
              top din Europa.
            </div>
          </div>
          <div className="about-pillar fade-up">
            <span className="pillar-num">02</span>
            <div className="pillar-text">
              <strong>Medici specializați</strong>
              Fiecare procedură este efectuată sau supervizată de medici cu specializare în
              dermatologie estetică.
            </div>
          </div>
          <div className="about-pillar fade-up">
            <span className="pillar-num">03</span>
            <div className="pillar-text">
              <strong>Protocoale personalizate</strong>
              Fiecare plan de tratament este conceput individual, după consultație detaliată
              gratuită.
            </div>
          </div>
        </div>
        <div style={{ marginTop: '40px' }}>
          <Link href="/despre" className="btn-primary">
            Despre noi →
          </Link>
        </div>
      </div>
    </section>
  )
}
