'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Chunk load failures happen after a new deploy invalidates old JS bundle hashes.
    // Reloading fetches the fresh chunks from the new deployment.
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
    <html lang="pt-BR">
      <body style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</p>
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Algo deu errado</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  )
}
