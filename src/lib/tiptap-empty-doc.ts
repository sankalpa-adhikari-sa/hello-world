import type { JSONContent } from '@tiptap/core'

/** Default document for new rich-text fields (StarterKit-compatible). */
export const emptyRichTextDocument: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

export function asRichTextContent(raw: unknown): JSONContent {
  if (
    raw !== null &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    (raw as JSONContent).type === 'doc'
  ) {
    return raw as JSONContent
  }
  return emptyRichTextDocument
}
