import { Resend } from 'resend'

/**
 * Shape of a lead used for the notification email. Kept independent of the
 * Payload `Lead` type so callers can pass a resolved/flattened version
 * (e.g. with `procedureTitle` instead of a relationship id).
 */
export interface LeadEmailInput {
  name: string
  phone: string
  email?: string
  message?: string
  procedureTitle?: string
  source?: string
}

const FROM_ADDRESS = 'Maravo Clinic <noreply@maravoclinic.ro>'
const FALLBACK_NOTIFY = 'contact@maravoclinic.ro'

function buildTextBody(lead: LeadEmailInput): string {
  const lines = [
    `Nume: ${lead.name}`,
    `Telefon: ${lead.phone}`,
    lead.email ? `Email: ${lead.email}` : null,
    lead.procedureTitle ? `Procedură de interes: ${lead.procedureTitle}` : null,
    lead.message ? `Mesaj: ${lead.message}` : null,
    lead.source ? `Sursă: ${lead.source}` : null,
  ].filter((l): l is string => l !== null)
  return lines.join('\n')
}

function buildHtmlBody(lead: LeadEmailInput): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const row = (label: string, value?: string) =>
    value ? `<p><strong>${label}:</strong> ${esc(value)}</p>` : ''
  return [
    '<h2>Solicitare nouă</h2>',
    row('Nume', lead.name),
    row('Telefon', lead.phone),
    row('Email', lead.email),
    row('Procedură de interes', lead.procedureTitle),
    row('Mesaj', lead.message),
    row('Sursă', lead.source),
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Sends a notification email about a new lead.
 *
 * - If `RESEND_API_KEY` is not configured, this is a no-op that logs to the
 *   console and returns — keeping local dev working without a key.
 * - Any failure (config or network) is caught and logged. This function never
 *   throws, so it is safe to call from a Payload `afterChange` hook without
 *   risking the lead creation.
 */
export async function sendLeadEmail(lead: LeadEmailInput): Promise<void> {
  const key = process.env.RESEND_API_KEY

  if (!key) {
    console.log('[lead] (email disabled) new lead:', {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      procedureTitle: lead.procedureTitle,
      source: lead.source,
    })
    return
  }

  try {
    const resend = new Resend(key)
    const to = process.env.LEAD_NOTIFY_EMAIL || FALLBACK_NOTIFY
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Solicitare nouă — ${lead.name}`,
      text: buildTextBody(lead),
      html: buildHtmlBody(lead),
    })
  } catch (err) {
    console.error('[lead] failed to send notification email:', err)
  }
}
