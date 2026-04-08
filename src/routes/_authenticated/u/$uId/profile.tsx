import { createFileRoute } from '@tanstack/react-router'
import { getCurrentUserProfileQO } from '@/sfn/users'

export const Route = createFileRoute('/_authenticated/u/$uId/profile')({
  component: RouteComponent,
  loader: async ({ context, params, deps }) => {
    const fetchParams = {
      ...deps,
      userId: params.uId,
    }
    await context.queryClient.ensureQueryData(
      getCurrentUserProfileQO(fetchParams),
    )
  },
})

function RouteComponent() {
  return <div>Hello "/_main/(users)/profile"!</div>
}
