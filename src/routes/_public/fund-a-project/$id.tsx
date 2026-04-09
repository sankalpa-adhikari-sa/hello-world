import { createFileRoute } from '@tanstack/react-router'

import { ProjectDetails } from '@/components/core/projects_research/project_details'
import { getFundAProjectByIdQO } from '@/sfn/fund-a-project'

export const Route = createFileRoute('/_public/fund-a-project/$id')({
  loader: async ({ context, params }) => {
    const project = await context.queryClient.ensureQueryData(
      getFundAProjectByIdQO(params.id),
    )
    return { project }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { project } = Route.useLoaderData()
  return (
    <div>
      <ProjectDetails project={project} />
    </div>
  )
}
