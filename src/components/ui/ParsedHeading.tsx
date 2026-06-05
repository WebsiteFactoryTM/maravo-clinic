import React from 'react'

interface ParsedHeadingProps {
  raw: string
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}

/**
 * Renders a heading string with \n → <br/> and *…* → <em> (text nodes only,
 * no dangerouslySetInnerHTML). Used by Hero (h1) and AboutTeaser (h2).
 */
export default function ParsedHeading({ raw, as: Tag = 'h2', className }: ParsedHeadingProps) {
  const lines = raw.split('\n')
  return (
    <Tag className={className}>
      {lines.map((line, i) => {
        const parts = line.split(/(\*[^*]+\*)/)
        return (
          <React.Fragment key={i}>
            {parts.map((part, j) =>
              part.startsWith('*') && part.endsWith('*') ? (
                <em key={j}>{part.slice(1, -1)}</em>
              ) : (
                part
              ),
            )}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        )
      })}
    </Tag>
  )
}
