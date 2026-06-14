// Single source of truth (in code) for Maravo Clinic's public business facts.
// These are used as FALLBACK DEFAULTS only — CMS `site-settings` overrides them
// at runtime. Sourced from the client's live site (maravoclinic.ro).

const street = 'Strada Salcâmilor 14-16'
const city = 'Timișoara'
const county = 'Timiș'

export const CLINIC = {
  name: 'Maravo Clinic',
  city,
  county,
  street,
  addressFull: `${street}, ${city}, ${county}`,
  phone: '+40 775 393 323',
  phoneHref: '+40775393323',
  whatsapp: '40775393323',
  email: 'info@maravoclinic.ro',
  socials: [
    { platform: 'facebook', url: 'https://www.facebook.com/DrCristianaVoinescu/' },
    { platform: 'instagram', url: 'https://www.instagram.com/maravo_clinic' },
    { platform: 'tiktok', url: 'https://www.tiktok.com/@maravoclinic' },
  ],
  // Keyless Google Maps embed for the clinic address (no API key required).
  mapsEmbedUrl:
    'https://www.google.com/maps?q=Strada+Salc%C3%A2milor+14-16,+300756+Timi%C8%99oara&output=embed',
  hours: [
    { day: 'Luni – Vineri', value: '09:00 – 20:00' },
    { day: 'Sâmbătă – Duminică', value: 'Închis' },
  ],
  // Verified (published on the live site). Keep role phrasing conservative in
  // copy — do not assert specific board certifications that aren't verified.
  doctor: { name: 'Dr. Cristiana Voinescu' },
} as const
