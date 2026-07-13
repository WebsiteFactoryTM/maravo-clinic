import React from 'react'
import { FaWhatsapp } from 'react-icons/fa6'
import { CLINIC } from '@/lib/clinic'

interface CtaButtonsProps {
  whatsapp: string
  phone: string
  procedureTitle?: string
  procedureSlug?: string
  variant?: 'inline' | 'stacked'
}

function buildWhatsAppMessage(procedureTitle?: string): string {
  if (procedureTitle) {
    return `Bună ziua, doresc mai multe informații despre procedura ${procedureTitle}.`
  }
  return CLINIC.whatsappMessage
}

export default function CtaButtons({
  whatsapp,
  phone,
  procedureTitle,
  procedureSlug,
  variant = 'inline',
}: CtaButtonsProps) {
  const message = buildWhatsAppMessage(procedureTitle)
  const whatsappHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
  const contactHref = `/contact${procedureSlug ? `?procedura=${procedureSlug}` : ''}`

  const wrapperClass = `cta-buttons cta-buttons--${variant}`

  return (
    <div className={wrapperClass}>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary cta-btn-whatsapp"
        aria-label={
          procedureTitle
            ? `Doresc o programare pentru ${procedureTitle} — scrie-ne pe WhatsApp`
            : 'Doresc o programare — scrie-ne pe WhatsApp'
        }
      >
        <FaWhatsapp aria-hidden="true" />
        Doresc o programare
      </a>

      <a
        href={`tel:${phone}`}
        className="btn-dark cta-btn-phone"
        aria-label={`Sună la ${phone}`}
      >
        Sună acum
      </a>

      <a
        href={contactHref}
        className="btn-outline cta-btn-booking"
        aria-label={
          procedureTitle
            ? `Formular de contact pentru ${procedureTitle}`
            : 'Formular de contact'
        }
      >
        Formular contact
      </a>
    </div>
  )
}

/** Pure helper — exported for unit tests without DOM */
export { buildWhatsAppMessage }
