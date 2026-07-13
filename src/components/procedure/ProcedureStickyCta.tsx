import React from 'react'
import { FaWhatsapp, FaPhone } from 'react-icons/fa6'
import { buildWhatsAppMessage } from '@/components/ui/CtaButtons'

interface ProcedureStickyCtaProps {
  whatsapp: string
  phone: string
  procedureTitle: string
}

/**
 * Booking bar pinned to the bottom of the viewport on procedure pages.
 * Purely CSS-driven so it can stay a server component; `tokens.css` reserves
 * page padding for it and lifts the sitewide WhatsApp FAB clear of it.
 */
export default function ProcedureStickyCta({
  whatsapp,
  phone,
  procedureTitle,
}: ProcedureStickyCtaProps) {
  const message = buildWhatsAppMessage(procedureTitle)
  const whatsappHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`

  return (
    <div className="proc-sticky-cta" role="region" aria-label="Programare rapidă">
      <div className="proc-sticky-cta__inner">
        <div className="proc-sticky-cta__label">
          <span className="proc-sticky-cta__eyebrow">Programează-te la</span>
          <span className="proc-sticky-cta__title">{procedureTitle}</span>
        </div>

        <div className="proc-sticky-cta__actions">
          <a
            href={`tel:${phone}`}
            className="btn-dark proc-sticky-cta__call"
            aria-label={`Sună la ${phone}`}
          >
            <FaPhone aria-hidden="true" />
            <span className="proc-sticky-cta__call-text">Sună acum</span>
          </a>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary proc-sticky-cta__book"
            aria-label={`Doresc o programare pentru ${procedureTitle} — scrie-ne pe WhatsApp`}
          >
            <FaWhatsapp aria-hidden="true" />
            Doresc o programare
          </a>
        </div>
      </div>
    </div>
  )
}
