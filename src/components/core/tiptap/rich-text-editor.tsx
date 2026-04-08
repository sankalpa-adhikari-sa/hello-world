import { Tiptap, useEditor } from '@tiptap/react'
import { useEffect, useMemo } from 'react'

import { createRichTextEditorExtensions } from './rich-text-editor-extensions'
import { RichTextEditorToolbar } from './rich-text-editor-toolbar'
import type { JSONContent } from '@tiptap/core'
import { cn } from '@/lib/utils'

import '@/styles/tiptap-editor.css'

export type RichTextEditorProps = {
  /** Initial document (TipTap JSON). Ignored after mount unless `content` is passed for controlled mode. */
  defaultContent?: JSONContent | string
  /** Controlled document; when set, the editor syncs when this value changes. */
  content?: JSONContent | string
  onChange?: (json: JSONContent) => void
  placeholder?: string
  editable?: boolean
  className?: string
  /** Additional classes for the scrollable content area (ProseMirror). */
  editorClassName?: string
  showToolbar?: boolean
}

function contentKey(value: JSONContent | string | undefined): string {
  if (value === undefined) return ''
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export function RichTextEditor({
  defaultContent,
  content,
  onChange,
  placeholder = 'Write something…',
  editable = true,
  className,
  editorClassName,
  showToolbar = true,
}: RichTextEditorProps) {
  const extensions = useMemo(
    () => createRichTextEditorExtensions({ placeholder }),
    [placeholder],
  )

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: content ?? defaultContent,
      editable,
      editorProps: {
        attributes: {
          class: cn('max-w-none text-xs leading-relaxed focus:outline-none', editorClassName),
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange?.(ed.getJSON())
      },
    },
    [extensions],
  )

  useEffect(() => {
    if (!editor || content === undefined) return
    const incoming = contentKey(content)
    const current = contentKey(editor.getJSON())
    if (incoming !== current) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editable, editor])

  if (!editor) {
    return (
      <div
        className={cn(
          'border-border bg-muted/20 h-[min(18rem,50vh)] animate-pulse rounded-md border',
          className,
        )}
        aria-hidden
      />
    )
  }

  return (
    <Tiptap editor={editor}>
      <div
        className={cn(
          'border-border bg-background tiptap-editor-root overflow-hidden rounded-md border shadow-sm',
          className,
        )}
      >
        {showToolbar ? <RichTextEditorToolbar /> : null}
        <Tiptap.Content className="max-h-[min(24rem,60vh)] overflow-y-auto overflow-x-hidden" />
      </div>
    </Tiptap>
  )
}
