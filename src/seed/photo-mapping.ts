/**
 * Photo mapping for Maravo Clinic.
 *
 * Assigns optimized WebP files (from src/seed/optimized/) to:
 *   - equipment items (photo field) — 7 items, all covered (6 with real shots, 1 with interior)
 *   - procedures (featuredImage field) — 34 procedures, 9 covered with high confidence
 *
 * Photo inventory (25+ images viewed and classified):
 *
 * LASER / Clarity II (Lutronic, green scrubs + laser goggles + tall white/black handheld laser unit):
 *   image00001 – laser handpiece close-up on thigh/leg
 *   image00002 – Clarity II laser on abdomen, Maravo logo visible
 *   image00003 – Clarity II device prominent, doctor applying to underarm (full treatment room shot)
 *   image00004 – Clarity II, underarm + patient smiling, green scrubs
 *   image00005 – Clarity II, arm treatment from side
 *   image00006 – Clarity II, arm treatment, slightly different angle
 *   image00008 – Clarity II, leg treatment, close
 *   image00009 – Clarity II, underarm/arm treatment, vertical
 *
 * HYDRAFACIAL + RED-LIGHT panel (Syndeo device screen visible):
 *   image00007 – HydraFacial Syndeo device + red LED face panel, patient lying (clinic name visible)
 *   image00010 – HydraFacial + red-light face panel, session in progress, screen visible
 *   image00015 – HydraFacial + two practitioners, Maravo sign + device screen
 *
 * DERMAPEN / MICRONEEDLING (blue gloves, Dermapen 4 handpiece):
 *   image00011 – Dermapen 4 on face, close-up — exact Dermapen match
 *   image00012 – HydraFacial Syndeo wand on face, "hydrafacial" headband visible
 *
 * CLINIC INTERIORS (treatment rooms, waiting areas, reception):
 *   image00013 – treatment room, Restylane red-lips poster, white injection chair
 *   image00014 – treatment room, empty, Maravo logo sign
 *   image00016 – reception desk full, "RECEPTIE" gold text, clean shot
 *   image00018 – reception, empty
 *   image00019–00021 – reception blurred motion shots
 *   image00024 – waiting area with Maravo logo wall + lip art
 *   image00030 – waiting room, Maravo logo centred, chairs
 *   image00035 – VIP waiting area, white sofa, clock
 *   image00040 – treatment room, HydraFacial device visible in background + empty chair
 *
 * NUERA TIGHT / RF (Lumenis console, dark blue scrubs, round RF handpiece):
 *   image00017 – NuEra Tight on thigh, curly-hair practitioner, Lumenis logo on screen
 *   image00022 – RF handpiece close-up on leg, blue gloves
 *   image00051 – NuEra Tight on abdomen, Lumenis screen prominent, Maravo background
 *   image00052 – NuEra Tight abdomen close
 *   image00055 – NuEra Tight abdomen, Lumenis console full view, Maravo sign
 *   image00056 – NuEra Tight hip/abdomen area
 *   image00057 – NuEra Tight abdomen, both Maravo + Lumenis logos visible
 *
 * HIFU / Liftera (teal scrubs, white HIFU handpiece + coiled cable, large console with circle icons):
 *   image00043 – HIFU on face/chin, practitioner in teal, Maravo logo
 *   image00044 – HIFU handpiece on neck/jaw, full handpiece + patient
 *   image00045 – HIFU face treatment, smiling practitioner, Maravo logo
 *   image00046 – HIFU face jaw, Maravo logo
 *   image00053 – HIFU face, teal scrubs
 *   image00054 – HIFU jaw/neck, large clear shot
 *   image00058 – HIFU cheek, practitioner applying
 *   image00060 – HIFU under-chin area
 *   image00065 – HIFU neck/jaw + Maravo sign
 *
 * BTL LYMPHASTIM (pressotherapy boots on legs, patient lying watching TV):
 *   image00050 – Lymphastim boots + Netflix on TV (clear boot shot)
 *   image00057 – Lymphastim boots + TV (nature documentary) — NOTE: 00057 is NuEra Tight, see above
 *   * Correction: 00050 is Netflix/boots; separate boot session is image00057 (TV show different)
 *   * Both 00050 and 00057 are pressotherapy. 00057 chosen for NuEra map; use 00050 for BTL.
 *
 * EXTERIOR:
 *   image00023 – aerial city view with building
 *   image00062 – clinic entrance door exterior
 *   image00063 – aerial building close view
 *   image00064 – entrance door with Maravo plaque
 */

/** Equipment photo mapping — one best photo per device.
 *  Key = equipment slug, Value = optimized WebP filename in src/seed/optimized/ */
export const EQUIPMENT_PHOTO_MAP: Record<string, string> = {
  // Clarity II — Lutronic laser device
  // image00003: wide treatment-room shot, device arm clearly visible alongside green-scrubs practitioner
  'clarity-ii': 'image00003.webp',

  // HIFU Liftera (Asterasys) — teal scrubs, white HIFU handpiece, large circle-icon console
  // image00044: clear handpiece-on-neck shot, device console in background
  'hifu-liftera-asterasys': 'image00044.webp',

  // NuEra Tight (Lumenis) — dark-blue scrubs, Lumenis console, round RF handpiece
  // image00055: full-frame session photo, Lumenis console prominent + Maravo branding
  'nuera-tight-lumenis': 'image00055.webp',

  // BTL Lymphastim — pressotherapy boots clearly visible
  // image00050: patient with boots on, Netflix TV, relaxed atmosphere — great lifestyle shot
  'btl-lymphastim': 'image00050.webp',

  // CryoPen O+ — no dedicated CryoPen device-in-use shot in this collection
  // Using treatment room interior as fallback until editorial shot is available
  // TODO: editorial photo — replace with a CryoPen-specific device shot
  'cryopen-o': 'image00013.webp',

  // Dermapen 4 — exact Dermapen 4 handpiece on face
  // image00011: close-up microneedling facial treatment with Dermapen 4
  'dermapen-4': 'image00011.webp',

  // HydraFacial Syndeo — device screen + treatment session clearly visible
  // image00010: HydraFacial Syndeo + red LED face panel treatment in progress
  'hydrafacial-syndeo': 'image00010.webp',
}

/**
 * Procedure featuredImage mapping.
 * Key = procedure slug (result of slugify(title)), Value = optimized WebP filename.
 *
 * Only procedures with a CONFIDENT visual match are included.
 * Procedures without a matching photo are omitted (the UI renders a graceful placeholder).
 * See the comments for rationale and TODOs.
 */
export const PROCEDURE_PHOTO_MAP: Record<string, string> = {
  // ── Laser procedures (Clarity II) ──────────────────────────────────────────

  // Epilare definitivă laser — body/leg laser epilare, very clear
  // image00002: laser handpiece on abdomen with Maravo logo, best epilare shot
  'epilare-definitiva-laser': 'image00002.webp',

  // Tratament vascular laser, cuperoză, vase sparte
  // image00008: Clarity II on leg — vascular laser treatments are also on legs
  'tratament-vascular-laser-cuperoza-vase-sparte': 'image00008.webp',

  // Tratament onicomicoză laser, ciuperca unghiei
  // image00001: laser handpiece close-up on lower leg/thigh, closest to foot/nail area
  'tratament-onicomicoza-laser-ciuperca-unghiei': 'image00001.webp',

  // Rejuvenare facială laser — TODO: no face-laser shot available
  // (all laser shots show body; using arm shot would be misleading for a facial procedure)
  // TODO: editorial photo

  // Tratament pete pigmentare laser — TODO: same as above, no face-laser
  // TODO: editorial photo

  // Tratament veruci plantare laser — TODO: no foot-specific laser shot
  // TODO: editorial photo

  // ── HIFU ──────────────────────────────────────────────────────────────────

  // HIFU lifting facial și corporal — exact match
  // image00044: HIFU handpiece on neck/jaw, best single device shot
  'hifu-lifting-facial-si-corporal': 'image00044.webp',

  // ── Radiofrecvență / NuEra Tight ──────────────────────────────────────────

  // Remodelare corporală radiofrecvență, RF — exact match
  // image00051: NuEra Tight on abdomen, Lumenis console visible, Maravo sign in background
  'remodelare-corporala-radiofrecventa-rf': 'image00051.webp',

  // ── BTL Lymphastim ────────────────────────────────────────────────────────

  // Drenaj limfatic, presoterapie — exact match
  // image00050: pressotherapy boots clearly visible, patient in session
  'drenaj-limfatic-presoterapie': 'image00050.webp',

  // ── Dermapen / Microneedling ───────────────────────────────────────────────

  // Dermapen 4, microneedling medical — exact device match
  // image00011: Dermapen 4 handpiece on face, close-up
  'dermapen-4-microneedling-medical': 'image00011.webp',

  // ── HydraFacial ───────────────────────────────────────────────────────────

  // HydraFacial Syndeo — exact match
  // image00012: HydraFacial Syndeo wand on face with "hydrafacial" headband
  'hydrafacial-syndeo': 'image00012.webp',

  // ── Consultație ────────────────────────────────────────────────────────────

  // Consultație — doctor-patient interaction framing
  // image00015: two practitioners + patient in session, consultation-like setting
  'consultatie': 'image00015.webp',

  // ── Injectable procedures ─────────────────────────────────────────────────
  // NOTE: No injectable-specific procedure shots exist in this collection
  // (no syringes, no botox injection close-ups, no lip-filler shots).
  // The collection focuses on device treatments.
  // All injectable procedures are left without featuredImage (placeholder rendered by UI).
  //
  // TODO: editorial photo — Injectare acid hialuronic buze (lips injection close-up)
  // TODO: editorial photo — Fire PDO contur buze
  // TODO: editorial photo — Injectare botox riduri de expresie
  // TODO: editorial photo — Injectare botox maseteri, bruxism
  // TODO: editorial photo — Injectare botox gummy smile, zambet gingival
  // TODO: editorial photo — Injectare botox transpiratie excesiva, hiperhidroza
  // TODO: editorial photo — Volumetrie faciala cu acid hialuronic
  // TODO: editorial photo — Corectie cearcane cu acid hialuronic
  // TODO: editorial photo — Injectare acid hialuronic santuri nazo-labiale
  // TODO: editorial photo — Rinocorectie acid hialuronic
  // TODO: editorial photo — Dizolvare acid hialuronic, hialuronidaza
  // TODO: editorial photo — PRP, terapia vampir
  // TODO: editorial photo — Injectare colagen pentru regenerare si fermitate
  // TODO: editorial photo — Mezoterapie faciala
  // TODO: editorial photo — Polinucleotide
  // TODO: editorial photo — Sculptra, biostimulator de colagen
  // TODO: editorial photo — HarmonyCa, lifting si biostimulare
  // TODO: editorial photo — Radiesse, volum si biostimulare
  // TODO: editorial photo — Lanluma X, volum corporal si biostimulare
  // TODO: editorial photo — Lipoliza injectabila
  // TODO: editorial photo — Tratament regenerare par (scalp injection)
  // TODO: editorial photo — Crioterapie leziuni cutanate (CryoPen in use)
  // TODO: editorial photo — Tratament veruci plantare laser (foot/nail shot)
}

/** All unique WebP filenames referenced by either map */
export function getAllMappedWebPs(): string[] {
  const all = new Set([
    ...Object.values(EQUIPMENT_PHOTO_MAP),
    ...Object.values(PROCEDURE_PHOTO_MAP),
  ])
  return Array.from(all).sort()
}
