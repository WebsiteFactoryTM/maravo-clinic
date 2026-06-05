'use client'

import React, { useRef } from 'react'

interface Testimonial {
  quote: string
  author: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      '„Am făcut epilare definitivă cu Lutronic Clarity II și rezultatele sunt uimitoare. Personal extrem de profesionist, clinică impecabilă."',
    author: 'Andreea M. · Timișoara',
  },
  {
    quote:
      '„Am ales Maravo pentru tratamentele HIFU și nu am regretat. Lift-ul este vizibil, fără nicio perioadă de recuperare. Recomand cu toată încrederea!"',
    author: 'Maria D. · Timișoara',
  },
  {
    quote:
      '„Acid hialuronic injectat cu multă pricepere — rezultat natural, exact cum mi-am dorit. Atmosfera clinicii este elegantă și relaxantă."',
    author: 'Irina P. · Timișoara',
  },
  {
    quote:
      '„HydraFacial-ul a transformat pielea mea. Acum vin lunar — e cel mai bun tratament de curățare pe care l-am încercat în Timișoara!"',
    author: 'Raluca T. · Timișoara',
  },
  {
    quote:
      '„Tratamentul PRP pentru căderea părului a dat roade după doar 3 ședințe. Mulțumesc echipei Maravo pentru profesionalism!"',
    author: 'Elena V. · Timișoara',
  },
]

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollPrev() {
    scrollRef.current?.scrollBy({ left: -380, behavior: 'smooth' })
  }

  function scrollNext() {
    scrollRef.current?.scrollBy({ left: 380, behavior: 'smooth' })
  }

  return (
    <section id="testimonials" aria-labelledby="testimonials-heading">
      <div className="test-header">
        <h2 className="test-title fade-up" id="testimonials-heading">
          Ce spun
          <br />
          <em>pacientele noastre</em>
        </h2>
        <nav className="test-nav" aria-label="Navigare testimoniale">
          <button
            className="test-btn"
            onClick={scrollPrev}
            aria-label="Testimonial anterior"
          >
            ←
          </button>
          <button
            className="test-btn"
            onClick={scrollNext}
            aria-label="Testimonial următor"
          >
            →
          </button>
        </nav>
      </div>

      <div
        className="test-scroll"
        ref={scrollRef}
        role="list"
        aria-label="Testimoniale pacienți"
        tabIndex={0}
      >
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="test-card fade-up" role="listitem">
            <div className="test-stars" aria-label="5 stele">
              ★★★★★
            </div>
            <p className="test-quote">{t.quote}</p>
            <div className="test-author">
              <span aria-hidden="true">◆</span>
              {t.author}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
