import React from 'react'

interface CtaButtonsProps {
  whatsapp: string
  phone: string
  procedureTitle?: string
  procedureSlug?: string
  variant?: 'inline' | 'stacked'
}

function buildWhatsAppMessage(procedureTitle?: string): string {
  if (procedureTitle) {
    return `Bună, aș dori o programare pentru ${procedureTitle} la Maravo Clinic.`
  }
  return 'Bună, aș dori o programare la Maravo Clinic.'
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
            ? `Contactează-ne pe WhatsApp pentru ${procedureTitle}`
            : 'Contactează-ne pe WhatsApp'
        }
      >
        WhatsApp
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
            ? `Programează-te pentru ${procedureTitle}`
            : 'Programează-te'
        }
      >
        Programează-te
      </a>
    </div>
  )
}

/** Pure helper — exported for unit tests without DOM */
export { buildWhatsAppMessage }
