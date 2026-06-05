/**
 * Footer — server/plain component.
 * Ported from <footer> markup in Homepage.html (lines 377-418).
 * Uses placeholder NAP/links; CMS wiring is Task 17.
 */

import React from 'react'

export default function Footer() {
  return (
    <footer>
      <div className="footer-grid-wrap">
        {/* Brand */}
        <div className="footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-gold.png" className="footer-logo" alt="Maravo Clinic" />
          <p className="footer-tagline">
            Clinică estetică premium în Timișoara. Frumusețe și sănătate prin tehnologie medicală
            certificată.
          </p>
        </div>

        {/* Link columns */}
        <div className="footer-cols">
          {/* Tratamente */}
          <div>
            <div className="footer-col-title">Tratamente</div>
            <ul className="footer-links">
              <li><a href="#">Epilare definitivă Timișoara</a></li>
              <li><a href="#">HIFU Timișoara</a></li>
              <li><a href="#">Acid hialuronic</a></li>
              <li><a href="#">Botox Timișoara</a></li>
              <li><a href="#">HydraFacial</a></li>
              <li><a href="#">Mezoterapie</a></li>
            </ul>
          </div>

          {/* Clinică */}
          <div>
            <div className="footer-col-title">Clinică</div>
            <ul className="footer-links">
              <li><a href="/despre">Despre noi</a></li>
              <li><a href="/aparatura">Aparatură</a></li>
              <li><a href="/tarife">Tarife</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/gdpr">GDPR</a></li>
            </ul>
          </div>

          {/* Contact (NAP) */}
          <div>
            <div className="footer-col-title">Contact</div>
            <div className="footer-contact-item">Timișoara, România</div>
            <div className="footer-contact-item">+40 XXX XXX XXX</div>
            <div className="footer-contact-item">contact@maravoclinic.ro</div>
            <div className="footer-contact-item">Lun–Vin: 9:00–19:00</div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-copy">
          © 2025 Maravo Clinic Timișoara. Toate drepturile rezervate.
        </div>
        <div className="footer-seo">
          Clinică estetică Timișoara · Epilare definitivă Timișoara · HIFU Timișoara · Botox
          Timișoara · Acid hialuronic Timișoara
        </div>
      </div>
    </footer>
  )
}
