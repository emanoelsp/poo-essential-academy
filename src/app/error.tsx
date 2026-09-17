'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed')

    if (isChunkError) {
      window.location.reload()
    }
  }, [error])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</p>
        <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Algo deu errado</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Tente novamente ou recarregue a página.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{ background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
          >
            Recarregar
          </button>
        </div>
      </div>
    </div>
  )
}
