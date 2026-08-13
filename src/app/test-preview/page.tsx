import { readFileSync } from 'fs'
import { join } from 'path'
import { ContentRenderer } from '@/components/features/course/ContentRenderer'

export default function TestPreview() {
  const content = readFileSync(
    join(process.cwd(), 'src/content/modulo-02/encontro-06.md'),
    'utf-8'
  )
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <ContentRenderer content={content} showGabarito={false} />
    </main>
  )
}
