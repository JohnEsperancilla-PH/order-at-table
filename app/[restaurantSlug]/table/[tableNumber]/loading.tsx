import { Skeleton } from '@/components/ui/skeleton'

export default function TableSectionLoading() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background to-muted/20 p-4 pb-8">
      <div className="mx-auto w-full max-w-md space-y-4">
        <Skeleton className="h-[clamp(70px,15dvh,130px)] w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
