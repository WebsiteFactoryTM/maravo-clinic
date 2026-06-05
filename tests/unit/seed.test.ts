import { parseProcedures } from '../../src/seed/parse-procedures'
import fs from 'node:fs'
import { test, expect, describe } from 'vitest'

const raw = fs.readFileSync('src/seed/proceduri.txt', 'utf8')

test('parses >=33 procedures with structured meta', () => {
  const procs = parseProcedures(raw)
  expect(procs.length).toBeGreaterThanOrEqual(33)

  const lips = procs.find((p) => /acid hialuronic buze/i.test(p.title))
  expect(lips).toBeTruthy()
  expect(lips!.meta.duration).toMatch(/45/)
  expect(lips!.meta.invasiveness).toBe('minim-invaziv')
  expect((lips!.faq ?? []).length).toBeGreaterThan(0)
  expect((lips!.benefits ?? []).length).toBeGreaterThan(0)
})

test('parses all procedure titles', () => {
  const procs = parseProcedures(raw)
  // Each must have a non-empty title
  for (const p of procs) {
    expect(p.title.trim().length).toBeGreaterThan(0)
  }
})

test('procedures 24-33 (device sections) still parse title and meta', () => {
  const procs = parseProcedures(raw)
  const epilare = procs.find((p) => /epilare definitiv/i.test(p.title))
  expect(epilare).toBeTruthy()
  expect(epilare!.meta.duration).toBeTruthy()

  const hifu = procs.find((p) => /HIFU lifting/i.test(p.title))
  expect(hifu).toBeTruthy()
  expect(hifu!.meta.painLevel).toBeDefined()
})

test('consultatie is parsed', () => {
  const procs = parseProcedures(raw)
  const cons = procs.find((p) => /consult/i.test(p.title))
  expect(cons).toBeTruthy()
})

test('invasiveness inferred correctly', () => {
  const procs = parseProcedures(raw)
  // HydraFacial should be non-invaziv
  const hydra = procs.find((p) => /hydrafacial/i.test(p.title))
  expect(hydra?.meta.invasiveness).toBe('non-invaziv')

  // Botox should be minim-invaziv
  const botox = procs.find((p) => /botox riduri/i.test(p.title))
  expect(botox?.meta.invasiveness).toBe('minim-invaziv')
})
