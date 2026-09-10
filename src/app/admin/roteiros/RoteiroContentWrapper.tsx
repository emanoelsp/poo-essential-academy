'use client'

import dynamic from 'next/dynamic'

const ContentRenderer = dynamic(
  () => import('@/components/features/course/ContentRenderer').then((m) => ({ default: m.ContentRenderer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    ),
  }
)

export function RoteiroContentWrapper({ content }: { content: string }) {
  return <ContentRenderer content={content} showGabarito={true} />
}
