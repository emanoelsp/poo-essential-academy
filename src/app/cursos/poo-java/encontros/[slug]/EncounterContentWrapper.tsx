'use client'

import dynamic from 'next/dynamic'
import type { Encounter } from '@/types'

const EncounterContentLazy = dynamic(
  () => import('./EncounterContent').then((m) => ({ default: m.EncounterContent })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    ),
  }
)

interface Props {
  content: string
  encounter: Encounter
}

export function EncounterContentWrapper({ content, encounter }: Props) {
  return <EncounterContentLazy content={content} encounter={encounter} />
}
