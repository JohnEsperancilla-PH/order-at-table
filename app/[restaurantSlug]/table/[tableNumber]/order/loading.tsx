import { Skeleton } from '@/components/ui/skeleton'

export default function OrderPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      <div className="mx-auto max-w-md space-y-6 p-4">
        <Skeleton className="h-[clamp(70px,15dvh,130px)] w-full rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <div className="space-y-3 pl-1">
                <Skeleton className="h-[88px] w-full rounded-xl" />
                <Skeleton className="h-[88px] w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="fixed bottom-3 left-1/2 h-12 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl md:relative md:bottom-auto md:left-auto md:w-full md:translate-x-0" />
      </div>
    </div>
  )
}
