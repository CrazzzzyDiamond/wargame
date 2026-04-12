// Програємо звук через Web Audio. Ковтаємо помилку — autoplay policy може заблокувати
export function playSound(src: string, volume = 1.0) {
  const audio = new Audio(src)
  audio.volume = volume
  audio.play().catch(() => {})
}
