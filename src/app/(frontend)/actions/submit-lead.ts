'use server'

import { z } from 'zod'
import { getPayloadClient } from '@/lib/payload'

/** Field-level errors keyed by field name. */
export type LeadFieldErrors = Partial<Record<keyof LeadInput, string[]>>

export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; errors: LeadFieldErrors }

const phoneRegex = /^[+\d][\d\s]{6,19}$/

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Numele este obligatoriu.'),
  phone: z
    .string()
    .trim()
    .min(7, 'Numărul de telefon este obligatoriu.')
    .max(20, 'Numărul de telefon este prea lung.')
    .regex(phoneRegex, 'Introduceți un număr de telefon valid.'),
  email: z
    .string()
    .trim()
    .email('Introduceți o adresă de email validă.')
    .optional()
    .or(z.literal('')),
  procedureInterest: z.union([z.string(), z.number()]).optional(),
  message: z.string().trim().optional(),
  source: z.string().optional(),
  // Honeypot — must stay empty. Real users never see/fill this.
  company: z.string().optional(),
})

type LeadInput = z.infer<typeof leadSchema>

function coerceProcedureId(value: string | number | undefined): number | undefined {
  if (value === undefined || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Server action that validates and persists a contact lead.
 *
 * - Honeypot: if `company` is filled, we silently return `{ ok: true }` and
 *   create NOTHING (defeats naive bots without revealing the trap).
 * - Validation errors are returned per field as `{ ok: false, errors }`.
 * - On success creates the lead with `overrideAccess: false` (public create is
 *   permitted by the collection's access control).
 */
export async function submitLead(formData: FormData): Promise<SubmitLeadResult> {
  const raw = {
    name: (formData.get('name') as string | null) ?? '',
    phone: (formData.get('phone') as string | null) ?? '',
    email: (formData.get('email') as string | null) ?? '',
    procedureInterest: (formData.get('procedureInterest') as string | null) ?? undefined,
    message: (formData.get('message') as string | null) ?? '',
    source: (formData.get('source') as string | null) ?? '/contact',
    company: (formData.get('company') as string | null) ?? '',
  }

  const parsed = leadSchema.safeParse(raw)
  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors
    return { ok: false, errors: flattened as LeadFieldErrors }
  }

  const data = parsed.data

  // Honeypot triggered — pretend success, create nothing.
  if (data.company && data.company.trim() !== '') {
    return { ok: true }
  }

  const payload = await getPayloadClient()
  await payload.create({
    collection: 'leads',
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email ? data.email : undefined,
      procedureInterest: coerceProcedureId(data.procedureInterest),
      message: data.message ? data.message : undefined,
      source: data.source,
    },
    overrideAccess: false,
  })

  return { ok: true }
}
