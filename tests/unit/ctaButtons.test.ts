import { test, expect } from 'vitest'
import { buildWhatsAppMessage } from '../../src/components/ui/CtaButtons'

test('builds procedure-specific WhatsApp message when procedureTitle is provided', () => {
  const msg = buildWhatsAppMessage('Botox facial')
  expect(msg).toBe('Bună, aș dori o programare pentru Botox facial la Maravo Clinic.')
})

test('builds generic WhatsApp message when no procedureTitle', () => {
  const msg = buildWhatsAppMessage()
  expect(msg).toBe('Bună, aș dori o programare la Maravo Clinic.')
})

test('builds generic WhatsApp message when procedureTitle is undefined', () => {
  const msg = buildWhatsAppMessage(undefined)
  expect(msg).toBe('Bună, aș dori o programare la Maravo Clinic.')
})

test('WhatsApp URL encodes the message correctly', () => {
  const waNumber = '40712345678'
  const title = 'Lifting facial'
  const message = buildWhatsAppMessage(title)
  const href = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
  expect(href).toContain('https://wa.me/40712345678?text=')
  expect(href).toContain(encodeURIComponent('Lifting facial'))
  expect(href).toContain(encodeURIComponent('Maravo Clinic'))
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
