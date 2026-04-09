export function getRichTextEditorContent(
  content: unknown,
  key = 'story',
): string | Record<string, unknown> {
  if (!content || typeof content !== 'object' || Array.isArray(content))
    return ''
  const value = (content as Record<string, unknown>)[key]
  if (!value) return ''

  if (typeof value === 'string') {
    if (!value.trim()) return ''
    try {
      const parsed = JSON.parse(value)
      if (parsed !== null && typeof parsed === 'object') {
        return parsed as Record<string, unknown>
      }
    } catch {
      return value
    }
    return value
  }

  if (typeof value === 'object') return value as Record<string, unknown>
  return ''
}

export function setRichTextEditorContent(
  content: unknown,
  doc: Record<string, unknown>,
  key = 'story',
): Record<string, unknown> {
  const base =
    content && typeof content === 'object' && !Array.isArray(content)
      ? (content as Record<string, unknown>)
      : {}
  return { ...base, [key]: doc }
}
