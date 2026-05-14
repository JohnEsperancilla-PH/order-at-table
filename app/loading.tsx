import { AuroraCanvas } from '@/components/aurora-canvas'

export default function Loading() {
  return (
    <div className="relative flex min-h-[50vh] items-center justify-center overflow-hidden text-black font-sf-pro">
      <AuroraCanvas />
      <div className="pill-glass relative grid h-14 w-14 place-items-center rounded-full">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-r-transparent" />
      </div>
    </div>
  )
}
