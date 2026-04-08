import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth/auth-client'
import { authMiddleware } from '@/middleware/auth'
import {
  FundmeCard,
  FundmeCardProps,
} from '@/components/core/fund-a-project/fund-a-project-card'

export const Route = createFileRoute('/_authenticated/u/dashboard')({
  component: RouteComponent,
  server: {
    middleware: [authMiddleware],
  },
})

function RouteComponent() {
  const navigate = useNavigate()
  const logout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: '/login' })
        },
      },
    })
  }
  const PROJECTS_DATA: (FundmeCardProps & { id: number })[] = [
    {
      id: 1,
      badge: 'Undergrad',
      name: 'Elena Nance',
      dept: 'MIT | Physics',
      title: 'Quantum Computing for Sustainable Urban Power',
      progress: 52,
      target: 12500,
      imagePlaceholderText: 'QUANTUM_01',
    },
    {
      id: 2,
      badge: 'Grad',
      name: 'Marcus Moore',
      dept: 'ETH Zurich | Arch',
      title: 'The Neo-Brutalist Manifesto: Housing Crisis',
      progress: 89,
      target: 8200,
      imagePlaceholderText: 'ARCH_02',
    },
  ]
  return (
    <div>
      Hello "/(main)/u/dashboard"!
      <Button onClick={logout}>Signout</Button>
      {PROJECTS_DATA.map((project) => (
        <FundmeCard key={project.id} {...project} />
      ))}
    </div>
  )
}
