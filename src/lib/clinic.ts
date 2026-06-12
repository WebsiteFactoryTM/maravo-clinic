// src/lib/clinic.ts
// Single source of truth (in code) for Maravo Clinic's public business facts.
// These are used as FALLBACK DEFAULTS only — CMS `site-settings` overrides them
// at runtime. Sourced from the client's live site (maravoclinic.ro).

export const CLINIC = {
  name: 'Maravo Clinic',
  city: 'Timișoara',
  county: 'Timiș',
  street: 'Strada Salcâmilor 14-16',
  addressFull: 'Strada Salcâmilor 14-16, Timișoara, Timiș',
  phone: '+40 775 393 323',
  phoneHref: '+40775393323',
  whatsapp: '40775393323',
  email: 'info@maravoclinic.ro',
  hours: [
    { day: 'Luni – Vineri', value: '09:00 – 20:00' },
    { day: 'Sâmbătă – Duminică', value: 'Închis' },
  ],
  // Verified (published on the live site). Keep role phrasing conservative in
  // copy — do not assert specific board certifications that aren't verified.
  doctor: { name: 'Dr. Cristiana Voinescu' },
} as const
