import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { JSONContent } from '@tiptap/core'
import { SurveyCard } from '@/components/core/projects_research/survey_card'
import { RichTextEditor } from '@/components/core/tiptap/rich-text-editor'

export const Route = createFileRoute('/_public/data')({
  component: RouteComponent,
})

const sampleSurvey = {
  categoryBadge: 'STEM / NEUROSCIENCE',
  endsInLabel: '4H 22M',
  title: 'Neural Correlation in Abstract Pattern Recognition',
  description:
    'Seeking participants for a 5-minute cognitive task mapping visual heuristics in complex environments.',
  participantsCurrent: 482,
  participantsGoal: 500,
  rewardAmount: '15.00',
} as const

function RouteComponent() {
  const [body, setBody] = useState<JSONContent | undefined>()
  return (
    <div>
      <article className="p-3 lg:p-6 space-y-4">
        <div className="border-b-3 flex flex-row items-center justify-between pb-2">
          <h1 className="text-lg font-bold">Active Questionnaires</h1>
          <span className="text-primary font-bold text-lg">(12)</span>
        </div>
        <SurveyCard {...sampleSurvey} />
      </article>
      <RichTextEditor value={body} onChange={setBody} />
    </div>
  )
}
