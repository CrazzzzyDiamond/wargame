import { playSound } from './sound'

const SELECT_SOUNDS = import.meta.glob('../sound/brigade/select/*.mp3', { eager: true, import: 'default' }) as Record<string, string>
import moveSound from '../sound/brigade/move.mp3'

// Витягуємо номер бригади з shortName (напр. '80 ОДШБр' → '80')
function brigadeNumber(shortName: string): string {
  return shortName.split(' ')[0]
}

export function playBrigadeSelectSound(shortName: string) {
  const num = brigadeNumber(shortName)
  const key = Object.keys(SELECT_SOUNDS).find(k => k.endsWith(`/${num}.mp3`))
  if (key) playSound(SELECT_SOUNDS[key])
}

export function playBrigadeMoveSound() {
  playSound(moveSound)
}
