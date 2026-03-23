import { Suspense } from 'react'
import ExploreContent from './ExploreContent'

export const metadata = {
  title: 'Explore 3D Models – 3D Print Hub',
  description: 'Browse thousands of free 3D printing models. Filter by category, sort by popularity.',
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>}>
      <ExploreContent />
    </Suspense>
  )
}
