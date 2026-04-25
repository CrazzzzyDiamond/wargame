import { useState, useEffect } from 'react'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'
import { UNIT_IMAGES } from '../assets/unitImages'

const IMAGE_URLS = [
  ...Object.values(BRIGADE_IMAGES),
  ...Object.values(UNIT_IMAGES),
]

const SOUND_URLS = Object.values(
  import.meta.glob('../sound/**/*.mp3', { eager: true, import: 'default' })
) as string[]

const ALL_ASSETS = [...IMAGE_URLS, ...SOUND_URLS]

function preloadImage(url: string): Promise<void> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = url
  })
}

function preloadAudio(url: string): Promise<void> {
  return fetch(url).then(() => {}).catch(() => {})
}

export function usePreloader() {
  const [loaded, setLoaded] = useState(0)
  const total = ALL_ASSETS.length

  useEffect(() => {
    ALL_ASSETS.forEach(url => {
      const p = /\.(png|jpe?g|webp)$/.test(url) ? preloadImage(url) : preloadAudio(url)
      p.then(() => setLoaded(n => n + 1))
    })
  }, [])

  return {
    ready: loaded >= total,
    progress: total > 0 ? loaded / total : 0,
  }
}
