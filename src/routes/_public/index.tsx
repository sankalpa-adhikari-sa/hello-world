import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_public/')({ component: App })

function App() {
  return (
    <div>
      <Button>
        <Link to="/login">Login</Link>
      </Button>
    </div>
  )
}
