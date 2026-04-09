import { FundMeMinimalCard } from '../fund-a-project/fund-a-project-card'
import type { FundAProjectOutput } from '@/types/fund-a-project'
import { RichTextEditor } from '@/components/core/tiptap/rich-text-editor'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRichTextEditorContent } from '@/lib/rich-text-content'
import { FUND_PROJECT_LEVEL_LABEL } from '@/types/fund-a-project'

function fundedPercent(funded: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((funded / target) * 100))
}

type ProjectDetailsProps = {
  project: FundAProjectOutput | null
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  if (!project) {
    return (
      <article className="space-y-4 p-3 lg:p-6">
        <p className="text-destructive text-sm">Campaign not found.</p>
      </article>
    )
  }

  const creatorName =
    project.createdBy.displayName?.trim() || project.createdBy.name || 'Creator'
  const affiliation = project.createdBy.studentMajor?.trim() || 'No affiliation'
  const pct = fundedPercent(project.fundedAmount, project.targetAmount)

  return (
    <article className="space-y-4 p-3 lg:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-none">
          {FUND_PROJECT_LEVEL_LABEL[project.projectLevel]}
        </Badge>
        {project.tags.map((t) => (
          <Badge key={t.id} variant="outline" className="rounded-none">
            {t.name}
          </Badge>
        ))}
      </div>

      <h1 className="text-3xl font-bold tracking-tight lg:text-5xl">
        {project.title}
      </h1>
      {project.subtitle ? (
        <p className="text-muted-foreground text-sm lg:text-base">
          {project.subtitle}
        </p>
      ) : null}

      <FundMeMinimalCard
        fundedPercent={pct}
        raisedAmount={project.fundedAmount}
        targetAmount={project.targetAmount}
      />

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary text-lg uppercase">
            About the Researcher
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-semibold">{creatorName}</p>
          <p className="text-muted-foreground">{affiliation}</p>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary text-lg uppercase">
            About Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={getRichTextEditorContent(project.content, 'story')}
            editable={false}
            showToolbar={false}
            className="bg-background"
          />
        </CardContent>
      </Card>
    </article>
  )
}
