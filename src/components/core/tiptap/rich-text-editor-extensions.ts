import Highlight from '@tiptap/extension-highlight'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Image from '@tiptap/extension-image'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import { Placeholder } from '@tiptap/extensions/placeholder'
import StarterKit from '@tiptap/starter-kit'

import { NodeBackground } from './tiptap-extension/node-background-extension'
import type { Extensions } from '@tiptap/core'

export function createRichTextEditorExtensions(options: {
  placeholder?: string
}): Extensions {
  const { placeholder = 'Write something…' } = options

  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      horizontalRule: false,
    }),
    HorizontalRule,
    Highlight.configure({ multicolor: false }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Typography,
    Subscript,
    Superscript,
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    NodeBackground.configure({
      types: [
        'paragraph',
        'heading',
        'blockquote',
        'bulletList',
        'orderedList',
        'listItem',
      ],
    }),
    Placeholder.configure({
      placeholder,
      emptyEditorClass: 'is-editor-empty',
    }),
  ]
}
