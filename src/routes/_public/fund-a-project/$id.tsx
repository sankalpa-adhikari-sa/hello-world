import { createFileRoute } from '@tanstack/react-router'

import { ProjectDetails } from '@/components/core/projects_research/project_details'

export const Route = createFileRoute('/_public/fund-a-project/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <ProjectDetails />
    </div>
  )
}
