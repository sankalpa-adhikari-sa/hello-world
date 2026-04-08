import { PlusCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ResearchBannerProps {
  /** Opens create flow (signed-in) or login (guest). */
  onPostResearchNeed?: () => void
}

export default function ResearchBanner({
  onPostResearchNeed,
}: ResearchBannerProps) {
  return (
    <div className="bg-primary lg:px-8 lg:py-12 space-y-4 border-b-4">
      <div className="uppercase bg-secondary text-secondary-foreground w-fit px-2 py-1">
        Academic calendar 2024/25
      </div>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-baseline-last gap-8">
        <div className="lg:max-w-4xl">
          <h1 className="text-6xl md:text-8xl text-primary-foreground uppercase italic font-black tracking-tighter">
            Research <br className="hidden md:block" /> Archive & Hub
          </h1>
          <div className="text-secondary-foreground">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus
            commodi ea, voluptatum laboriosam assumenda reprehenderit deserunt
            quos autem facilis reiciendis.
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-auto py-4 px-6 uppercase font-black text-xl cursor-pointer rounded-none border-2 border-black bg-primary-foreground text-secondary hover:bg-primary-foreground hover:text-secondary dark:bg-primary-foreground dark:text-secondary dark:hover:bg-white"
          onClick={() => onPostResearchNeed?.()}
        >
          Post Research Need
          <PlusCircleIcon className="ml-2 size-6" />
        </Button>
      </div>
    </div>
  )
}
