interface PdfTextItem {
  str: string
  transform: number[]
  width: number
  height: number
  hasEOL?: boolean
  dir?: string
}

interface Fragment {
  text: string
  left: number
  right: number
  baseline: number
  height: number
}

const lineText = (line: Fragment[]) => line.map(fragment => fragment.text).join(' ')

export function readPdfPage(items: PdfTextItem[], pageWidth: number): string {
  const textItems = items.filter(item => typeof item.str === 'string' && item.str.trim())
  if (textItems.some(item => item.dir === 'rtl' || Math.abs(item.transform[1]) > 0.01)) {
    return textItems.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('').trim()
  }

  const fragments = textItems.map(({ str, transform, width, height }) => ({
    text: str.trim(),
    left: transform[4],
    right: transform[4] + width,
    baseline: transform[5],
    height,
  })).sort((a, b) => b.baseline - a.baseline || a.left - b.left)

  const lines: Fragment[][] = []
  for (const fragment of fragments) {
    const line = lines[lines.length - 1]
    if (line && Math.abs(line[0].baseline - fragment.baseline) <= Math.max(1, fragment.height * 0.2)) {
      line.push(fragment)
    } else {
      lines.push([fragment])
    }
  }
  for (const line of lines) line.sort((a, b) => a.left - b.left)

  // Repeated starts after a wide gap distinguish columns from ordinary word spacing.
  const gapWidth = Math.max(24, pageWidth * 0.05)
  const candidates = lines.flatMap(line => line.slice(1)
    .filter((fragment, index) => fragment.left - line[index].right >= gapWidth)
    .map(fragment => fragment.left))
  const gutter = candidates.find(start => candidates.filter(other => Math.abs(other - start) <= 4).length >= 3)
  if (gutter === undefined) return lines.map(lineText).join('\n')

  const boundary = gutter - 5
  const splitLines = lines.map(line => {
    const left = line.filter(fragment => fragment.left < boundary)
    const right = line.filter(fragment => fragment.left >= boundary)
    return { line, left, right, spansColumns: left.some(fragment => fragment.right > boundary) }
  })

  const sections: string[] = []
  let section: typeof splitLines = []
  const flush = () => {
    const pairedCount = section.filter(({ left, right }) => left.length && right.length).length
    if (pairedCount >= 3) {
      sections.push(section.map(({ left }) => lineText(left)).filter(Boolean).join('\n'))
      sections.push(section.map(({ right }) => lineText(right)).filter(Boolean).join('\n'))
    } else {
      sections.push(section.map(({ line }) => lineText(line)).join('\n'))
    }
    section = []
  }
  for (const row of splitLines) {
    if (row.spansColumns) {
      flush()
      sections.push(lineText(row.line))
    } else {
      section.push(row)
    }
  }
  flush()
  return sections.filter(Boolean).join('\n\n')
}
