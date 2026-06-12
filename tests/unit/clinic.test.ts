import { CLINIC } from '../../src/lib/clinic'
import { test, expect } from 'vitest'

test('CLINIC exposes core NAP fields', () => {
  expect(CLINIC.name).toBe('Maravo Clinic')
  expect(CLINIC.city).toBe('Timișoara')
  expect(CLINIC.email).toBe('info@maravoclinic.ro')
  expect(CLINIC.addressFull).toContain('Salcâmilor')
})

test('CLINIC.phoneHref is dial-safe (starts with + and has no whitespace)', () => {
  expect(CLINIC.phoneHref.startsWith('+')).toBe(true)
  expect(CLINIC.phoneHref).not.toMatch(/\s/)
})

test('CLINIC.hours is a non-empty list of {day,value}', () => {
  expect(CLINIC.hours.length).toBeGreaterThan(0)
  expect(CLINIC.hours[0]).toHaveProperty('day')
  expect(CLINIC.hours[0]).toHaveProperty('value')
})
