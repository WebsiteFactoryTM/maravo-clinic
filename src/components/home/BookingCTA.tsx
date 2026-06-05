import React from 'react'
import CtaButtons from '@/components/ui/CtaButtons'

interface BookingCTAProps {
  whatsapp: string
  phone: string
}

export default function BookingCTA({ whatsapp, phone }: BookingCTAProps) {
  return (
    <section id="booking" aria-labelledby="booking-title">
      <div className="booking-inner">
        <span className="section-tag fade-up">Timișoara · Clinică Estetică Premium</span>
        <h2 className="booking-title fade-up" id="booking-title">
          Începe transformarea
          <br />
          <em>ta astăzi</em>
        </h2>
        <p className="booking-sub fade-up">
          Consultație inițială gratuită. Programare rapidă, online sau telefonic.
        </p>
        <div className="booking-actions fade-up">
          <CtaButtons whatsapp={whatsapp} phone={phone} />
        </div>
      </div>
    </section>
  )
}
