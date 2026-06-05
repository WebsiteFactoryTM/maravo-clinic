import React from 'react'

interface ProcedureMeta {
  duration?: string | null
  painLevel?: number | null
  painLabel?: string | null
  results?: string | null
  recovery?: string | null
}

interface PictogramRowProps {
  meta: ProcedureMeta
}

interface PictoCell {
  key: string
  glyph: string
  label: string
  value: string
}

export default function PictogramRow({ meta }: PictogramRowProps) {
  const cells: PictoCell[] = []

  if (meta.duration) {
    cells.push({ key: 'duration', glyph: '⏱', label: 'Durată', value: meta.duration })
  }

  if (meta.painLevel != null) {
    const painValue = `${meta.painLevel}/10${meta.painLabel ? ` · ${meta.painLabel}` : ''}`
    cells.push({ key: 'pain', glyph: '◦', label: 'Disconfort', value: painValue })
  }

  if (meta.results) {
    cells.push({ key: 'results', glyph: '✦', label: 'Rezultate', value: meta.results })
  }

  if (meta.recovery) {
    cells.push({ key: 'recovery', glyph: '↺', label: 'Recuperare', value: meta.recovery })
  }

  if (cells.length === 0) return null

  return (
    <div className="pictogram-row" role="list" aria-label="Caracteristici procedură">
      {cells.map((cell) => (
        <div key={cell.key} className="picto-cell" role="listitem">
          <span className="picto-cell__glyph" aria-hidden="true">
            {cell.glyph}
          </span>
          <span className="picto-cell__label">{cell.label}</span>
          <span className="picto-cell__value">{cell.value}</span>
        </div>
      ))}
    </div>
  )
}
