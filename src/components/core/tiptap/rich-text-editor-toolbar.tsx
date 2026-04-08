import { useEditorState } from '@tiptap/react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Paintbrush,
  Pilcrow,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Undo2,
} from 'lucide-react'
import { useState } from 'react'
import type { Editor } from '@tiptap/core'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { cn } from '@/lib/utils'

const NODE_BACKGROUND_PRESETS = [
  { label: 'Yellow', color: 'oklch(0.95 0.12 95)' },
  { label: 'Green', color: 'oklch(0.92 0.08 155)' },
  { label: 'Blue', color: 'oklch(0.92 0.06 240)' },
  { label: 'Rose', color: 'oklch(0.93 0.06 15)' },
] as const

function textAlignFromEditor(e: Editor): 'left' | 'center' | 'right' {
  if (e.isActive({ textAlign: 'right' })) return 'right'
  if (e.isActive({ textAlign: 'center' })) return 'center'
  return 'left'
}

const TOOLBAR_IDLE = {
  isBold: false,
  isItalic: false,
  isStrike: false,
  isCode: false,
  isHighlight: false,
  isSubscript: false,
  isSuperscript: false,
  isBulletList: false,
  isOrderedList: false,
  isBlockquote: false,
  isCodeBlock: false,
  textAlign: 'left' as const,
  headingLevel: 0,
  isLink: false,
  canUndo: false,
  canRedo: false,
}

function useToolbarState(editor: Editor | null) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return TOOLBAR_IDLE
      return {
        isBold: e.isActive('bold'),
        isItalic: e.isActive('italic'),
        isStrike: e.isActive('strike'),
        isCode: e.isActive('code'),
        isHighlight: e.isActive('highlight'),
        isSubscript: e.isActive('subscript'),
        isSuperscript: e.isActive('superscript'),
        isBulletList: e.isActive('bulletList'),
        isOrderedList: e.isActive('orderedList'),
        isBlockquote: e.isActive('blockquote'),
        isCodeBlock: e.isActive('codeBlock'),
        textAlign: textAlignFromEditor(e),
        headingLevel: e.isActive('heading', { level: 1 })
          ? 1
          : e.isActive('heading', { level: 2 })
            ? 2
            : e.isActive('heading', { level: 3 })
              ? 3
              : 0,
        isLink: e.isActive('link'),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      }
    },
  })
}

function LinkPopover() {
  const { editor } = useTiptapEditor()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')

  const isLink = useEditorState({
    editor,
    selector: ({ editor: e }) => !!e?.isActive('link'),
  })

  const apply = () => {
    if (!editor) return
    const trimmed = url.trim()
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      const href = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setOpen(false)
  }

  if (!editor) return null

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          const prior = editor.getAttributes('link').href as string | undefined
          setUrl(prior ?? '')
        }
      }}
    >
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'outline', size: 'icon-sm' }),
          isLink === true && 'bg-muted',
        )}
        aria-label="Link"
      >
        <Link2 className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-72 gap-2" align="start">
        <p className="text-muted-foreground text-[0.625rem] font-medium uppercase tracking-wide">
          Link URL
        </p>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              apply()
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              setOpen(false)
            }}
          >
            Remove
          </Button>
          <Button type="button" size="sm" onClick={apply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NodeBackgroundPopover() {
  const { editor } = useTiptapEditor()
  const [open, setOpen] = useState(false)

  if (!editor) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
        aria-label="Block background"
      >
        <Paintbrush className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-52 gap-2 p-2" align="start">
        <p className="text-muted-foreground text-[0.625rem] font-medium uppercase tracking-wide">
          Paragraph background
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {NODE_BACKGROUND_PRESETS.map(({ label, color }) => (
            <button
              key={label}
              type="button"
              title={label}
              className="border-border hover:ring-ring size-7 rounded-md border shadow-sm hover:ring-2"
              style={{ backgroundColor: color }}
              onClick={() => {
                editor.chain().focus().setNodeBackgroundColor(color).run()
                setOpen(false)
              }}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            editor.chain().focus().unsetNodeBackgroundColor().run()
            setOpen(false)
          }}
        >
          Clear background
        </Button>
      </PopoverContent>
    </Popover>
  )
}

function ImagePopover() {
  const { editor } = useTiptapEditor()
  const [open, setOpen] = useState(false)
  const [src, setSrc] = useState('')

  if (!editor) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
        aria-label="Insert image"
      >
        <ImageIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-72 gap-2" align="start">
        <p className="text-muted-foreground text-[0.625rem] font-medium uppercase tracking-wide">
          Image URL
        </p>
        <Input
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          placeholder="https://…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const trimmed = src.trim()
              if (trimmed) {
                editor.chain().focus().setImage({ src: trimmed }).run()
                setSrc('')
                setOpen(false)
              }
            }
          }}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const trimmed = src.trim()
              if (trimmed) {
                editor.chain().focus().setImage({ src: trimmed }).run()
                setSrc('')
                setOpen(false)
              }
            }}
          >
            Insert
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function RichTextEditorToolbar({ className }: { className?: string }) {
  const { editor } = useTiptapEditor()
  const s = useToolbarState(editor)

  if (!editor || !s) return null

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className={cn(
        'bg-muted/40 flex flex-wrap items-center gap-2 border-b px-1.5 py-2',
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Undo"
        disabled={!s.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Redo"
        disabled={!s.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-3.5" />
      </Button>
      <Separator orientation="vertical" className="mx-0.5 h-6" />

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'min-w-[7.5rem] justify-between gap-1 font-normal',
          )}
        >
          <span className="truncate">
            {s.headingLevel === 1
              ? 'Heading 1'
              : s.headingLevel === 2
                ? 'Heading 2'
                : s.headingLevel === 3
                  ? 'Heading 3'
                  : 'Paragraph'}
          </span>
          <ChevronDown className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[10rem]">
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            <Pilcrow className="size-3.5" />
            Paragraph
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="size-3.5" />
            Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="size-3.5" />
            Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="size-3.5" />
            Heading 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-0.5 h-6" />

      <Toggle
        size="sm"
        pressed={s.isBold}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={s.isItalic}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={s.isStrike}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strikethrough"
      >
        <Strikethrough className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={s.isCode}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        aria-label="Inline code"
      >
        <Code className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={s.isHighlight}
        onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
        aria-label="Highlight"
      >
        <Highlighter className="size-3.5" />
      </Toggle>

      <NodeBackgroundPopover />

      <Separator orientation="vertical" className="mx-0.5 h-6" />

      <Toggle
        size="sm"
        pressed={s.isSubscript}
        onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
        aria-label="Subscript"
      >
        <SubscriptIcon className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={s.isSuperscript}
        onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}
        aria-label="Superscript"
      >
        <SuperscriptIcon className="size-3.5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-0.5 h-6" />

      <Toggle
        size="sm"
        pressed={s.textAlign === 'left'}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign('left').run()
        }
        aria-label="Align left"
      >
        <AlignLeft className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={s.textAlign === 'center'}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign('center').run()
        }
        aria-label="Align center"
      >
        <AlignCenter className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={s.textAlign === 'right'}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign('right').run()
        }
        aria-label="Align right"
      >
        <AlignRight className="size-3.5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-0.5 h-6" />

      <Toggle
        size="sm"
        pressed={s.isBulletList}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet list"
      >
        <List className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={s.isOrderedList}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Numbered list"
      >
        <ListOrdered className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={s.isBlockquote}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Quote"
      >
        <Quote className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={s.isCodeBlock}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        aria-label="Code block"
      >
        <SquareCode className="size-3.5" />
      </Toggle>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="size-3.5" />
      </Button>

      <Separator orientation="vertical" className="mx-0.5 h-6" />

      <LinkPopover />
      <ImagePopover />
    </div>
  )
}
