import { useEffect, useState } from 'react'

interface Props {
  ready: boolean
  progress: number
}

export function LoadingScreen({ ready, progress }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setVisible(false), 600)
      return () => clearTimeout(t)
    }
  }, [ready])

  if (!visible) return null

  const pct = Math.round(progress * 100)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#0a0c0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      opacity: ready ? 0 : 1,
      transition: 'opacity 0.6s ease',
      pointerEvents: ready ? 'none' : 'all',
    }}>
      <div style={{
        fontFamily: 'monospace',
        fontSize: 11,
        letterSpacing: '0.25em',
        color: '#ffdd00',
        textTransform: 'uppercase',
        opacity: 0.7,
      }}>
        Харківський контрнаступ
      </div>

      <div style={{
        fontFamily: 'monospace',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: '#ffffff',
      }}>
        Вересень 2022
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 16, width: 200 }}>
        <div style={{
          width: '100%',
          height: 2,
          background: '#1e1e1e',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: '#ffdd00',
            transition: 'width 0.2s ease',
          }} />
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: '0.15em',
          color: '#444',
          textTransform: 'uppercase',
        }}>
          {pct < 100 ? `Завантаження... ${pct}%` : 'Ініціалізація карти...'}
        </div>
      </div>
    </div>
  )
}
