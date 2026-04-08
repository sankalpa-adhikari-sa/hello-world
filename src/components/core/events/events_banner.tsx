export default function EventsBanner() {
  return (
    <div className="bg-primary lg:px-8 lg:py-12 space-y-4 border-b-4">
      <div className="uppercase bg-secondary text-secondary-foreground w-fit px-2 py-1">
        Academic calendar 2024/25
      </div>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-8">
        <h1 className="text-6xl md:text-8xl text-primary-foreground uppercase italic font-black tracking-tighter  lg:max-w-4xl">
          The city is our <br className="hidden md:block" /> campus.
        </h1>

        <div className="uppercase font-black text-lg border-2 bg-primary-foreground text-secondary p-6 shadow-md lg:max-w-sm shrink-0">
          Radical Knowledge Does not live in lecture halls. It lives in the
          streets
        </div>
      </div>
    </div>
  )
}
