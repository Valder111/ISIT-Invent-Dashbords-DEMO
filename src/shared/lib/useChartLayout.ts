import { useEffect, useState } from 'react'

export type ChartLayout = 'mobile' | 'tablet' | 'desktop'

function getLayout(): ChartLayout {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w <= 767) return 'mobile'
  if (w <= 1023) return 'tablet'
  return 'desktop'
}

export function useChartLayout(): ChartLayout {
  const [layout, setLayout] = useState<ChartLayout>(getLayout)

  useEffect(() => {
    const update = () => setLayout(getLayout())
    const mqMobile = window.matchMedia('(max-width: 767px)')
    const mqTablet = window.matchMedia('(max-width: 1023px)')
    mqMobile.addEventListener('change', update)
    mqTablet.addEventListener('change', update)
    return () => {
      mqMobile.removeEventListener('change', update)
      mqTablet.removeEventListener('change', update)
    }
  }, [])

  return layout
}

export function isCompactLayout(layout: ChartLayout): boolean {
  return layout !== 'desktop'
}
