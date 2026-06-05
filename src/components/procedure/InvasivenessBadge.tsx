import React from 'react'

type Invasiveness = 'non-invaziv' | 'minim-invaziv' | 'invaziv'

interface InvasivenessBadgeProps {
  invasiveness: Invasiveness
}

const LABELS: Record<Invasiveness, string> = {
  'non-invaziv': 'Non-invaziv',
  'minim-invaziv': 'Minim-invaziv',
  'invaziv': 'Invaziv',
}

export default function InvasivenessBadge({ invasiveness }: InvasivenessBadgeProps) {
  const label = LABELS[invasiveness]
  return (
    <span
      className={`invasiveness-badge invasiveness-badge--${invasiveness}`}
      aria-label={`Nivel invazivitate: ${label}`}
    >
      {label}
    </span>
  )
}
