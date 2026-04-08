import { Badge } from '@/components/ui/badge'
import { FundMeMinimalCard } from '../fund-a-project/fund-a-project-card'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function ProjectDetails() {
  return (
    <article className="p-3 lg:p-6 space-y-4">
      <Badge className="rounded-none">Cybernatics</Badge>
      <h1 className="text-6xl font-bold tracking-tighter">
        The Digital Deconstruction of Urban Anomalies
      </h1>
      <FundMeMinimalCard
        fundedPercent={74}
        raisedAmount={33_300}
        targetAmount={45_000}
      />
      <AboutResearcher />
      <div className="border-2 shadow-sm p-4">
        <h1 className="text-xl font-bold">About Project</h1>
        <Separator className={'border-2'} />
        ddfd
      </div>
    </article>
  )
}

export function AboutResearcher() {
  return (
    <Card className="shadow-sm border-2">
      <CardHeader>
        <CardTitle className="text-primary text-lg uppercase">
          About the Researcher
        </CardTitle>
        <CardDescription>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Recusandae
          velit architecto ipsum id ipsa. Earum?
        </CardDescription>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  )
}
