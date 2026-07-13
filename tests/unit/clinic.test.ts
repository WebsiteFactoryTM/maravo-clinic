import { CLINIC } from '../../src/lib/clinic'
import { test, expect } from 'vitest'

test('CLINIC exposes core NAP fields', () => {
  expect(CLINIC.name).toBe('Maravo Clinic')
  expect(CLINIC.city).toBe('Timișoara')
  expect(CLINIC.email).toBe('info@maravoclinic.ro')
  expect(CLINIC.addressFull).toContain('Salcâmilor 14-16')
})

test('CLINIC.mapsEmbedUrl points at the same street number as the address', () => {
  // Query uses "+" for spaces, so compare on the decoded street + number only.
  expect(decodeURIComponent(CLINIC.mapsEmbedUrl)).toContain('Salcâmilor+14-16')
})

test('CLINIC hours: weekdays 09:00–20:00, weekend closed', () => {
  expect(CLINIC.hours).toEqual([
    { day: 'Luni – Vineri', value: '09:00 – 20:00' },
    { day: 'Sâmbătă – Duminică', value: 'Închis' },
  ])
})

test('CLINIC.phoneHref is dial-safe (starts with + and has no whitespace)', () => {
  expect(CLINIC.phoneHref.startsWith('+')).toBe(true)
  expect(CLINIC.phoneHref).not.toMatch(/\s/)
})

test('CLINIC.whatsapp is a bare digit string (no + or whitespace)', () => {
  expect(CLINIC.whatsapp).toMatch(/^\d+$/)
})

test('CLINIC.hours is a non-empty list of {day,value}', () => {
  expect(CLINIC.hours.length).toBeGreaterThan(0)
  expect(CLINIC.hours[0]).toHaveProperty('day')
  expect(CLINIC.hours[0]).toHaveProperty('value')
})
