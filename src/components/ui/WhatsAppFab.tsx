import React from 'react'
import { FaWhatsapp } from 'react-icons/fa6'

export default function WhatsAppFab({
  whatsapp,
  message = 'Bună ziua! Aș dori o programare la Maravo Clinic.',
}: {
  whatsapp?: string | null
  message?: string
}) {
  if (!whatsapp) return null
  const number = whatsapp.replace(/[^\d]/g, '')
  if (!number) return null
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-fab"
      aria-label="Scrie-ne pe WhatsApp"
    >
      <FaWhatsapp aria-hidden="true" />
    </a>
  )
}
