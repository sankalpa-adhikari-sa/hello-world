type Json = unknown

function collectText(node: Json): string {
  if (node === null || node === undefined) return ''
  if (typeof node === 'string') return node
  if (typeof node !== 'object') return ''
  const o = node as Record<string, unknown>
  if (typeof o.text === 'string') return o.text
  if (Array.isArray(o.content)) {
    return o.content.map(collectText).join(' ')
  }
  return ''
}

const CARD_PREVIEW_MAX = 280

/** Plain-text from a TipTap-style `{ type: 'doc', content: [...] }` JSON document. */
export function previewTextFromRequestContent(
  content: Json,
  maxLength: number = CARD_PREVIEW_MAX,
): string {
  if (!content || typeof content !== 'object') return ''
  const doc = content as Record<string, unknown>
  if (doc.type !== 'doc') return ''
  const text = collectText(content).replace(/\s+/g, ' ').trim()
  if (maxLength > 0 && text.length > maxLength) {
    return `${text.slice(0, Math.max(0, maxLength - 1))}…`
  }
  return text
}

export function getRequestCardDescription(row: {
  subtitle: string | null
  content: unknown
}): string {
  const sub = row.subtitle?.trim()
  if (sub) return sub
  const fromDoc = previewTextFromRequestContent(row.content, CARD_PREVIEW_MAX)
  if (fromDoc) return fromDoc
  return 'No description provided.'
}

/** Longer body text for detail pages (subtitle shown separately). */
export function getRequestDetailBody(row: { content: unknown }): string {
  const fromDoc = previewTextFromRequestContent(row.content, 50_000)
  if (fromDoc) return fromDoc
  return 'No further details in the document body.'
}
