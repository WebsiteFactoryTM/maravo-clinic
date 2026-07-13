import { test, expect } from 'vitest'
import { buildWhatsAppMessage } from '../../src/components/ui/CtaButtons'
import { CLINIC } from '../../src/lib/clinic'

test('builds procedure-specific WhatsApp message when procedureTitle is provided', () => {
  const msg = buildWhatsAppMessage('Botox facial')
  expect(msg).toBe('Bună ziua, doresc mai multe informații despre procedura Botox facial.')
})

test('builds the generic clinic message when no procedureTitle', () => {
  expect(buildWhatsAppMessage()).toBe('Bună ziua, doresc mai multe informații despre proceduri.')
  expect(buildWhatsAppMessage()).toBe(CLINIC.whatsappMessage)
})

test('builds generic WhatsApp message when procedureTitle is undefined', () => {
  expect(buildWhatsAppMessage(undefined)).toBe(CLINIC.whatsappMessage)
})

test('WhatsApp URL encodes the message correctly', () => {
  const waNumber = '40712345678'
  const title = 'Lifting facial'
  const message = buildWhatsAppMessage(title)
  const href = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
  expect(href).toContain('https://wa.me/40712345678?text=')
  expect(href).toContain(encodeURIComponent('Lifting facial'))
})

test('procedureSlug contact URL: with slug', () => {
  const slug = 'botox-facial'
  const contactHref = `/contact${slug ? `?procedura=${slug}` : ''}`
  expect(contactHref).toBe('/contact?procedura=botox-facial')
})

test('procedureSlug contact URL: without slug', () => {
  const slug = undefined
  const contactHref = `/contact${slug ? `?procedura=${slug}` : ''}`
  expect(contactHref).toBe('/contact')
})
