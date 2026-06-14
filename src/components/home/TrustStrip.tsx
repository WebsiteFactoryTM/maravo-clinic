import React from 'react'
import { FaShieldHeart, FaCertificate, FaWandMagicSparkles, FaUserDoctor } from 'react-icons/fa6'

const PILLARS = [
  { Icon: FaShieldHeart, title: 'Siguranță medicală', text: 'Protocoale stricte și produse de la branduri recunoscute internațional.' },
  { Icon: FaCertificate, title: 'Tehnologie certificată CE', text: 'Aparatură medicală de ultimă generație, certificată și întreținută.' },
  { Icon: FaWandMagicSparkles, title: 'Rezultate naturale', text: 'Estetică subtilă și echilibrată — armonie, nu exagerare.' },
  { Icon: FaUserDoctor, title: 'Medic dedicat', text: 'Fiecare tratament e efectuat sau supervizat de medic, după consultație.' },
]

export default function TrustStrip() {
  return (
    <section className="trust-strip" aria-labelledby="trust-title">
      <div className="trust-strip__inner">
        <span className="section-tag">De ce Maravo</span>
        <h2 id="trust-title" className="trust-strip__title">
          Estetică medicală în care poți avea <em>încredere</em>
        </h2>
        <div className="trust-strip__grid">
          {PILLARS.map(({ Icon, title, text }) => (
            <article className="trust-pillar" key={title}>
              <span className="trust-pillar__icon" aria-hidden="true"><Icon /></span>
              <h3 className="trust-pillar__title">{title}</h3>
              <p className="trust-pillar__text">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
