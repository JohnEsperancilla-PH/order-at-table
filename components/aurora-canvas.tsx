export function AuroraCanvas() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 aurora-canvas">
      <div
        className="aurora-orb aurora-drift"
        style={{
          left: '-8%',
          top: '-6%',
          width: '46rem',
          height: '46rem',
          background:
            'radial-gradient(circle, oklch(0.85 0.16 35 / 0.55) 0%, transparent 65%)',
        }}
      />
      <div
        className="aurora-orb aurora-drift-slow"
        style={{
          right: '-10%',
          top: '22%',
          width: '38rem',
          height: '38rem',
          background:
            'radial-gradient(circle, oklch(0.85 0.12 320 / 0.4) 0%, transparent 65%)',
        }}
      />
      <div
        className="aurora-orb aurora-drift"
        style={{
          left: '40%',
          bottom: '-12%',
          width: '52rem',
          height: '52rem',
          background:
            'radial-gradient(circle, oklch(0.9 0.1 70 / 0.45) 0%, transparent 65%)',
        }}
      />
    </div>
  )
}
